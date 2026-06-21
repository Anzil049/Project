const asyncHandler = require('express-async-handler');
const Appointment = require('../models/Appointment');
const AppointmentSlot = require('../models/AppointmentSlot');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Prescription = require('../models/Prescription');
const {
    BOOKING_CLOSE_MINUTES,
    generateAvailableSlots,
    assertConsultationAllowed,
    assertInsideBookingWindow,
    normalizeDateKey,
    getSessionRangeForSlot,
} = require('../utils/schedulingUtils');

const OFFLINE_BOOKING_PERCENTAGE = 30;

const populateAppointmentQuery = (query) => query
    .populate('patient_id', 'name phone gender dob bloodGroup address email')
    .populate({
        path: 'doctor_id',
        populate: [
            { path: 'user', select: 'name image phone email address city state zip' },
            { path: 'hospitalId', select: 'name image phone email address city state zip' },
        ],
    })
    .populate('slot_id')
    .populate('prescription_id');

const formatAppointmentResponse = (appointment) => {
    if (!appointment) return null;
    const obj = appointment.toObject ? appointment.toObject() : appointment;
    if (obj.prescription_id) {
        obj.prescription = {
            diagnosis: obj.prescription_id.diagnosis,
            notes: obj.prescription_id.notes,
            follow_up_date: obj.prescription_id.follow_up_date,
            medicines: obj.prescription_id.medicines || []
        };
        obj.vitals = obj.prescription_id.vitals || {};
        obj.custom_vitals = obj.prescription_id.custom_vitals || [];
        obj.consultation_notes = obj.prescription_id.notes;
    }
    return obj;
};

const calculatePayment = (doctor, consultationType, mode = 'online_gateway') => {
    const amount = Number(doctor.fee || 0);
    const bookingFee = consultationType === 'online'
        ? amount
        : Math.ceil((amount * OFFLINE_BOOKING_PERCENTAGE) / 100);

    return {
        amount,
        booking_fee: bookingFee,
        paid_amount: bookingFee,
        currency: 'INR',
        status: mode === 'waived' ? 'waived' : 'paid',
        mode,
    };
};

const calculateRefund = (appointment, slot, reason = 'cancelled') => {
    const paidAmount = Number(appointment.payment?.paid_amount || 0);
    const start = new Date(slot.start_datetime);
    const refundableUntil = new Date(start.getTime() - BOOKING_CLOSE_MINUTES * 60 * 1000);
    const eligible = new Date() < refundableUntil || reason === 'provider_blocked';

    return {
        eligible,
        amount: eligible ? paidAmount : 0,
        status: eligible && paidAmount > 0 ? 'processed' : 'none',
        reason,
        processed_at: eligible && paidAmount > 0 ? new Date() : undefined,
    };
};

const getNextTokenNumber = async (doctorId, slotDateTime, consultationType = 'offline') => {
    // Primary: query persisted slots for this session range on this day sorted chronologically.
    const slotDate = new Date(slotDateTime);
    const sessionRange = await getSessionRangeForSlot(doctorId, consultationType, slotDate);
    
    let queryStart, queryEnd;
    if (sessionRange) {
        queryStart = sessionRange.sessionStart;
        queryEnd = sessionRange.sessionEnd;
    } else {
        // Fallback to full day if session range not found
        queryStart = new Date(slotDate);
        queryStart.setHours(0, 0, 0, 0);
        queryEnd = new Date(slotDate);
        queryEnd.setHours(23, 59, 59, 999);
    }

    const sameSessionSlots = await AppointmentSlot.find({
        doctor_id: doctorId,
        consultation_type: consultationType,
        start_datetime: { $gte: queryStart, $lte: queryEnd },
    }).select('_id start_datetime').sort({ start_datetime: 1 });

    const targetTime = new Date(slotDateTime).getTime();
    const dbPosition = sameSessionSlots.findIndex(s => new Date(s.start_datetime).getTime() === targetTime);
    if (dbPosition !== -1) {
        return dbPosition + 1;
    }

    // Fallback: slot not yet persisted — compute position from generated slots
    try {
        const slots = await generateAvailableSlots(doctorId, consultationType, { isOfflineBooking: true, includeReserved: true });
        const targetDateStr = normalizeDateKey(new Date(slotDateTime));
        const daySlots = slots.filter(s => normalizeDateKey(s.start_datetime) === targetDateStr);
        const targetIso = new Date(slotDateTime).toISOString();
        const targetSlot = daySlots.find(s => new Date(s.start_datetime).toISOString() === targetIso);
        
        if (targetSlot) {
            // Filter daySlots to only include those in the same session
            const sameSessionDaySlots = daySlots.filter(s => 
                s.session_start_time === targetSlot.session_start_time && 
                s.session_end_time === targetSlot.session_end_time
            );
            sameSessionDaySlots.sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
            const pos = sameSessionDaySlots.findIndex(s => new Date(s.start_datetime).toISOString() === targetIso);
            if (pos !== -1) return pos + 1;
        }
    } catch (err) {
        console.error('Error in getNextTokenNumber generateAvailableSlots fallback:', err);
    }

    // Last resort: next after highest existing token for the session
    const last = await Appointment.find({
        doctor_id: doctorId,
        slot_id: { $in: sameSessionSlots.map(slot => slot._id) },
    }).sort({ token_number: -1 }).select('token_number').limit(1);

    return (last[0]?.token_number || 0) + 1;
};

