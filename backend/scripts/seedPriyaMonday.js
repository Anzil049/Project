/**
 * Seed Monday 2026-06-29 bookings for Dr. Priya Nair
 *
 * Session 1: 09:00 – 13:00  (16 slots × 15 min)  → 14 booked, last 2 free
 * Session 2: 14:00 – 17:00  (12 slots × 15 min)  → 10 booked, last 2 free
 *
 * Tokens run sequentially across both sessions (1-24).
 * Same patients may appear across multiple doctors on the same day.
 *
 * Run: node scripts/seedPriyaMonday.js
 */

require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const AppointmentSlot = require('../models/AppointmentSlot');
const Appointment = require('../models/Appointment');

const DATE_STR   = '2026-06-29';
const DOCTOR_EMAIL = 'priya.nair@medcare.com';
const DURATION   = 15; // minutes per slot

// Sessions: { start, end, leaveLastN }
const SESSIONS = [
  { start: '09:00', end: '13:00', leaveLastN: 2 },
  { start: '14:00', end: '17:00', leaveLastN: 2 },
];

const pad = (n) => String(n).padStart(2, '0');

const createLocalDate = (dateStr, timeStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
};

const minutesFromTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const run = async () => {
  try {
    await connectDB();
    console.log('Connected to DB.');

    // ── Find Dr. Priya Nair ───────────────────────────────────────────────
    const drUser = await User.findOne({ email: DOCTOR_EMAIL });
    if (!drUser) throw new Error('Doctor user not found: ' + DOCTOR_EMAIL);
    const doctor = await Doctor.findOne({ user: drUser._id });
    if (!doctor) throw new Error('Doctor profile not found.');
    const doctorId = doctor._id;
    console.log('Doctor:', drUser.name, '| ID:', doctorId);

    // ── Clear existing slots/appointments for this day ───────────────────
    const dayStart = createLocalDate(DATE_STR, '00:00');
    const dayEnd   = createLocalDate(DATE_STR, '23:59');
    const existing = await AppointmentSlot.find({
      doctor_id: doctorId,
      start_datetime: { $gte: dayStart, $lte: dayEnd },
    });
    if (existing.length) {
      await Appointment.deleteMany({ slot_id: { $in: existing.map(s => s._id) } });
      await AppointmentSlot.deleteMany({ _id: { $in: existing.map(s => s._id) } });
      console.log('Cleared', existing.length, 'existing slots.');
    }

    // ── Load patients ─────────────────────────────────────────────────────
    // Use a mix; intentionally include patients already booked with Dr. Anzil
    const patients = await User.find({ role: 'patient' }).limit(50).lean();
    if (patients.length < 5) throw new Error('Not enough patients in DB.');

    // ── Generate slots and appointments ──────────────────────────────────
    let patientIndex = 0;
    for (const session of SESSIONS) {
      let globalToken = 0; // resets to 0 for each session → tokens start from 1
      const startMin = minutesFromTime(session.start);
      const endMin   = minutesFromTime(session.end);

      // Build slot list for this session
      const slotTimes = [];
      for (let min = startMin; min + DURATION <= endMin; min += DURATION) {
        slotTimes.push(min);
      }
      const totalSlots  = slotTimes.length;
      const bookUpTo    = totalSlots - session.leaveLastN; // index exclusive

      console.log(`\nSession ${session.start}–${session.end}: ${totalSlots} slots, book first ${bookUpTo}, leave last ${session.leaveLastN} free`);

      for (let i = 0; i < totalSlots; i++) {
        const min   = slotTimes[i];
        const sTime = `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
        const eTime = `${pad(Math.floor((min + DURATION) / 60))}:${pad((min + DURATION) % 60)}`;

        const startDt = createLocalDate(DATE_STR, sTime);
        const endDt   = createLocalDate(DATE_STR, eTime);
        const toBook  = i < bookUpTo;

        const slot = await AppointmentSlot.create({
          doctor_id:         doctorId,
          consultation_type: 'offline',
          start_datetime:    startDt,
          end_datetime:      endDt,
          status:            toBook ? 'booked' : 'available',
          booked_count:      toBook ? 1 : 0,
          booking_limit:     1,
        });

        if (toBook) {
          globalToken++;
          const patient = patients[patientIndex % patients.length];
          patientIndex++;

          await Appointment.create({
            patient_id: patient._id,
            patient_snapshot: {
              name:       patient.name,
              phone:      patient.phone || '9000000000',
              email:      patient.email,
              age:        patient.dob ? String(new Date().getFullYear() - new Date(patient.dob).getFullYear()) : '30',
              gender:     patient.gender  || 'Male',
              bloodGroup: patient.bloodGroup || 'O+',
              address:    patient.address || 'Kerala, India',
            },
            doctor_id:         doctorId,
            consultation_type: 'offline',
            slot_id:           slot._id,
            status:            'booked',
            token_number:      globalToken,
            booked_by_role:    'patient',
            reason:            'Neurology consultation',
            payment: {
              amount:       700,
              booking_fee:  700,
              paid_amount:  700,
              currency:     'INR',
              status:       'paid',
              mode:         'online_gateway',
            },
          });

          console.log(`  T-${pad(globalToken)} | ${sTime}–${eTime} | BOOKED   | ${patient.name}`);
        } else {
          console.log(`  ------ | ${sTime}–${eTime} | AVAILABLE`);
        }
      }
    }

    console.log(`\n✅ Done! Seeded both sessions for Dr. Priya Nair on ${DATE_STR} (tokens restart from T-1 each session).`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
