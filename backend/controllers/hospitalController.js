const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const { sendDoctorCredentialsEmail } = require('../utils/emailUtils');
const crypto = require('crypto');

// @desc    Add a new doctor (Hospital Action)
// @route   POST /api/hospital/doctors
// @access  Private (Hospital)
const addDoctor = asyncHandler(async (req, res) => {
    const { name, email, phone, specialization, maxTokens, slots, availableDays, onlineConsultation, licenseNumber, experience, qualifications, image } = req.body;
    const hospitalId = req.user.userId;

    const hospitalUser = await User.findById(hospitalId);
    const hospitalProfile = await Hospital.findOne({ user: hospitalId });

    if (!hospitalUser || !hospitalProfile) {
        res.status(404);
        throw new Error('Hospital profile not found');
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
        res.status(400);
        throw new Error('A user with this email already exists');
    }

    // Generate a temporary 8-character password
    const tempPassword = crypto.randomBytes(4).toString('hex'); // e.g. "a1b2c3d4"

    // Create the User with role 'doctor' and isFirstLogin = true
    user = await User.create({
        name,
        email: email.toLowerCase(),
        password: tempPassword,
        role: 'doctor',
        phone,
        isVerified: true, // Bypassing OTP as they are created by a verified hospital
        isApproved: true, // Hospital-added doctors are pre-approved
        isFirstLogin: true,
        image: image || null,
        location: hospitalUser.location,
        address: hospitalProfile.address
    });

    if (user) {
        // Create the Doctor profile linked to the hospital
        await Doctor.create({
            user: user._id,
            hospitalId,
            specialization,
            maxTokens: maxTokens || 20,
            slots: slots || [],
            availableDays: availableDays || [],
            onlineConsultation: false, // Hospital doctors only support physical visits
            isAcceptingAppointments: req.body.isAcceptingAppointments ?? true,
            licenseNumber: licenseNumber || 'N/A', 
            experience: experience || 'N/A',
            qualifications: qualifications || 'N/A',
            address: hospitalProfile.address
        });

        // Send email with credentials
        try {
            await sendDoctorCredentialsEmail(user.email, user.name, tempPassword);
        } catch (error) {
            console.error('Failed to send doctor credentials email:', error);
            // We do not throw here so the doctor is still created, but hospital should be notified if needed.
        }

        res.status(201).json({
            message: 'Doctor created successfully and credentials sent to their email.',
            doctor: {
                id: user._id,
                name: user.name,
                email: user.email,
                specialization,
            }
        });
    } else {
        res.status(400);
        throw new Error('Invalid doctor data');
    }
});

// @desc    Get all doctors for a hospital
// @route   GET /api/hospital/doctors
// @access  Private (Hospital)
const getDoctors = asyncHandler(async (req, res) => {
    const hospitalId = req.user.userId;

    const doctors = await Doctor.find({ hospitalId }).populate('user', '-password');
    res.json(doctors);
});

// @desc    Toggle Doctor Status (Block/Unblock)
// @route   PATCH /api/hospital/doctors/:id/status
// @access  Private (Hospital)
const toggleDoctorStatus = asyncHandler(async (req, res) => {
    const doctorId = req.params.id; // This is the DOCTOR record ID, not user ID
    const hospitalId = req.user.userId;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.hospitalId.toString() !== hospitalId.toString()) {
        res.status(404);
        throw new Error('Doctor not found or not affiliated with this hospital');
    }

    const user = await User.findById(doctor.user);
    if (!user) {
        res.status(404);
        throw new Error('Associated user record not found');
    }

    user.status = user.status === 'active' ? 'blocked' : 'active';
    await user.save();

    res.json({
        message: `Doctor ${user.status === 'active' ? 'unblocked' : 'blocked'} successfully`,
        status: user.status
    });
});

// @desc    Delete Doctor completely
// @route   DELETE /api/hospital/doctors/:id
// @access  Private (Hospital)
const deleteDoctor = asyncHandler(async (req, res) => {
    const doctorId = req.params.id;
    const hospitalId = req.user.userId;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.hospitalId.toString() !== hospitalId.toString()) {
        res.status(404);
        throw new Error('Doctor not found or not affiliated with this hospital');
    }

    // Delete associated User record
    await User.findByIdAndDelete(doctor.user);
    
    // Delete Doctor record
    await Doctor.findByIdAndDelete(doctorId);

    res.json({ message: 'Doctor and associated account deleted permanently' });
});

