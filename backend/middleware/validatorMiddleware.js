const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

    console.log('Validation failed:', extractedErrors);

    return res.status(422).json({
        errors: extractedErrors,
    });
};

module.exports = validate;
