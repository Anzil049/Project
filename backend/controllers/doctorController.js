const asyncHandler = require('express-async-handler');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// @desc    Get nearby doctors based on coordinates
// @route   GET /api/public/doctors/nearby
// @access  Public
const getNearbyDoctors = asyncHandler(async (req, res) => {
    const { longitude, latitude, radius = 10, specialization } = req.query;

    if (!longitude || !latitude) {
        res.status(400);
        throw new Error('Please provide longitude and latitude');
    }

    // radius is in km, convert to meters for MongoDB
    const radiusInMeters = radius * 1000;

    const nearbyUsers = await User.find({
        role: 'doctor',
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

    const doctors = await Doctor.find(query)
        .populate({
            path: 'user',
            select: 'name email image location phone'
        })
        .populate({
            path: 'hospitalId',
            select: 'name'
        });

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

module.exports = {
    getNearbyDoctors
};
