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
        required: false,
        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', null],
    },
    custom_date: {
        type: String,
        default: null,
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

}, {
    timestamps: true,
});

doctorScheduleSchema.index({ doctor_id: 1, consultation_type: 1, day_of_week: 1 });
doctorScheduleSchema.index({ doctor_id: 1, consultation_type: 1, custom_date: 1 });

const DoctorSchedule = mongoose.models.DoctorSchedule || mongoose.model('DoctorSchedule', doctorScheduleSchema);

module.exports = DoctorSchedule;
