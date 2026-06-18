const mongoose = require('mongoose');

const prescriptionSchema = mongoose.Schema({
    appointment_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Appointment',
    },
    patient_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    doctor_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Doctor',
    },
    diagnosis: {
        type: String,
        required: true,
    },
    notes: String,
    follow_up_date: Date,
    medicines: [{
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
        instruction: String,
    }],
    vitals: {
        bp: String,
        pulse: String,
        temperature: String,
        weight: String,
    },
    custom_vitals: [{
        name: String,
        value: String,
    }],
}, {
    timestamps: true,
});

prescriptionSchema.index({ appointment_id: 1 });
prescriptionSchema.index({ patient_id: 1, createdAt: -1 });
prescriptionSchema.index({ doctor_id: 1, createdAt: -1 });

const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;
