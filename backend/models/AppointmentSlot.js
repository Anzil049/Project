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

// Centralized helper to cascade delete related entities when slot(s) are deleted
async function cascadeDeleteSlots(slotIds) {
    if (!slotIds || slotIds.length === 0) return;

    try {
        const Appointment = mongoose.model('Appointment');
        await Appointment.deleteMany({ slot_id: { $in: slotIds } });
    } catch (err) {
        console.error('Error in cascadeDeleteSlots helper:', err);
    }
}

// Automatically delete associated appointments when an appointment slot is deleted
appointmentSlotSchema.pre(['findOneAndDelete', 'deleteOne', 'deleteMany'], { document: false, query: true }, async function() {
    try {
        const filter = this.getQuery();
        const slots = await this.model.find(filter);
        const slotIds = slots.map(s => s._id);
        if (slotIds.length > 0) {
            await cascadeDeleteSlots(slotIds);
        }
    } catch (err) {
        console.error('Error in AppointmentSlot query delete pre-hook:', err);
    }
});

appointmentSlotSchema.pre('deleteOne', { document: true, query: false }, async function() {
    try {
        await cascadeDeleteSlots([this._id]);
    } catch (err) {
        console.error('Error in AppointmentSlot document deleteOne pre-hook:', err);
    }
});

const AppointmentSlot = mongoose.models.AppointmentSlot || mongoose.model('AppointmentSlot', appointmentSlotSchema);

module.exports = AppointmentSlot;
