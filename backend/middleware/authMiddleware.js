const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes based on user role.
 * Express 5 handles async/await natively, so we don't need asyncHandler here.
 */
const protect = (role) => async (req, res, next) => {
    let token;

    // 1. Try Authorization Bearer header first (hybrid strategy)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // 2. Fallback to role-specific cookie
    if (!token) {
        token = req.cookies[`accessToken_${role}`];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            
            // Basic role check
            if (decoded.role !== role) {
                return res.status(403).json({ message: 'Not authorized for this role' });
            }

            // Check if user is blocked in the database (Real-time enforcement)
            const user = await User.findById(decoded.userId).select('status');
            if (!user || user.status === 'blocked') {
                return res.status(403).json({ 
                    message: 'Your account has been suspended. Access revoked.',
                    isBlocked: true 
                });
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
