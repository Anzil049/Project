const jwt = require('jsonwebtoken');

/**
 * Protect routes based on user role.
 * Express 5 handles async/await natively, so we don't need asyncHandler here.
 */
const protect = (role) => async (req, res, next) => {
    let token;

    // Look for the specific token for this role in cookies
    token = req.cookies[`accessToken_${role}`];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            
            // Basic role check
            if (decoded.role !== role) {
                return res.status(403).json({ message: 'Not authorized for this role' });
            }

            req.user = decoded;
            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
