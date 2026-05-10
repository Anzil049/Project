const express = require('express');
const router = express.Router();
const { 
    addDoctor, 
    getDoctors, 
    toggleDoctorStatus, 
    deleteDoctor,
    updateDoctor,
    getNearbyHospitals,
    getPublicHospitals
} = require('../controllers/hospitalController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validatorMiddleware');
const { hospitalDoctorValidator, hospitalDoctorUpdateValidator } = require('../validators/authValidator');

const { doctorAddLimiter } = require('../middleware/rateLimitMiddleware');

// Public Routes
router.get('/public', getPublicHospitals);
router.get('/public/nearby', getNearbyHospitals);

// Protected Routes (Hospital only)
router.use(protect('hospital'));

// @desc    Add a new doctor
// @route   POST /api/hospital/doctors
// @access  Private (Hospital)
router.post('/doctors', doctorAddLimiter, hospitalDoctorValidator, validate, addDoctor);

// @desc    Get all doctors
// @route   GET /api/hospital/doctors
// @access  Private (Hospital)
router.get('/doctors', getDoctors);
router.put('/doctors/:id', hospitalDoctorUpdateValidator, validate, updateDoctor);
router.patch('/doctors/:id/status', toggleDoctorStatus);
router.delete('/doctors/:id', deleteDoctor);

module.exports = router;
