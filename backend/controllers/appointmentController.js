const asyncHandler = require('express-async-handler');
const Appointment = require('../models/Appointment');
const AppointmentSlot = require('../models/AppointmentSlot');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const {
    BOOKING_CLOSE_MINUTES,
    generateAvailableSlots,
    assertConsultationAllowed,
    assertInsideBookingWindow,
    normalizeDateKey,
} = require('../utils/schedulingUtils');

const OFFLINE_BOOKING_PERCENTAGE = 30;

const populateAppointmentQuery = (query) => query
    .populate('patient_id', 'name phone gender dob bloodGroup address email')
    .populate({
        path: 'doctor_id',
        populate: [
            { path: 'user', select: 'name image phone' },
            { path: 'hospitalId', select: 'name image phone' },
        ],
    })
    .populate('slot_id');

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

const getNextTokenNumber = async (doctorId, slotDateTime) => {
    const slotDate = new Date(slotDateTime);
    const dayStart = new Date(slotDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(slotDate);
    dayEnd.setHours(23, 59, 59, 999);

    const sameDaySlots = await AppointmentSlot.find({
        doctor_id: doctorId,
        start_datetime: { $gte: dayStart, $lte: dayEnd },
    }).select('_id');

    const last = await Appointment.find({
        doctor_id: doctorId,
        slot_id: { $in: sameDaySlots.map(slot => slot._id) },
    }).sort({ token_number: -1 }).select('token_number').limit(1);

    return (last[0]?.token_number || 0) + 1;
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

const getDoctorSlots = asyncHandler(async (req, res) => {
    const { consultationType = 'offline', includeReserved = 'false' } = req.query;
    const slots = await generateAvailableSlots(req.params.id, consultationType, {
        includeReserved: includeReserved === 'true',
    });

    const grouped = slots.reduce((acc, slot) => {
        const date = normalizeDateKey(slot.start_datetime);
        if (!acc[date]) acc[date] = [];
        acc[date].push(slot);
        return acc;
    }, {});

    res.json(Object.entries(grouped).map(([date, dateSlots]) => ({
        date,
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
            is_reserved: slot.is_reserved,
            reserved_for: slot.reserved_for,
            booked_count: slot.booked_count,
            booking_limit: slot.booking_limit,
        })),
    })));
});

const bookAppointment = asyncHandler(async (req, res) => {
    const { doctor_id, consultation_type, start_datetime, reason, phone, email, dob, gender, bloodGroup, address } = req.body;
    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor not found');
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
    assertInsideBookingWindow(doctor, start_datetime);

    const availableSlots = await generateAvailableSlots(doctor_id, consultation_type);
    const requestedStart = new Date(start_datetime).toISOString();
    const requestedDateStr = normalizeDateKey(new Date(start_datetime));

    // Find all slots on this date
    const dateSlots = availableSlots.filter(s => normalizeDateKey(s.start_datetime) === requestedDateStr);
    
    // Find the first available slot on this date
    const firstAvailable = dateSlots.find(s => s.status === 'available' && !s.is_reserved);
    if (!firstAvailable) {
        res.status(400);
        throw new Error('No slots available on the selected date');
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

    if (firstAvailable.start_datetime.toISOString() !== requestedStart) {
        res.status(400);
        throw new Error('You must book the earliest available slot on the selected date');
    }

    const generatedSlot = firstAvailable;

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

    const tokenNumber = await getNextTokenNumber(doctor_id, slot.start_datetime);
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

    res.json(appointments);
});

const getHospitalAppointments = asyncHandler(async (req, res) => {
    const doctors = await Doctor.find({ hospitalId: req.user.userId }).select('_id user specialization').populate('user', 'name image');
    const doctorIds = doctors.map(doctor => doctor._id);
    const appointments = await populateAppointmentQuery(Appointment.find({ doctor_id: { $in: doctorIds } }))
        .sort({ createdAt: -1 });

    res.json({ doctors, appointments });
});

const getAppointmentById = asyncHandler(async (req, res) => {
    const appointment = await populateAppointmentQuery(Appointment.findById(req.params.id));

    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }

    await assertCanManageAppointment(req, appointment);

    const previousPrescriptions = appointment.patient_id?._id
        ? await Appointment.find({
            _id: { $ne: appointment._id },
            patient_id: appointment.patient_id._id,
            doctor_id: appointment.doctor_id._id,
            status: 'completed',
            'prescription.diagnosis': { $exists: true, $ne: '' },
        }).populate('slot_id').sort({ createdAt: -1 }).limit(5)
        : [];

    res.json({
        ...appointment.toObject(),
        previous_prescriptions: previousPrescriptions,
    });
});

const startAppointment = asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id).populate('slot_id');
    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }

    await assertCanManageAppointment(req, appointment);
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
    appointment.status = 'completed';
    appointment.prescription = req.body.prescription || appointment.prescription;
    appointment.consultation_notes = req.body.consultation_notes || appointment.consultation_notes;
    await appointment.save();

    await AppointmentSlot.findByIdAndUpdate(appointment.slot_id, { status: 'completed' });
    res.json({ message: 'Consultation completed', appointment });
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
        status: { $in: ['booked', 'consulting', 'completed'] },
    })).sort({ token_number: 1, createdAt: 1 });

    const current = queue.find(item => item.status === 'consulting');
    const currentIndex = current ? queue.findIndex(item => item._id.toString() === current._id.toString()) : -1;
    const patientIndex = queue.findIndex(item => item._id.toString() === appointment._id.toString());
    const firstSlot = slots[0];
    const duration = firstSlot
        ? Math.max(5, Math.round((new Date(firstSlot.end_datetime) - new Date(firstSlot.start_datetime)) / 60000))
        : 10;
    const tokensAhead = Math.max(0, patientIndex - Math.max(currentIndex, -1) - (currentIndex >= 0 ? 0 : 1));

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

const createOfflineAppointment = asyncHandler(async (req, res) => {
    const { doctor_id, start_datetime, patientName, phone, email, age, gender, bloodGroup, address, reason } = req.body;
    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor not found');
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
    assertInsideBookingWindow(doctor, start_datetime);
    const availableSlots = await generateAvailableSlots(doctor_id, 'offline', { includeReserved: true });
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
            isVerified: true,
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

    const tokenNumber = await getNextTokenNumber(doctor_id, slot.start_datetime);
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

    res.json(appointments);
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
    getQueuePreview,
    notifyParticipant,
    markParticipantJoined,
    submitFeedback,
    blockDoctorDate,
};
