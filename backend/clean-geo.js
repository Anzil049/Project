const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const cleanData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Use native MongoDB driver to bypass Mongoose casting
        console.log('Searching for and fixing all invalid location structures...');
        
        // 1. Fix missing/NaN coordinates
        await User.collection.updateMany(
            { 
                $or: [
                    { "location.coordinates": { $type: "double", $eq: NaN } },
                    { "location.coordinates": { $size: 0 } },
                    { "location.coordinates": null },
                    { "location.coordinates": { $exists: false } },
                    { "location.type": { $exists: false } },
                    { "location": { $type: "array" } } // In case it was saved as just an array
                ]
            },
            { $set: { "location": { type: "Point", coordinates: [78.9629, 20.5937] } } }
        );

        // 2. Fix specific coordinate errors [null, null] or [NaN, NaN]
        await User.collection.updateMany(
            { 
                $or: [
                    { "location.coordinates.0": null },
                    { "location.coordinates.1": null },
                    { "location.coordinates.0": NaN },
                    { "location.coordinates.1": NaN }
                ]
            },
            { $set: { "location": { type: "Point", coordinates: [78.9629, 20.5937] } } }
        );

        // 3. Ensure "type" is always "Point"
        await User.collection.updateMany(
            { "location.type": { $ne: "Point" } },
            { $set: { "location.type": "Point" } }
        );

        console.log('Database location fields sanitized.');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

cleanData();
