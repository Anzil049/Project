const mongoose = require('mongoose');

const appointmentSchema = mongoose.Schema({
    patient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    patient_snapshot: {
        name: String,
        phone: String,
        age: String,
        gender: String,
    },
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
    slot_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'AppointmentSlot',
    },
    status: {
        type: String,
        enum: ['booked', 'consulting', 'completed', 'cancelled', 'no_show'],
        default: 'booked',
    },
    token_number: {
        type: Number,
        min: 1,
    },
    reason: String,
    booked_by_role: {
        type: String,
        enum: ['patient', 'doctor', 'hospital', 'admin'],
        default: 'patient',
    },
    payment: {
        amount: { type: Number, default: 0 },
        booking_fee: { type: Number, default: 0 },
        paid_amount: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
        status: {
            type: String,
            enum: ['pending', 'paid', 'refunded', 'failed', 'waived'],
            default: 'paid',
        },
        mode: {
            type: String,
            enum: ['online_gateway', 'cash', 'card', 'upi', 'waived'],
            default: 'online_gateway',
        },
        refund: {
            eligible: { type: Boolean, default: false },
            amount: { type: Number, default: 0 },
            status: {
                type: String,
                enum: ['none', 'pending', 'processed', 'rejected'],
                default: 'none',
            },
            reason: String,
            processed_at: Date,
        },
    },
    online_session: {
        room_id: String,
        doctor_joined_at: Date,
        patient_joined_at: Date,
        doctor_notified_at: Date,
        patient_notified_at: Date,
    },
    prescription: {
        diagnosis: String,
        notes: String,
        follow_up_date: Date,
        medicines: [{
            name: String,
            dosage: String,
            frequency: String,
            duration: String,
            instruction: String,
        }],
    },
    consultation_notes: String,
    feedback: {
        doctor_rating: { type: Number, min: 1, max: 5 },
        hospital_rating: { type: Number, min: 1, max: 5 },
        comment: String,
        tags: [String],
        submitted_at: Date,
    },
    cancelled_at: Date,
    cancellation_reason: String,
}, {
    timestamps: true,
});

appointmentSchema.index({ patient_id: 1, createdAt: -1 });
appointmentSchema.index({ doctor_id: 1, consultation_type: 1 });
appointmentSchema.index({ doctor_id: 1, slot_id: 1 }, { unique: true });

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
