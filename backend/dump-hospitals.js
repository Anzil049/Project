const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Hospital = require('./models/Hospital');

dotenv.config();

const dump = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const hospitals = await Hospital.find({}).lean();
        console.log(JSON.stringify(hospitals, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

dump();
