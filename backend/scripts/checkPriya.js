require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const DoctorSchedule = require('../models/DoctorSchedule');

connectDB().then(async () => {
  const u = await User.findOne({ email: 'priya.nair@medcare.com' });
  if (!u) { console.log('Not found'); return process.exit(1); }
  const doc = await Doctor.findOne({ user: u._id });
  const scheds = await DoctorSchedule.find({ doctor_id: doc._id });
  console.log('Doctor ID:', doc._id);
  console.log('Schedules:');
  scheds.forEach(s => console.log(' ', s.day_of_week, s.start_time, '-', s.end_time, s.slot_duration + 'm', s.consultation_type));

  // Also list some patients
  const patients = await User.find({ role: 'patient' }).limit(30).select('name email phone gender bloodGroup address dob');
  console.log('\nAvailable patients (' + patients.length + '):');
  patients.forEach((p, i) => console.log('  ' + i + '. ' + p.name + ' | ' + p.email));
  process.exit(0);
});
