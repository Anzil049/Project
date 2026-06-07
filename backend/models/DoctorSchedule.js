const mongoose = require('mongoose');

const doctorScheduleSchema = mongoose.Schema({
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
    day_of_week: {
        type: String,
        required: true,
        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    start_time: {
        type: String,
        required: true,
    },
    end_time: {
        type: String,
        required: true,
    },
    slot_duration: {
        type: Number,
        required: true,
        min: 5,
    },
    booking_limit: {
        type: Number,
        default: 1,
        min: 1,
    },
    follow_up_percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
}, {
    timestamps: true,
});

doctorScheduleSchema.index({ doctor_id: 1, consultation_type: 1, day_of_week: 1 });

const DoctorSchedule = mongoose.models.DoctorSchedule || mongoose.model('DoctorSchedule', doctorScheduleSchema);

module.exports = DoctorSchedule;
