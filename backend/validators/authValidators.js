const { body } = require('express-validator');
const {
    BLOOD_GROUPS,
    FACILITY_TYPES,
    LICENSE_PATTERN,
    NAME_PATTERN,
} = require('./constants');
const {
    conditionalPositiveInt,
    conditionalRequiredText,
    email,
    password,
    requiredText,
} = require('./fields');

const registerValidator = [
    body('role')
        .optional()
        .isIn(['patient', 'doctor', 'hospital']).withMessage('Invalid registration role'),
    requiredText('name', 'Name', {
        min: 2,
        max: 80,
        pattern: NAME_PATTERN,
        patternMessage: 'Name may contain letters, spaces, apostrophes, hyphens, and periods only',
    }),
    email(),
    password(),
    body('bloodGroup')
        .if((value, { req }) => req.params.role === 'patient')
        .trim()
        .notEmpty().withMessage('Blood group is required for patients')
        .isIn(BLOOD_GROUPS).withMessage('Please select a valid blood group'),
    conditionalRequiredText('licenseNumber', 'License number', (value, { req }) => req.params.role === 'doctor', {
        min: 3,
        max: 50,
        pattern: LICENSE_PATTERN,
    }),
    conditionalRequiredText('specialization', 'Specialization', (value, { req }) => req.params.role === 'doctor', {
        min: 2,
        max: 80,
    }),
    conditionalPositiveInt('experience', 'Experience', (value, { req }) => req.params.role === 'doctor', {
        min: 0,
        max: 70,
    }),
    conditionalRequiredText('registrationNumber', 'Registration number', (value, { req }) => req.params.role === 'hospital', {
        min: 5,
        max: 60,
        pattern: LICENSE_PATTERN,
    }),
    body('facilityType')
        .if((value, { req }) => req.params.role === 'hospital')
        .trim()
        .notEmpty().withMessage('Facility type is required')
        .isIn(FACILITY_TYPES).withMessage('Please select a valid facility type'),
    conditionalPositiveInt('beds', 'Bed capacity', (value, { req }) => req.params.role === 'hospital', {
        min: 1,
        max: 100000,
    }),
    body('certificate').custom((value, { req }) => {
        if (['doctor', 'hospital'].includes(req.params.role) && !req.file) {
            throw new Error('Certificate file is required');
        }
        return true;
    }),
];

const loginValidator = [
    email(),
    body('password').trim().notEmpty().withMessage('Password is required'),
];

const verifyOtpValidator = [
    email(),
    body('otp')
        .trim()
        .matches(/^[0-9]{6}$/).withMessage('OTP must be a 6-digit number'),
    body('type')
        .optional()
        .isIn(['registration', 'recovery', 'reset', '2fa']).withMessage('Invalid OTP type'),
];

const resendOtpValidator = [
    email(),
    body('type')
        .optional()
        .isIn(['registration', 'recovery', 'reset', '2fa']).withMessage('Invalid OTP type'),
];

const forgotPasswordValidator = [email()];

const resetPasswordValidator = [
    email(),
    body('otp')
        .trim()
        .matches(/^[0-9]{6}$/).withMessage('OTP must be a 6-digit number'),
    password(),
];

const changePasswordValidator = [
    email(),
    body('currentPassword')
        .trim()
        .notEmpty().withMessage('Current password is required'),
    password('newPassword'),
];

module.exports = {
    registerValidator,
    loginValidator,
    verifyOtpValidator,
    resendOtpValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    changePasswordValidator,
};
