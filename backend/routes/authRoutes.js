const express = require('express');
const router = express.Router();
const {
    loginUser,
    registerUser,
    logoutUser,
    refreshAccessToken,
    getUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// The :role parameter allows us to handle patient, doctor, hospital, and admin in one clean set of routes
router.post('/:role/login', loginUser);
router.post('/:role/register', registerUser);
router.post('/:role/logout', logoutUser);
router.post('/:role/refresh', refreshAccessToken);

// Profile route is protected by a dynamic role-check middleware
router.get('/:role/profile', (req, res, next) => {
    const { role } = req.params;
    protect(role)(req, res, next);
}, getUserProfile);

module.exports = router;