const assertAppointmentCanStart = async (appointment, res) => {
    if (!appointment.slot_id?.start_datetime) return;

    const now = new Date();
    const slotStart = new Date(appointment.slot_id.start_datetime);
    const sessionRange = await getSessionRangeForSlot(
        appointment.doctor_id,
        appointment.consultation_type,
        slotStart
    );

    if (appointment.status === 'no_show') {
        if (sessionRange && (now < sessionRange.sessionStart || now > sessionRange.sessionEnd)) {
            res.status(400);
            throw new Error('No-show patients can be restarted only during the doctor availability window');
        }
        if (!sessionRange && appointment.slot_id?.end_datetime && now > new Date(appointment.slot_id.end_datetime)) {
            res.status(400);
            throw new Error('No-show patients can be restarted only before the slot finishes');
        }
        return;
    }

    if (appointment.status === 'consulting') return;

    if (appointment.status !== 'booked') {
        res.status(400);
        throw new Error('Only booked or no-show appointments can be started');
    }

    const dayStart = new Date(slotStart);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(slotStart);
    dayEnd.setHours(23, 59, 59, 999);

    const sameDaySlots = await AppointmentSlot.find({
        doctor_id: appointment.doctor_id,
        consultation_type: appointment.consultation_type,
        start_datetime: { $gte: dayStart, $lte: dayEnd },
    }).select('_id start_datetime').sort({ start_datetime: 1 });

    const queue = await Appointment.find({
        doctor_id: appointment.doctor_id,
        consultation_type: appointment.consultation_type,
        slot_id: { $in: sameDaySlots.map(slot => slot._id) },
        status: { $in: ['booked', 'consulting', 'completed', 'cancelled', 'no_show'] },
    }).populate('slot_id');

    queue.sort((a, b) => {
        const timeA = a.slot_id?.start_datetime ? new Date(a.slot_id.start_datetime).getTime() : 0;
        const timeB = b.slot_id?.start_datetime ? new Date(b.slot_id.start_datetime).getTime() : 0;
        if (timeA !== timeB) return timeA - timeB;
        return (a.token_number || 0) - (b.token_number || 0);
    });

    const appointmentId = appointment._id.toString();
    const appointmentIndex = queue.findIndex(item => item._id.toString() === appointmentId);

    if (appointmentIndex === 0) {
        if (slotStart.getTime() - now.getTime() > 5 * 60 * 1000) {
            res.status(400);
            throw new Error('Consultation can start only within 5 minutes of the scheduled time');
        }
    }

    const precedingAppointments = appointmentIndex === -1 ? [] : queue.slice(0, appointmentIndex);
    const hasPendingPrecedingAppointment = precedingAppointments.some(item => ['booked', 'consulting'].includes(item.status));

    if (hasPendingPrecedingAppointment) {
        res.status(400);
        throw new Error('Consultations must be started in appointment order. Mark absent earlier patients as no-show first.');
    }
};

const assertCanManageAppointment = async (req, appointment) => {
    if (req.user.role === 'admin') return;
    if (req.user.role === 'patient' && appointment.patient_id?.toString() === req.user.userId.toString()) return;

    const doctor = await Doctor.findById(appointment.doctor_id).select('user hospitalId');
    if (!doctor) {
        const error = new Error('Doctor profile not found');
        error.statusCode = 404;
        throw error;
    }
    if (req.user.role === 'doctor' && doctor.user.toString() === req.user.userId.toString()) return;
    if (req.user.role === 'hospital' && doctor.hospitalId?.toString() === req.user.userId.toString()) return;

    const error = new Error('Not authorized to manage this appointment');
    error.statusCode = 403;
    throw error;
};

