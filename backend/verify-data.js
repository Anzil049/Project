const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Hospital = require('./models/Hospital');
const User = require('./models/User');

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const hospitalCount = await Hospital.countDocuments();
        console.log(`Total hospitals: ${hospitalCount}`);

        const hospitals = await Hospital.find({}).limit(5).populate('user');
        hospitals.forEach(h => {
            console.log(`Hospital ID: ${h._id}, User populated: ${!!h.user}`);
            if (h.user) {
                console.log(`  User Name: ${h.user.name}, Location: ${JSON.stringify(h.user.location)}`);
            }
        });

        process.exit(0);
    } catch (error) {
        console.error('Error during verification:', error);
        process.exit(1);
    }
};

verify();
