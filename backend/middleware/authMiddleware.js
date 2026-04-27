const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler'); // Note: Need to install this or use a custom one

const protect = (role) => asyncHandler(async (req, res, next) => {
    let token;

    // Look for the specific token for this role
    token = req.cookies[`accessToken_${role}`];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            
            // Basic role check
            if (decoded.role !== role) {
                res.status(403);
                throw new Error('Not authorized for this role');
            }

            req.user = decoded;
            next();
        } catch (error) {
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    } else {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

module.exports = { protect };
