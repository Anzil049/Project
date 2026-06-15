const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const DoctorSchedule = require('../models/DoctorSchedule');
const Appointment = require('../models/Appointment');
const AppointmentSlot = require('../models/AppointmentSlot');
const { replaceDoctorSchedules } = require('../utils/schedulingUtils');
const { sendDoctorCredentialsEmail } = require('../utils/emailUtils');
const crypto = require('crypto');

// @desc    Add a new doctor (Hospital Action)
// @route   POST /api/hospital/doctors
// @access  Private (Hospital)
const addDoctor = asyncHandler(async (req, res) => {
    const { name, email, phone, specialization, maxTokens, slots, availableDays, onlineConsultation, licenseNumber, experience, qualifications, image, booking_window_days, schedules } = req.body;
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

    // Construct full address for doctor
    const fullAddressParts = [];
    if (hospitalProfile.address) fullAddressParts.push(hospitalProfile.address);
    if (hospitalProfile.city) fullAddressParts.push(hospitalProfile.city);
    if (hospitalProfile.state) fullAddressParts.push(hospitalProfile.state);
    const doctorFullAddress = fullAddressParts.join(', ');

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
        address: doctorFullAddress
    });

    if (user) {
        // Create the Doctor profile linked to the hospital
        const doctorProfile = await Doctor.create({
            user: user._id,
            hospitalId,
            specialization,
            maxTokens: maxTokens || 20,
            booking_window_days: booking_window_days || 30,
            slots: slots || [],
            availableDays: availableDays || [],
            onlineConsultation: false, // Hospital doctors only support physical visits
            isAcceptingAppointments: req.body.isAcceptingAppointments ?? true,
            licenseNumber: licenseNumber || 'N/A', 
            experience: experience || 'N/A',
            qualifications: qualifications || 'N/A',
            address: doctorFullAddress
        });

        if (Array.isArray(schedules) && schedules.length > 0) {
            await replaceDoctorSchedules(doctorProfile, schedules.map(schedule => ({
                ...schedule,
                consultation_type: 'offline',
            })));
        }

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

    const doctors = await Doctor.find({ hospitalId }).populate('user', '-password').lean();
    const scheduleGroups = await DoctorSchedule.find({
        doctor_id: { $in: doctors.map(doctor => doctor._id) }
    }).sort({ consultation_type: 1, custom_date: 1, day_of_week: 1, start_time: 1 }).lean();

    const schedulesByDoctor = scheduleGroups.reduce((acc, schedule) => {
        const key = schedule.doctor_id.toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(schedule);
        return acc;
    }, {});

    res.json(doctors.map(doctor => ({
        ...doctor,
        schedules: schedulesByDoctor[doctor._id.toString()] || [],
    })));
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
        isAcceptingAppointments, licenseNumber, experience, qualifications, image,
        booking_window_days, schedules, unavailability
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
    doctor.onlineConsultation = false;
    doctor.isAcceptingAppointments = isAcceptingAppointments !== undefined ? isAcceptingAppointments : doctor.isAcceptingAppointments;
    doctor.booking_window_days = booking_window_days !== undefined ? booking_window_days : doctor.booking_window_days;
    doctor.custom_date_mode = req.body.custom_date_mode !== undefined ? req.body.custom_date_mode : doctor.custom_date_mode;
    if (Array.isArray(unavailability)) doctor.unavailability = unavailability;
    doctor.licenseNumber = licenseNumber || doctor.licenseNumber;
    doctor.experience = experience || doctor.experience;
    doctor.qualifications = qualifications || doctor.qualifications;

    await doctor.save();

    if (Array.isArray(unavailability) && unavailability.length > 0) {
        for (const leave of unavailability) {
            const dayStart = new Date(leave.date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);
            const slotsToBlock = await AppointmentSlot.find({
                doctor_id: doctor._id,
                start_datetime: { $gte: dayStart, $lte: dayEnd },
            });
            const affectedAppointments = await Appointment.find({
                doctor_id: doctor._id,
                slot_id: { $in: slotsToBlock.map(slot => slot._id) },
                status: { $in: ['booked', 'consulting'] },
            });

            for (const appointment of affectedAppointments) {
                const paidAmount = Number(appointment.payment?.paid_amount || 0);
                appointment.status = 'cancelled';
                appointment.cancelled_at = new Date();
                appointment.cancellation_reason = leave.note || 'Hospital blocked doctor availability';
                appointment.payment = {
                    ...(appointment.payment?.toObject ? appointment.payment.toObject() : appointment.payment),
                    status: paidAmount > 0 ? 'refunded' : appointment.payment?.status,
                    refund: {
                        eligible: true,
                        amount: paidAmount,
                        status: paidAmount > 0 ? 'processed' : 'none',
                        reason: 'provider_blocked',
                        processed_at: paidAmount > 0 ? new Date() : undefined,
                    },
                };
                await appointment.save();
            }

            await AppointmentSlot.updateMany(
                { _id: { $in: slotsToBlock.map(slot => slot._id) } },
                { status: 'blocked', booked_count: 0 }
            );
        }
    }

    let updatedSchedules = undefined;
    if (Array.isArray(schedules)) {
        updatedSchedules = await replaceDoctorSchedules(doctor, schedules.map(schedule => ({
            ...schedule,
            consultation_type: 'offline',
        })));
    }

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
        doctor,
        schedules: updatedSchedules,
    });
});

