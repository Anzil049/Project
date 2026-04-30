const express = require('express');
const router = express.Router();
const {
    loginUserGeneric,
    loginUser,
    registerUser,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    logoutUser,
    refreshAccessToken,
    getUserProfile,
} = require('../controllers/authController');
const { getCurrentUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validatorMiddleware');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const upload = require('../config/multerConfig');

// Global Auth Routes
router.get('/me', getCurrentUser);
router.post('/login', loginValidator, validate, loginUserGeneric);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Registration with optional certificate upload
router.post('/:role/register', 
    upload.single('certificate'), // Handles file upload if present
    registerValidator, 
    validate, 
    registerUser
);

router.post('/:role/login', loginValidator, validate, loginUser);

router.post('/:role/logout', logoutUser);
router.post('/:role/refresh', refreshAccessToken);

// Profile route is protected by a dynamic role-check middleware
router.get('/:role/profile', (req, res, next) => {
    return protect(req.params.role)(req, res, next);
}, getUserProfile);

module.exports = router;
