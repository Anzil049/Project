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
    },
    beds: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;
