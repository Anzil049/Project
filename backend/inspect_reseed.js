const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const DoctorSchedule = require('./models/DoctorSchedule');

dotenv.config();

const run = async () => {
    try {
        await connectDB();

        // Find both patients
        const p1 = await User.findOne({ email: 'anzil049@gmail.com' });
        const p2 = await User.findOne({ email: 'anfzcj030@gmail.com' });
        console.log('\n=== PATIENTS ===');
        console.log('anzil049@gmail.com:', p1 ? `ID=${p1._id}, Name=${p1.name}, Phone=${p1.phone}, Gender=${p1.gender}, DOB=${p1.dob}, BG=${p1.bloodGroup}` : 'NOT FOUND');
        console.log('anfzcj030@gmail.com:', p2 ? `ID=${p2._id}, Name=${p2.name}, Phone=${p2.phone}, Gender=${p2.gender}, DOB=${p2.dob}, BG=${p2.bloodGroup}` : 'NOT FOUND');

        // Find xinnovat doctor
        const xinUser = await User.findOne({ email: 'x4innovative@gmail.com' });
        if (!xinUser) { console.log('xinnovat user NOT FOUND'); process.exit(0); }
        const doctor = await Doctor.findOne({ user: xinUser._id });
        if (!doctor) { console.log('xinnovat doctor profile NOT FOUND'); process.exit(0); }

        console.log('\n=== DR. XINNOVAT ===');
        console.log('Doctor ID:', doctor._id);
        console.log('Fee:', doctor.fee);
        console.log('Slots config from DB:', JSON.stringify(doctor.slots));
        console.log('Available days:', doctor.availableDays);
        console.log('Custom date mode:', doctor.custom_date_mode);
        console.log('Is accepting:', doctor.isAcceptingAppointments);

        const schedules = await DoctorSchedule.find({ doctor_id: doctor._id });
        console.log('\n=== SCHEDULES ===');
        schedules.forEach(s => console.log(`  [${s.consultation_type}] ${s.day_of_week || s.custom_date} ${s.start_time}-${s.end_time} (${s.slot_duration}min)`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
