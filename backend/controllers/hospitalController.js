const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { sendDoctorCredentialsEmail } = require('../utils/emailUtils');
const crypto = require('crypto');

// @desc    Add a new doctor (Hospital Action)
// @route   POST /api/hospital/doctors
// @access  Private (Hospital)
const addDoctor = asyncHandler(async (req, res) => {
    const { name, email, phone, specialization, maxTokens, slots, availableDays, onlineConsultation, licenseNumber, experience } = req.body;
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
        isFirstLogin: true,
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
            onlineConsultation: onlineConsultation ?? true,
            licenseNumber: licenseNumber || 'N/A', // If added by hospital, they can put a placeholder if not provided upfront
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

module.exports = {
    addDoctor,
    getDoctors,
};
