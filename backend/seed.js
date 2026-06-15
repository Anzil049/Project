const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Hospital = require('./models/Hospital');
const DoctorSchedule = require('./models/DoctorSchedule');
const AppointmentSlot = require('./models/AppointmentSlot');
const Appointment = require('./models/Appointment');

// Load env vars
dotenv.config();

const usersData = [
  {
    name: 'John Patient',
    email: 'patient@medcare.com',
    password: 'Password123!',
    role: 'patient',
    isVerified: true,
    isApproved: true,
    gender: 'Male',
    phone: '1234567890',
  },
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
  },
  {
    name: 'Anzil Patient',
    email: 'anzil049@gmail.com',
    password: 'Password123!',
    role: 'patient',
    isVerified: true,
    isApproved: true,
    phone: '9998887777',
    gender: 'Male',
    dob: new Date('1998-03-24'),
    bloodGroup: 'O+',
    address: '123 Anzil Street',
  },
  {
    name: 'Dr. Sarah Smith',
    email: 'doctor@medcare.com',
    password: 'Password123!',
    role: 'doctor',
    isVerified: true,
    isApproved: true,
    phone: '9876543210',
    location: {
      type: 'Point',
      coordinates: [72.8777, 19.0760]
    },
    address: '123 Medical Drive, Mumbai',
    doctorProfile: {
      specialization: 'Cardiology',
      experience: '10 years',
      licenseNumber: 'LIC123456',
      fee: 800,
      onlineConsultation: true,
      about: 'Experienced cardiologist specialized in heart surgery and cardiovascular diseases.',
    }
  },
  {
    name: 'City General Hospital',
    email: 'hospital@medcare.com',
    password: 'Password123!',
    role: 'hospital',
    isVerified: true,
    isApproved: true,
    phone: '5551234567',
    location: {
      type: 'Point',
      coordinates: [72.8780, 19.0765]
    },
    address: '456 Healthcare Way, Mumbai',
    hospitalProfile: {
      registrationNumber: 'REG78910',
      facilityType: 'Hospital',
      beds: '150',
      about: 'A state-of-the-art multi-specialty healthcare facility serving the community.',
    }
  },
  {
    name: 'System Admin',
    email: 'admin@medcare.com',
    password: 'Password123!',
    role: 'admin',
    isVerified: true,
    isApproved: true,
    phone: '0000000000',
  }
];

