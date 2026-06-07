const mongoose = require('mongoose');

const doctorSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Refers to the hospital's User document
    },
    specialization: {
        type: String,
        required: true,
    },
    experience: {
        type: String,
        required: true,
    },
    licenseNumber: {
        type: String,
        required: true,
    },
    maxTokens: {
        type: Number,
        default: 20,
    },
    booking_window_days: {
        type: Number,
        default: 30,
        min: 1,
    },
    onlineConsultation: {
        type: Boolean,
        default: false,
    },
    unavailability: [{
        date: {
            type: Date,
            required: true,
        },
        reason: {
            type: String,
            enum: ['leave', 'vacation', 'holiday', 'emergency_closure'],
            default: 'leave',
        },
        note: String,
    }],
    availableDays: [{
        type: String,
    }],
    slots: [{
        start: String,
        end: String,
    }],
    isFeatured: {
        type: Boolean,
        default: false,
    },
    isAcceptingAppointments: {
        type: Boolean,
        default: true,
    },
    about: {
        type: String,
    },
    phone: {
        type: String,
    },
    fee: {
        type: Number,
        default: 500,
    },
    address: {
        type: String,
    },
    qualifications: {
        type: String,
    },
}, {
    timestamps: true,
});

// Enforce consultation rules: Hospital doctors are physical only, Independent doctors default to online
doctorSchema.pre('save', async function() {
    if (this.hospitalId) {
        this.onlineConsultation = false;
    } else {
        // If they are independent and it hasn't been set, default to true
        if (this.onlineConsultation === undefined || this.onlineConsultation === null) {
            this.onlineConsultation = true;
        }
    }
});

const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
