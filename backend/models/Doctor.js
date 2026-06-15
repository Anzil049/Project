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
    booking_window_days: {
        type: Number,
        default: 30,
        min: 1,
    },
    onlineConsultation: {
        type: Boolean,
        default: false,
    },
    unavailability: [{
        date: {
            type: Date,
            required: true,
        },
        reason: {
            type: String,
            enum: ['leave', 'vacation', 'holiday', 'emergency_closure'],
            default: 'leave',
        },
        note: String,
    }],
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
    address: {
        type: String,
    },
    qualifications: {
        type: String,
    },
    custom_date_mode: {
        type: Boolean,
        default: false,
    },
    closed_bookings: [{
        date: {
            type: String,
            required: true,
        },
        consultation_type: {
            type: String,
            enum: ['online', 'offline', 'all'],
            default: 'all',
        }
    }],
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

// Centralized helper to cascade delete related entities when doctor(s) are deleted
async function cascadeDeleteDoctors(doctorIds) {
    if (!doctorIds || doctorIds.length === 0) return;

    try {
        const DoctorSchedule = mongoose.model('DoctorSchedule');
        const AppointmentSlot = mongoose.model('AppointmentSlot');
        const Appointment = mongoose.model('Appointment');

        // Delete schedules
        await DoctorSchedule.deleteMany({ doctor_id: { $in: doctorIds } });

        // Delete slots
        await AppointmentSlot.deleteMany({ doctor_id: { $in: doctorIds } });

        // Delete appointments
        await Appointment.deleteMany({ doctor_id: { $in: doctorIds } });
    } catch (err) {
        console.error('Error in cascadeDeleteDoctors helper:', err);
    }
}

// Automatically delete doctor-related collections (schedules, slots, appointments) when a doctor is deleted
doctorSchema.pre(['findOneAndDelete', 'deleteOne', 'deleteMany'], { document: false, query: true }, async function() {
    try {
        const filter = this.getQuery();
        const doctors = await this.model.find(filter);
        const doctorIds = doctors.map(d => d._id);
        if (doctorIds.length > 0) {
            await cascadeDeleteDoctors(doctorIds);
        }
    } catch (err) {
        console.error('Error in Doctor query delete pre-hook:', err);
    }
});

doctorSchema.pre('deleteOne', { document: true, query: false }, async function() {
    try {
        await cascadeDeleteDoctors([this._id]);
    } catch (err) {
        console.error('Error in Doctor document deleteOne pre-hook:', err);
    }
});

const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
