/**
 * Fix token numbers for Dr. Anzil K on 2026-06-29:
 * Sort all appointments by slot start_datetime and reassign tokens 1, 2, 3...
 *
 * Run: node scripts/fixTokens.js
 */

require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const AppointmentSlot = require('../models/AppointmentSlot');

const DATE_STR = '2026-06-29';

const run = async () => {
  try {
    await connectDB();
    console.log('Connected to DB.');

    // Find Dr. Anzil K
    const anzilUser = await User.findOne({ email: 'anzil.k.dev@gmail.com' });
    if (!anzilUser) throw new Error('Dr. Anzil K not found.');
    const doctor = await Doctor.findOne({ user: anzilUser._id });
    if (!doctor) throw new Error('Doctor profile not found.');

    const dayStart = new Date(DATE_STR + 'T00:00:00');
    const dayEnd   = new Date(DATE_STR + 'T23:59:59');

    // Get all slots for that day
    const slots = await AppointmentSlot.find({
      doctor_id: doctor._id,
      start_datetime: { $gte: dayStart, $lte: dayEnd },
    }).sort({ start_datetime: 1 });

    console.log('Slots found:', slots.length);

    // Get all appointments for those slots
    const slotIds = slots.map(s => s._id);
    const appointments = await Appointment.find({ slot_id: { $in: slotIds } });

    // Build a map: slotId -> appointment
    const slotToAppt = {};
    for (const appt of appointments) {
      slotToAppt[appt.slot_id.toString()] = appt;
    }

    // Walk slots in time order, assign sequential token numbers
    let token = 1;
    for (const slot of slots) {
      const appt = slotToAppt[slot._id.toString()];
      if (!appt) {
        console.log(`  ${slot.start_datetime.toTimeString().slice(0, 5)} — no appointment (available slot)`);
        continue;
      }

      const oldToken = appt.token_number;
      if (appt.token_number !== token) {
        await Appointment.updateOne({ _id: appt._id }, { token_number: token });
        console.log(`  ${slot.start_datetime.toTimeString().slice(0, 5)} — ${appt._id} | token ${oldToken} → ${token} (${appt.status})`);
      } else {
        console.log(`  ${slot.start_datetime.toTimeString().slice(0, 5)} — token ${token} OK (${appt.status})`);
      }
      token++;
    }

    console.log(`\n✅ Tokens fixed. Total appointments updated: ${token - 1}`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

run();
