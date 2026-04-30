const mongoose = require('mongoose');
const { comparePassword, hashPassword } = require('../utils/passwordUtils');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        enum: ['patient', 'doctor', 'hospital', 'admin'],
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    certificate: {
        type: String, // URL to Cloudinary
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isVerified: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    const isMatch = await comparePassword(enteredPassword, this.password);
    console.log(`Password match check for ${this.email}: ${isMatch}`);
    return isMatch;
};

// Middleware to hash password before saving
// Refactored to use native async/await without next() for Mongoose 7/8 compatibility
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    
    try {
        this.password = await hashPassword(this.password);
    } catch (error) {
        throw error;
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
