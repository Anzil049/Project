const { body } = require('express-validator');
const {
    LICENSE_PATTERN,
    NAME_PATTERN,
    WEEK_DAYS,
} = require('./constants');
const {
    email,
    optionalPositiveInt,
    optionalText,
    phone,
    positiveInt,
    requiredText,
} = require('./fields');

const scheduleValidators = [
    body('isAcceptingAppointments').optional().isBoolean().withMessage('Accepting appointments must be true or false'),
    body('availableDays')
        .optional()
        .isArray().withMessage('Available days must be an array')
        .custom((days) => days.every(day => WEEK_DAYS.includes(day))).withMessage('Available days contains an invalid day'),
    body('slots')
        .optional()
        .isArray().withMessage('Slots must be an array'),
    body('slots.*.start')
        .optional()
        .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Slot start time must use HH:mm format'),
    body('slots.*.end')
        .optional()
        .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Slot end time must use HH:mm format'),
];

const hospitalDoctorValidator = [
    requiredText('name', 'Name', {
        min: 2,
        max: 80,
        pattern: NAME_PATTERN,
        patternMessage: 'Name may contain letters, spaces, apostrophes, hyphens, and periods only',
    }),
    email(),
    phone(),
    requiredText('specialization', 'Specialization', { min: 2, max: 80 }),
    positiveInt('maxTokens', 'Token limit', { min: 1, max: 200 }),
    requiredText('licenseNumber', 'License number', { min: 3, max: 50, pattern: LICENSE_PATTERN }),
    positiveInt('experience', 'Experience', { min: 0, max: 70 }),
    requiredText('qualifications', 'Qualifications', { min: 2, max: 160 }),
    optionalText('image', 'Image URL', 500),
    ...scheduleValidators,
];

const hospitalDoctorUpdateValidator = [
    requiredText('name', 'Name', {
        min: 2,
        max: 80,
        pattern: NAME_PATTERN,
        patternMessage: 'Name may contain letters, spaces, apostrophes, hyphens, and periods only',
    }).optional({ checkFalsy: true }),
    email().optional({ checkFalsy: true }),
    phone().optional({ checkFalsy: true }),
    requiredText('specialization', 'Specialization', { min: 2, max: 80 }).optional({ checkFalsy: true }),
    optionalPositiveInt('maxTokens', 'Token limit', { min: 1, max: 200 }),
    requiredText('licenseNumber', 'License number', { min: 3, max: 50, pattern: LICENSE_PATTERN }).optional({ checkFalsy: true }),
    optionalPositiveInt('experience', 'Experience', { min: 0, max: 70 }),
    requiredText('qualifications', 'Qualifications', { min: 2, max: 160 }).optional({ checkFalsy: true }),
    optionalText('image', 'Image URL', 500),
    ...scheduleValidators,
];

module.exports = {
    hospitalDoctorValidator,
    hospitalDoctorUpdateValidator,
};
