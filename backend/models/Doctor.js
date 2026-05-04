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
        default: true,
    },
    availableDays: [{
        type: String,
    }],
    slots: [{
        start: String,
        end: String,
    }],
}, {
    timestamps: true,
});

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
