const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes based on user role.
 * Express 5 handles async/await natively, so we don't need asyncHandler here.
 */
const protect = (role) => (req, res, next) => {
    let token;

    // 1. Header token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // 2. Cookie token
    if (!token) {
        if (role === 'any') {
            const roles = ['patient', 'doctor', 'hospital', 'admin'];
            for (const r of roles) {
                const t = req.cookies[`accessToken_${r}`];
                if (t) {
                    token = t;
                    break;
                }
            }
        } else {
            token = req.cookies[`accessToken_${role}`];
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        
        if (role !== 'any' && decoded.role !== role) {
            return res.status(403).json({ message: `Not authorized for this role. Expected ${role}, got ${decoded.role}` });
        }

        User.findById(decoded.userId).select('status')
            .then(user => {
                if (!user || user.status === 'blocked') {
                    return res.status(403).json({ 
                        message: 'Your account has been suspended.',
                        isBlocked: true 
                    });
                }
                req.user = decoded;
                next();
            })
            .catch(err => {
                console.error('DB Error in protect:', err);
                res.status(500).json({ message: 'Internal server error during auth' });
            });
    } catch (error) {
        console.error('Auth Middleware Error:', error.message);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

module.exports = { protect };
