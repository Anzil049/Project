const express = require('express');
const router = express.Router();
const {
    getPendingRegistrations,
    approveRegistration,
    rejectRegistration,
    downloadCertificate
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Protect all admin routes
router.use((req, res, next) => {
    return protect('admin')(req, res, next);
});

router.get('/registrations', getPendingRegistrations);
router.post('/approve/:id', approveRegistration);
router.post('/reject/:id', rejectRegistration);
router.get('/download-certificate', downloadCertificate);

module.exports = router;
