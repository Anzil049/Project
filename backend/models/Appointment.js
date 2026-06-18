const mongoose = require('mongoose');

const appointmentSchema = mongoose.Schema({
    patient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    patient_snapshot: {
        name: String,
        phone: String,
        email: String,
        age: String,
        gender: String,
        bloodGroup: String,
        address: String,
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
    prescription_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription',
    },
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
appointmentSchema.index(
    { doctor_id: 1, slot_id: 1 },
    { 
        unique: true, 
        partialFilterExpression: { status: 'booked' } 
    }
);

// Centralized helper to revert slot status when appointment(s) are deleted or cancelled
async function revertSlots(slotIds) {
    if (!slotIds || slotIds.length === 0) return;

    try {
        const AppointmentSlot = mongoose.model('AppointmentSlot');
        await AppointmentSlot.updateMany(
            { _id: { $in: slotIds } },
            { status: 'available', booked_count: 0 }
        );
    } catch (err) {
        console.error('Error in revertSlots helper:', err);
    }
}

// Automatically revert slot status if an appointment is deleted within Mongoose
appointmentSchema.pre(['findOneAndDelete', 'deleteOne', 'deleteMany'], { document: false, query: true }, async function() {
    try {
        const filter = this.getQuery();
        const appointments = await this.model.find(filter);
        const slotIds = appointments.map(a => a.slot_id).filter(Boolean);
        if (slotIds.length > 0) {
            await revertSlots(slotIds);
        }
    } catch (err) {
        console.error('Error in Appointment query delete pre-hook:', err);
    }
});

appointmentSchema.pre('deleteOne', { document: true, query: false }, async function() {
    try {
        if (this.slot_id) {
            const slotIdStr = this.slot_id._id ? this.slot_id._id.toString() : this.slot_id.toString();
            await revertSlots([slotIdStr]);
        }
    } catch (err) {
        console.error('Error in Appointment document deleteOne pre-hook:', err);
    }
});

// Automatically revert slot status if an appointment is cancelled (status set to 'cancelled')
appointmentSchema.pre('save', async function() {
    if (this.isModified('status') && this.status === 'cancelled') {
        if (this.slot_id) {
            const slotIdStr = this.slot_id._id ? this.slot_id._id.toString() : this.slot_id.toString();
            await revertSlots([slotIdStr]);
        }
    }
});

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

// Drop the old full unique index so MongoDB can recreate it as a partial index
if (Appointment.collection) {
    Appointment.collection.dropIndex('doctor_id_1_slot_id_1').catch(err => {
        // Ignore error if index does not exist or has already been dropped
    });
}

module.exports = Appointment;