// @desc    Get nearby hospitals based on coordinates
// @route   GET /api/public/hospitals/nearby
// @access  Public
const getNearbyHospitals = asyncHandler(async (req, res) => {
    const { longitude, latitude, radius = 50, facility, search } = req.query;

    if (!longitude || !latitude) {
        res.status(400);
        throw new Error('Please provide longitude and latitude');
    }

    // Convert radius from km to meters for MongoDB $near query
    const radiusInMeters = radius * 1000;

    const nearbyUsers = await User.find({
        role: 'hospital',
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

    // Build filter for Hospital profile
    let query = { user: { $in: userIds } };
    if (facility && facility !== 'All') {
        query.$or = [
            { facilityType: { $regex: facility, $options: 'i' } },
            { about: { $regex: facility, $options: 'i' } },
            { 'facilities.title': { $regex: facility, $options: 'i' } }
        ];
    }

    let hospitals = await Hospital.find(query)
        .populate('user', 'name email image location phone');

    if (search) {
        const searchLower = search.toLowerCase();
        hospitals = hospitals.filter(h => {
            if (!h.user) return false;
            const nameMatch = h.user.name?.toLowerCase().includes(searchLower);
            const cityMatch = h.city?.toLowerCase().includes(searchLower);
            const stateMatch = h.state?.toLowerCase().includes(searchLower);
            const addressMatch = h.address?.toLowerCase().includes(searchLower);
            const facilityTypeMatch = h.facilityType?.toLowerCase().includes(searchLower);
            
            return nameMatch || cityMatch || stateMatch || addressMatch || facilityTypeMatch;
        });
    }

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
            { about: { $regex: facility, $options: 'i' } },
            { 'facilities.title': { $regex: facility, $options: 'i' } }
        ];
    }

    // Fetch hospitals and populate active hospital users
    const hospitals = await Hospital.find(hospQuery)
        .populate({
            path: 'user',
            match: {
                role: 'hospital',
                status: 'active',
                isVerified: true,
                isApproved: true
            },
            select: 'name image location status role isVerified isApproved'
        });

    // Apply name and location search and filter out unmatched users
    const results = hospitals.filter(h => {
        if (!h.user) return false;
        if (search) {
            const searchLower = search.toLowerCase();
            const nameMatch = h.user.name?.toLowerCase().includes(searchLower);
            const cityMatch = h.city?.toLowerCase().includes(searchLower);
            const stateMatch = h.state?.toLowerCase().includes(searchLower);
            const addressMatch = h.address?.toLowerCase().includes(searchLower);
            const facilityTypeMatch = h.facilityType?.toLowerCase().includes(searchLower);
            
            if (!nameMatch && !cityMatch && !stateMatch && !addressMatch && !facilityTypeMatch) return false;
        }
        return true;
    });

    res.json(results);
});

// @desc    Get hospital details by ID
// @route   GET /api/public/hospitals/:id
// @access  Public
const getHospitalById = asyncHandler(async (req, res) => {
    const hospital = await Hospital.findOne({ user: req.params.id })
        .populate('user', 'name image location status phone city state address');
    
    if (!hospital || (hospital.user && hospital.user.status === 'blocked')) {
        res.status(404);
        throw new Error('Hospital not found');
    }

    const doctors = await Doctor.find({ hospitalId: req.params.id })
        .populate('user', 'name image status');

    res.json({
        ...hospital.toObject(),
        doctors: doctors.filter(d => d.user && d.user.status === 'active')
    });
});

// @desc    Get all unique facility titles
// @route   GET /api/public/hospitals/facilities
// @access  Public
const getFacilityTitles = asyncHandler(async (req, res) => {
    // Get unique facilities from hospitals whose user is active, verified, and approved
    const activeUsers = await User.find({ 
        role: 'hospital', 
        status: 'active', 
        isVerified: true, 
        isApproved: true 
    }).select('_id');
    const activeUserIds = activeUsers.map(u => u._id);

    const distinctFacilities = await Hospital.distinct('facilities.title', { user: { $in: activeUserIds } });
    
    // Filter out any null or empty ones, then sort
    const validFacilities = distinctFacilities.filter(f => f && f.trim() !== '').sort();
    
    res.json(validFacilities);
});

module.exports = {
    addDoctor,
    getDoctors,
    toggleDoctorStatus,
    deleteDoctor,
    updateDoctor,
    getNearbyHospitals,
    getPublicHospitals,
    getHospitalById,
    getFacilityTitles
};
