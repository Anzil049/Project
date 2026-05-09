const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        console.log('Building 2dsphere index on User.location...');
        await User.collection.createIndex({ location: "2dsphere" });
        console.log('Index created successfully');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixIndexes();
