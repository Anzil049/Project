const express = require('express');
const router = express.Router();
const {
    getNearbyDoctors,
    getAllDoctors,
    getSpecializations,
    getDoctorById,
    getDoctorSlots,
    updateMySchedules,
    getMySchedules,
} = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me/schedules', protect('doctor'), getMySchedules);
router.put('/me/schedules', protect('doctor'), updateMySchedules);

// Public routes for finding doctors
router.get('/', getAllDoctors);
router.get('/specializations', getSpecializations);
router.get('/nearby', getNearbyDoctors);
router.get('/:id/slots', getDoctorSlots);
router.get('/:id', getDoctorById);

module.exports = router;
