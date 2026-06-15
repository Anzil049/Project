const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const AppointmentSlot = require('./models/AppointmentSlot');
const Appointment = require('./models/Appointment');

dotenv.config();

const createLocalDate = (dateStr, timeStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, 0, 0);
};
const padTwo = (n) => String(n).padStart(2, '0');

const run = async () => {
    try {
        await connectDB();
        console.log('\n=== Reseeding 5PM–8PM slots for Dr. xinnovat ===\n');

        // ── Fetch Dr. xinnovat ─────────────────────────────────────────────────
        const xinUser = await User.findOne({ email: 'x4innovative@gmail.com' });
        if (!xinUser) throw new Error('Dr. xinnovat user not found');
        const doctor = await Doctor.findOne({ user: xinUser._id });
        if (!doctor) throw new Error('Dr. xinnovat doctor profile not found');
        const doctorId = doctor._id;
        const fee = doctor.fee || 200;
        console.log(`Doctor: ${xinUser.name} | Fee: ₹${fee}`);

        // ── Fetch all patients we need ─────────────────────────────────────────
        // Fetch the two "real" patients
        const pAnzil  = await User.findOne({ email: 'anzil049@gmail.com' });
        const pShadga = await User.findOne({ email: 'anfzcj030@gmail.com' });
        if (!pAnzil)  throw new Error('anzil049@gmail.com not found');
        if (!pShadga) throw new Error('anfzcj030@gmail.com not found');

        // Fetch a diverse set of other patients to fill the remaining slots
        const otherEmails = [
            'patient3@medcare.com',   // Bob-like, Male, B-
            'patient7@medcare.com',   // Female, O-
            'patient12@medcare.com',  // Male, AB+
            'alice@medcare.com',      // Female, A+
            'patient19@medcare.com',  // Female, B-
            'patient24@medcare.com',  // Male, A+
            'charlie@medcare.com',    // Male, B+
            'patient31@medcare.com',  // Female, O-
        ];
        const otherPatients = [];
        for (const email of otherEmails) {
            const p = await User.findOne({ email });
            if (p) otherPatients.push(p);
        }

        // ── Build the slot assignment plan ─────────────────────────────────────
        // 12 slots total (T-1 to T-12).
        // anzil049  → T-2, T-8        (non-consecutive, spread across session)
        // anfzcj030 → T-5, T-11       (non-consecutive, spread across session)
        // other patients fill T-1, T-3, T-4, T-6, T-7, T-9, T-10, T-12
        // Slots T-  (no patient needed here — leave 2 slots available for realism)
        // We'll make T-6 and T-10 "available" (unbooked), rest booked.

        // patient assignment per token (1-indexed), null = available
        const plan = [
            { token: 1,  patient: otherPatients[0] },   // Patient 3
            { token: 2,  patient: pAnzil },              // Anzil ← real patient
            { token: 3,  patient: otherPatients[1] },   // Patient 7
            { token: 4,  patient: otherPatients[2] },   // Patient 12
            { token: 5,  patient: pShadga },             // shadga ← real patient
            { token: 6,  patient: null },                // available
            { token: 7,  patient: otherPatients[3] },   // Alice Green
            { token: 8,  patient: pAnzil },              // Anzil (second visit — different status? No, separate session slot)
            { token: 9,  patient: otherPatients[4] },   // Patient 19
            { token: 10, patient: null },                // available
            { token: 11, patient: pShadga },             // shadga (second slot)
            { token: 12, patient: otherPatients[5] },   // Patient 24
        ];

        // ── Clear existing slots for this date ────────────────────────────────
        const seedDate = '2026-06-15';
        const dayStart = createLocalDate(seedDate, '00:00');
        const dayEnd   = createLocalDate(seedDate, '23:59');

        const existingSlots = await AppointmentSlot.find({
            doctor_id: doctorId,
            consultation_type: 'offline',
            start_datetime: { $gte: dayStart, $lte: dayEnd },
        });
        if (existingSlots.length > 0) {
            await Appointment.deleteMany({ slot_id: { $in: existingSlots.map(s => s._id) } });
            await AppointmentSlot.deleteMany({ _id: { $in: existingSlots.map(s => s._id) } });
            console.log(`Cleared ${existingSlots.length} old slots and their appointments.\n`);
        }

        // ── Generate time slots (17:00 → 20:00, 15-min each) ─────────────────
        const sessionStart = 17 * 60;
        const sessionEnd   = 20 * 60;
        const duration     = 15;

        const slotTimes = [];
        for (let min = sessionStart; min + duration <= sessionEnd; min += duration) {
            slotTimes.push({
                sTime: `${padTwo(Math.floor(min / 60))}:${padTwo(min % 60)}`,
                eTime: `${padTwo(Math.floor((min + duration) / 60))}:${padTwo((min + duration) % 60)}`,
            });
        }

        // ── Create slots and appointments ─────────────────────────────────────
        console.log('=== Slot schedule ===\n');

        // Note: a single patient (anzil / shadga) can only have ONE active appointment 
        // per doctor per day. So we must handle the duplicate: 
        // For T-8 (Anzil again), T-11 (shadga again) — these would conflict. 
        // Instead, let's use different patients for those positions.
        // Revised plan — ensuring no patient appears twice:
        const revisedPlan = [
            { token: 1,  patient: otherPatients[0] },   // Patient 3      — 17:00
            { token: 2,  patient: pAnzil },              // Anzil          — 17:15
            { token: 3,  patient: otherPatients[1] },   // Patient 7      — 17:30
            { token: 4,  patient: otherPatients[2] },   // Patient 12     — 17:45
            { token: 5,  patient: pShadga },             // shadga         — 18:00
            { token: 6,  patient: null },                // available      — 18:15
            { token: 7,  patient: otherPatients[3] },   // Alice Green    — 18:30
            { token: 8,  patient: otherPatients[4] },   // Patient 19     — 18:45
            { token: 9,  patient: otherPatients[5] },   // Patient 24     — 19:00
            { token: 10, patient: null },                // available      — 19:15
            { token: 11, patient: otherPatients[6] },   // Charlie Davis  — 19:30
            { token: 12, patient: otherPatients[7] },   // Patient 31     — 19:45
        ];

        for (let i = 0; i < slotTimes.length; i++) {
            const { sTime, eTime } = slotTimes[i];
            const entry   = revisedPlan[i];
            const patient = entry.patient;
            const booked  = patient !== null;

            const slot = await AppointmentSlot.create({
                doctor_id: doctorId,
                consultation_type: 'offline',
                start_datetime: createLocalDate(seedDate, sTime),
                end_datetime:   createLocalDate(seedDate, eTime),
                status:      booked ? 'booked' : 'available',
                booked_count: booked ? 1 : 0,
                booking_limit: 1,
            });

            if (booked) {
                const ageYears = patient.dob
                    ? String(new Date().getFullYear() - new Date(patient.dob).getFullYear())
                    : '28';

                await Appointment.create({
                    patient_id:       patient._id,
                    patient_snapshot: {
                        name:        patient.name,
                        phone:       patient.phone  || '',
                        email:       patient.email,
                        age:         ageYears,
                        gender:      patient.gender     || 'Male',
                        bloodGroup:  patient.bloodGroup || 'O+',
                        address:     patient.address    || '',
                    },
                    doctor_id:        doctorId,
                    consultation_type: 'offline',
                    slot_id:          slot._id,
                    status:           'booked',
                    token_number:     entry.token,
                    reason:           'General consultation',
                    payment: {
                        amount:       fee,
                        booking_fee:  fee,
                        paid_amount:  fee,
                        currency:     'INR',
                        status:       'paid',
                        mode:         'online_gateway',
                    },
                });

                const tag = (patient.email === pAnzil.email || patient.email === pShadga.email)
                    ? ' ★ (real patient)'
                    : '';
                console.log(`  T-${String(entry.token).padStart(2)} | ${sTime}–${eTime} | BOOKED  | ${patient.name}${tag}`);
            } else {
                console.log(`  T-${String(entry.token).padStart(2)} | ${sTime}–${eTime} | available`);
            }
        }

        console.log('\n=== Done! ===');
        console.log('anzil049@gmail.com  → T-2  (17:15)');
        console.log('anfzcj030@gmail.com → T-5  (18:00)');
        console.log('Other patients fill T-1,3,4,7,8,9,11,12');
        console.log('Available slots     → T-6, T-10');

        process.exit(0);
    } catch (err) {
        console.error('Reseed error:', err);
        process.exit(1);
    }
};

run();
