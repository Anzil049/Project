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
    facilities: [{
        title: {
            type: String,
            required: [true, 'Facility title is required'],
        },
        description: {
            type: String,
            required: [true, 'Facility description is required'],
        },
        images: {
            type: [String],
            required: [true, 'Facility images are required'],
            validate: {
                validator: function(v) {
                    return Array.isArray(v) && v.length > 0;
                },
                message: 'At least one facility image is required'
            }
        },
    }],
}, {
    timestamps: true,
});

// Centralized helper to cascade delete related entities when hospital(s) are deleted
async function cascadeDeleteHospitals(hospitalUserIds) {
    if (!hospitalUserIds || hospitalUserIds.length === 0) return;

    try {
        const User = mongoose.model('User');
        const Doctor = mongoose.model('Doctor');

        // Find doctors affiliated with these hospital User IDs (hospitalId matches the hospital User ID)
        const doctors = await Doctor.find({ hospitalId: { $in: hospitalUserIds } });
        const doctorUserIds = doctors.map(d => d.user).filter(Boolean);
        const doctorIds = doctors.map(d => d._id);

        if (doctorUserIds.length > 0) {
            await User.deleteMany({ _id: { $in: doctorUserIds } });
        }
        if (doctorIds.length > 0) {
            await Doctor.deleteMany({ _id: { $in: doctorIds } });
        }
    } catch (err) {
        console.error('Error in cascadeDeleteHospitals helper:', err);
    }
}

// Automatically delete hospital-related doctors when a hospital profile is deleted
hospitalSchema.pre(['findOneAndDelete', 'deleteOne', 'deleteMany'], { document: false, query: true }, async function() {
    try {
        const filter = this.getQuery();
        const hospitals = await this.model.find(filter);
        const hospitalUserIds = hospitals.map(h => h.user).filter(Boolean);
        if (hospitalUserIds.length > 0) {
            await cascadeDeleteHospitals(hospitalUserIds);
        }
    } catch (err) {
        console.error('Error in Hospital query delete pre-hook:', err);
    }
});

hospitalSchema.pre('deleteOne', { document: true, query: false }, async function() {
    try {
        if (this.user) {
            await cascadeDeleteHospitals([this.user]);
        }
    } catch (err) {
        console.error('Error in Hospital document deleteOne pre-hook:', err);
    }
});

const Hospital = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;
