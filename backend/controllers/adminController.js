const asyncHandler = require('express-async-handler');
const axios = require('axios');
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
        isApproved: { $ne: true }
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

// @desc    Proxy to download/view certificate with correct headers
// @route   GET /api/admin/download-certificate
// @access  Private/Admin
const downloadCertificate = asyncHandler(async (req, res) => {
    const { url } = req.query;

    console.log('Proxying download for URL:', url);

    if (!url) {
        res.status(400);
        throw new Error('URL is required');
    }

    try {
        const cloudinary = require('cloudinary').v2;
        
        // Configuration
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        // Extract public ID more reliably
        const urlParts = url.split('/');
        const medcareIndex = urlParts.findIndex(part => part === 'medcare_certificates');
        let publicId = null;
        if (medcareIndex !== -1) {
            const idWithExt = urlParts.slice(medcareIndex).join('/');
            // Remove the extension properly (everything after the last dot)
            publicId = idWithExt.substring(0, idWithExt.lastIndexOf('.'));
        }

        let downloadUrl = url;
        if (publicId) {
            // Use the official private download URL generator
            downloadUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
                resource_type: 'image',
                type: 'upload',
                attachment: true
            });
        }

        const response = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'arraybuffer'
        });

        // Force correct headers for PDF viewing/downloading
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=certificate.pdf');
        
        res.send(response.data);
    } catch (error) {
        const fs = require('fs');
        const urlParts = url.split('/');
        const medcareIndex = urlParts.findIndex(part => part === 'medcare_certificates');
        const idWithExt = medcareIndex !== -1 ? urlParts.slice(medcareIndex).join('/') : 'NOT_FOUND';
        
        // Regenerate signed URL for logging
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        const publicId = idWithExt.substring(0, idWithExt.lastIndexOf('.'));
        const signedUrlLog = cloudinary.utils.private_download_url(publicId, 'pdf', { resource_type: 'image', type: 'upload' });

        const errorLog = `Error: ${error.message}\nURL: ${url}\nSIGNED_URL: ${signedUrlLog}\nID_EXTRACTED: ${publicId}\nStatus: ${error.response?.status}\nData: ${error.response?.data?.toString()}`;
        fs.writeFileSync('_proxy_error.log', errorLog);
        
        res.status(500).json({ 
            message: 'Failed to fetch certificate from storage',
            error: error.message 
        });
    }
});

module.exports = {
    getPendingRegistrations,
    approveRegistration,
    rejectRegistration,
    downloadCertificate
};
