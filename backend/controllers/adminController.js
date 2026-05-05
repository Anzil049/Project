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

    if (url.startsWith('blob:')) {
        res.status(400);
        throw new Error('Cannot proxy browser blob URLs');
    }

    try {
        const cloudinary = require('cloudinary').v2;
        
        // Configuration
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        // Decode the URL to handle special characters (like spaces) correctly
        const decodedUrl = decodeURIComponent(url);
        const urlParts = decodedUrl.split('/');
        const medcareIndex = urlParts.findIndex(part => part === 'medcare_certificates');
        let publicId = null;
        if (medcareIndex !== -1) {
            const idWithExt = urlParts.slice(medcareIndex).join('/');
            // Remove the extension properly (everything after the last dot)
            publicId = idWithExt.substring(0, idWithExt.lastIndexOf('.'));
        }

        let downloadUrl = url;
        const ext = decodedUrl.split('.').pop().toLowerCase();
        
        if (publicId) {
            // Use the official private download URL generator
            downloadUrl = cloudinary.utils.private_download_url(publicId, ext, {
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

        // Determine content type based on extension
        let contentType = 'application/pdf';
        if (['jpg', 'jpeg'].includes(ext)) contentType = 'image/jpeg';
        else if (ext === 'png') contentType = 'image/png';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename=certificate.${ext}`);
        
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

// @desc    Get all approved doctors
// @route   GET /api/admin/doctors
// @access  Private/Admin
// @desc    Get all approved doctors
// @route   GET /api/admin/doctors
// @access  Private/Admin
const getAllApprovedDoctors = asyncHandler(async (req, res) => {
    // Fetch all doctors that are approved
    const approvedUsers = await User.find({ role: 'doctor', isApproved: true }).select('-password');
    
    const doctorsList = [];
    for (const user of approvedUsers) {
        const doctorProfile = await Doctor.findOne({ user: user._id })
            .populate({
                path: 'hospitalId',
                select: 'name'
            });

        doctorsList.push({
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            specialization: doctorProfile?.specialization || 'General',
            experience: doctorProfile?.experience || 'N/A',
            licenseNumber: doctorProfile?.licenseNumber || 'N/A',
            hospitalName: doctorProfile?.hospitalId?.name || 'Independent',
            status: user.status || 'active',
            isFeatured: doctorProfile?.isFeatured || false
        });
    }

    res.json(doctorsList);
});

// @desc    Get all approved hospitals
// @route   GET /api/admin/hospitals
// @access  Private/Admin
const getAllApprovedHospitals = asyncHandler(async (req, res) => {
    const approvedHospitals = await User.find({ role: 'hospital', isApproved: true }).select('-password');

    const hospitalsList = [];
    for (const hospitalUser of approvedHospitals) {
        const doctorsCount = await Doctor.countDocuments({ hospitalId: hospitalUser._id });
        
        hospitalsList.push({
            id: hospitalUser._id,
            name: hospitalUser.name,
            email: hospitalUser.email,
            phone: hospitalUser.phone,
            doctorsCount: doctorsCount,
            status: hospitalUser.status || 'active',
            isFeatured: (await Hospital.findOne({ user: hospitalUser._id }))?.isFeatured || false
        });
    }

    res.json(hospitalsList);
});

// @desc    Toggle user status (active/blocked)
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
const toggleUserStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.status = user.status === 'blocked' ? 'active' : 'blocked';
    await user.save();

    res.json({ 
        message: `User ${user.status === 'blocked' ? 'blocked' : 'unblocked'} successfully`,
        status: user.status 
    });
});

// @desc    Get all registered patients
// @route   GET /api/admin/patients
// @access  Private/Admin
const getAllPatients = asyncHandler(async (req, res) => {
    const patients = await User.find({ role: 'patient' }).select('-password').sort({ createdAt: -1 });
    
    const patientsList = patients.map(p => ({
        id: p._id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        status: p.status || 'active',
        joined: new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        // Dummy values for city/bloodGroup if they are not in User model (they are usually in profile)
        city: 'N/A', 
        bloodGroup: 'N/A',
        appointments: 0, // Should be fetched from Appointment model
        initials: p.name.split(' ').map(n => n[0]).join('').toUpperCase()
    }));

    res.json(patientsList);
});

// @desc    Toggle featured status
// @route   PATCH /api/admin/featured/:role/:id
// @access  Private/Admin
const toggleFeatured = asyncHandler(async (req, res) => {
    const { role, id } = req.params; // id is the User ID

    if (role === 'doctor') {
        const doctor = await Doctor.findOne({ user: id });
        if (!doctor) {
            res.status(404);
            throw new Error('Doctor profile not found');
        }
        doctor.isFeatured = !doctor.isFeatured;
        await doctor.save();
        res.json({ message: `Doctor ${doctor.isFeatured ? 'featured' : 'unfeatured'}`, isFeatured: doctor.isFeatured });
    } else if (role === 'hospital') {
        const hospital = await Hospital.findOne({ user: id });
        if (!hospital) {
            res.status(404);
            throw new Error('Hospital profile not found');
        }
        hospital.isFeatured = !hospital.isFeatured;
        await hospital.save();
        res.json({ message: `Hospital ${hospital.isFeatured ? 'featured' : 'unfeatured'}`, isFeatured: hospital.isFeatured });
    } else {
        res.status(400);
        throw new Error('Invalid role for featured status');
    }
});

// @desc    Get full doctor details for admin
// @route   GET /api/admin/doctors/:id
// @access  Private/Admin
const getAdminDoctorDetails = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const doctorProfile = await Doctor.findOne({ user: user._id })
        .populate({
            path: 'hospitalId',
            select: 'name email phone'
        });

    res.json({
        ...user._doc,
        profile: doctorProfile
    });
});

// @desc    Delete a user completely
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.role === 'doctor') {
        await Doctor.findOneAndDelete({ user: user._id });
    } else if (user.role === 'hospital') {
        await Hospital.findOneAndDelete({ user: user._id });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User and profile removed completely' });
});

module.exports = {
    getPendingRegistrations,
    approveRegistration,
    rejectRegistration,
    downloadCertificate,
    getAllApprovedDoctors,
    getAllApprovedHospitals,
    getAllPatients,
    toggleUserStatus,
    toggleFeatured,
    getAdminDoctorDetails,
    deleteUser
};