// @desc    Update Doctor profile (including schedule)
// @route   PUT /api/hospital/doctors/:id
// @access  Private (Hospital)
const updateDoctor = asyncHandler(async (req, res) => {
    const doctorId = req.params.id;
    const hospitalId = req.user.userId;
    const { 
        name, email, phone, specialization, maxTokens, 
        slots, availableDays, onlineConsultation, 
        isAcceptingAppointments, licenseNumber, experience, qualifications, image 
    } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.hospitalId.toString() !== hospitalId.toString()) {
        res.status(404);
        throw new Error('Doctor not found or not affiliated with this hospital');
    }

    // Update Doctor profile
    doctor.specialization = specialization || doctor.specialization;
    doctor.maxTokens = maxTokens !== undefined ? maxTokens : doctor.maxTokens;
    doctor.slots = slots || doctor.slots;
    doctor.availableDays = availableDays || doctor.availableDays;
    doctor.onlineConsultation = onlineConsultation !== undefined ? onlineConsultation : doctor.onlineConsultation;
    doctor.isAcceptingAppointments = isAcceptingAppointments !== undefined ? isAcceptingAppointments : doctor.isAcceptingAppointments;
    doctor.licenseNumber = licenseNumber || doctor.licenseNumber;
    doctor.experience = experience || doctor.experience;
    doctor.qualifications = qualifications || doctor.qualifications;

    await doctor.save();

    // Update User if name/email/phone provided
    const user = await User.findById(doctor.user);
    if (user) {
        if (name) user.name = name;
        if (email) user.email = email.toLowerCase();
        if (phone) user.phone = phone;
        if (image) user.image = image;
        await user.save();
    }

    res.json({ 
        message: 'Doctor profile updated successfully', 
        doctor 
    });
});

// @desc    Get nearby hospitals based on coordinates
// @route   GET /api/public/hospitals/nearby
// @access  Public
const getNearbyHospitals = asyncHandler(async (req, res) => {
    const { longitude, latitude, radius = 50, facility } = req.query;

    if (!longitude || !latitude) {
        res.status(400);
        throw new Error('Please provide longitude and latitude');
    }

    // Convert radius from km to meters for MongoDB $near query
    const radiusInMeters = radius * 1000;

    const nearbyUsers = await User.find({
        role: 'hospital',
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

    // Build filter for Hospital profile
    let query = { user: { $in: userIds } };
    if (facility && facility !== 'All') {
        query.$or = [
            { facilityType: { $regex: facility, $options: 'i' } },
            { about: { $regex: facility, $options: 'i' } }
        ];
    }

    const hospitals = await Hospital.find(query)
        .populate('user', 'name email image location phone');

    const results = hospitals
        .filter(hosp => hosp.user) // Safety check for orphaned records
        .map(hosp => ({
            ...hosp.toObject(),
            distance: 'Calculated' // Native MongoDB sorting is already applied
        }));

    res.json(results);
});

// @desc    Get all public hospitals (with search/filter)
// @route   GET /api/public/hospitals
// @access  Public
const getPublicHospitals = asyncHandler(async (req, res) => {
    const { search, facility } = req.query;
    
    let hospQuery = {};
    if (facility && facility !== 'All') {
        hospQuery.$or = [
            { facilityType: { $regex: facility, $options: 'i' } },
            { about: { $regex: facility, $options: 'i' } }
        ];
    }

    // Fetch hospitals and populate active hospital users
    const hospitals = await Hospital.find(hospQuery)
        .populate({
            path: 'user',
            match: {
                role: 'hospital',
                status: 'active'
            },
            select: 'name image location status role'
        });

    // Apply name search and filter out unmatched users
    const results = hospitals.filter(h => {
        if (!h.user) return false;
        if (search && !h.user.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    res.json(results);
});

module.exports = {
    addDoctor,
    getDoctors,
    toggleDoctorStatus,
    deleteDoctor,
    updateDoctor,
    getNearbyHospitals,
    getPublicHospitals
};
