/**
 * Fix: Re-link Dr. Priya Nair to the correct "medcare" hospital
 * (medcare049@gmail.com, ID: 6a00b1a01a87334759618b8e)
 *
 * Run with: node scripts/addHospitalDoctor.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const DoctorSchedule = require('../models/DoctorSchedule');

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    console.log('Connected to DB.');

    // ── 1. Find the correct MedCare hospital user ──────────────────────────
    const hospitalUser = await User.findOne({ email: 'medcare049@gmail.com' });
    if (!hospitalUser) {
      throw new Error('MedCare hospital user (medcare049@gmail.com) not found.');
    }
    console.log('Found hospital: ' + hospitalUser.name + ' (' + hospitalUser._id + ')');

    // ── 2. Delete existing Priya Nair if linked to wrong hospital ──────────
    const existingUser = await User.findOne({ email: 'priya.nair@medcare.com' });
    if (existingUser) {
      const existingDoctor = await Doctor.findOne({ user: existingUser._id });
      if (existingDoctor) {
        await DoctorSchedule.deleteMany({ doctor_id: existingDoctor._id });
        await Doctor.deleteOne({ _id: existingDoctor._id });
        console.log('Removed old doctor profile and schedules.');
      }
      await User.deleteOne({ _id: existingUser._id });
      console.log('Removed old user account.');
    }

    // ── 3. Create the doctor User account ─────────────────────────────────
    const doctorUser = new User({
      name: 'Dr. Priya Nair',
      email: 'priya.nair@medcare.com',
      password: 'Password123!',
      role: 'doctor',
      isVerified: true,
      isApproved: true,
      phone: '9123456780',
      address: 'MedCare Hospital Campus, Mumbai',
      location: {
        type: 'Point',
        coordinates: [72.8780, 19.0765],
      },
    });
    await doctorUser.save();
    console.log('Created User: ' + doctorUser.name);

    // ── 4. Create Doctor profile linked to MedCare ────────────────────────
    const doctorProfile = await Doctor.create({
      user: doctorUser._id,
      hospitalId: hospitalUser._id,       // ← correct MedCare hospital
      specialization: 'Neurology',
      experience: '8 years',
      licenseNumber: 'LIC-NEU-88231',
      qualifications: 'MBBS, DM Neurology',
      fee: 700,
      onlineConsultation: false,
      isAcceptingAppointments: true,
      booking_window_days: 30,
      about: 'Dr. Priya Nair is a specialist in clinical neurology with expertise in epilepsy, stroke management, and headache disorders.',
    });
    console.log('Created Doctor profile (ID: ' + doctorProfile._id + ')');

    // ── 5. Add offline schedules Mon / Wed / Fri ───────────────────────────
    const scheduleDays = ['Mon', 'Wed', 'Fri'];
    for (const day of scheduleDays) {
      await DoctorSchedule.create({
        doctor_id: doctorProfile._id,
        consultation_type: 'offline',
        day_of_week: day,
        start_time: '09:00',
        end_time: '13:00',
        slot_duration: 15,
        booking_limit: 1,
      });
      console.log('  Created ' + day + ' schedule (09:00-13:00, 15 min slots)');
    }

    console.log('\n  Dr. Priya Nair seeded successfully under MedCare hospital!');
    console.log('   Email    : priya.nair@medcare.com');
    console.log('   Password : Password123!');
    console.log('   Hospital : medcare (medcare049@gmail.com)');
    console.log('   Spec     : Neurology');
    console.log('   Schedule : Mon / Wed / Fri  09:00-13:00');
    process.exit(0);
  } catch (err) {
    console.error('Error: ' + err.message);
    process.exit(1);
  }
};

run();
