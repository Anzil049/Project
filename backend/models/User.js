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
    phone: {
        type: String,
    },
    certificate: {
        type: String, // URL to Cloudinary
    },
    image: {
        type: String, // Profile Image URL
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isVerified: {
        type: Boolean,
        default: false,
    },
    isApproved: {
        type: Boolean,
        default: false, // Will be set to true for patients during registration, but false for doctors/hospitals until admin approves
    },
    isFirstLogin: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['active', 'blocked'],
        default: 'active',
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0],
        },
    },
    address: String,
    city: String,
    state: String,
    zip: String,
    dob: Date,
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
    },
    emgName: String,
    emgRelation: String,
    emgPhone: String,
}, {
    timestamps: true,
});

// Add 2dsphere index for geolocation queries
userSchema.index({ location: '2dsphere' });

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

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
