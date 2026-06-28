/**
 * Seed Monday (2026-06-29) bookings for Dr. Anzil K
 * Schedule: 10:00 AM - 1:00 PM, 15-min slots (12 total)
 *
 * Run: node scripts/seedAnzilMonday.js
 */

require('dotenv').config();
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const AppointmentSlot = require('../models/AppointmentSlot');
const Appointment = require('../models/Appointment');

const DATE_STR = '2026-06-29'; // next Monday

const createLocalDate = (dateStr, timeStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
};

const pad = (n) => String(n).padStart(2, '0');

const run = async () => {
  try {
    await connectDB();
    console.log('Connected to DB.');

    // ── Find Dr. Anzil K ──────────────────────────────────────────────────
    const anzilUser = await User.findOne({ email: 'anzil.k.dev@gmail.com' });
    if (!anzilUser) throw new Error('Dr. Anzil K user not found.');
    const doctor = await Doctor.findOne({ user: anzilUser._id });
    if (!doctor) throw new Error('Doctor profile for Anzil K not found.');
    const doctorId = doctor._id;
    console.log('Doctor ID:', doctorId);

    // ── Clear any existing slots/appointments for this day ────────────────
    const dayStart = createLocalDate(DATE_STR, '00:00');
    const dayEnd   = createLocalDate(DATE_STR, '23:59');
    const existingSlots = await AppointmentSlot.find({
      doctor_id: doctorId,
      start_datetime: { $gte: dayStart, $lte: dayEnd },
    });
    const existingSlotIds = existingSlots.map(s => s._id);
    if (existingSlotIds.length > 0) {
      await Appointment.deleteMany({ slot_id: { $in: existingSlotIds } });
      await AppointmentSlot.deleteMany({ _id: { $in: existingSlotIds } });
      console.log('Cleared', existingSlotIds.length, 'existing slots for this day.');
    }

    // ── Fetch some patients to book with ─────────────────────────────────
    const patients = await User.find({ role: 'patient' }).limit(12).lean();

    // ── Generate 15-min slots from 10:00 to 13:00 ────────────────────────
    const START_MIN = 10 * 60;  // 600 mins
    const END_MIN   = 13 * 60;  // 780 mins
    const DURATION  = 15;

    // Decide booking pattern: first 2 available, rest booked
    const AVAILABLE_INDICES = new Set([3, 7]); // slots 4 & 8 stay free (0-indexed)

    let tokenNumber = 1;
    let slotIndex = 0;

    for (let min = START_MIN; min + DURATION <= END_MIN; min += DURATION) {
      const sTime = `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
      const eTime = `${pad(Math.floor((min + DURATION) / 60))}:${pad((min + DURATION) % 60)}`;

      const startDt = createLocalDate(DATE_STR, sTime);
      const endDt   = createLocalDate(DATE_STR, eTime);

      const isAvailable = AVAILABLE_INDICES.has(slotIndex);

      const slot = await AppointmentSlot.create({
        doctor_id: doctorId,
        consultation_type: 'offline',
        start_datetime: startDt,
        end_datetime: endDt,
        status: isAvailable ? 'available' : 'booked',
        booked_count: isAvailable ? 0 : 1,
        booking_limit: 1,
      });

      if (!isAvailable) {
        const patient = patients[slotIndex % patients.length];
        await Appointment.create({
          patient_id: patient._id,
          patient_snapshot: {
            name: patient.name,
            phone: patient.phone || '9000000000',
            email: patient.email,
            age: '30',
            gender: patient.gender || 'Male',
            bloodGroup: patient.bloodGroup || 'O+',
            address: patient.address || 'Kerala, India',
          },
          doctor_id: doctorId,
          consultation_type: 'offline',
          slot_id: slot._id,
          status: 'booked',
          token_number: tokenNumber,
          booked_by_role: 'patient',
          reason: 'Routine consultation',
          payment: {
            amount: 700,
            booking_fee: 700,
            paid_amount: 700,
            currency: 'INR',
            status: 'paid',
            mode: 'online_gateway',
          },
        });
        console.log(`  Token ${pad(tokenNumber)} | ${sTime}-${eTime} | BOOKED  | ${patient.name}`);
        tokenNumber++;
      } else {
        console.log(`  Slot   -  | ${sTime}-${eTime} | AVAILABLE`);
      }

      slotIndex++;
    }

    console.log('\n Seeded', slotIndex, 'slots (' + (slotIndex - AVAILABLE_INDICES.size) + ' booked, ' + AVAILABLE_INDICES.size + ' available) for Dr. Anzil K on', DATE_STR);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

run();
