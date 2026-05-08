const express = require('express');
const router = express.Router();
const { getNearbyDoctors } = require('../controllers/doctorController');

// Public routes for finding doctors
router.get('/nearby', getNearbyDoctors);

module.exports = router;
