const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await connectDB();
        const patients = await User.find({ role: 'patient' })
            .select('name email phone gender dob bloodGroup address')
            .limit(60);
        console.log(`\nTotal patients found: ${patients.length}\n`);
        patients.forEach(p => {
            console.log(`  ${p.name} | ${p.email} | ${p.phone} | ${p.gender} | BG:${p.bloodGroup}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
