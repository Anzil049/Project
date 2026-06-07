const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/my', protect('patient'), getMyAppointments);
router.get('/doctor', protect('doctor'), getDoctorAppointments);
router.get('/hospital', protect('hospital'), getHospitalAppointments);
router.post('/block-date', protect('any'), blockDoctorDate);
router.get('/:id', protect('any'), getAppointmentById);
router.get('/:id/queue', protect('any'), getQueuePreview);
router.post('/', protect('patient'), bookAppointment);
router.post('/offline', protect('any'), createOfflineAppointment);
router.patch('/:id/start', protect('any'), startAppointment);
router.patch('/:id/complete', protect('any'), completeAppointment);
router.patch('/:id/cancel', protect('any'), cancelAppointment);
router.patch('/:id/notify', protect('any'), notifyParticipant);
router.patch('/:id/join', protect('any'), markParticipantJoined);
router.post('/:id/feedback', protect('patient'), submitFeedback);

module.exports = router;
