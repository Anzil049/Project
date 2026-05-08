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
    onlineConsultation: {
        type: Boolean,
        default: false,
    },
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

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
