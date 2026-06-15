const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const DoctorSchedule = require('./models/DoctorSchedule');
const AppointmentSlot = require('./models/AppointmentSlot');
const Appointment = require('./models/Appointment');

dotenv.config();

const runInspect = async () => {
    try {
        await connectDB();
        const doctors = await Doctor.find().populate('user');
        console.log(`Found ${doctors.length} doctors:`);
        for (const doc of doctors) {
            console.log('------------------------------');
            console.log('Doctor User Name:', doc.user?.name);
            console.log('Doctor User Email:', doc.user?.email);
            console.log('Doctor ID:', doc._id);
            console.log('hospitalId:', doc.hospitalId);
            console.log('custom_date_mode:', doc.custom_date_mode);
            console.log('onlineConsultation:', doc.onlineConsultation);
            console.log('isAcceptingAppointments:', doc.isAcceptingAppointments);
            
            const schedules = await DoctorSchedule.find({ doctor_id: doc._id });
            console.log('Schedules count:', schedules.length);
            schedules.forEach((s, idx) => {
                console.log(`  Schedule #${idx + 1}:`, {
                    consultation_type: s.consultation_type,
                    day_of_week: s.day_of_week,
                    custom_date: s.custom_date,
                    start_time: s.start_time,
                    end_time: s.end_time,
                    slot_duration: s.slot_duration,
                });
            });
        }

        console.log('\n==============================');
        const slots = await AppointmentSlot.find();
        console.log(`Found ${slots.length} appointment slots:`);
        slots.forEach((slot, idx) => {
            console.log(`  Slot #${idx + 1}:`, {
                id: slot._id,
                doctor_id: slot.doctor_id,
                consultation_type: slot.consultation_type,
                start_datetime: slot.start_datetime.toISOString(),
                end_datetime: slot.end_datetime.toISOString(),
                status: slot.status,
                booked_count: slot.booked_count,
            });
        });

        console.log('\n==============================');
        const appointments = await Appointment.find().populate('patient_id');
        console.log(`Found ${appointments.length} appointments:`);
        appointments.forEach((app, idx) => {
            console.log(`  Appointment #${idx + 1}:`, {
                id: app._id,
                patient_name: app.patient_snapshot?.name || app.patient_id?.name,
                patient_email: app.patient_snapshot?.email || app.patient_id?.email,
                doctor_id: app.doctor_id,
                consultation_type: app.consultation_type,
                slot_id: app.slot_id,
                status: app.status,
                token_number: app.token_number,
            });
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

runInspect();
