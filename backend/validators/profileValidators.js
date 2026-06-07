const { body } = require('express-validator');
const {
    BLOOD_GROUPS,
    FACILITY_TYPES,
    GENDERS,
    LICENSE_PATTERN,
    NAME_PATTERN,
    PHONE_PATTERN,
    PIN_PATTERN,
} = require('./constants');
const {
    optionalPositiveInt,
    optionalText,
    phone,
    requiredText,
} = require('./fields');
const locationValidator = require('./locationValidator');

const updateProfileValidator = [
    requiredText('name', 'Name', {
        min: 2,
        max: 100,
        pattern: NAME_PATTERN,
        patternMessage: 'Name may contain letters, spaces, apostrophes, hyphens, and periods only',
    }).optional({ checkFalsy: true }),
    phone().optional({ checkFalsy: true }),
    body('bloodGroup')
        .optional({ checkFalsy: true })
        .isIn(BLOOD_GROUPS).withMessage('Please select a valid blood group'),
    body('gender')
        .optional({ checkFalsy: true })
        .isIn(GENDERS).withMessage('Please select a valid gender'),
    body('dob')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('Please provide a valid date of birth')
        .custom((value) => {
            const date = new Date(value);
            const today = new Date();
            const oldest = new Date();
            oldest.setFullYear(today.getFullYear() - 120);
            if (date > today || date < oldest) {
                throw new Error('Please provide a realistic date of birth');
            }
            return true;
        }),
    optionalText('address', 'Address', 240),
    optionalText('city', 'City', 80),
    optionalText('state', 'State', 80),
    body('zip')
        .optional({ checkFalsy: true })
        .matches(PIN_PATTERN).withMessage('Please provide a valid 6-digit PIN code'),
    optionalText('emgName', 'Emergency contact name', 80),
    optionalText('emgRelation', 'Emergency relationship', 50),
    body('emgPhone')
        .optional({ checkFalsy: true })
        .matches(PHONE_PATTERN).withMessage('Please provide a valid emergency phone number'),
    requiredText('specialization', 'Specialization', { min: 2, max: 80 }).optional({ checkFalsy: true }),
    optionalPositiveInt('experience', 'Experience', { min: 0, max: 70 }),
    requiredText('licenseNumber', 'License number', {
        min: 3,
        max: 50,
        pattern: LICENSE_PATTERN,
    }).optional({ checkFalsy: true }),
    optionalText('qualifications', 'Qualifications', 160),
    optionalText('about', 'About', 1200),
    optionalPositiveInt('fee', 'Consultation fee', { min: 0, max: 100000 }),
    body('onlineConsultation').optional().isBoolean().withMessage('Online consultation must be true or false'),
    body('facilityType')
        .optional({ checkFalsy: true })
        .isIn(FACILITY_TYPES).withMessage('Please select a valid facility type'),
    optionalPositiveInt('beds', 'Bed capacity', { min: 1, max: 100000 }),
    body('website')
        .optional({ checkFalsy: true })
        .isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Please provide a valid website URL'),
    optionalText('coverImage', 'Cover image URL', 500),
    optionalText('image', 'Image URL', 500),
    body('facilities')
        .optional()
        .isArray().withMessage('Facilities must be an array')
        .custom((facilities) => {
            for (let i = 0; i < facilities.length; i++) {
                const facility = facilities[i];
                if (!facility.title || typeof facility.title !== 'string' || facility.title.trim() === '') {
                    throw new Error(`Facility ${i + 1} must have a valid title`);
                }
                if (!facility.description || typeof facility.description !== 'string' || facility.description.trim() === '') {
                    throw new Error(`Facility ${i + 1} must have a valid description`);
                }
                if (!facility.images || !Array.isArray(facility.images) || facility.images.length === 0) {
                    throw new Error(`Facility ${i + 1} must have at least one image`);
                }
                for (let j = 0; j < facility.images.length; j++) {
                    const img = facility.images[j];
                    if (typeof img !== 'string' || img.trim() === '') {
                        throw new Error(`Facility ${i + 1} image ${j + 1} must be a valid URL`);
                    }
                }
            }
            return true;
        }),
    ...locationValidator,
];

module.exports = {
    updateProfileValidator,
};
