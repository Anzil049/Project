const mongoose = require('mongoose');

const appointmentSlotSchema = mongoose.Schema({
    doctor_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Doctor',
    },
    consultation_type: {
        type: String,
        required: true,
        enum: ['online', 'offline'],
    },
    start_datetime: {
        type: Date,
        required: true,
    },
    end_datetime: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['available', 'booked', 'completed', 'cancelled', 'blocked', 'no_show'],
        default: 'available',
    },
    is_reserved: {
        type: Boolean,
        default: false,
    },
    reserved_for: {
        type: String,
        enum: ['emergency', 'follow_up', null],
        default: null,
    },
    booking_limit: {
        type: Number,
        default: 1,
    },
    booked_count: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

appointmentSlotSchema.index(
    { doctor_id: 1, consultation_type: 1, start_datetime: 1 },
    { unique: true }
);

const AppointmentSlot = mongoose.models.AppointmentSlot || mongoose.model('AppointmentSlot', appointmentSlotSchema);

module.exports = AppointmentSlot;
