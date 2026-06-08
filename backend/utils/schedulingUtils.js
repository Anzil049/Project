const Doctor = require('../models/Doctor');
const DoctorSchedule = require('../models/DoctorSchedule');
const AppointmentSlot = require('../models/AppointmentSlot');

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

const assertInsideBookingWindow = (doctor, startDateTime) => {
    const start = new Date(startDateTime);
    const now = new Date();
    const closeBefore = new Date(now.getTime() + BOOKING_CLOSE_MINUTES * 60 * 1000);
    const maxBookable = new Date(now);
    maxBookable.setDate(maxBookable.getDate() + (doctor.booking_window_days || DEFAULT_BOOKING_WINDOW_DAYS));

    if (start <= closeBefore) {
        throw new Error('Booking closes 30 minutes before consultation');
    }
    if (start > maxBookable) {
        throw new Error('This slot is outside the doctor booking window');
    }
};

const validateSchedulePayload = (doctor, schedules) => {
    if (!Array.isArray(schedules)) {
        throw new Error('Schedules must be an array');
    }

    const byTypeAndDay = new Map();
    for (const schedule of schedules) {
        assertConsultationAllowed(doctor, schedule.consultation_type);

        const start = minutesFromTime(schedule.start_time);
        const end = minutesFromTime(schedule.end_time);
        if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
            throw new Error('Schedule start time must be before end time');
        }
        if (!DAYS.includes(schedule.day_of_week)) {
            throw new Error('Invalid day of week');
        }
        if (!schedule.slot_duration || schedule.slot_duration < 5) {
            throw new Error('Slot duration must be at least 5 minutes');
        }
        const key = `${schedule.consultation_type}:${schedule.day_of_week}`;
        const existing = byTypeAndDay.get(key) || [];
        for (const range of existing) {
            if (start < range.end && range.start < end) {
                throw new Error('Overlapping schedules are not allowed within the same consultation type');
            }
        }
        existing.push({ start, end });
        byTypeAndDay.set(key, existing);
    }
};

const replaceDoctorSchedules = async (doctor, schedules) => {
    validateSchedulePayload(doctor, schedules);
    await DoctorSchedule.deleteMany({ doctor_id: doctor._id });

    if (schedules.length === 0) return [];

    const created = await DoctorSchedule.insertMany(schedules.map(schedule => ({
        doctor_id: doctor._id,
        consultation_type: schedule.consultation_type,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        slot_duration: Number(schedule.slot_duration),
        booking_limit: 1,
        follow_up_percentage: Number(schedule.follow_up_percentage || 0),
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
    const closeBefore = new Date(now.getTime() + BOOKING_CLOSE_MINUTES * 60 * 1000);
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
    const persistedByStart = new Map(persistedSlots.map(slot => [slot.start_datetime.toISOString(), slot]));

    const generated = [];
    for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
        const dateKey = normalizeDateKey(day);
        if (leaveDates.has(dateKey)) continue;

        const daySchedules = schedules.filter(schedule => schedule.day_of_week === DAYS[day.getDay()]);
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
                const bookedCount = persisted?.booked_count || 0;
                const bookingLimit = 1;
                const isReserved = Boolean(persisted?.is_reserved);

                if (slotStart > closeBefore && status !== 'blocked' && (!isReserved || options.includeReserved)) {
                    generated.push({
                        id: persisted?._id || `${doctor._id}-${consultationType}-${slotStart.toISOString()}`,
                        doctor_id: doctor._id,
                        consultation_type: consultationType,
                        start_datetime: slotStart,
                        end_datetime: slotEnd,
                        status: bookedCount >= bookingLimit ? 'booked' : status,
                        is_reserved: isReserved,
                        reserved_for: persisted?.reserved_for || null,
                        booking_limit: bookingLimit,
                        booked_count: bookedCount,
                        slot_index: index,
                        total_slots: totalSlots,
                        regular_slots: totalSlots,
                    });
                }
                index += 1;
            }
        }
    }

    return generated;
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
};
