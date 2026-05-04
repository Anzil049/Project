const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const { sendApprovalEmail, sendRejectionEmail } = require('../utils/emailUtils');

// @desc    Get all pending registrations (doctors & hospitals)
// @route   GET /api/admin/registrations
// @access  Private/Admin
const getPendingRegistrations = asyncHandler(async (req, res) => {
    // We only want doctors and hospitals that are verified (email OTP done) but NOT yet approved by admin.
    const pendingUsers = await User.find({ 
        role: { $in: ['doctor', 'hospital'] },
        isVerified: true,
        isApproved: false
    }).select('-password').sort({ createdAt: -1 });

    const registrations = [];

    // Fetch associated specific data (license, registration numbers, etc.)
    for (const user of pendingUsers) {
        let specificData = null;
        if (user.role === 'doctor') {
            specificData = await Doctor.findOne({ user: user._id });
        } else if (user.role === 'hospital') {
            specificData = await Hospital.findOne({ user: user._id });
        }

        registrations.push({
            id: user._id,
            name: user.name,
            email: user.email,
            type: user.role,
            submittedAt: user.createdAt,
            certPreview: user.certificate || null, // Cloudinary URL
            status: 'pending',
            details: specificData
        });
    }

    res.json(registrations);
});

// @desc    Approve a registration
// @route   POST /api/admin/approve/:id
// @access  Private/Admin
const approveRegistration = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.isApproved) {
        res.status(400);
        throw new Error('User is already approved');
    }

    user.isApproved = true;
    await user.save();

    // Send approval email
    try {
        await sendApprovalEmail(user.email, user.name, user.role);
    } catch (error) {
        console.error('Failed to send approval email:', error);
    }

    res.json({ message: 'Registration approved successfully' });
});

// @desc    Reject a registration
// @route   POST /api/admin/reject/:id
// @access  Private/Admin
const rejectRegistration = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (!reason) {
        res.status(400);
        throw new Error('Rejection reason is required');
    }

    const email = user.email;
    const name = user.name;
    const role = user.role;

    // Delete associated specific data
    if (role === 'doctor') {
        await Doctor.findOneAndDelete({ user: user._id });
    } else if (role === 'hospital') {
        await Hospital.findOneAndDelete({ user: user._id });
    }

    // Delete the user record completely
    await User.findByIdAndDelete(user._id);

    // Send rejection email
    try {
        await sendRejectionEmail(email, name, reason);
    } catch (error) {
        console.error('Failed to send rejection email:', error);
    }

    res.json({ message: 'Registration rejected and user deleted successfully' });
});

module.exports = {
    getPendingRegistrations,
    approveRegistration,
    rejectRegistration
};