// Dynamically generate 50 patient users with password @Patient123
const genders = ['Male', 'Female', 'Other'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
for (let i = 1; i <= 50; i++) {
  const pad = String(i).padStart(2, '0');
  usersData.push({
    name: `Patient ${i}`,
    email: `patient${i}@medcare.com`,
    password: '@Patient123',
    role: 'patient',
    isVerified: true,
    isApproved: true,
    phone: `90000000${pad}`,
    gender: genders[i % genders.length],
    dob: new Date(1975 + (i % 30), i % 12, (i % 28) + 1),
    bloodGroup: bloodGroups[i % bloodGroups.length],
    address: `${100 + i} Green Avenue, Sector ${i % 10 + 1}`,
  });
}

const createLocalDate = (dateStr, timeStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
};

const seedData = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('Starting DB Seeding...');

    // Extract emails to find and clean existing profiles
    const emails = usersData.map(u => u.email.toLowerCase());
    
    // Find existing users to delete their doctor/hospital profiles
    const existingUsers = await User.find({ email: { $in: emails } });
    const existingUserIds = existingUsers.map(u => u._id);

    // Delete existing records
    await Doctor.deleteMany({ user: { $in: existingUserIds } });
    await Hospital.deleteMany({ user: { $in: existingUserIds } });
    await User.deleteMany({ email: { $in: emails } });

    // Clean up schedules, slots, and appointments for seeded doctor / patients
    // Since this is a test seed script, we clean these collections to start fresh
    await DoctorSchedule.deleteMany({});
    await AppointmentSlot.deleteMany({});
    await Appointment.deleteMany({});

    console.log('Cleaned up existing test users, profiles, schedules, slots, and appointments.');

    let sarahDoctorId = null;
    let xinnovatDoctorId = null;
    const patientMap = {};

    // Insert new test users
    for (const userData of usersData) {
      const { doctorProfile, hospitalProfile, ...userFields } = userData;
      
      // Create user (pre-save hook will hash password)
      const user = new User(userFields);
      await user.save();
      console.log(`Created User: ${user.name} (${user.role})`);

      if (user.role === 'patient') {
        patientMap[user.name] = user;
      }

      // If doctor role, create Doctor profile
      if (user.role === 'doctor' && doctorProfile) {
        const doc = await Doctor.create({
          user: user._id,
          ...doctorProfile,
        });
        console.log(`Created Doctor Profile for ${user.name}`);
        if (user.name === 'Dr. Sarah Smith') {
          sarahDoctorId = doc._id;
        }
        if (user.name === 'xinnovat') {
          xinnovatDoctorId = doc._id;
        }
      }

      // If hospital role, create Hospital profile
      if (user.role === 'hospital' && hospitalProfile) {
        await Hospital.create({
          user: user._id,
          ...hospitalProfile,
        });
        console.log(`Created Hospital Profile for ${user.name}`);
      }
    }

    // Fetch Dr. xinnovat doctor profile dynamically from database without modifying it
    const xinnovatUser = await User.findOne({ email: 'x4innovative@gmail.com' });
    if (xinnovatUser) {
      const doc = await Doctor.findOne({ user: xinnovatUser._id });
      if (doc) {
        xinnovatDoctorId = doc._id;
        console.log(`Found existing Dr. xinnovat profile in DB with ID: ${xinnovatDoctorId}`);
      }
    }

    if (!sarahDoctorId) {
      throw new Error('Dr. Sarah Smith doctor profile creation failed.');
    }

    console.log(`Sarah Smith Doctor ID: ${sarahDoctorId}`);

    // Create weekly schedules for Dr. Sarah Smith on Fridays
    const onlineSchedule = await DoctorSchedule.create({
      doctor_id: sarahDoctorId,
      consultation_type: 'online',
      day_of_week: 'Fri',
      start_time: '09:00',
      end_time: '09:30',
      slot_duration: 15,
      booking_limit: 1,
    });
    console.log('Created Friday online schedule.');

    const offlineSchedule = await DoctorSchedule.create({
      doctor_id: sarahDoctorId,
      consultation_type: 'offline',
      day_of_week: 'Fri',
      start_time: '10:00',
      end_time: '11:00',
      slot_duration: 15,
      booking_limit: 1,
    });
    console.log('Created Friday offline schedule.');

    // Create slots and appointments for Friday, June 12, 2026
    const tomorrowStr = '2026-06-12';

    // 1. ONLINE SLOTS (All Available)
    const slot1Start = createLocalDate(tomorrowStr, '09:00');
    const slot1End = createLocalDate(tomorrowStr, '09:15');
    await AppointmentSlot.create({
      doctor_id: sarahDoctorId,
      consultation_type: 'online',
      start_datetime: slot1Start,
      end_datetime: slot1End,
      status: 'available',
      booked_count: 0,
      booking_limit: 1,
    });

    const slot2Start = createLocalDate(tomorrowStr, '09:15');
    const slot2End = createLocalDate(tomorrowStr, '09:30');
    await AppointmentSlot.create({
      doctor_id: sarahDoctorId,
      consultation_type: 'online',
      start_datetime: slot2Start,
      end_datetime: slot2End,
      status: 'available',
      booked_count: 0,
      booking_limit: 1,
    });

    console.log('Seeded online consultation slots as available.');

    // 2. OFFLINE SLOTS (All Available)
    // Slot 3: 10:00 - 10:15 (available)
    const slot3Start = createLocalDate(tomorrowStr, '10:00');
    const slot3End = createLocalDate(tomorrowStr, '10:15');
    await AppointmentSlot.create({
      doctor_id: sarahDoctorId,
      consultation_type: 'offline',
      start_datetime: slot3Start,
      end_datetime: slot3End,
      status: 'available',
      booked_count: 0,
      booking_limit: 1,
    });

    // Slot 4: 10:15 - 10:30 (available)
    const slot4Start = createLocalDate(tomorrowStr, '10:15');
    const slot4End = createLocalDate(tomorrowStr, '10:30');
    await AppointmentSlot.create({
      doctor_id: sarahDoctorId,
      consultation_type: 'offline',
      start_datetime: slot4Start,
      end_datetime: slot4End,
      status: 'available',
      booked_count: 0,
      booking_limit: 1,
    });

    // Slot 5: 10:30 - 10:45 (available)
    const slot5Start = createLocalDate(tomorrowStr, '10:30');
    const slot5End = createLocalDate(tomorrowStr, '10:45');
    await AppointmentSlot.create({
      doctor_id: sarahDoctorId,
      consultation_type: 'offline',
      start_datetime: slot5Start,
      end_datetime: slot5End,
      status: 'available',
      booked_count: 0,
      booking_limit: 1,
    });

    // Slot 6: 10:45 - 11:00 (available)
    const slot6Start = createLocalDate(tomorrowStr, '10:45');
    const slot6End = createLocalDate(tomorrowStr, '11:00');
    await AppointmentSlot.create({
      doctor_id: sarahDoctorId,
      consultation_type: 'offline',
      start_datetime: slot6Start,
      end_datetime: slot6End,
      status: 'available',
      booked_count: 0,
      booking_limit: 1,
    });

    console.log('Seeded offline consultation slots as available.');

    // --- SEEDING FOR DR. XINNOVAT (x4innovative@gmail.com) FOR SUNDAY & MONDAY ---
    if (xinnovatDoctorId) {
      const mondayStr = '2026-06-15';
      
      const xinnovatDoc = await Doctor.findById(xinnovatDoctorId);
      const availableDays = xinnovatDoc.availableDays || [];
      const slotsConfig = xinnovatDoc.slots || [];
      
      console.log(`Seeding Dr. xinnovat based on DB profile availability days: [${availableDays.join(', ')}]`);

      const minutesFromTime = (time) => {
        const [hour, minute] = time.split(':').map(Number);
        return (hour * 60) + minute;
      };

      // We will loop through the doctor's slotsConfig and create schedules & slots
      let isFirstShift = true;
      for (const slotConf of slotsConfig) {
        // Convert to standard 24h format if needed
        const parseTo24 = (timeStr) => {
          const [h, m] = timeStr.split(':').map(Number);
          if (h < 9) {
            return `${String(h + 12).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          }
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        };

        const start24 = parseTo24(slotConf.start);
        const end24 = parseTo24(slotConf.end);

        console.log(`Setting up shift: ${start24} - ${end24}`);

        // Create DoctorSchedule
        await DoctorSchedule.create({
          doctor_id: xinnovatDoctorId,
          consultation_type: 'offline',
          day_of_week: 'Mon',
          start_time: start24,
          end_time: end24,
          slot_duration: 15,
          booking_limit: 1,
        });


        // Generate slots
        const startMin = minutesFromTime(start24);
        const endMin = minutesFromTime(end24);
        const duration = 15;

        let slotIndex = 0;
        for (let min = startMin; min + duration <= endMin; min += duration) {
          const sTime = `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
          const eTime = `${String(Math.floor((min + duration) / 60)).padStart(2, '0')}:${String((min + duration) % 60).padStart(2, '0')}`;

          const startD = createLocalDate(mondayStr, sTime);
          const endD = createLocalDate(mondayStr, eTime);

          const shouldBook = !isFirstShift;
          const patient = shouldBook ? (slotIndex === 0 ? patientMap['Anzil Patient'] : patientMap[`Patient ${slotIndex + 1}`]) : null;

          const slot = await AppointmentSlot.create({
            doctor_id: xinnovatDoctorId,
            consultation_type: 'offline',
            start_datetime: startD,
            end_datetime: endD,
            status: shouldBook ? 'booked' : 'available',
            booked_count: shouldBook ? 1 : 0,
            booking_limit: 1,
          });

          if (shouldBook && patient) {
            await Appointment.create({
              patient_id: patient._id,
              patient_snapshot: {
                name: patient.name,
                phone: patient.phone,
                email: patient.email,
                age: '32',
                gender: patient.gender,
                bloodGroup: patient.bloodGroup,
                address: patient.address,
              },
              doctor_id: xinnovatDoctorId,
              consultation_type: 'offline',
              slot_id: slot._id,
              status: 'booked',
              token_number: slotIndex + 1,
              reason: 'Clinical pediatric visit',
              payment: {
                amount: 200,
                booking_fee: 200,
                paid_amount: 200,
                currency: 'INR',
                status: 'paid',
                mode: 'online_gateway'
              }
            });
          }

          slotIndex++;
        }

        isFirstShift = false;
      }

      console.log('Seeded Monday offline slots and schedules dynamically from Dr. xinnovat profile.');
    }

    console.log('DB Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during DB Seeding:', error);
    process.exit(1);
  }
};

seedData();
