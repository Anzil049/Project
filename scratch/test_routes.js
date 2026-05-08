const express = require('express');
const router = require('./backend/routes/authRoutes');
const app = express();
app.use(express.json());
app.use('/api/auth', router);
console.log('Routes loaded successfully');
