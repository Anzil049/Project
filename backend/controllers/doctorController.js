const asyncHandler = require('express-async-handler');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const DoctorSchedule = require('../models/DoctorSchedule');
const { getDoctorSlots } = require('./appointmentController');
const { replaceDoctorSchedules } = require('../utils/schedulingUtils');

// @desc    Get nearby doctors based on coordinates
// @route   GET /api/public/doctors/nearby
// @access  Public
const getNearbyDoctors = asyncHandler(async (req, res) => {
    const { longitude, latitude, radius = 10, specialization, search } = req.query;

    if (!longitude || !latitude) {
        res.status(400);
        throw new Error('Please provide longitude and latitude');
    }

    // radius is in km, convert to meters for MongoDB
    const radiusInMeters = radius * 1000;

    const nearbyUsers = await User.find({
        role: 'doctor',
        status: 'active',
        isVerified: true,
        isApproved: true,
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)]
                },
                $maxDistance: radiusInMeters
            }
        }
    }).select('_id name email image location');

    const userIds = nearbyUsers.map(u => u._id);

    // Build filter for Doctor profile
    let query = { user: { $in: userIds } };
    if (specialization && specialization !== 'All') {
        query.specialization = specialization;
    }

    let doctors = await Doctor.find(query)
        .populate({
            path: 'user',
            select: 'name email image location phone'
        })
        .populate({
            path: 'hospitalId',
            select: 'name'
        })
        .select('+address');

    if (search) {
        const searchLower = search.toLowerCase();
        doctors = doctors.filter(doc => {
            const doctorNameMatch = doc.user?.name?.toLowerCase().includes(searchLower);
            const specMatch = doc.specialization?.toLowerCase().includes(searchLower);
            const hospitalMatch = doc.hospitalId?.name?.toLowerCase().includes(searchLower);
            const addressMatch = doc.address?.toLowerCase().includes(searchLower);
            
            return doctorNameMatch || specMatch || hospitalMatch || addressMatch;
        });
    }

    // Map to include distance if needed (MongoDB $near sorts by distance automatically)
    const results = doctors.map(doc => {
        const userLoc = nearbyUsers.find(u => u._id.toString() === doc.user._id.toString());
        return {
            ...doc.toObject(),
            distance: userLoc ? 'Calculated' : 'Unknown' // Distance can be calculated precisely if needed
        };
    });

    res.json(results);
});

// @desc    Get all doctors with filters
// @route   GET /api/public/doctors
// @access  Public
const getAllDoctors = asyncHandler(async (req, res) => {
    const { search, specialization, mode, hospitalId } = req.query;

    let query = {};

    // Filter by specialization
    if (specialization && specialization !== 'All') {
        query.specialization = specialization;
    }

    // Filter by mode
    if (mode === 'Online') {
        query.onlineConsultation = true;
    }

    // Filter by hospital
    if (hospitalId && hospitalId !== 'All') {
        if (hospitalId === 'null') {
            query.hospitalId = { $exists: false };
        } else {
            query.hospitalId = hospitalId;
        }
    }

    let doctors = await Doctor.find(query)
        .populate({
            path: 'user',
            match: {
                role: 'doctor',
                status: 'active',
                isVerified: true,
                isApproved: true
            },
            select: 'name email image status location isVerified isApproved'
        })
        .populate({
            path: 'hospitalId',
            select: 'name'
        })
        .select('+address'); // Explicitly select address if it's not selected by default or just use the find() result

    // Filter by search query (doctor name, specialization, hospital name, address)
    if (search) {
        const searchLower = search.toLowerCase();
        doctors = doctors.filter(doc => {
            const doctorNameMatch = doc.user?.name?.toLowerCase().includes(searchLower);
            const specMatch = doc.specialization?.toLowerCase().includes(searchLower);
            const hospitalMatch = doc.hospitalId?.name?.toLowerCase().includes(searchLower);
            const addressMatch = doc.address?.toLowerCase().includes(searchLower);
            
            return doctorNameMatch || specMatch || hospitalMatch || addressMatch;
        });
    }

    // Filter out blocked/unmatched users (since the match filter will return null for user if not verified/approved)
    doctors = doctors.filter(doc => doc.user && doc.user.status === 'active');

    res.json(doctors);
});

// @desc    Get all unique specializations
// @route   GET /api/public/doctors/specializations
// @access  Public
const getSpecializations = asyncHandler(async (req, res) => {
    // Get unique specializations from doctors whose user is active
    const activeUsers = await User.find({ role: 'doctor', status: 'active' }).select('_id');
    const activeUserIds = activeUsers.map(u => u._id);

    const specializations = await Doctor.distinct('specialization', { user: { $in: activeUserIds } });
    
    // Filter out any null or empty ones, then sort
    const validSpecs = specializations.filter(spec => spec && spec.trim() !== '').sort();
    
    res.json(validSpecs);
});

// @desc    Get doctor by ID
// @route   GET /api/public/doctors/:id
// @access  Public
const getDoctorById = asyncHandler(async (req, res) => {
    // req.params.id could be Doctor _id or User _id. Let's assume it's Doctor _id to match FindDoctors.jsx.
    // In FindDoctors.jsx: id: d._id || d.id
    const doctor = await Doctor.findById(req.params.id)
        .populate({
            path: 'user',
            select: 'name email image status location phone isVerified isApproved'
        })
        .populate({
            path: 'hospitalId',
            select: 'name city state address coverImage facilityType'
        })
        .select('+address');
    
    if (!doctor || !doctor.user || doctor.user.status !== 'active') {
        res.status(404);
        throw new Error('Doctor not found');
    }

    res.json(doctor);
});

// @desc    Update logged-in doctor's schedule configuration
// @route   PUT /api/doctors/me/schedules
// @access  Private (Doctor)
const updateMySchedules = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findOne({ user: req.user.userId });
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor profile not found');
    }

    if (doctor.hospitalId) {
        res.status(403);
        throw new Error('Availability schedules for hospital-affiliated doctors can only be managed by the hospital');
    }

    const bookingWindowDays = Number(req.body.booking_window_days || doctor.booking_window_days || 30);
    if (bookingWindowDays < 1) {
        res.status(400);
        throw new Error('Booking window must be at least 1 day');
    }

    doctor.booking_window_days = bookingWindowDays;
    doctor.isAcceptingAppointments = req.body.isAcceptingAppointments !== undefined
        ? req.body.isAcceptingAppointments
        : doctor.isAcceptingAppointments;
    doctor.onlineConsultation = req.body.onlineConsultation !== undefined
        ? req.body.onlineConsultation
        : doctor.onlineConsultation;
    if (doctor.hospitalId) doctor.onlineConsultation = false;
    if (Array.isArray(req.body.unavailability)) {
        doctor.unavailability = req.body.unavailability;
    }

    await doctor.save();

    const schedules = await replaceDoctorSchedules(doctor, req.body.schedules || []);
    res.json({ message: 'Schedule updated successfully', doctor, schedules });
});

// @desc    Get logged-in doctor's schedule configuration
// @route   GET /api/doctors/me/schedules
// @access  Private (Doctor)
const getMySchedules = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findOne({ user: req.user.userId });
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor profile not found');
    }

    const schedules = await DoctorSchedule.find({ doctor_id: doctor._id }).sort({
        consultation_type: 1,
        day_of_week: 1,
        start_time: 1,
    });
    res.json({ doctor, schedules });
});

module.exports = {
    getNearbyDoctors,
    getAllDoctors,
    getSpecializations,
    getDoctorById,
    getDoctorSlots,
    updateMySchedules,
    getMySchedules,
};