const formatTime12 = (timeStr) => {
    if (!timeStr) return '';
    const [hourStr, minuteStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${minuteStr} ${ampm}`;
};

const getDoctorSlots = asyncHandler(async (req, res) => {
    const { consultationType = 'offline', includeReserved = 'false', isOfflineBooking = 'false' } = req.query;
    const slots = await generateAvailableSlots(req.params.id, consultationType, {
        includeReserved: includeReserved === 'true',
        isOfflineBooking: isOfflineBooking === 'true',
    });

    const doctor = await Doctor.findById(req.params.id).select('closed_bookings');
    const closedBookings = doctor?.closed_bookings || [];

    const grouped = slots.reduce((acc, slot) => {
        const date = normalizeDateKey(slot.start_datetime);
        if (!acc[date]) acc[date] = [];
        acc[date].push(slot);
        return acc;
    }, {});

    const result = [];
    for (const [date, dateSlots] of Object.entries(grouped)) {
        const isClosed = closedBookings.some(
            entry => entry.date === date && (entry.consultation_type === consultationType || entry.consultation_type === 'all')
        );

        if (isOfflineBooking === 'true') {
            // For offline booking, return individual slots
            result.push({
                date,
                bookingClosed: isClosed,
                times: dateSlots.map(slot => ({
                    id: slot.id,
                    start_datetime: slot.start_datetime,
                    end_datetime: slot.end_datetime,
                    time: slot.start_datetime.toLocaleTimeString('en-IN', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                    }),
                    status: slot.status,
                    booked_count: slot.booked_count,
                    booking_limit: slot.booking_limit,
                    slot_index: slot.slot_index,
                    session_start_time: slot.session_start_time,
                    session_end_time: slot.session_end_time,
                })),
            });
        } else {
            // For online booking, group slots by session range
            const sessionsMap = new Map();
            for (const slot of dateSlots) {
                const sessionKey = `${slot.session_start_time}-${slot.session_end_time}`;
                if (!sessionsMap.has(sessionKey)) {
                    sessionsMap.set(sessionKey, {
                        session_start_time: slot.session_start_time,
                        session_end_time: slot.session_end_time,
                        slots: [],
                    });
                }
                sessionsMap.get(sessionKey).slots.push(slot);
            }

            const times = [];
            const now = new Date();
            for (const [sessionKey, sessionData] of sessionsMap.entries()) {
                const { session_start_time, session_end_time, slots: sSlots } = sessionData;
                
                // Parse session start/end as Date objects on this specific date
                const [sHour, sMin] = session_start_time.split(':').map(Number);
                const [eHour, eMin] = session_end_time.split(':').map(Number);
                const sessionStart = new Date(date);
                sessionStart.setHours(sHour, sMin, 0, 0);
                const sessionEnd = new Date(date);
                sessionEnd.setHours(eHour, eMin, 0, 0);

                // Find the earliest available slot in this session
                const earliestAvailable = sSlots.find(s => s.status === 'available');
                
                // Determine status of the session
                let sessionStatus = 'booked';
                if (now < sessionStart) {
                    if (earliestAvailable) {
                        sessionStatus = 'available';
                    } else {
                        sessionStatus = 'booked';
                    }
                } else {
                    // Consultation has started (now >= sessionStart)
                    // If there is any available slot left in the future (slotStart > now)
                    const futureAvailable = sSlots.find(s => s.status === 'available' && s.start_datetime > now);
                    if (futureAvailable) {
                        sessionStatus = 'direct_visit';
                    } else {
                        sessionStatus = 'booked';
                    }
                }

                // Representative slot properties
                const repSlot = earliestAvailable || sSlots.find(s => s.start_datetime > now) || sSlots[0];

                if (repSlot) {
                    times.push({
                        id: repSlot.id,
                        start_datetime: repSlot.start_datetime,
                        end_datetime: repSlot.end_datetime,
                        time: `${formatTime12(session_start_time)} - ${formatTime12(session_end_time)}`,
                        status: sessionStatus,
                        booked_count: repSlot.booked_count,
                        booking_limit: repSlot.booking_limit,
                        slot_index: repSlot.slot_index,
                    });
                }
            }

            result.push({
                date,
                bookingClosed: isClosed,
                times,
            });
        }
    }

    res.json(result);
});

const bookAppointment = asyncHandler(async (req, res) => {
    const { doctor_id, consultation_type, start_datetime, reason, phone, email, dob, gender, bloodGroup, address } = req.body;
    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor not found');
    }

    const dateKey = normalizeDateKey(new Date(start_datetime));
    const isClosed = (doctor.closed_bookings || []).some(
        entry => entry.date === dateKey && (entry.consultation_type === consultation_type || entry.consultation_type === 'all')
    );
    if (isClosed) {
        res.status(400);
        throw new Error('Booking has been stopped/closed for this date');
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const patientPhone = phone || user.phone;
    const patientEmail = email || user.email;
    const patientDob = dob || user.dob;
    const patientGender = gender || user.gender;
    const patientBloodGroup = bloodGroup || user.bloodGroup;
    const patientAddress = address || user.address;

    if (!patientPhone || !patientEmail || !patientDob || !patientGender || !patientBloodGroup || !patientAddress) {
        res.status(400);
        throw new Error('All patient details (Phone, Email, DOB, Gender, Blood Group, Address) are required to book an appointment');
    }

    // Update profile if missing
    let profileUpdated = false;
    if (phone && user.phone !== phone) { user.phone = phone; profileUpdated = true; }
    if (dob && (!user.dob || new Date(user.dob).getTime() !== new Date(dob).getTime())) { user.dob = new Date(dob); profileUpdated = true; }
    if (gender && user.gender !== gender) { user.gender = gender; profileUpdated = true; }
    if (bloodGroup && user.bloodGroup !== bloodGroup) { user.bloodGroup = bloodGroup; profileUpdated = true; }
    if (address && user.address !== address) { user.address = address; profileUpdated = true; }
    if (profileUpdated) {
        await user.save();
    }

    assertConsultationAllowed(doctor, consultation_type);
    await assertInsideBookingWindow(doctor, start_datetime, consultation_type, false);

    const availableSlots = await generateAvailableSlots(doctor_id, consultation_type);
    const requestedStart = new Date(start_datetime).toISOString();
    const requestedDateStr = normalizeDateKey(new Date(start_datetime));

    // Find the session range for the requested slot
    const sessionRange = await getSessionRangeForSlot(doctor_id, consultation_type, start_datetime);
    if (!sessionRange) {
        res.status(400);
        throw new Error('Invalid slot time: no matching schedule session found');
    }

    // Find all slots on this date
    const dateSlots = availableSlots.filter(s => normalizeDateKey(s.start_datetime) === requestedDateStr);

    // Find the slots that belong to this session
    const sessionSlots = dateSlots.filter(s => {
        const slotMinutes = s.start_datetime.getHours() * 60 + s.start_datetime.getMinutes();
        const sMin = sessionRange.sessionStart.getHours() * 60 + sessionRange.sessionStart.getMinutes();
        const eMin = sessionRange.sessionEnd.getHours() * 60 + sessionRange.sessionEnd.getMinutes();
        return slotMinutes >= sMin && slotMinutes < eMin;
    });

    // Find the first available slot in this session
    const firstAvailableInSession = sessionSlots.find(s => s.status === 'available');
    if (!firstAvailableInSession) {
        res.status(400);
        throw new Error('No slots available in the selected session');
    }

    const patientAppointments = await Appointment.find({
        patient_id: req.user.userId,
        doctor_id,
        status: { $in: ['booked', 'consulting', 'completed'] }
    }).populate('slot_id');

    const alreadyBooked = patientAppointments.some(app => {
        if (!app.slot_id?.start_datetime) return false;
        return normalizeDateKey(app.slot_id.start_datetime) === requestedDateStr;
    });

    if (alreadyBooked) {
        res.status(400);
        throw new Error('You already have an active appointment with this doctor on the selected date');
    }

    if (firstAvailableInSession.start_datetime.toISOString() !== requestedStart) {
        res.status(400);
        throw new Error('You must book the earliest available slot in the selected session');
    }

    const generatedSlot = firstAvailableInSession;

    try {
        await AppointmentSlot.updateOne(
            {
                doctor_id,
                consultation_type,
                start_datetime: generatedSlot.start_datetime,
            },
            {
                $setOnInsert: {
                    doctor_id,
                    consultation_type,
                    start_datetime: generatedSlot.start_datetime,
                    end_datetime: generatedSlot.end_datetime,
                    status: 'available',
                    booking_limit: 1,
                    booked_count: 0,
                },
            },
            { upsert: true }
        );
    } catch (error) {
        if (error.code !== 11000) throw error;
    }

    const slot = await AppointmentSlot.findOneAndUpdate(
        {
            doctor_id,
            consultation_type,
            start_datetime: generatedSlot.start_datetime,
            end_datetime: generatedSlot.end_datetime,
            status: 'available',
            booked_count: 0,
        },
        {
            $inc: { booked_count: 1 },
            $set: { status: 'booked', booking_limit: 1 },
        },
        { new: true }
    );

    if (!slot) {
        res.status(400);
        throw new Error('Selected slot is already booked');
    }

    const tokenNumber = await getNextTokenNumber(doctor_id, slot.start_datetime, consultation_type);
    const appointment = await Appointment.create({
        patient_id: req.user.userId,
        doctor_id,
        consultation_type,
        slot_id: slot._id,
        status: 'booked',
        token_number: tokenNumber,
        reason,
        payment: calculatePayment(doctor, consultation_type),
        online_session: consultation_type === 'online'
            ? { room_id: `consult-${slot._id.toString()}` }
            : undefined,
    });

    res.status(201).json({
        message: 'Appointment booked successfully',
        appointment,
        slot,
    });
});

const getDoctorAppointments = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findOne({ user: req.user.userId });
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor profile not found');
    }

    const appointments = await populateAppointmentQuery(Appointment.find({ doctor_id: doctor._id }))
        .sort({ token_number: 1, createdAt: 1 });

    res.json(appointments.map(formatAppointmentResponse));
});

const getHospitalAppointments = asyncHandler(async (req, res) => {
    const doctors = await Doctor.find({ hospitalId: req.user.userId }).select('_id user specialization').populate('user', 'name image');
    const doctorIds = doctors.map(doctor => doctor._id);
    const appointments = await populateAppointmentQuery(Appointment.find({ doctor_id: { $in: doctorIds } }))
        .sort({ createdAt: -1 });

    res.json({ doctors, appointments: appointments.map(formatAppointmentResponse) });
});

const getAppointmentById = asyncHandler(async (req, res) => {
    const appointment = await populateAppointmentQuery(Appointment.findById(req.params.id));

    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }

    await assertCanManageAppointment(req, appointment);

    const previousPrescriptions = appointment.patient_id?._id
        ? await Prescription.find({
            patient_id: appointment.patient_id._id,
            doctor_id: appointment.doctor_id._id,
        }).sort({ createdAt: -1 }).limit(5)
        : [];

    const formattedPrevPrescriptions = previousPrescriptions.map(p => ({
        _id: p._id,
        createdAt: p.createdAt,
        prescription: {
            diagnosis: p.diagnosis,
            notes: p.notes,
            follow_up_date: p.follow_up_date,
            medicines: p.medicines || []
        },
        vitals: p.vitals || {},
        custom_vitals: p.custom_vitals || [],
        consultation_notes: p.notes
    }));

    res.json({
        ...formatAppointmentResponse(appointment),
        previous_prescriptions: formattedPrevPrescriptions,
    });
});

const startAppointment = asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id).populate('slot_id');
    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }

    await assertCanManageAppointment(req, appointment);

    if (['completed', 'cancelled'].includes(appointment.status)) {
        res.status(400);
        throw new Error('This appointment has already been completed or cancelled');
    }

    await assertAppointmentCanStart(appointment, res);

    // Automatically transition any currently active ('consulting') appointments for this doctor back to their previous status
    const activeAppointments = await Appointment.find({
        doctor_id: appointment.doctor_id,
        status: 'consulting',
        _id: { $ne: appointment._id }
    });

    for (const activeApp of activeAppointments) {
        const targetStatus = activeApp.previous_status === 'no_show' ? 'no_show' : 'booked';
        activeApp.status = targetStatus;
        await activeApp.save();
        if (activeApp.slot_id) {
            await AppointmentSlot.findByIdAndUpdate(activeApp.slot_id, { status: targetStatus });
        }
    }

    appointment.previous_status = appointment.status;
    appointment.status = 'consulting';
    await appointment.save();
    await AppointmentSlot.findByIdAndUpdate(appointment.slot_id, { status: 'booked' });
    res.json({ message: 'Consultation started', appointment });
});

const completeAppointment = asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }

    await assertCanManageAppointment(req, appointment);

    // Vitals validation
    if (req.body.vitals) {
        const { bp, pulse, temperature, weight } = req.body.vitals;
        if (bp && (typeof bp !== 'string' || bp.length > 50)) {
            res.status(400);
            throw new Error('Invalid blood pressure value (must be under 50 characters)');
        }
        if (pulse && (typeof pulse !== 'string' || pulse.length > 50)) {
            res.status(400);
            throw new Error('Invalid pulse value (must be under 50 characters)');
        }
        if (temperature && (typeof temperature !== 'string' || temperature.length > 50)) {
            res.status(400);
            throw new Error('Invalid temperature value (must be under 50 characters)');
        }
        if (weight && (typeof weight !== 'string' || weight.length > 50)) {
            res.status(400);
            throw new Error('Invalid weight value (must be under 50 characters)');
        }
    }

    // Custom Vitals validation
    if (req.body.custom_vitals) {
        if (!Array.isArray(req.body.custom_vitals)) {
            res.status(400);
            throw new Error('custom_vitals must be an array');
        }
        if (req.body.custom_vitals.length > 10) {
            res.status(400);
            throw new Error('A maximum of 10 custom vital fields is allowed');
        }
        for (const item of req.body.custom_vitals) {
            if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
                res.status(400);
                throw new Error('Custom vital field name is required and must be a non-empty string');
            }
            if (item.name.length > 50) {
                res.status(400);
                throw new Error('Custom vital field name must be under 50 characters');
            }
            if (!item.value || typeof item.value !== 'string' || item.value.trim() === '') {
                res.status(400);
                throw new Error('Custom vital field value is required and must be a non-empty string');
            }
            if (item.value.length > 50) {
                res.status(400);
                throw new Error('Custom vital field value must be under 50 characters');
            }
        }
    }

    // Create or update Prescription record
    const prescription = await Prescription.findOneAndUpdate(
        { appointment_id: appointment._id },
        {
            appointment_id: appointment._id,
            patient_id: appointment.patient_id,
            doctor_id: appointment.doctor_id,
            diagnosis: req.body.prescription?.diagnosis || 'General Health Review',
            notes: req.body.prescription?.notes || req.body.consultation_notes || '',
            follow_up_date: req.body.prescription?.follow_up_date,
            medicines: req.body.prescription?.medicines || [],
            vitals: req.body.vitals || {},
            custom_vitals: req.body.custom_vitals || []
        },
        { upsert: true, new: true }
    );

    appointment.status = 'completed';
    appointment.prescription_id = prescription._id;
    await appointment.save();

    await AppointmentSlot.findByIdAndUpdate(appointment.slot_id, { status: 'completed' });

    // Return populated and formatted response
    const populated = await populateAppointmentQuery(Appointment.findById(appointment._id));
    res.json({ message: 'Consultation completed', appointment: formatAppointmentResponse(populated) });
});

const noShowAppointment = asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }
    if (!['booked', 'consulting'].includes(appointment.status)) {
        res.status(400);
        throw new Error('Only booked or active consultations can be marked as no-show');
    }

    await assertCanManageAppointment(req, appointment);
    appointment.status = 'no_show';
    await appointment.save();

    await AppointmentSlot.findByIdAndUpdate(appointment.slot_id, { status: 'no_show' });
    res.json({ message: 'Patient marked as no-show', appointment });
});

const cancelAppointment = asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id).populate('slot_id');
    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }
    if (['completed', 'cancelled'].includes(appointment.status)) {
        res.status(400);
        throw new Error('This appointment cannot be cancelled');
    }

    await assertCanManageAppointment(req, appointment);

    const refund = calculateRefund(appointment, appointment.slot_id, req.body.reason || 'cancelled');
    appointment.status = 'cancelled';
    appointment.cancelled_at = new Date();
    appointment.cancellation_reason = req.body.reason || 'cancelled';
    appointment.payment = {
        ...(appointment.payment?.toObject ? appointment.payment.toObject() : appointment.payment),
        status: refund.amount > 0 ? 'refunded' : appointment.payment?.status,
        refund,
    };
    await appointment.save();

    await AppointmentSlot.findByIdAndUpdate(appointment.slot_id._id, {
        status: 'available',
        booked_count: 0,
    });

    res.json({ message: 'Appointment cancelled', appointment, refund });
});

const getQueuePreview = asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id).populate('slot_id doctor_id');
    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }
    await assertCanManageAppointment(req, appointment);

    const start = new Date(appointment.slot_id.start_datetime);
    const dayStart = new Date(start);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(start);
    dayEnd.setHours(23, 59, 59, 999);

    const slots = await AppointmentSlot.find({
        doctor_id: appointment.doctor_id,
        start_datetime: { $gte: dayStart, $lte: dayEnd },
    }).select('_id start_datetime end_datetime').sort({ start_datetime: 1 });

    const queue = await populateAppointmentQuery(Appointment.find({
        doctor_id: appointment.doctor_id,
        slot_id: { $in: slots.map(slot => slot._id) },
        status: { $in: ['booked', 'consulting', 'completed', 'no_show'] },
    }));

    queue.sort((a, b) => {
        const timeA = a.slot_id?.start_datetime ? new Date(a.slot_id.start_datetime).getTime() : 0;
        const timeB = b.slot_id?.start_datetime ? new Date(b.slot_id.start_datetime).getTime() : 0;
        if (timeA !== timeB) return timeA - timeB;
        return (a.token_number || 0) - (b.token_number || 0);
    });

    const current = queue.find(item => item.status === 'consulting');
    const firstSlot = slots[0];
    const duration = firstSlot
        ? Math.max(5, Math.round((new Date(firstSlot.end_datetime) - new Date(firstSlot.start_datetime)) / 60000))
        : 10;

    const activeQueue = queue.filter(item => ['booked', 'consulting'].includes(item.status));
    const activePatientIndex = activeQueue.findIndex(item => item._id.toString() === appointment._id.toString());
    const activeCurrentIndex = activeQueue.findIndex(item => item.status === 'consulting');
    const tokensAhead = activePatientIndex === -1 ? 0 : Math.max(0, activePatientIndex - Math.max(activeCurrentIndex, -1) - (activeCurrentIndex >= 0 ? 0 : 1));

    res.json({
        appointment_id: appointment._id,
        token_number: appointment.token_number,
        current_token: current?.token_number || null,
        status: appointment.status,
        consultation_started: Boolean(current),
        tokens_ahead: tokensAhead,
        estimated_wait_minutes: tokensAhead * duration,
        queue: queue.map(item => ({
            id: item._id,
            token_number: item.token_number,
            patient_name: item.patient_id?.name || item.patient_snapshot?.name || 'Walk-in Patient',
            status: item.status,
            consultation_type: item.consultation_type,
            start_datetime: item.slot_id?.start_datetime,
        })),
    });
});

const notifyParticipant = asyncHandler(async (req, res) => {
    const { target } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }
    await assertCanManageAppointment(req, appointment);

    appointment.online_session = appointment.online_session || {};
    if (target === 'doctor') {
        appointment.online_session.doctor_notified_at = new Date();
    } else if (target === 'patient') {
        appointment.online_session.patient_notified_at = new Date();
    } else {
        res.status(400);
        throw new Error('Notification target must be doctor or patient');
    }

    await appointment.save();
    res.json({ message: `${target} notified`, appointment });
});

const markParticipantJoined = asyncHandler(async (req, res) => {
    const { participant } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }
    await assertCanManageAppointment(req, appointment);

    appointment.online_session = appointment.online_session || {};
    if (participant === 'doctor') {
        appointment.online_session.doctor_joined_at = new Date();
    } else if (participant === 'patient') {
        appointment.online_session.patient_joined_at = new Date();
    } else {
        res.status(400);
        throw new Error('Participant must be doctor or patient');
    }

    await appointment.save();
    res.json({ message: `${participant} joined`, appointment });
});

const submitFeedback = asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }
    if (appointment.patient_id?.toString() !== req.user.userId.toString()) {
        res.status(403);
        throw new Error('You can only review your own appointment');
    }
    if (appointment.status !== 'completed') {
        res.status(400);
        throw new Error('Feedback can be added after consultation is completed');
    }

    appointment.feedback = {
        doctor_rating: req.body.doctor_rating,
        hospital_rating: req.body.hospital_rating,
        comment: req.body.comment,
        tags: req.body.tags || [],
        submitted_at: new Date(),
    };
    await appointment.save();
    res.json({ message: 'Feedback submitted', appointment });
});

const blockDoctorDate = asyncHandler(async (req, res) => {
    const { doctor_id, date, reason = 'emergency_closure', note = '' } = req.body;
    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor not found');
    }
    if (req.user.role === 'doctor' && doctor.user.toString() !== req.user.userId.toString()) {
        res.status(403);
        throw new Error('You can only block your own dates');
    }
    if (req.user.role === 'hospital' && doctor.hospitalId?.toString() !== req.user.userId.toString()) {
        res.status(403);
        throw new Error('You can only block dates for doctors in your hospital');
    }
    if (req.user.role === 'doctor' && doctor.hospitalId) {
        res.status(403);
        throw new Error('Hospital-associated doctor availability is managed by the hospital');
    }

    const dateKey = normalizeDateKey(date);
    const alreadyBlocked = (doctor.unavailability || []).some(item => normalizeDateKey(item.date) === dateKey);
    if (!alreadyBlocked) {
        doctor.unavailability.push({ date: new Date(dateKey), reason, note });
        await doctor.save();
    }

    const dayStart = new Date(dateKey);
    const dayEnd = new Date(dateKey);
    dayEnd.setHours(23, 59, 59, 999);
    const slots = await AppointmentSlot.find({
        doctor_id: doctor._id,
        start_datetime: { $gte: dayStart, $lte: dayEnd },
    });

    const affectedAppointments = await Appointment.find({
        doctor_id: doctor._id,
        slot_id: { $in: slots.map(slot => slot._id) },
        status: { $in: ['booked', 'consulting'] },
    }).populate('slot_id');

    for (const appointment of affectedAppointments) {
        const refund = calculateRefund(appointment, appointment.slot_id, 'provider_blocked');
        appointment.status = 'cancelled';
        appointment.cancelled_at = new Date();
        appointment.cancellation_reason = note || 'Doctor unavailable';
        appointment.payment = {
            ...(appointment.payment?.toObject ? appointment.payment.toObject() : appointment.payment),
            status: refund.amount > 0 ? 'refunded' : appointment.payment?.status,
            refund,
        };
        await appointment.save();
    }

    await AppointmentSlot.updateMany(
        { _id: { $in: slots.map(slot => slot._id) } },
        { status: 'blocked', booked_count: 0 }
    );

    res.json({
        message: 'Date blocked and affected appointments cancelled',
        cancelled_count: affectedAppointments.length,
    });
});

const toggleCloseBooking = asyncHandler(async (req, res) => {
    const { doctor_id, date, action, consultation_type = 'all' } = req.body;
    
    if (!doctor_id || !date || !action) {
        res.status(400);
        throw new Error('Doctor ID, date, and action are required');
    }

    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor not found');
    }

    // Authorization checks
    if (req.user.role === 'doctor') {
        if (doctor.user.toString() !== req.user.userId.toString()) {
            res.status(403);
            throw new Error('You can only modify booking status for your own schedule');
        }
    } else if (req.user.role === 'hospital') {
        if (doctor.hospitalId?.toString() !== req.user.userId.toString()) {
            res.status(403);
            throw new Error('You can only modify booking status for doctors in your hospital');
        }
    } else if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to modify booking status');
    }

    const dateKey = normalizeDateKey(date);

    if (action === 'close') {
        const alreadyClosed = (doctor.closed_bookings || []).some(
            item => item.date === dateKey && item.consultation_type === consultation_type
        );
        if (!alreadyClosed) {
            if (!doctor.closed_bookings) doctor.closed_bookings = [];
            doctor.closed_bookings.push({ date: dateKey, consultation_type });
            await doctor.save();
        }
    } else if (action === 'open') {
        if (doctor.closed_bookings) {
            doctor.closed_bookings = doctor.closed_bookings.filter(
                item => !(item.date === dateKey && item.consultation_type === consultation_type)
            );
            await doctor.save();
        }
    } else {
        res.status(400);
        throw new Error('Invalid action. Use close or open');
    }

    res.json({
        message: `Booking successfully ${action === 'close' ? 'closed' : 'reopened'} for ${dateKey}`,
        closed_bookings: doctor.closed_bookings,
    });
});

const createOfflineAppointment = asyncHandler(async (req, res) => {
    const { doctor_id, start_datetime, patientName, phone, email, age, gender, bloodGroup, address, reason } = req.body;
    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor not found');
    }

    const dateKey = normalizeDateKey(new Date(start_datetime));
    const isClosed = (doctor.closed_bookings || []).some(
        entry => entry.date === dateKey && (entry.consultation_type === 'offline' || entry.consultation_type === 'all')
    );
    if (isClosed) {
        res.status(400);
        throw new Error('Booking has been stopped/closed for this date');
    }

    if (!patientName || !phone || !email || !age || !gender || !bloodGroup || !address) {
        res.status(400);
        throw new Error('All patient details (Name, Phone, Email, Age, Gender, Blood Group, Address) are required');
    }

    if (req.user.role === 'hospital' && doctor.hospitalId?.toString() !== req.user.userId.toString()) {
        res.status(403);
        throw new Error('Doctor does not belong to this hospital');
    }
    if (req.user.role === 'doctor' && doctor.user.toString() !== req.user.userId.toString()) {
        res.status(403);
        throw new Error('You can only create offline bookings for your own schedule');
    }

    assertConsultationAllowed(doctor, 'offline');
    await assertInsideBookingWindow(doctor, start_datetime, 'offline', true);
    const availableSlots = await generateAvailableSlots(doctor_id, 'offline', { includeReserved: true, isOfflineBooking: true });
    const requestedStart = new Date(start_datetime).toISOString();
    const generatedSlot = availableSlots.find(slot => slot.start_datetime.toISOString() === requestedStart);
    if (!generatedSlot || generatedSlot.status !== 'available') {
        res.status(400);
        throw new Error('Selected offline slot is not available');
    }

    // Find or register patient user
    let patient = null;
    if (email) {
        patient = await User.findOne({ email: email.toLowerCase(), role: 'patient' });
    }
    if (!patient && phone) {
        patient = await User.findOne({ phone, role: 'patient' });
    }

    if (!patient) {
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            res.status(400);
            throw new Error('This email is already registered to another user account');
        }

        const defaultPassword = 'Patient123!';
        patient = await User.create({
            name: patientName,
            email: email.toLowerCase(),
            password: defaultPassword,
            phone: phone,
            role: 'patient',
            isVerified: false,
            isApproved: true,
            isFirstLogin: true,
            gender: gender,
            bloodGroup: bloodGroup,
            address: address,
            dob: new Date(new Date().getFullYear() - Number(age), 0, 1),
        });
    } else {
        let modified = false;
        if (!patient.phone && phone) {
            patient.phone = phone;
            modified = true;
        }
        if (!patient.bloodGroup && bloodGroup) {
            patient.bloodGroup = bloodGroup;
            modified = true;
        }
        if (!patient.address && address) {
            patient.address = address;
            modified = true;
        }
        if (!patient.gender && gender) {
            patient.gender = gender;
            modified = true;
        }
        if (modified) {
            await patient.save();
        }
    }

    // Check same-day booking prevention
    const queryConditions = [
        { 'patient_snapshot.phone': phone }
    ];
    if (patient) {
        queryConditions.push({ patient_id: patient._id });
        if (email) {
            queryConditions.push({ 'patient_snapshot.email': email.toLowerCase() });
        }
    }

    const patientAppointments = await Appointment.find({
        doctor_id,
        status: { $in: ['booked', 'consulting', 'completed'] },
        $or: queryConditions
    }).populate('slot_id');

    const requestedDateStr = normalizeDateKey(generatedSlot.start_datetime);
    const alreadyBooked = patientAppointments.some(app => {
        if (!app.slot_id?.start_datetime) return false;
        return normalizeDateKey(app.slot_id.start_datetime) === requestedDateStr;
    });

    if (alreadyBooked) {
        res.status(400);
        throw new Error('This patient already has an active appointment with this doctor on the selected date');
    }

    try {
        await AppointmentSlot.updateOne(
            { doctor_id, consultation_type: 'offline', start_datetime: generatedSlot.start_datetime },
            {
                $setOnInsert: {
                    doctor_id,
                    consultation_type: 'offline',
                    start_datetime: generatedSlot.start_datetime,
                    end_datetime: generatedSlot.end_datetime,
                    status: 'available',
                    booking_limit: 1,
                    booked_count: 0,
                },
            },
            { upsert: true }
        );
    } catch (error) {
        if (error.code !== 11000) throw error;
    }

    const slot = await AppointmentSlot.findOneAndUpdate(
        {
            doctor_id,
            consultation_type: 'offline',
            start_datetime: generatedSlot.start_datetime,
            status: 'available',
            booked_count: 0,
        },
        { $inc: { booked_count: 1 }, $set: { status: 'booked', booking_limit: 1 } },
        { new: true }
    );

    if (!slot) {
        res.status(400);
        throw new Error('Selected slot is already booked');
    }

    const tokenNumber = await getNextTokenNumber(doctor_id, slot.start_datetime, 'offline');
    const appointment = await Appointment.create({
        patient_id: patient._id,
        patient_snapshot: { name: patientName, phone, email: email.toLowerCase(), age, gender, bloodGroup, address },
        doctor_id,
        consultation_type: 'offline',
        slot_id: slot._id,
        status: 'booked',
        token_number: tokenNumber,
        reason,
        booked_by_role: req.user.role,
        payment: calculatePayment(doctor, 'offline', req.body.payment_mode || 'cash'),
    });

    res.status(201).json({ message: 'Offline appointment booked successfully', appointment, slot });
});

const getMyAppointments = asyncHandler(async (req, res) => {
    const appointments = await populateAppointmentQuery(Appointment.find({ patient_id: req.user.userId }))
        .sort({ createdAt: -1 });

    res.json(appointments.map(formatAppointmentResponse));
});

const getPatientByEmail = asyncHandler(async (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ message: 'Email query parameter is required' });
    }
    const patient = await User.findOne({ email: email.toLowerCase().trim(), role: 'patient' }).select('-password');
    if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
});

module.exports = {
    getDoctorSlots,
    bookAppointment,
    getMyAppointments,
    getDoctorAppointments,
    getHospitalAppointments,
    getAppointmentById,
    startAppointment,
    completeAppointment,
    createOfflineAppointment,
    cancelAppointment,
    noShowAppointment,
    getQueuePreview,
    notifyParticipant,
    markParticipantJoined,
    submitFeedback,
    blockDoctorDate,
    toggleCloseBooking,
    getPatientByEmail,
};
