const express = require('express');
const router = express.Router();
const { addDoctor, getDoctors, toggleDoctorStatus, deleteDoctor } = require('../controllers/hospitalController');
const { protect } = require('../middleware/authMiddleware');

const { doctorAddLimiter } = require('../middleware/rateLimitMiddleware');

// Protect all routes in this file. The user must have 'hospital' role.
router.use(protect('hospital'));

// @desc    Add a new doctor
// @route   POST /api/hospital/doctors
// @access  Private (Hospital)
router.post('/doctors', doctorAddLimiter, addDoctor);

// @desc    Get all doctors
// @route   GET /api/hospital/doctors
// @access  Private (Hospital)
router.get('/doctors', getDoctors);
router.patch('/doctors/:id/status', toggleDoctorStatus);
router.delete('/doctors/:id', deleteDoctor);

module.exports = router;
