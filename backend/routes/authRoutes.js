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
    changeFirstPassword,
    logoutUser,
    refreshAccessToken,
    getUserProfile,
} = require('../controllers/authController');
const { getCurrentUser, getFeaturedData, updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validatorMiddleware');
const {
    registerValidator,
    loginValidator,
    verifyOtpValidator,
    resendOtpValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    changePasswordValidator,
    updateProfileValidator,
} = require('../validators/authValidator');
const upload = require('../config/multerConfig');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

// Global Auth Routes
router.get('/me', getCurrentUser);
router.get('/featured', getFeaturedData);
router.post('/login', authLimiter, loginValidator, validate, loginUserGeneric);
router.post('/verify-otp', verifyOtpValidator, validate, verifyOTP);
router.post('/resend-otp', resendOtpValidator, validate, resendOTP);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidator, validate, resetPassword);
router.post('/change-password', changePasswordValidator, validate, changeFirstPassword);

// Role-specific Registration
router.post('/:role/register', 
    authLimiter,
    upload.single('certificate'),
    registerValidator, 
    validate, 
    registerUser
);

router.post('/:role/login', loginValidator, validate, loginUser);
router.post('/:role/logout', logoutUser);
router.post('/:role/refresh', refreshAccessToken);

// Role-specific profile fetching
router.get('/patient/profile', protect('patient'), getUserProfile);
router.get('/doctor/profile', protect('doctor'), getUserProfile);
router.get('/hospital/profile', protect('hospital'), getUserProfile);
router.get('/admin/profile', protect('admin'), getUserProfile);

// Unified profile update route
router.put('/profile', protect('any'), updateProfileValidator, validate, updateUserProfile);

// Upload route
router.post('/upload', protect('any'), (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Upload failed', error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        res.json({ url: req.file.path });
    });
});

module.exports = router;
