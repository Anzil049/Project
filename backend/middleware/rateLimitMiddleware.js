const rateLimit = require('express-rate-limit');

/**
 * General rate limiter for all API requests
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window`
    message: {
        message: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Stricter limiter for sensitive operations like adding doctors
 */
const doctorAddLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each hospital IP to 20 doctor additions per hour
    message: {
        message: 'You have reached the limit for adding doctors. Please try again in an hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Limiter for authentication routes (login, forgot password)
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 authentication attempts per 15 minutes
    message: {
        message: 'Too many login attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    apiLimiter,
    doctorAddLimiter,
    authLimiter
};
