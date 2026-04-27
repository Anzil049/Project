const jwt = require('jsonwebtoken');

const generateTokens = (res, userId, role) => {
    const accessToken = jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: '15m',
    });

    const refreshToken = jwt.sign({ userId, role }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
    });

    // Set Access Token Cookie
    res.cookie(`accessToken_${role}`, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Set Refresh Token Cookie
    res.cookie(`refreshToken_${role}`, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { accessToken, refreshToken };
};

const clearTokens = (res, role) => {
    res.cookie(`accessToken_${role}`, '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.cookie(`refreshToken_${role}`, '', {
        httpOnly: true,
        expires: new Date(0),
    });
};

module.exports = { generateTokens, clearTokens };
