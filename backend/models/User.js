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

// Centralized helper to cascade delete related entities when user(s) are deleted
async function cascadeDeleteUsers(userIds) {
    if (!userIds || userIds.length === 0) return;

    try {
        const Doctor = mongoose.model('Doctor');
        const Hospital = mongoose.model('Hospital');
        const Appointment = mongoose.model('Appointment');
        const User = mongoose.model('User');

        const users = await User.find({ _id: { $in: userIds } });
        if (users.length === 0) return;

        const doctorUserIds = [];
        const hospitalUserIds = [];
        const patientUserIds = [];

        for (const u of users) {
            if (u.role === 'doctor') {
                doctorUserIds.push(u._id);
            } else if (u.role === 'hospital') {
                hospitalUserIds.push(u._id);
            } else if (u.role === 'patient') {
                patientUserIds.push(u._id);
            }
        }

        // 1. If hospital users are deleted, delete affiliated doctor users and their doctor profiles
        if (hospitalUserIds.length > 0) {
            // Delete Hospital profiles
            await Hospital.deleteMany({ user: { $in: hospitalUserIds } });

            // Find doctors affiliated with this hospital (hospitalId is the hospital's User ID)
            const affiliatedDoctors = await Doctor.find({ hospitalId: { $in: hospitalUserIds } });
            const affiliatedDoctorUserIds = affiliatedDoctors.map(d => d.user).filter(Boolean);
            const affiliatedDoctorIds = affiliatedDoctors.map(d => d._id);

            if (affiliatedDoctorUserIds.length > 0) {
                // Delete doctor user accounts (which triggers cascadeDeleteUsers recursively)
                await User.deleteMany({ _id: { $in: affiliatedDoctorUserIds } });
            }
            if (affiliatedDoctorIds.length > 0) {
                // In case doctor profiles aren't deleted by User.deleteMany, clean them up
                await Doctor.deleteMany({ _id: { $in: affiliatedDoctorIds } });
            }
        }

        // 2. If doctor users are deleted, delete their doctor profiles (which triggers Doctor deletion cascade)
        if (doctorUserIds.length > 0) {
            const doctors = await Doctor.find({ user: { $in: doctorUserIds } });
            const doctorIds = doctors.map(d => d._id);
            if (doctorIds.length > 0) {
                await Doctor.deleteMany({ _id: { $in: doctorIds } });
            }
        }

        // 3. If patient users are deleted, delete their appointments
        if (patientUserIds.length > 0) {
            await Appointment.deleteMany({ patient_id: { $in: patientUserIds } });
        }
    } catch (err) {
        console.error('Error in cascadeDeleteUsers helper:', err);
    }
}

// Automatically delete associated profiles when a user is deleted
userSchema.pre(['findOneAndDelete', 'deleteOne', 'deleteMany'], { document: false, query: true }, async function() {
    try {
        const filter = this.getQuery();
        const users = await this.model.find(filter);
        const userIds = users.map(u => u._id);
        if (userIds.length > 0) {
            await cascadeDeleteUsers(userIds);
        }
    } catch (err) {
        console.error('Error in User query delete pre-hook:', err);
    }
});

userSchema.pre('deleteOne', { document: true, query: false }, async function() {
    try {
        await cascadeDeleteUsers([this._id]);
    } catch (err) {
        console.error('Error in User document deleteOne pre-hook:', err);
    }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
