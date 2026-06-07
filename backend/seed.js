const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Hospital = require('./models/Hospital');

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
    name: 'Dr. Sarah Smith',
    email: 'doctor@medcare.com',
    password: 'Password123!',
    role: 'doctor',
    isVerified: true,
    isApproved: true,
    phone: '9876543210',
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

    console.log('Cleaned up existing test users and profiles.');

    // Insert new test users
    for (const userData of usersData) {
      const { doctorProfile, hospitalProfile, ...userFields } = userData;
      
      // Create user (pre-save hook will hash password)
      const user = new User(userFields);
      await user.save();
      console.log(`Created User: ${user.name} (${user.role})`);

      // If doctor role, create Doctor profile
      if (user.role === 'doctor' && doctorProfile) {
        await Doctor.create({
          user: user._id,
          ...doctorProfile,
        });
        console.log(`Created Doctor Profile for ${user.name}`);
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

    console.log('DB Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during DB Seeding:', error);
    process.exit(1);
  }
};

seedData();
