const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const OTP = require('../models/OTP');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const { generateTokens, clearTokens } = require('../utils/tokenUtils');
const { sendOTPEmail, sendResetEmail } = require('../utils/emailUtils');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// @desc    Auth user & get token (Generic - auto-detects role)
// @route   POST /api/auth/login
// @access  Public
const loginUserGeneric = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        // Check if user is verified
        if (!user.isVerified) {
            res.status(403);
            throw new Error('Please verify your email to login');
        }

        // Automatically generate tokens for the user's specific role
        generateTokens(res, user._id, user.role);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            isFirstLogin: user.isFirstLogin,
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Auth user & get token (Role-specific - strict)
// @route   POST /api/auth/:role/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { role } = req.params; // From URL params

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (user.role !== role) {
            res.status(403);
            throw new Error(`Invalid credentials for role: ${role}`);
        }

        generateTokens(res, user._id, user.role);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new user
// @route   POST /api/auth/:role/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, bloodGroup, registrationNumber, facilityType, beds, licenseNumber, specialization, experience } = req.body;
    const { role } = req.params;

    let user = await User.findOne({ email });

    if (user) {
        // If user exists and is already verified, block registration
        if (user.isVerified) {
            res.status(400);
            throw new Error('User already exists');
        } else {
            // If user exists but is NOT verified, update their info and proceed to send new OTP
            user.name = name;
            user.password = password; // Will be hashed by pre-save hook
            user.role = role;
            user.bloodGroup = role === 'patient' ? bloodGroup : null;
            user.certificate = req.file ? req.file.path : null;
            await user.save();

            // We should also update or create the profile, but for simplicity we will handle it below by checking if profile exists
        }
    } else {
        // Create new user if they don't exist
        user = await User.create({
            name,
            email,
            password,
            role,
            bloodGroup: role === 'patient' ? bloodGroup : null,
            certificate: req.file ? req.file.path : null,
        });
    }

    if (user) {
        if (role === 'hospital') {
            await Hospital.findOneAndUpdate(
                { user: user._id },
                { registrationNumber, facilityType, beds },
                { upsert: true, new: true }
            );
        } else if (role === 'doctor') {
            await Doctor.findOneAndUpdate(
                { user: user._id },
                { licenseNumber, specialization, experience },
                { upsert: true, new: true }
            );
        }

        // Generate a random 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in database
        await OTP.create({
            email: user.email.toLowerCase(),
            otp: otpCode,
        });

        // Send OTP via email
        try {
            await sendOTPEmail(user.email.toLowerCase(), otpCode);
        } catch (error) {
            console.error('Email sending failed:', error.message);
            // We don't throw here to allow the user to try "resend" later
        }

        res.status(201).json({
            message: 'Registration successful. Please verify your email.',
            email: user.email,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase();

    console.log(`Verification attempt for ${normalizedEmail} with OTP: ${otp}`);

    const otpRecord = await OTP.findOne({ 
        email: normalizedEmail, 
        otp: otp.toString() 
    });

    if (!otpRecord) {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    // Mark user as verified
    const user = await User.findOneAndUpdate({ email: normalizedEmail }, { isVerified: true }, { new: true });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Delete the used OTP
    await OTP.deleteMany({ email });

    // Now generate tokens and log them in
    generateTokens(res, user._id, user.role);

    res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
    });
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
    const { email, type } = req.body;
    const normalizedEmail = email.toLowerCase();
    const isRecovery = type === 'recovery' || type === 'reset' || type === '2fa';

    console.log(`Resend OTP request for: ${normalizedEmail}, type: ${type}`);

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (!isRecovery && user.isVerified) {
        res.status(400);
        throw new Error('Account already verified');
    }

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: normalizedEmail });

    // Generate a new 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store new OTP
    await OTP.create({
        email: normalizedEmail,
        otp: otpCode,
    });

    // Send new OTP
    await sendOTPEmail(normalizedEmail, otpCode, isRecovery ? 'reset' : 'verification');

    res.status(200).json({ message: 'New OTP sent to your email' });
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/:role/logout
// @access  Public
const logoutUser = (req, res) => {
    const { role } = req.params;
    clearTokens(res, role);
    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Refresh access token
// @route   POST /api/auth/:role/refresh
// @access  Public
const refreshAccessToken = asyncHandler(async (req, res) => {
    const { role } = req.params;
    const refreshToken = req.cookies[`refreshToken_${role}`];

    if (!refreshToken) {
        res.status(401);
        throw new Error('No refresh token provided');
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        
        if (decoded.role !== role) {
            res.status(403);
            throw new Error('Token role mismatch');
        }

        // Re-generate both tokens (rotation)
        generateTokens(res, decoded.userId, decoded.role);

        res.status(200).json({ message: 'Token refreshed' });
    } catch (error) {
        res.status(401);
        throw new Error('Invalid refresh token');
    }
});

// @desc    Get user profile
// @route   GET /api/auth/:role/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId).select('-password');

    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        res.status(404);
        throw new Error('User with this email does not exist');
    }

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: normalizedEmail });

    // Generate a new 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store new OTP
    await OTP.create({
        email: normalizedEmail,
        otp: otpCode,
    });

    // Send Reset OTP
    await sendOTPEmail(normalizedEmail, otpCode, 'reset');

    res.status(200).json({ message: 'Password reset code sent to your email' });
});

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Verify OTP
    const otpRecord = await OTP.findOne({ 
        email: normalizedEmail, 
        otp: otp.toString() 
    });

    if (!otpRecord) {
        res.status(400);
        throw new Error('Invalid or expired reset code');
    }

    // Find user and update password
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.password = password;
    await user.save();

    // Delete the used OTP
    await OTP.deleteMany({ email: normalizedEmail });

    res.status(200).json({ message: 'Password reset successful. You can now login.' });
});

// @desc    Change First Password
// @route   POST /api/auth/change-password
// @access  Private (or Public if using current password)
const changeFirstPassword = asyncHandler(async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(currentPassword))) {
        user.password = newPassword;
        user.isFirstLogin = false;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully. You can now login with your new password.' });
    } else {
        res.status(401);
        throw new Error('Invalid email or current password');
    }
});

module.exports = {
    loginUserGeneric,
    loginUser,
    registerUser,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    changeFirstPassword,
    logoutUser,
    refreshAccessToken,
    getUserProfile,
};
