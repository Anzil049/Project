const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { generateTokens, clearTokens } = require('../utils/tokenUtils');
const jwt = require('jsonwebtoken');

// @desc    Auth user & get token
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
    const { name, email, password } = req.body;
    const { role } = req.params;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
        role,
    });

    if (user) {
        generateTokens(res, user._id, user.role);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
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

module.exports = {
    loginUser,
    registerUser,
    logoutUser,
    refreshAccessToken,
    getUserProfile,
};
