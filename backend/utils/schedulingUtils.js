const Doctor = require('../models/Doctor');
const DoctorSchedule = require('../models/DoctorSchedule');
const AppointmentSlot = require('../models/AppointmentSlot');
const Appointment = require('../models/Appointment');

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const BOOKING_CLOSE_MINUTES = 30;
const DEFAULT_BOOKING_WINDOW_DAYS = 30;

const normalizeDateKey = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const minutesFromTime = (time) => {
    const [hour, minute] = String(time).split(':').map(Number);
    return (hour * 60) + minute;
};

const dateAtMinutes = (date, minutes) => {
    const d = new Date(date);
    d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return d;
};

const calculateSlotCount = (startTime, endTime, duration) => {
    const start = minutesFromTime(startTime);
    const end = minutesFromTime(endTime);
    const slotDuration = Number(duration);
    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(slotDuration) || slotDuration <= 0 || start >= end) {
        return 0;
    }
    return Math.floor((end - start) / slotDuration);
};

const assertConsultationAllowed = (doctor, consultationType) => {
    const isHospitalDoctor = Boolean(doctor.hospitalId);
    if (!['online', 'offline'].includes(consultationType)) {
        throw new Error('Invalid consultation type');
    }
    if (isHospitalDoctor && consultationType === 'online') {
        throw new Error('Hospital-associated doctors can offer only offline consultation');
    }
    if (consultationType === 'online' && !doctor.onlineConsultation) {
        throw new Error('Online consultation is not enabled for this doctor');
    }
};

const getSessionRangeForSlot = async (doctorId, consultationType, startDateTime) => {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) throw new Error('Doctor not found');

    const start = new Date(startDateTime);
    const dateKey = normalizeDateKey(start);
    const slotMinutes = start.getHours() * 60 + start.getMinutes();

    const schedules = await DoctorSchedule.find({
        doctor_id: doctor._id,
        consultation_type: consultationType,
    }).lean();

    const daySchedules = doctor.custom_date_mode
        ? schedules.filter(schedule => schedule.custom_date === dateKey)
        : schedules.filter(schedule => schedule.day_of_week === DAYS[start.getDay()]);

    for (const schedule of daySchedules) {
        const sMin = minutesFromTime(schedule.start_time);
        const eMin = minutesFromTime(schedule.end_time);
        if (slotMinutes >= sMin && slotMinutes < eMin) {
            const sessionStart = dateAtMinutes(start, sMin);
            const sessionEnd = dateAtMinutes(start, eMin);
            return { sessionStart, sessionEnd };
        }
    }
    return null;
};

const assertInsideBookingWindow = async (doctor, startDateTime, consultationType, isOfflineBooking = false) => {
    const start = new Date(startDateTime);
    const now = new Date();
    const maxBookable = new Date(now);
    maxBookable.setDate(maxBookable.getDate() + (doctor.booking_window_days || DEFAULT_BOOKING_WINDOW_DAYS));
    maxBookable.setHours(23, 59, 59, 999);

    if (start > maxBookable) {
        throw new Error('This slot is outside the doctor booking window');
    }

    if (isOfflineBooking) {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        if (start < startOfToday) {
            throw new Error('Cannot book slots on past dates');
        }
        // Also reject slots that have already fully ended today
        const slotDurationMs = (doctor.slot_duration || 15) * 60 * 1000;
        const slotEnd = new Date(start.getTime() + slotDurationMs);
        if (slotEnd <= now) {
            throw new Error('Cannot book a slot that has already ended');
        }
    } else {
        const range = await getSessionRangeForSlot(doctor._id, consultationType, startDateTime);
        if (!range) {
            throw new Error('No matching schedule session found for this slot');
        }
        if (now >= range.sessionStart) {
            throw new Error('Online booking is closed once the consultation starts');
        }
    }
};

