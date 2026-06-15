const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const DoctorSchedule = require('./models/DoctorSchedule');
const AppointmentSlot = require('./models/AppointmentSlot');
const Appointment = require('./models/Appointment');

dotenv.config();

const patientsData = [
  {
    name: 'Alice Green',
    email: 'alice@medcare.com',
    password: 'Password123!',
    role: 'patient',
    isVerified: true,
    isApproved: true,
    phone: '1112223333',
    gender: 'Female',
    dob: new Date('1990-05-15'),
    bloodGroup: 'A+',
    address: '123 Maple Street',
  },
  {
    name: 'Bob Miller',
    email: 'bob@medcare.com',
    password: 'Password123!',
    role: 'patient',
    isVerified: true,
    isApproved: true,
    phone: '4445556666',
    gender: 'Male',
    dob: new Date('1985-08-20'),
    bloodGroup: 'O-',
    address: '456 Oak Avenue',
  },
  {
    name: 'Charlie Davis',
    email: 'charlie@medcare.com',
    password: 'Password123!',
    role: 'patient',
    isVerified: true,
    isApproved: true,
    phone: '7778889999',
    gender: 'Male',
    dob: new Date('1995-12-10'),
    bloodGroup: 'B+',
    address: '789 Pine Road',
  }
];

const seedAndBookFully = async () => {
  try {
    await connectDB();
    console.log('Connected to DB. Starting seed and book...');

    // 1. Find Dr. Sarah Smith
    const sarahUser = await User.findOne({ email: 'doctor@medcare.com' });
    if (!sarahUser) {
      console.error('Dr. Sarah Smith user not found. Please run seed script first.');
      process.exit(1);
    }
    const doctor = await Doctor.findOne({ user: sarahUser._id });
    if (!doctor) {
      console.error('Doctor profile for Sarah Smith not found.');
      process.exit(1);
    }

    console.log(`Found Doctor Sarah Smith: ${doctor._id}`);

    // 2. Clear old data for seeded patients
    const patientEmails = patientsData.map(p => p.email.toLowerCase());
    const existingPatients = await User.find({ email: { $in: patientEmails } });
    const existingPatientIds = existingPatients.map(p => p._id);

    // Delete existing appointments and slots associated with these patients / doctor tomorrow
    const tomorrowStr = '2026-06-12';
    const tomorrowStart = new Date(`${tomorrowStr}T00:00:00.000Z`);
    const tomorrowEnd = new Date(`${tomorrowStr}T23:59:59.999Z`);

    const tomorrowSlots = await AppointmentSlot.find({ start_datetime: { $gte: tomorrowStart, $lte: tomorrowEnd } });
    const tomorrowSlotIds = tomorrowSlots.map(s => s._id);

    await Appointment.deleteMany({
      $or: [
        { patient_id: { $in: existingPatientIds } },
        { doctor_id: doctor._id, slot_id: { $in: tomorrowSlotIds } }
      ]
    });

    await AppointmentSlot.deleteMany({
      doctor_id: doctor._id,
      start_datetime: { $gte: tomorrowStart, $lte: tomorrowEnd }
    });

    await User.deleteMany({ email: { $in: patientEmails } });
    console.log('Cleaned up previous seeded patient records and tomorrow\'s slots.');

    // 3. Create Patient Users
    const patients = [];
    for (const pData of patientsData) {
      const patient = new User(pData);
      await patient.save();
      patients.push(patient);
      console.log(`Created Patient User: ${patient.name}`);
    }

    // 4. Create Doctor Schedule for Sarah Smith for Friday ("Fri") if not existing
    // We will clean up any existing Friday schedule first
    await DoctorSchedule.deleteMany({ doctor_id: doctor._id, day_of_week: 'Fri', consultation_type: 'online' });
    const schedule = await DoctorSchedule.create({
      doctor_id: doctor._id,
      consultation_type: 'online',
      day_of_week: 'Fri',
      start_time: '09:00',
      end_time: '09:30',
      slot_duration: 15,
      booking_limit: 1,
    });
    console.log(`Created Tomorrow Schedule for Sarah Smith: ${schedule.start_time} - ${schedule.end_time}`);

    // 5. Create two slots for tomorrow Friday (June 12, 2026)
    // Slot 1: 09:00 - 09:15
    const slot1Start = new Date(`${tomorrowStr}T09:00:00.000Z`);
    const slot1End = new Date(`${tomorrowStr}T09:15:00.000Z`);
    
    // Slot 2: 09:15 - 09:30
    const slot2Start = new Date(`${tomorrowStr}T09:15:00.000Z`);
    const slot2End = new Date(`${tomorrowStr}T09:30:00.000Z`);

    const slot1 = await AppointmentSlot.create({
      doctor_id: doctor._id,
      consultation_type: 'online',
      start_datetime: slot1Start,
      end_datetime: slot1End,
      status: 'booked',
      booked_count: 1,
      booking_limit: 1,
    });
    console.log(`Created Slot 1: ${slot1Start.toISOString()}`);

    const slot2 = await AppointmentSlot.create({
      doctor_id: doctor._id,
      consultation_type: 'online',
      start_datetime: slot2Start,
      end_datetime: slot2End,
      status: 'booked',
      booked_count: 1,
      booking_limit: 1,
    });
    console.log(`Created Slot 2: ${slot2Start.toISOString()}`);

    // 6. Create appointments booking both slots fully!
    const app1 = await Appointment.create({
      patient_id: patients[0]._id,
      doctor_id: doctor._id,
      consultation_type: 'online',
      slot_id: slot1._id,
      status: 'booked',
      token_number: 1,
      reason: 'Regular consultation checkup',
      payment: {
        amount: 800,
        booking_fee: 800,
        paid_amount: 800,
        currency: 'INR',
        status: 'paid',
        mode: 'online_gateway'
      },
      online_session: {
        room_id: `consult-${slot1._id.toString()}`
      }
    });
    console.log(`Booked Slot 1 for Patient: ${patients[0].name}`);

    const app2 = await Appointment.create({
      patient_id: patients[1]._id,
      doctor_id: doctor._id,
      consultation_type: 'online',
      slot_id: slot2._id,
      status: 'booked',
      token_number: 2,
      reason: 'General follow-up',
      payment: {
        amount: 800,
        booking_fee: 800,
        paid_amount: 800,
        currency: 'INR',
        status: 'paid',
        mode: 'online_gateway'
      },
      online_session: {
        room_id: `consult-${slot2._id.toString()}`
      }
    });
    console.log(`Booked Slot 2 for Patient: ${patients[1].name}`);

    console.log('Database successfully seeded with patients, schedule, and tomorrow\'s slots are FULLY booked!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedAndBookFully();
