const { body } = require('express-validator');

const registerValidator = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address'),
    
    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),

    body('bloodGroup')
        .if((value, { req }) => req.params.role === 'patient')
        .trim()
        .notEmpty().withMessage('Blood group is required for patients')
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Please select a valid blood group'),

    // Doctor specific fields
    body('licenseNumber')
        .if((value, { req }) => req.params.role === 'doctor')
        .trim()
        .notEmpty().withMessage('License number is required')
        .isLength({ min: 5 }).withMessage('License number must be at least 5 characters'),

    body('specialization')
        .if((value, { req }) => req.params.role === 'doctor')
        .trim()
        .notEmpty().withMessage('Specialization is required')
        .isLength({ min: 2 }).withMessage('Specialization must be at least 2 characters'),

    body('experience')
        .if((value, { req }) => req.params.role === 'doctor')
        .trim()
        .notEmpty().withMessage('Experience is required')
        .isInt({ min: 0 }).withMessage('Experience must be a valid positive number'),

    // Hospital specific fields
    body('registrationNumber')
        .if((value, { req }) => req.params.role === 'hospital')
        .trim()
        .notEmpty().withMessage('Registration number is required')
        .isLength({ min: 5 }).withMessage('Registration number must be at least 5 characters'),

    body('facilityType')
        .if((value, { req }) => req.params.role === 'hospital')
        .trim()
        .notEmpty().withMessage('Facility type is required')
        .isLength({ min: 2 }).withMessage('Facility type must be at least 2 characters'),

    body('beds')
        .if((value, { req }) => req.params.role === 'hospital')
        .trim()
        .notEmpty().withMessage('Bed capacity is required')
        .isInt({ min: 1 }).withMessage('Bed capacity must be a valid number greater than 0'),
];

const loginValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address'),
    
    body('password')
        .trim()
        .notEmpty().withMessage('Password is required'),
];

module.exports = {
    registerValidator,
    loginValidator,
};