const validateSchedulePayload = (doctor, schedules) => {
    if (!Array.isArray(schedules)) {
        throw new Error('Schedules must be an array');
    }

    // Key by day/date only (NOT by consultation_type) so cross-type overlaps are caught
    const byDayKey = new Map();

    for (const schedule of schedules) {
        assertConsultationAllowed(doctor, schedule.consultation_type);

        const start = minutesFromTime(schedule.start_time);
        const end = minutesFromTime(schedule.end_time);
        if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
            throw new Error('Schedule start time must be before end time');
        }

        let dayKey;
        if (doctor.custom_date_mode) {
            if (!schedule.custom_date) {
                throw new Error('Custom date is required for custom date schedules');
            }
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            const normalizedDateStr = String(schedule.custom_date).slice(0, 10);
            if (!dateRegex.test(normalizedDateStr)) {
                throw new Error('Invalid custom date format. Use YYYY-MM-DD');
            }
            dayKey = normalizedDateStr;
        } else {
            if (!DAYS.includes(schedule.day_of_week)) {
                throw new Error('Invalid day of week');
            }
            dayKey = schedule.day_of_week;
        }

        if (!schedule.slot_duration || schedule.slot_duration < 5) {
            throw new Error('Slot duration must be at least 5 minutes');
        }

        // Check overlap against ALL schedules on the same day (online AND offline)
        const existing = byDayKey.get(dayKey) || [];
        for (const range of existing) {
            if (start < range.end && range.start < end) {
                const isCrossType = range.consultation_type !== schedule.consultation_type;
                throw new Error(
                    isCrossType
                        ? `Online and offline sessions cannot overlap. ${schedule.start_time}–${schedule.end_time} (${schedule.consultation_type}) clashes with an existing ${range.consultation_type} session (${range.start_time}–${range.end_time}) on the same ${doctor.custom_date_mode ? 'date' : 'day'}.`
                        : doctor.custom_date_mode
                            ? 'Overlapping schedules are not allowed on the same date within the same consultation type'
                            : 'Overlapping schedules are not allowed within the same consultation type'
                );
            }
        }
        existing.push({ start, end, start_time: schedule.start_time, end_time: schedule.end_time, consultation_type: schedule.consultation_type });
        byDayKey.set(dayKey, existing);
    }
};

const replaceDoctorSchedules = async (doctor, schedules) => {
    validateSchedulePayload(doctor, schedules);
    await DoctorSchedule.deleteMany({ doctor_id: doctor._id });

    if (schedules.length === 0) return [];

    const created = await DoctorSchedule.insertMany(schedules.map(schedule => ({
        doctor_id: doctor._id,
        consultation_type: schedule.consultation_type,
        day_of_week: doctor.custom_date_mode ? null : schedule.day_of_week,
        custom_date: doctor.custom_date_mode ? String(schedule.custom_date).slice(0, 10) : null,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        slot_duration: Number(schedule.slot_duration),
        booking_limit: 1,
    })));
    return created;
};

const getLeaveDateSet = (doctor) => new Set(
    (doctor.unavailability || []).map(item => normalizeDateKey(item.date))
);

const generateAvailableSlots = async (doctorId, consultationType, options = {}) => {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) throw new Error('Doctor not found');

    assertConsultationAllowed(doctor, consultationType);
    if (!doctor.isAcceptingAppointments) return [];

    const schedules = await DoctorSchedule.find({
        doctor_id: doctor._id,
        consultation_type: consultationType,
    }).lean();

    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (doctor.booking_window_days || DEFAULT_BOOKING_WINDOW_DAYS));
    endDate.setHours(23, 59, 59, 999);
    const leaveDates = getLeaveDateSet(doctor);

        const persistedSlots = await AppointmentSlot.find({
        doctor_id: doctor._id,
        consultation_type: consultationType,
        start_datetime: { $gte: startDate, $lte: endDate },
    }).lean();

    // Dynamically clean up any active appointments whose slot was deleted directly from the database
    const doctorActiveAppointments = await Appointment.find({
        doctor_id: doctor._id,
        status: { $ne: 'cancelled' }
    });
    const orphanedAppIds = [];
    for (const app of doctorActiveAppointments) {
        if (app.slot_id) {
            const slotExists = await AppointmentSlot.exists({ _id: app.slot_id });
            if (!slotExists) {
                orphanedAppIds.push(app._id);
            }
        }
    }
    if (orphanedAppIds.length > 0) {
        await Appointment.deleteMany({ _id: { $in: orphanedAppIds } });
        console.log(`[On-the-fly Sync] Deleted ${orphanedAppIds.length} orphaned appointments because their slot documents were deleted directly from DB.`);
    }

    const activeSlotIds = new Set(
        doctorActiveAppointments
            .filter(app => !orphanedAppIds.some(id => id.toString() === app._id.toString()))
            .map(app => app.slot_id.toString())
    );

    const persistedByStart = new Map();
    for (const slot of persistedSlots) {
        if ((slot.status === 'booked' || slot.booked_count > 0) && !activeSlotIds.has(slot._id.toString())) {
            // Correct the status on the fly for the response
            slot.status = 'available';
            slot.booked_count = 0;
            // Update the slot document in the database asynchronously
            AppointmentSlot.updateOne(
                { _id: slot._id },
                { $set: { status: 'available', booked_count: 0 } }
            ).catch(err => console.error('[On-the-fly Sync] Error updating orphaned slot:', err));
        } else if (slot.status === 'available' && activeSlotIds.has(slot._id.toString())) {
            // Correct the status on the fly for the response
            slot.status = 'booked';
            slot.booked_count = 1;
            // Update the slot document in the database asynchronously
            AppointmentSlot.updateOne(
                { _id: slot._id },
                { $set: { status: 'booked', booked_count: 1 } }
            ).catch(err => console.error('[On-the-fly Sync] Error updating active slot status:', err));
        }
        persistedByStart.set(slot.start_datetime.toISOString(), slot);
    }

    const generated = [];
    for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
        const dateKey = normalizeDateKey(day);
        if (leaveDates.has(dateKey)) continue;

        const daySchedules = doctor.custom_date_mode
            ? schedules.filter(schedule => schedule.custom_date === dateKey)
            : schedules.filter(schedule => schedule.day_of_week === DAYS[day.getDay()]);
        for (const schedule of daySchedules) {
            let index = 0;
            const start = minutesFromTime(schedule.start_time);
            const end = minutesFromTime(schedule.end_time);
            const duration = Number(schedule.slot_duration);
            const totalSlots = calculateSlotCount(schedule.start_time, schedule.end_time, duration);
            for (let minute = start; minute + duration <= end; minute += duration) {
                const slotStart = dateAtMinutes(day, minute);
                const slotEnd = dateAtMinutes(day, minute + duration);
                const persisted = persistedByStart.get(slotStart.toISOString());
                const status = persisted?.status || 'available';
                const bookingLimit = 1;
                // For online: only show future slots (slotStart > now)
                // For offline: show today's slots that haven't fully ended yet (slotEnd > now),
                //              plus all future-date slots — but NOT past-time slots from today
                const startOfToday = new Date(now);
                startOfToday.setHours(0, 0, 0, 0);
                const isFutureOrOfflineToday = slotStart > now ||
                    (options.isOfflineBooking && slotStart >= startOfToday);
                const bookedCount = persisted?.booked_count || 0;
                if (isFutureOrOfflineToday && status !== 'blocked') {
                    generated.push({
                        id: persisted?._id || `${doctor._id}-${consultationType}-${slotStart.toISOString()}`,
                        doctor_id: doctor._id,
                        consultation_type: consultationType,
                        start_datetime: slotStart,
                        end_datetime: slotEnd,
                        status: bookedCount >= bookingLimit ? 'booked' : status,
                        booking_limit: bookingLimit,
                        booked_count: bookedCount,
                        slot_index: index,
                        total_slots: totalSlots,
                        regular_slots: totalSlots,
                        session_start_time: schedule.start_time,
                        session_end_time: schedule.end_time,
                    });
                }
                index += 1;
            }
        }
    }

    return generated;
};

