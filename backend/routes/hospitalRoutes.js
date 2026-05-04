const express = require('express');
const router = express.Router();
const { addDoctor, getDoctors } = require('../controllers/hospitalController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes in this file. The user must have 'hospital' role.
router.use(protect('hospital'));

// @desc    Add a new doctor
// @route   POST /api/hospital/doctors
// @access  Private (Hospital)
router.post('/doctors', addDoctor);

// @desc    Get all doctors
// @route   GET /api/hospital/doctors
// @access  Private (Hospital)
router.get('/doctors', getDoctors);

module.exports = router;
