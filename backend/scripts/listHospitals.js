require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

connectDB().then(async () => {
  const hospitals = await User.find({ role: 'hospital' }).select('name email _id');
  console.log('All hospital users:');
  hospitals.forEach(h => console.log('  ' + h.name + ' | ' + h.email + ' | ' + h._id));
  process.exit(0);
});
