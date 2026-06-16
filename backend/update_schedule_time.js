require('dotenv').config();
const connectDB = require('./config/db');
const DoctorSchedule = require('./models/DoctorSchedule');
const AppointmentSlot = require('./models/AppointmentSlot');

connectDB().then(async () => {
  // 1. Update DoctorSchedule: 12:00-14:00 → 13:00-15:00
  const sched = await DoctorSchedule.updateMany(
    { start_time: '12:00', end_time: '14:00' },
    { $set: { start_time: '13:00', end_time: '15:00' } }
  );
  console.log('Schedules updated:', sched.modifiedCount);

  // 2. Shift all AppointmentSlots by +1 hour
  const slots = await AppointmentSlot.find({});
  let slotCount = 0;
  for (const slot of slots) {
    const newStart = new Date(slot.start_datetime);
    newStart.setHours(newStart.getHours() + 1);
    const newEnd = new Date(slot.end_datetime);
    newEnd.setHours(newEnd.getHours() + 1);
    await AppointmentSlot.updateOne(
      { _id: slot._id },
      { $set: { start_datetime: newStart, end_datetime: newEnd } }
    );
    slotCount++;
  }
  console.log('Slots shifted:', slotCount);

  // Verify
  const check = await DoctorSchedule.find({ start_time: '13:00' });
  console.log('Verified schedules with 13:00:', check.map(s => `${s.consultation_type} ${s.day_of_week} ${s.start_time}-${s.end_time}`));

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