const cleanOldAvailableSlots = async () => {
    try {
        const result = await AppointmentSlot.deleteMany({
            end_datetime: { $lt: new Date() },
            status: 'available'
        });
        if (result.deletedCount > 0) {
            console.log(`[Cleanup] Cleaned up ${result.deletedCount} past available slots.`);
        }
    } catch (err) {
        console.error('Error cleaning up past available slots:', err);
    }
};

const syncOrphanedSlots = async () => {
    try {
        const bookedSlots = await AppointmentSlot.find({ status: 'booked' });
        let resetCount = 0;
        for (const slot of bookedSlots) {
            const activeAppointment = await Appointment.findOne({ 
                slot_id: slot._id, 
                status: { $ne: 'cancelled' } 
            });
            if (!activeAppointment) {
                slot.status = 'available';
                slot.booked_count = 0;
                await slot.save();
                resetCount++;
            }
        }
        if (resetCount > 0) {
            console.log(`[Sync] Reset ${resetCount} orphaned slots back to available.`);
        }

        // Clean up orphaned appointments where their slot document was deleted directly from the database
        const activeAppointments = await Appointment.find({ status: { $ne: 'cancelled' } });
        let deletedAppointmentsCount = 0;
        for (const app of activeAppointments) {
            if (app.slot_id) {
                const slotExists = await AppointmentSlot.exists({ _id: app.slot_id });
                if (!slotExists) {
                    await Appointment.deleteOne({ _id: app._id });
                    deletedAppointmentsCount++;
                }
            }
        }
        if (deletedAppointmentsCount > 0) {
            console.log(`[Sync] Deleted ${deletedAppointmentsCount} orphaned appointments due to directly deleted slots.`);
        }
    } catch (err) {
        console.error('Error synchronizing orphaned slots/appointments:', err);
    }
};

module.exports = {
    BOOKING_CLOSE_MINUTES,
    DEFAULT_BOOKING_WINDOW_DAYS,
    calculateSlotCount,
    generateAvailableSlots,
    replaceDoctorSchedules,
    assertConsultationAllowed,
    assertInsideBookingWindow,
    normalizeDateKey,
    getSessionRangeForSlot,
    cleanOldAvailableSlots,
    syncOrphanedSlots,
};
