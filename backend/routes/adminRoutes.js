const express = require('express');
const router = express.Router();
const {
    getPendingRegistrations,
    approveRegistration,
    rejectRegistration,
    downloadCertificate,
    getAllApprovedDoctors,
    getAllApprovedHospitals
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Protect all admin routes
router.use(protect('admin'));

router.get('/registrations', getPendingRegistrations);
router.post('/approve/:id', approveRegistration);
router.post('/reject/:id', rejectRegistration);
router.get('/download-certificate', downloadCertificate);
router.get('/doctors', getAllApprovedDoctors);
router.get('/hospitals', getAllApprovedHospitals);

module.exports = router;
