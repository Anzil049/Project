const { body } = require('express-validator');
const { PHONE_PATTERN } = require('./constants');

const requiredText = (field, label, { min = 1, max = 120, pattern, patternMessage } = {}) => {
    let chain = body(field)
        .trim()
        .notEmpty().withMessage(`${label} is required`)
        .isLength({ min, max }).withMessage(`${label} must be between ${min} and ${max} characters`);

    if (pattern) {
        chain = chain.matches(pattern).withMessage(patternMessage || `${label} contains unsupported characters`);
    }

    return chain;
};

const conditionalRequiredText = (field, label, condition, options = {}) => {
    const { min = 1, max = 120, pattern, patternMessage } = options;
    let chain = body(field)
        .if(condition)
        .trim()
        .notEmpty().withMessage(`${label} is required`)
        .isLength({ min, max }).withMessage(`${label} must be between ${min} and ${max} characters`);

    if (pattern) {
        chain = chain.matches(pattern).withMessage(patternMessage || `${label} contains unsupported characters`);
    }

    return chain;
};

const optionalText = (field, label, max = 240) =>
    body(field)
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max }).withMessage(`${label} must be ${max} characters or fewer`);

const email = (field = 'email') =>
    body(field)
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .isLength({ max: 120 }).withMessage('Email must be 120 characters or fewer')
        .normalizeEmail({ gmail_remove_dots: false });

const password = (field = 'password') =>
    body(field)
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8, max: 72 }).withMessage('Password must be between 8 and 72 characters')
        .matches(/[A-Z]/).withMessage('Password must include an uppercase letter')
        .matches(/[a-z]/).withMessage('Password must include a lowercase letter')
        .matches(/[0-9]/).withMessage('Password must include a number')
        .matches(/[^A-Za-z0-9]/).withMessage('Password must include a special character');

const phone = (field = 'phone', label = 'Phone number') =>
    body(field)
        .trim()
        .notEmpty().withMessage(`${label} is required`)
        .matches(PHONE_PATTERN).withMessage(`Please provide a valid ${label.toLowerCase()}`);

const positiveInt = (field, label, { min = 1, max = 100000 } = {}) =>
    body(field)
        .notEmpty().withMessage(`${label} is required`)
        .isInt({ min, max }).withMessage(`${label} must be a whole number between ${min} and ${max}`);

const optionalPositiveInt = (field, label, { min = 0, max = 100000 } = {}) =>
    body(field)
        .optional({ checkFalsy: true })
        .isInt({ min, max }).withMessage(`${label} must be a whole number between ${min} and ${max}`);

const conditionalPositiveInt = (field, label, condition, { min = 1, max = 100000 } = {}) =>
    body(field)
        .if(condition)
        .notEmpty().withMessage(`${label} is required`)
        .isInt({ min, max }).withMessage(`${label} must be a whole number between ${min} and ${max}`);

module.exports = {
    requiredText,
    conditionalRequiredText,
    optionalText,
    email,
    password,
    phone,
    positiveInt,
    optionalPositiveInt,
    conditionalPositiveInt,
};
