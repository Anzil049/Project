const { body } = require('express-validator');

const locationValidator = [
    body('location')
        .optional()
        .isObject().withMessage('Location must be an object'),
    body('location.type')
        .if(body('location').exists())
        .equals('Point').withMessage('Location type must be Point'),
    body('location.coordinates')
        .if(body('location').exists())
        .isArray({ min: 2, max: 2 }).withMessage('Location coordinates must include longitude and latitude'),
    body('location.coordinates.0')
        .if(body('location.coordinates').exists())
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    body('location.coordinates.1')
        .if(body('location.coordinates').exists())
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
];

module.exports = locationValidator;
