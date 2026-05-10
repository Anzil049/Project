const mongoose = require('mongoose');

const hospitalSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    registrationNumber: {
        type: String,
        required: true,
    },
    facilityType: {
        type: String,
        required: true,
        enum: ['Hospital', 'Clinic'],
        set: v => v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : v
    },
    beds: {
        type: String,
        required: true,
    },
    about: {
        type: String,
    },
    phone: {
        type: String,
    },
    website: {
        type: String,
    },
    address: {
        type: String,
    },
    locality: {
        type: String,
    },
    landmark: {
        type: String,
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    zip: {
        type: String,
    },
    establishYear: {
        type: String,
    },
    coverImage: {
        type: String, // URL
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const Hospital = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;
