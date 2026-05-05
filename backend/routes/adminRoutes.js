const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Protect all admin routes
router.use(protect('admin'));

router.get('/registrations', getPendingRegistrations);
router.post('/approve/:id', approveRegistration);
router.post('/reject/:id', rejectRegistration);
router.get('/download-certificate', downloadCertificate);
router.get('/doctors', getAllApprovedDoctors);
router.get('/doctors/:id', getAdminDoctorDetails);
router.get('/hospitals', getAllApprovedHospitals);
router.get('/patients', getAllPatients);
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/featured/:role/:id', toggleFeatured);
router.delete('/users/:id', deleteUser);

module.exports = router;
