const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');

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
        if (user.status === 'blocked') {
            res.status(403);
            return res.json({ 
                message: 'Your account has been suspended. Access revoked.',
                isBlocked: true 
            });
        }
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get featured doctors and hospitals for landing page
// @route   GET /api/public/featured
// @access  Public
const getFeaturedData = asyncHandler(async (req, res) => {
    // Fetch featured doctors
    const featuredDoctorsProfiles = await Doctor.find({ isFeatured: true })
        .populate({
            path: 'user',
            select: 'name email phone status image'
        })
        .populate({
            path: 'hospitalId',
            select: 'name'
        });
    
    // Filter out blocked doctors
    const featuredDoctors = featuredDoctorsProfiles
        .filter(doc => doc.user && doc.user.status !== 'blocked')
        .map(doc => ({
            id: doc.user._id,
            name: doc.user.name,
            specialization: doc.specialization,
            experience: doc.experience,
            hospitalName: doc.hospitalId?.name || 'Independent',
            image: doc.user.image || null
        }));

    // Fetch featured hospitals
    const featuredHospitalsProfiles = await Hospital.find({ isFeatured: true })
        .populate({
            path: 'user',
            select: 'name email phone status image'
        });
    
    // Filter out blocked hospitals
    const featuredHospitals = featuredHospitalsProfiles
        .filter(hosp => hosp.user && hosp.user.status !== 'blocked')
        .map(hosp => ({
            id: hosp.user._id,
            name: hosp.user.name,
            facilityType: hosp.facilityType,
            beds: hosp.beds,
            image: hosp.user.image || null
        }));

    res.json({
        doctors: featuredDoctors,
        hospitals: featuredHospitals
    });
});

module.exports = { getCurrentUser, getFeaturedData };
