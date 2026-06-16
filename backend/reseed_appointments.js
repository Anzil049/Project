const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const AppointmentSlot = require('./models/AppointmentSlot');
const Appointment = require('./models/Appointment');

dotenv.config();

const createLocalDate = (dateStr, h, m) => new Date(
  parseInt(dateStr.split('-')[0]),
  parseInt(dateStr.split('-')[1]) - 1,
  parseInt(dateStr.split('-')[2]),
  h, m, 0, 0
);

const pad2 = n => String(n).padStart(2, '0');

const run = async () => {
  try {
    await connectDB();
    console.log('\n=== Seeding ALL 15 slots for Dr. xinnovat (Tue 12:00–14:00, 8-min) ===\n');

    const xinUser = await User.findOne({ email: 'x4innovative@gmail.com' });
    const doctor  = await Doctor.findOne({ user: xinUser._id });
    const doctorId = doctor._id;
    const fee = doctor.fee || 200;

    const pAnzil  = await User.findOne({ email: 'anzil049@gmail.com' });
    const pShadga = await User.findOne({ email: 'anfzcj030@gmail.com' });
    if (!pAnzil)  throw new Error('anzil049@gmail.com not found');
    if (!pShadga) throw new Error('anfzcj030@gmail.com not found');

    // 13 filler patients needed (15 total - 2 real patients)
    const fillerEmails = [
      'patient3@medcare.com',
      'patient7@medcare.com',
      'patient12@medcare.com',
      'alice@medcare.com',
      'patient18@medcare.com',
      'patient22@medcare.com',
      'charlie@medcare.com',
      'patient27@medcare.com',
      'patient30@medcare.com',
      'patient35@medcare.com',
      'patient40@medcare.com',
      'patient44@medcare.com',
      'bob@medcare.com',
    ];
    const fillers = [];
    for (const email of fillerEmails) {
      const p = await User.findOne({ email });
      if (p) fillers.push(p);
    }

    // Clear existing slots for today
    const seedDate = '2026-06-16';
    const dayStart = createLocalDate(seedDate, 0, 0);
    const dayEnd   = createLocalDate(seedDate, 23, 59);

    const existing = await AppointmentSlot.find({
      doctor_id: doctorId,
      start_datetime: { $gte: dayStart, $lte: dayEnd },
    });
    if (existing.length > 0) {
      await Appointment.deleteMany({ slot_id: { $in: existing.map(s => s._id) } });
      await AppointmentSlot.deleteMany({ _id: { $in: existing.map(s => s._id) } });
      console.log(`Cleared ${existing.length} old slots.\n`);
    }

    // Generate 15 slot times (12:00 → 14:00, 8-min each)
    const slotTimes = [];
    for (let min = 12 * 60; min + 8 <= 14 * 60; min += 8) {
      slotTimes.push({
        sH: Math.floor(min / 60),     sM: min % 60,
        eH: Math.floor((min+8) / 60), eM: (min+8) % 60,
      });
    }

    // ALL 15 slots booked: Anzil → T-3, shadga → T-9, fillers fill the rest
    let fi = 0;
    const plan = slotTimes.map((_, i) => {
      const token = i + 1;
      if (token === 3)  return { token, patient: pAnzil };
      if (token === 9)  return { token, patient: pShadga };
      return { token, patient: fillers[fi++] || null };
    });

    console.log('Token | Time        | Patient');
    console.log('------+-------------+---------------------------');

    for (let i = 0; i < slotTimes.length; i++) {
      const { sH, sM, eH, eM } = slotTimes[i];
      const { token, patient } = plan[i];
      if (!patient) { console.log(`T-${pad2(token)}  | skipped     | (no filler found)`); continue; }

      const startD = createLocalDate(seedDate, sH, sM);
      const endD   = createLocalDate(seedDate, eH, eM);

      const slot = await AppointmentSlot.create({
        doctor_id: doctorId, consultation_type: 'offline',
        start_datetime: startD, end_datetime: endD,
        status: 'booked', booked_count: 1, booking_limit: 1,
      });

      const ageYears = patient.dob
        ? String(new Date().getFullYear() - new Date(patient.dob).getFullYear()) : '28';

      await Appointment.create({
        patient_id: patient._id,
        patient_snapshot: {
          name: patient.name, phone: patient.phone || '',
          email: patient.email, age: ageYears,
          gender: patient.gender || 'Male',
          bloodGroup: patient.bloodGroup || 'O+',
          address: patient.address || '',
        },
        doctor_id: doctorId, consultation_type: 'offline',
        slot_id: slot._id, status: 'booked', token_number: token,
        reason: 'General consultation',
        payment: { amount: fee, booking_fee: fee, paid_amount: fee, currency: 'INR', status: 'paid', mode: 'online_gateway' },
      });

      const tag = (patient.email === pAnzil.email || patient.email === pShadga.email) ? ' ★' : '';
      const sTime = `${pad2(sH)}:${pad2(sM)}–${pad2(eH)}:${pad2(eM)}`;
      console.log(`T-${pad2(token)}  | ${sTime} | ${patient.name}${tag}`);
    }

    console.log('\n=== Done! All 15 slots booked ===');
    console.log('anzil049@gmail.com  → T-3  (12:16–12:24)');
    console.log('anfzcj030@gmail.com → T-9  (13:04–13:12)');
    console.log('Other patients      → T-1,2,4,5,6,7,8,10,11,12,13,14,15');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

run();
