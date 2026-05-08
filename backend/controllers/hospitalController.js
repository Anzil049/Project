const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { sendDoctorCredentialsEmail } = require('../utils/emailUtils');
const crypto = require('crypto');

// @desc    Add a new doctor (Hospital Action)
// @route   POST /api/hospital/doctors
// @access  Private (Hospital)
const addDoctor = asyncHandler(async (req, res) => {
    const { name, email, phone, specialization, maxTokens, slots, availableDays, onlineConsultation, licenseNumber, experience, image } = req.body;
    const hospitalId = req.user.userId;

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
        isAcceptingAppointments, licenseNumber, experience, image 
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

module.exports = {
    addDoctor,
    getDoctors,
    toggleDoctorStatus,
    deleteDoctor,
    updateDoctor,
};
