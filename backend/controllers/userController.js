const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Get current user by checking all role cookies
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = asyncHandler(async (req, res) => {
    const roles = ['patient', 'doctor', 'hospital', 'admin'];
    let decodedUser = null;

    // 1. Try to get token from Authorization header first (Hybrid strategy)
    let bearerToken = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        bearerToken = req.headers.authorization.split(' ')[1];
    }

    if (bearerToken) {
        try {
            const decoded = jwt.verify(bearerToken, process.env.JWT_ACCESS_SECRET);
            if (roles.includes(decoded.role)) {
                decodedUser = decoded;
            }
        } catch (err) {
            // Token invalid, fall through to cookie check
        }
    }

    // 2. Fallback to checking cookies if header token is missing or invalid
    if (!decodedUser) {
        for (const role of roles) {
            const token = req.cookies[`accessToken_${role}`];
            if (token) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
                    if (decoded.role === role) {
                        decodedUser = decoded;
                        break;
                    }
                } catch (err) {
                    // Token invalid for this role, continue checking others
                }
            }
        }
    }

    if (!decodedUser) {
        console.log('getCurrentUser failed: No valid session found for roles. Cookies:', req.cookies);
        res.status(401);
        throw new Error('Not authorized, no valid session found');
    }

    const user = await User.findById(decodedUser.userId).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = { getCurrentUser };
