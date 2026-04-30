const bcrypt = require('bcryptjs');

/**
 * Compares a plain text password with a hashed password.
 * @param {string} enteredPassword - The plain text password from user input.
 * @param {string} hashedPassword - The stored hashed password.
 * @returns {Promise<boolean>}
 */
const comparePassword = async (enteredPassword, hashedPassword) => {
    return await bcrypt.compare(enteredPassword, hashedPassword);
};

/**
 * Hashes a plain text password.
 * @param {string} password - The plain text password.
 * @returns {Promise<string>}
 */
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

module.exports = {
    comparePassword,
    hashPassword,
};
