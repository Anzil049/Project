const express = require('express');
const router = express.Router();
const { getNearbyDoctors, getAllDoctors } = require('../controllers/doctorController');

// Public routes for finding doctors
router.get('/', getAllDoctors);
router.get('/nearby', getNearbyDoctors);

module.exports = router;
