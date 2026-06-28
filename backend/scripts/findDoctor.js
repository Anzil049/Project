require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const DoctorSchedule = require('../models/DoctorSchedule');

connectDB().then(async () => {
  const users = await User.find({ role: 'doctor', name: /anzil/i }).select('name email _id');
  console.log('Matching doctors:');
  for (const u of users) {
    const doc = await Doctor.findOne({ user: u._id }).select('_id specialization hospitalId');
    const sched = await DoctorSchedule.find({ doctor_id: doc?._id });
    console.log('  User:', u.name, '|', u.email, '| userId:', u._id);
    console.log('  Doctor ID:', doc?._id, '| hospitalId:', doc?.hospitalId);
    console.log('  Schedules:', JSON.stringify(sched.map(s => ({ day: s.day_of_week, start: s.start_time, end: s.end_time, duration: s.slot_duration, type: s.consultation_type }))));
    console.log('---');
  }
  process.exit(0);
});
