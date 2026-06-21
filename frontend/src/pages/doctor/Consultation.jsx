import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, Avatar } from '../../components/common';
import { 
  Activity, ClipboardList, PlusCircle, Trash2, Calendar, 
  Clock, Heart, Thermometer, User, FileText, ChevronLeft, Plus, CheckCircle2, Download, Users,
  Mic, MicOff, Video, VideoOff, PhoneOff, Send, MessageSquare, AlertCircle
} from 'lucide-react';
import doctorService from '../../services/doctorService';
import { generatePrescriptionPDF } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';
import useConsultationStore from '../../store/consultationStore';

const calculateAge = (dobString) => {
  if (!dobString) return 'N/A';
  const dob = new Date(dobString);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const EMPTY_ARRAY = [];

const getLocalDateString = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: get the session (schedule) that a given appointment belongs to
const getAppointmentSession = (app, todaySchedules) => {
  const startDatetime = app.slot_id?.start_datetime || app.start_datetime;
  if (!startDatetime) return null;
  const startTime = new Date(startDatetime);
  const slotMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  return todaySchedules.find(s => {
    if (!s.start_time || !s.end_time) return false;
    const [sH, sM] = s.start_time.split(':').map(Number);
    const [eH, eM] = s.end_time.split(':').map(Number);
    return slotMinutes >= sH * 60 + sM && slotMinutes < eH * 60 + eM;
  }) || null;
};

const isAppointmentStartable = (app, appointmentsList, schedulesList = []) => {
  if (!app) return true;

  const appIdStr = (app._id || app.id || '').toString();
  const nowTime = new Date();
  const today = getLocalDateString(nowTime);

  const startDatetime = app.slot_id?.start_datetime || app.start_datetime;
  if (!startDatetime) return true;

  const startTime = new Date(startDatetime);
  const appType = app.consultation_type;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDayOfWeek = days[nowTime.getDay()];

  const todaySchedules = (schedulesList || []).filter(s =>
    s.consultation_type === appType && (s.custom_date === today || s.day_of_week === todayDayOfWeek)
  );

  const appointmentSession = getAppointmentSession(app, todaySchedules);

  let availabilityEndTime = null;
  if (todaySchedules.length > 0) {
    const endTimes = todaySchedules.map(s => {
      if (!s.end_time) return null;
      const [endH, endM] = s.end_time.split(':').map(Number);
      const dt = new Date(nowTime);
      dt.setHours(endH, endM, 0, 0);
      return dt;
    }).filter(Boolean);
    if (endTimes.length > 0) availabilityEndTime = new Date(Math.max(...endTimes));
  }
  if (!availabilityEndTime) {
    const getEndDatetime = (a) => {
      if (a.slot_id?.end_datetime) return new Date(a.slot_id.end_datetime);
      if (a.end_datetime) return new Date(a.end_datetime);
      const start = a.slot_id?.start_datetime || a.start_datetime;
      if (start) return new Date(new Date(start).getTime() + 15 * 60 * 1000);
      return null;
    };
    const todaySlots = appointmentsList
      .filter(a => {
        const aStart = a.slot_id?.start_datetime || a.start_datetime;
        return aStart && getLocalDateString(aStart) === today && a.consultation_type === appType;
      })
      .map(a => getEndDatetime(a)).filter(Boolean);
    availabilityEndTime = todaySlots.length > 0 ? new Date(Math.max(...todaySlots)) : null;
  }

  if (app.status === 'no_show') {
    const appDate = getLocalDateString(startTime);
    let sessionEndTime = null;
    let allOtherFinished = true;
    if (appointmentSession) {
      const [eH, eM] = appointmentSession.end_time.split(':').map(Number);
      sessionEndTime = new Date(startTime);
      sessionEndTime.setHours(eH, eM, 0, 0);
      const [sH, sM] = appointmentSession.start_time.split(':').map(Number);
      const sMin = sH * 60 + sM;
      const eMin = eH * 60 + eM;
      const sameSessionApps = appointmentsList.filter(a => {
        const aStart = a.slot_id?.start_datetime || a.start_datetime;
        if (!aStart || getLocalDateString(aStart) !== appDate || a.consultation_type !== appType) return false;
        const aMin = new Date(aStart).getHours() * 60 + new Date(aStart).getMinutes();
        return aMin >= sMin && aMin < eMin;
      });
      allOtherFinished = sameSessionApps.every(a =>
        (a._id || a.id || '').toString() === appIdStr || ['completed', 'cancelled', 'no_show'].includes(a.status)
      );
    }
    if (sessionEndTime && nowTime > sessionEndTime && allOtherFinished) return false;
    if (availabilityEndTime && nowTime > availabilityEndTime) return false;
    return true;
  }

  const appDate = getLocalDateString(startTime);
  if (appDate !== today) return false;

  let sameSessionApps;
  if (appointmentSession) {
    const [sH, sM] = appointmentSession.start_time.split(':').map(Number);
    const [eH, eM] = appointmentSession.end_time.split(':').map(Number);
    const sMin = sH * 60 + sM;
    const eMin = eH * 60 + eM;
    sameSessionApps = appointmentsList
      .filter(a => {
        const aStart = a.slot_id?.start_datetime || a.start_datetime;
        if (!aStart || getLocalDateString(aStart) !== today || a.consultation_type !== appType) return false;
        const aMin = new Date(aStart).getHours() * 60 + new Date(aStart).getMinutes();
        return aMin >= sMin && aMin < eMin;
      })
      .sort((a, b) => new Date(a.slot_id?.start_datetime || a.start_datetime) - new Date(b.slot_id?.start_datetime || b.start_datetime));
  } else {
    sameSessionApps = appointmentsList
      .filter(a => {
        const aStart = a.slot_id?.start_datetime || a.start_datetime;
        return aStart && getLocalDateString(aStart) === today && a.consultation_type === appType;
      })
      .sort((a, b) => new Date(a.slot_id?.start_datetime || a.start_datetime) - new Date(b.slot_id?.start_datetime || b.start_datetime));
  }

  const appIdx = sameSessionApps.findIndex(a => (a._id || a.id || '').toString() === appIdStr);
  if (appIdx === -1) return false;

  if (appIdx === 0) {
    // On the Consultation page, first patient is always allowed to start (they're already in a session)
    return true;
  }

  return sameSessionApps.slice(0, appIdx).every(a => ['completed', 'cancelled', 'no_show'].includes(a.status));
};

const DoctorConsultationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appointment, setAppointment] = useState(null);

  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: '',
    notes: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '', instruction: '' }]
  });
  const [consultationNotes, setConsultationNotes] = useState('');

  // Standard and Custom Vitals State
  const [vitalsForm, setVitalsForm] = useState({
    bp: '',
    pulse: '',
    temperature: '',
    weight: '',
  });
  const [customVitals, setCustomVitals] = useState([]);
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [nextPatient, setNextPatient] = useState(null);
  const [queue, setQueue] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [now, setNow] = useState(new Date());

  // Online consultation room state & sync
  const isOnline = appointment?.consultation_type === 'online';
  const { getSession, sendMessage } = useConsultationStore();
  const activeSessionData = useConsultationStore(s => s.sessions.find(x => x.id === id));
  const messages = activeSessionData?.messages || EMPTY_ARRAY;
  const chatBottomRef = useRef(null);
  const localVideoRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [camError, setCamError] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    if (isOnline && appointment) {
      const existing = useConsultationStore.getState().sessions.find(s => s.id === id);
      if (!existing) {
        useConsultationStore.setState(state => ({
          sessions: [
            ...state.sessions,
            {
              id: id,
              patientName: appointment.patient_snapshot?.name || 'Patient',
              patientInitials: appointment.patient_snapshot?.name ? appointment.patient_snapshot.name.split(' ').map(n => n[0]).join('') : 'P',
              doctorName: 'Doctor',
              doctorInitials: 'D',
              type: 'video',
              status: 'active',
              messages: []
            }
          ]
        }));
      }
    }
  }, [isOnline, appointment, id]);

  useEffect(() => {
    if (!isOnline) return;
    let localStream = null;
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStream = mediaStream;
        setStream(mediaStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setCamError('Camera/Microphone permission denied. Please allow access and reload.');
      }
    };
    startCamera();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isOnline]);

  useEffect(() => {
    if (isOnline) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOnline]);

  const toggleMic = () => {
    stream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicOn(p => !p);
  };

  const toggleCam = () => {
    stream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOn(p => !p);
  };

  const handleSend = () => {
    if (!chatInput.trim()) return;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Ensure session is initialized in the store if it's not already
    const existing = useConsultationStore.getState().sessions.find(s => s.id === id);
    if (!existing) {
      useConsultationStore.setState(state => ({
        sessions: [
          ...state.sessions,
          {
            id: id,
            patientName: appointment?.patient_snapshot?.name || 'Patient',
            patientInitials: appointment?.patient_snapshot?.name ? appointment.patient_snapshot.name.split(' ').map(n => n[0]).join('') : 'P',
            doctorName: 'Doctor',
            doctorInitials: 'D',
            type: 'video',
            status: 'active',
            messages: []
          }
        ]
      }));
    }

    sendMessage(id, {
      role: 'doctor',
      text: chatInput.trim(),
      time: nowStr,
    });
    setChatInput('');
  };

  // Refresh current time every 30 seconds so start consultation checks are updated
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchAppointmentDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      setShowSuccess(false);
      const [data, scheduleData] = await Promise.all([
        doctorService.getAppointmentById(id),
        doctorService.getSchedules()
      ]);
      setAppointment(data);
      // Handle both { doctor, schedules } and plain array responses
      const parsedSchedules = scheduleData?.schedules && Array.isArray(scheduleData.schedules)
        ? scheduleData.schedules
        : Array.isArray(scheduleData) ? scheduleData : [];
      setSchedules(parsedSchedules);
      
      // Pre-fill prescription
      if (data.prescription) {
        setPrescriptionForm({
          diagnosis: data.prescription.diagnosis || '',
          notes: data.prescription.notes || '',
          medicines: data.prescription.medicines?.length > 0 
            ? data.prescription.medicines.map(m => ({
                name: m.name || '',
                dosage: m.dosage || '',
                frequency: m.frequency || '',
                duration: m.duration || '',
                instruction: m.instruction || ''
              }))
            : [{ name: '', dosage: '', frequency: '', duration: '', instruction: '' }]
        });
      } else {
        setPrescriptionForm({
          diagnosis: '',
          notes: '',
          medicines: [{ name: '', dosage: '', frequency: '', duration: '', instruction: '' }]
        });
      }
      if (data.consultation_notes) {
        setConsultationNotes(data.consultation_notes);
      } else {
        setConsultationNotes('');
      }
      
      // Pre-fill vitals
      if (data.vitals) {
        setVitalsForm({
          bp: data.vitals.bp || '',
          pulse: data.vitals.pulse || '',
          temperature: data.vitals.temperature || '',
          weight: data.vitals.weight || '',
        });
      } else {
        setVitalsForm({
          bp: '',
          pulse: '',
          temperature: '',
          weight: '',
        });
      }
      if (data.custom_vitals) {
        setCustomVitals(data.custom_vitals.map(cv => ({
          name: cv.name || '',
          value: cv.value || ''
        })));
      } else {
        setCustomVitals([]);
      }

      // Fetch queue preview to find next patient
      try {
        const queueData = await doctorService.getQueuePreview(id);
        const q = queueData.queue || [];
        const activeType = data.consultation_type;

        // Determine session boundaries for the current appointment
        const apptStart = data.slot_id?.start_datetime || data.start_datetime;
        let sessionFilteredQ = q.filter(item => item.consultation_type === activeType);

        if (apptStart && parsedSchedules.length > 0) {
          const apptTime = new Date(apptStart);
          const apptMin = apptTime.getHours() * 60 + apptTime.getMinutes();
          const today = `${apptTime.getFullYear()}-${String(apptTime.getMonth()+1).padStart(2,'0')}-${String(apptTime.getDate()).padStart(2,'0')}`;
          const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
          const dayOfWeek = DAYS[apptTime.getDay()];

          const matchingSchedule = parsedSchedules.find(s => {
            if (s.consultation_type !== activeType) return false;
            if (s.custom_date !== today && s.day_of_week !== dayOfWeek) return false;
            if (!s.start_time || !s.end_time) return false;
            const [sH, sM] = s.start_time.split(':').map(Number);
            const [eH, eM] = s.end_time.split(':').map(Number);
            return apptMin >= sH * 60 + sM && apptMin < eH * 60 + eM;
          });

          if (matchingSchedule) {
            const [sH, sM] = matchingSchedule.start_time.split(':').map(Number);
            const [eH, eM] = matchingSchedule.end_time.split(':').map(Number);
            const sMin = sH * 60 + sM;
            const eMin = eH * 60 + eM;
            sessionFilteredQ = sessionFilteredQ.filter(item => {
              if (!item.start_datetime) return false;
              const t = new Date(item.start_datetime);
              const tMin = t.getHours() * 60 + t.getMinutes();
              return tMin >= sMin && tMin < eMin;
            });
          }
        }

        setQueue(sessionFilteredQ);
        const currentIdx = sessionFilteredQ.findIndex(item => item.id.toString() === id.toString());
        if (currentIdx !== -1) {
          const nextBooked = sessionFilteredQ.find((item, index) => index > currentIdx && item.status === 'booked');
          setNextPatient(nextBooked || null);
        } else {
          setNextPatient(sessionFilteredQ.find(item => item.status === 'booked') || null);
        }
      } catch (queueError) {
        console.error('Failed to load queue preview:', queueError);
      }
    } catch (error) {
      toast.error('Failed to load appointment details');
      navigate('/doctor/appointments');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [fetchAppointmentDetails]);

  const isReadOnly = appointment?.status === 'completed' || appointment?.status === 'no_show' || appointment?.status === 'booked';

  const addMedicine = () => {
    if (isReadOnly) return;
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', frequency: '', duration: '', instruction: '' }]
    }));
  };

  const updateMedicine = (index, field, value) => {
    if (isReadOnly) return;
    const updatedMedicines = [...prescriptionForm.medicines];
    updatedMedicines[index][field] = value;
    setPrescriptionForm(prev => ({ ...prev, medicines: updatedMedicines }));
  };

  const removeMedicine = (index) => {
    if (isReadOnly) return;
    if (prescriptionForm.medicines.length > 1) {
      const updatedMedicines = prescriptionForm.medicines.filter((_, i) => i !== index);
      setPrescriptionForm(prev => ({ ...prev, medicines: updatedMedicines }));
    }
  };

  const addCustomVital = () => {
    if (isReadOnly) return;
    if (customVitals.length >= 10) {
      toast.error('A maximum of 10 custom vital fields is allowed');
      return;
    }
    setCustomVitals([...customVitals, { name: '', value: '' }]);
  };

  const updateCustomVital = (index, field, value) => {
    if (isReadOnly) return;
    const updated = [...customVitals];
    updated[index][field] = value;
    setCustomVitals(updated);
  };

  const removeCustomVital = (index) => {
    if (isReadOnly) return;
    setCustomVitals(customVitals.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isReadOnly) return;

    if (!prescriptionForm.diagnosis.trim()) {
      toast.error('Please enter a diagnosis');
      return;
    }

    // Standard vitals validation
    const { bp, pulse, temperature, weight } = vitalsForm;
    if (bp && bp.length > 50) return toast.error('Blood pressure must be under 50 characters');
    if (pulse && pulse.length > 50) return toast.error('Pulse must be under 50 characters');
    if (temperature && temperature.length > 50) return toast.error('Temperature must be under 50 characters');
    if (weight && weight.length > 50) return toast.error('Weight must be under 50 characters');

    // Custom vitals validation
    if (customVitals.length > 10) {
      toast.error('A maximum of 10 custom vital fields is allowed');
      return;
    }
    for (const cv of customVitals) {
      if (!cv.name.trim() || !cv.value.trim()) {
        toast.error('Custom vital names and values cannot be empty');
        return;
      }
      if (cv.name.length > 50 || cv.value.length > 50) {
        toast.error('Custom vital names and values must be under 50 characters');
        return;
      }
    }

    try {
      setSubmitting(true);
      await doctorService.completeAppointment(id, {
        prescription: prescriptionForm,
        consultation_notes: consultationNotes,
        vitals: vitalsForm,
        custom_vitals: customVitals
      });
      toast.success('Consultation completed and prescription saved!');
      setShowSuccess(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete consultation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartNextConsultation = async () => {
    if (!nextPatient) return;
    try {
      toast.loading('Starting next consultation...', { id: 'start-next-toast' });
      await doctorService.startAppointment(nextPatient.id);
      toast.success('Next consultation started!', { id: 'start-next-toast' });
      navigate(`/doctor/appointments/${nextPatient.id}/consult`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start next consultation', { id: 'start-next-toast' });
    }
  };

  const handleSelectQueuePatient = async (item) => {
    const proceedNavigation = () => {
      navigate(`/doctor/appointments/${item.id}/consult`);
    };

    if (appointment?.status === 'consulting' && item.id.toString() !== id.toString()) {
      toast((t) => (
        <div className="flex flex-col gap-3 p-1 font-body text-left">
          <p className="text-sm font-bold text-navy leading-normal">
            Are you sure you want to view <span className="text-[#0D9488] font-black">{item.patient_name}</span>? The current active consultation session will remain unsaved.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                proceedNavigation();
              }}
              className="px-4 py-2 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer"
            >
              Yes, Proceed
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 bg-gray-100 text-navy hover:bg-gray-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ), {
        duration: 8000,
        position: 'top-center',
        style: {
          borderRadius: '24px',
          background: '#fff',
          color: '#0C1A2E',
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 25px -5px rgb(12 26 46 / 0.1), 0 8px 10px -6px rgb(12 26 46 / 0.1)',
          maxWidth: '400px',
        }
      });
    } else {
      proceedNavigation();
    }
  };

  const handleRestartConsultation = async () => {
    try {
      toast.loading('Restarting consultation...', { id: 'restart-action' });
      await doctorService.startAppointment(id);
      toast.success('Consultation restarted!', { id: 'restart-action' });
      
      const data = await doctorService.getAppointmentById(id);
      setAppointment(data);
      
      if (data.prescription) {
        setPrescriptionForm({
          diagnosis: data.prescription.diagnosis || '',
          notes: data.prescription.notes || '',
          medicines: data.prescription.medicines?.length > 0 
            ? data.prescription.medicines.map(m => ({
                name: m.name || '',
                dosage: m.dosage || '',
                frequency: m.frequency || '',
                duration: m.duration || '',
                instruction: m.instruction || ''
              }))
            : [{ name: '', dosage: '', frequency: '', duration: '', instruction: '' }]
        });
      } else {
        setPrescriptionForm({
          diagnosis: '',
          notes: '',
          medicines: [{ name: '', dosage: '', frequency: '', duration: '', instruction: '' }]
        });
      }
      if (data.consultation_notes) {
        setConsultationNotes(data.consultation_notes);
      } else {
        setConsultationNotes('');
      }
      
      if (data.vitals) {
        setVitalsForm({
          bp: data.vitals.bp || '',
          pulse: data.vitals.pulse || '',
          temperature: data.vitals.temperature || '',
          weight: data.vitals.weight || '',
        });
      } else {
        setVitalsForm({
          bp: '',
          pulse: '',
          temperature: '',
          weight: '',
        });
      }
      if (data.custom_vitals) {
        setCustomVitals(data.custom_vitals.map(cv => ({
          name: cv.name || '',
          value: cv.value || ''
        })));
      } else {
        setCustomVitals([]);
      }

      try {
        const queueData = await doctorService.getQueuePreview(id);
        const q = queueData.queue || [];
        const activeType = data.consultation_type;
        const filteredQ = q.filter(item => item.consultation_type === activeType);
        setQueue(filteredQ);
        const currentIdx = filteredQ.findIndex(item => item.id.toString() === id.toString());
        if (currentIdx !== -1) {
          const nextBooked = filteredQ.find((item, index) => index > currentIdx && item.status === 'booked');
          setNextPatient(nextBooked || null);
        } else {
          const nextBooked = filteredQ.find(item => item.status === 'booked');
          setNextPatient(nextBooked || null);
        }
      } catch (queueError) {
        console.error('Failed to load queue preview:', queueError);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restart consultation', { id: 'restart-action' });
    }
  };

  const handleMarkNoShowSidebar = async (itemId, patientName, e) => {
    e.stopPropagation();

    const proceedNoShow = async () => {
      // Optimistically update the status to no-show state on the spot for sidebar patients
      setQueue(prev => prev.map(item => item.id.toString() === itemId.toString() ? { ...item, status: 'no_show' } : item));

      try {
        toast.loading('Marking patient as no-show...', { id: 'no-show-sidebar' });
        await doctorService.noShowAppointment(itemId);
        toast.success(`${patientName} marked as no-show`, { id: 'no-show-sidebar' });
        
        // Update queue preview in state
        const queueData = await doctorService.getQueuePreview(id);
        const q = queueData.queue || [];
        const activeType = appointment?.consultation_type;
        const filteredQ = q.filter(item => item.consultation_type === activeType);
        setQueue(filteredQ);
        
        // Update next patient if needed
        const currentIdx = filteredQ.findIndex(item => item.id.toString() === id.toString());
        if (currentIdx !== -1) {
          const nextBooked = filteredQ.find((item, index) => index > currentIdx && item.status === 'booked');
          setNextPatient(nextBooked || null);
        } else {
          const nextBooked = filteredQ.find(item => item.status === 'booked');
          setNextPatient(nextBooked || null);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to update status', { id: 'no-show-sidebar' });
      }
    };

    toast((t) => (
      <div className="flex flex-col gap-3 p-1 font-body text-left">
        <p className="text-sm font-bold text-navy leading-normal">
          Are you sure you want to mark <span className="text-[#0D9488] font-black">{patientName}</span> as No-Show?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              proceedNoShow();
            }}
            className="px-4 py-2 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer"
          >
            Yes, Proceed
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-gray-100 text-navy hover:bg-gray-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 8000,
      position: 'top-center',
      style: {
        borderRadius: '24px',
        background: '#fff',
        color: '#0C1A2E',
        border: '1px solid #E2E8F0',
        boxShadow: '0 20px 25px -5px rgb(12 26 46 / 0.1), 0 8px 10px -6px rgb(12 26 46 / 0.1)',
        maxWidth: '400px',
      }
    });
  };

  const handleMarkActiveNoShow = async () => {
    const proceedNoShow = async () => {
      try {
        toast.loading('Marking patient as no-show...', { id: 'no-show-action' });
        await doctorService.noShowAppointment(id);
        toast.success('Patient marked as no-show', { id: 'no-show-action' });
        
        // Refresh details to update state and header buttons
        await fetchAppointmentDetails();

        // Find next booked patient in queue
        const queueData = await doctorService.getQueuePreview(id);
        const q = queueData.queue || [];
        const activeType = appointment?.consultation_type;
        const filteredQ = q.filter(item => item.consultation_type === activeType);
        setQueue(filteredQ);
        const nextBooked = filteredQ.find(item => item.status === 'booked' && item.id !== id);
        if (nextBooked) {
          toast((t) => (
            <div className="flex flex-col gap-3 p-1 font-body text-left">
              <p className="text-sm font-bold text-navy leading-normal">
                Would you like to start the consultation for the next patient: <span className="text-[#0D9488] font-black">{nextBooked.patient_name}</span>?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={async () => {
                    toast.dismiss(t.id);
                    try {
                      toast.loading('Starting next consultation...', { id: 'start-next-action' });
                      await doctorService.startAppointment(nextBooked.id);
                      toast.success('Consultation started!', { id: 'start-next-action' });
                      navigate(`/doctor/appointments/${nextBooked.id}/consult`);
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to start next consultation', { id: 'start-next-action' });
                    }
                  }}
                  className="px-4 py-2 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer"
                >
                  Yes
                </button>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                  }}
                  className="px-4 py-2 bg-gray-100 text-navy hover:bg-gray-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer"
                >
                  No
                </button>
              </div>
            </div>
          ), {
            duration: 10000,
            position: 'top-center',
            style: {
              borderRadius: '24px',
              background: '#fff',
              color: '#0C1A2E',
              border: '1px solid #E2E8F0',
              boxShadow: '0 20px 25px -5px rgb(12 26 46 / 0.1), 0 8px 10px -6px rgb(12 26 46 / 0.1)',
              maxWidth: '400px',
            }
          });
        } else {
          toast.success('No more patients in queue today.');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to mark patient as no-show', { id: 'no-show-action' });
      }
    };

    toast((t) => (
      <div className="flex flex-col gap-3 p-1 font-body text-left">
        <p className="text-sm font-bold text-navy leading-normal">
          Are you sure you want to mark the current patient as No-Show?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              proceedNoShow();
            }}
            className="px-4 py-2 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer"
          >
            Yes, Proceed
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-gray-100 text-navy hover:bg-gray-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 8000,
      position: 'top-center',
      style: {
        borderRadius: '24px',
        background: '#fff',
        color: '#0C1A2E',
        border: '1px solid #E2E8F0',
        boxShadow: '0 20px 25px -5px rgb(12 26 46 / 0.1), 0 8px 10px -6px rgb(12 26 46 / 0.1)',
        maxWidth: '400px',
      }
    });
  };

  const handleStartNextPatient = async () => {
    const nextBooked = queue.find(item => item.status === 'booked');
    if (!nextBooked) {
      toast.error("No booked patients left in today's queue.");
      return;
    }

    const proceedStart = async () => {
      try {
        toast.loading('Starting next consultation...', { id: 'start-next-action' });
        await doctorService.startAppointment(nextBooked.id);
        toast.success('Consultation started!', { id: 'start-next-action' });
        navigate(`/doctor/appointments/${nextBooked.id}/consult`);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to start next consultation', { id: 'start-next-action' });
      }
    };

    if (appointment?.status === 'consulting') {
      toast((t) => (
        <div className="flex flex-col gap-3 p-1 font-body text-left">
          <p className="text-sm font-bold text-navy leading-normal">
            Are you sure you want to start consultation for <span className="text-[#0D9488] font-black">{nextBooked.patient_name}</span>? The current consultation will remain unsaved.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                proceedStart();
              }}
              className="px-4 py-2 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer"
            >
              Yes, Proceed
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 bg-gray-100 text-navy hover:bg-gray-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ), {
        duration: 8000,
        position: 'top-center',
        style: {
          borderRadius: '24px',
          background: '#fff',
          color: '#0C1A2E',
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 25px -5px rgb(12 26 46 / 0.1), 0 8px 10px -6px rgb(12 26 46 / 0.1)',
          maxWidth: '400px',
        }
      });
    } else {
      proceedStart();
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Active Consultation" role="doctor">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0D9488]" />
        </div>
      </DashboardLayout>
    );
  }

  const patient = appointment?.patient_id;
  const snapshot = appointment?.patient_snapshot;
  const patientName = patient?.name || snapshot?.name || 'Walk-in Patient';
  const patientGender = patient?.gender || snapshot?.gender || 'N/A';
  const patientAge = patient?.dob ? calculateAge(patient.dob) : (snapshot?.age || 'N/A');
  const patientPhone = patient?.phone || snapshot?.phone || 'N/A';

  const appointmentTime = appointment?.slot_id?.start_datetime 
    ? new Date(appointment.slot_id.start_datetime).toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : 'N/A';

  const triggerDownloadPDF = () => {
    generatePrescriptionPDF({
      ...appointment,
      prescription: prescriptionForm,
      consultation_notes: consultationNotes,
      vitals: vitalsForm,
      custom_vitals: customVitals
    });
  };

  // SUCCESS SCREEN TEMPLATE
  if (showSuccess) {
    return (
      <DashboardLayout title="Consultation Completed" role="doctor">
        <div className="max-w-2xl mx-auto py-12 animate-in fade-in zoom-in duration-300">
          <Card className="p-10 bg-white border border-gray-100 shadow-xl rounded-[40px] text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0D9488]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            
            <div className="w-20 h-20 bg-[#0D9488]/10 text-[#0D9488] rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 size={42} />
            </div>

            <div className="space-y-2 relative z-10">
              <h2 className="text-3xl font-black text-navy uppercase tracking-tight">Consultation Completed!</h2>
              <p className="text-sm font-bold text-navy/55">Prescription and vitals for <span className="text-[#0D9488]">{patientName}</span> have been successfully saved.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10 pt-2">
              <Button
                onClick={triggerDownloadPDF}
                className="bg-navy text-white rounded-2xl py-4 px-8 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
              >
                <Download size={15} /> Download Prescription (PDF)
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/doctor/appointments')}
                className="border-gray-200 text-navy rounded-2xl py-4 px-8 font-black text-[11px] uppercase tracking-widest"
              >
                Return to Queue
              </Button>
            </div>

            {nextPatient ? (
              <div className="pt-8 border-t border-gray-150 space-y-6 text-left relative z-10">
                <div className="bg-teal-50/50 border border-teal-100 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar name={nextPatient.patient_name} className="ring-2 ring-teal-200 shadow-sm" />
                    <div>
                      <span className="text-[9px] font-black text-[#0D9488] uppercase tracking-wider block">Next Up in Queue</span>
                      <h4 className="text-base font-black text-navy">{nextPatient.patient_name}</h4>
                      <p className="text-xs text-navy/50 font-bold">Token T-{nextPatient.token_number} • {nextPatient.consultation_type}</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleStartNextConsultation}
                    className="bg-[#0D9488] hover:bg-[#0D9488]/90 text-white rounded-xl text-[10px] py-3 px-6 font-black uppercase tracking-widest shadow-md border-none self-start md:self-auto"
                  >
                    Start Consultation
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs font-bold text-navy/35 pt-4">No remaining patients in your queue for today.</p>
            )}
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isReadOnly ? "View Consultation Record" : "Clinical Consultation Room"} role="doctor">
      <div className="max-w-7xl mx-auto space-y-8 pb-20 font-body animate-in fade-in duration-500">
        
        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <button 
            type="button"
            onClick={() => navigate('/doctor/appointments')} 
            className="flex items-center gap-2 text-xs font-black text-navy/60 hover:text-navy uppercase tracking-widest transition-colors"
          >
            <ChevronLeft size={16} /> Back to Queue
          </button>
          
          <div className="flex items-center gap-3">
            {appointment?.status === 'completed' && (
              <Button
                type="button"
                onClick={triggerDownloadPDF}
                className="bg-navy text-white rounded-xl py-2.5 px-6 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border-none shadow-md"
              >
                <Download size={14} /> Download PDF
              </Button>
            )}
            {appointment?.status === 'no_show' && (
              <Button
                type="button"
                disabled={!isAppointmentStartable(appointment, queue, schedules)}
                onClick={handleRestartConsultation}
                className="bg-[#0D9488] hover:bg-[#0D9488]/90 text-white rounded-xl py-2.5 px-6 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border-none shadow-md disabled:bg-gray-200 disabled:text-navy/30 disabled:cursor-not-allowed"
              >
                Restart Consultation
              </Button>
            )}
            {appointment?.status === 'booked' && (
              <>
                <Button
                  type="button"
                  onClick={handleMarkActiveNoShow}
                  className="bg-amber-600 hover:bg-amber-700 text-white border-none rounded-xl py-2.5 px-6 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-md"
                >
                  Mark No-Show
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    const canStart = isAppointmentStartable(appointment, queue, schedules);
                    if (!canStart) {
                      toast.error('Please complete or mark the preceding consultation as no-show first');
                      return;
                    }
                    try {
                      toast.loading(`Starting consultation for ${appointment.patient_snapshot?.name || 'Patient'}...`, { id: 'start-consultation-header' });
                      await doctorService.startAppointment(id);
                      toast.success('Consultation started!', { id: 'start-consultation-header' });
                      fetchAppointmentDetails();
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to start consultation', { id: 'start-consultation-header' });
                    }
                  }}
                  className="bg-[#0D9488] hover:bg-[#0D9488]/90 text-white rounded-xl py-2.5 px-6 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border-none shadow-md"
                >
                  Start Consultation
                </Button>
              </>
            )}
            {!isReadOnly && (
              <>
                <Button
                  type="button"
                  onClick={handleMarkActiveNoShow}
                  className="bg-amber-600 hover:bg-amber-700 text-white border-none rounded-xl py-2.5 px-6 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-md"
                >
                  Mark No-Show
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="bg-[#0D9488] hover:bg-[#0D9488]/90 text-white rounded-xl py-2.5 px-6 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border-none shadow-md"
                >
                  <CheckCircle2 size={14} /> Save & End Call
                </Button>
              </>
            )}
            <Badge className={`${isReadOnly ? 'bg-slate-400 text-white' : 'bg-[#0D9488] text-white'} border-none text-[10px] px-6 py-2 font-black uppercase tracking-widest`}>
              {appointment?.status === 'no_show' 
                ? 'No-Show Record' 
                : appointment?.status === 'booked'
                ? 'Pending Session'
                : isReadOnly 
                ? 'Completed Record' 
                : 'Active Session'}
            </Badge>
          </div>
        </div>

        {/* 2-Column Console Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar: Daily Queue Preview (3/12 width) */}
          <div className="lg:col-span-3 space-y-4 sticky top-[100px]">
            <div className="bg-white border border-gray-150 rounded-[32px] p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-xs font-black text-navy uppercase tracking-widest flex items-center gap-2">
                  <Users size={16} className="text-[#0D9488]" /> Daily Queue ({queue.length})
                </h3>
                </div>
              
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {queue.length === 0 ? (
                  <p className="text-[10px] text-navy/40 italic text-center py-4">No patients in queue today.</p>
                ) : (
                  queue.map(item => {
                    const isActive = item.id.toString() === id.toString() && item.status === 'consulting';
                    const isOnline = item.consultation_type === 'online';
                    const timeStr = item.start_datetime 
                      ? new Date(item.start_datetime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
                      : 'N/A';
                      
                    let statusBadge = null;
                    let cardStyle = "border-gray-100 bg-white hover:border-gray-300";
                    
                    if (isActive) {
                      cardStyle = "border-[#0D9488] bg-teal-50/10 shadow-md ring-1 ring-[#0D9488]/10";
                      statusBadge = (
                        <Badge className="bg-[#0D9488] text-white border-none text-[8px] px-2 py-0.5 animate-pulse flex items-center gap-1 font-black">
                          <span className="w-1.5 h-1.5 rounded-full bg-white block animate-ping" /> ACTIVE
                        </Badge>
                      );
                    } else if (item.status === 'completed') {
                      cardStyle = "border-gray-200 bg-gray-50/50 opacity-70 hover:opacity-100";
                      statusBadge = (
                        <Badge className="bg-gray-100 text-navy/70 border-gray-300 text-[8px] px-2 py-0.5 font-bold">
                          COMPLETED
                        </Badge>
                      );
                    } else if (item.status === 'no_show') {
                      cardStyle = "border-amber-100 bg-amber-50/20 opacity-70 hover:opacity-100";
                      statusBadge = (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[8px] px-2 py-0.5 font-bold">
                          NO-SHOW
                        </Badge>
                      );
                    } else if (item.status === 'booked') {
                      cardStyle = "border-purple-100 bg-purple-50/10 hover:border-purple-300";
                      statusBadge = (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[8px] px-2 py-0.5 font-black">
                          BOOKED
                        </Badge>
                      );
                    }
                    
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectQueuePatient(item)}
                        className={`p-4 border rounded-2xl transition-all duration-300 cursor-pointer flex flex-col gap-2 relative group ${cardStyle}`}
                      >
                        {/* Header: Name, token, status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className={`text-xs font-black truncate ${isActive ? 'text-navy' : 'text-navy/80'}`}>
                              {item.patient_name}
                            </h4>
                            <p className="text-[9px] font-bold text-navy/40 uppercase tracking-wider mt-0.5">
                              Token T-{item.token_number} • {timeStr}
                            </p>
                          </div>
                          {statusBadge}
                        </div>
                        
                        {/* Footer row: Type, Action indicator */}
                        <div className="flex items-center justify-between border-t border-gray-50 pt-2 mt-1">
                          <span className={`text-[8px] font-black tracking-wider uppercase ${isOnline ? 'text-teal-600' : 'text-purple-600'}`}>
                            {isOnline ? 'Online' : 'Physical'}
                          </span>
                          
                          {['booked', 'no_show'].includes(item.status) && (
                            <div className="flex items-center gap-1.5">
                              {item.status === 'booked' && (
                                <button
                                  type="button"
                                  onClick={(e) => handleMarkNoShowSidebar(item.id, item.patient_name, e)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  title="Mark as No-Show"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                               {!isAppointmentStartable(item, queue, schedules) ? (
                                <span className="text-[8px] font-bold text-navy/20 uppercase tracking-widest" title="Starts soon">
                                  Locked
                                </span>
                              ) : (
                                <span className="text-[8px] font-black text-navy/40 uppercase tracking-widest group-hover:text-[#0D9488] transition-colors">
                                  Start →
                                </span>
                              )}
                            </div>
                          )}
                          
                          {item.status === 'completed' && (
                            <span className="text-[8px] font-bold text-navy/40 uppercase tracking-wider">
                              View Record
                            </span>
                          )}
                          
                          {isActive && (
                            <span className="text-[8px] font-black text-[#0D9488] uppercase tracking-wider">
                              Active Session
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Console Workspace Area (9/12 width) */}
          <div className="lg:col-span-9 space-y-8">
            
            {/* Patient Demographic Banner */}
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0D9488]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              
              <div className="flex items-center gap-6 relative z-10">
                <Avatar name={patientName} size="xl" className="ring-4 ring-gray-50 shadow-md" />
                <div>
                  <h2 className="text-2xl font-black text-navy uppercase tracking-tight mb-1">{patientName}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-left">
                    <Badge variant="outline" className="text-[10px] font-black border-gray-200">
                      {patientGender} • {patientAge} Years
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-black border-gray-200 text-red-500">
                      Blood: {patient?.bloodGroup || snapshot?.bloodGroup || 'N/A'}
                    </Badge>
                    <span className="text-xs text-navy/60 font-bold">Contact: {patientPhone}</span>
                    <span className="text-xs text-navy/60 font-bold">Address: {patient?.address || snapshot?.address || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 relative z-10">
                <div className="text-center bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
                  <span className="text-xs font-black text-navy/40 block uppercase tracking-wider mb-1">Time Slot</span>
                  <span className="text-sm font-black text-navy">{appointmentTime}</span>
                </div>
                <div className="text-center bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
                  <span className="text-xs font-black text-navy/40 block uppercase tracking-wider mb-1">Consultation</span>
                  <span className="text-sm font-black text-[#0D9488] uppercase tracking-widest">{appointment?.consultation_type}</span>
                </div>
              </div>
            </div>

            {/* If it's an online consultation, render the video feed and dialogue chat side-by-side above the clinical form */}
            {isOnline && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
                {/* Left Card: Webcam video feed */}
                <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-[32px] relative overflow-hidden flex flex-col h-[320px] bg-slate-50 justify-between">
                  <div className="pb-3 border-b border-gray-100 flex items-center justify-between text-left shrink-0">
                    <span className="text-[10px] font-black uppercase text-navy/40 tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Virtual Call Stream
                    </span>
                    <Badge className="bg-[#0D9488]/10 text-[#0D9488] border-none text-[8px] px-2 py-0.5 font-black uppercase tracking-widest">Active Call</Badge>
                  </div>
                  
                  {camError ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                      <AlertCircle size={32} className="text-red-500 mb-2 animate-bounce" />
                      <p className="text-navy/60 font-bold text-xs leading-normal">{camError}</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center relative my-2 bg-slate-100/50 rounded-2xl border border-gray-100/50 overflow-hidden">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0D9488]/20 to-[#0D9488]/5 flex items-center justify-center text-navy text-xl font-black shadow-md border-2 border-white">
                        {patientName ? patientName.split(' ').map(n => n[0]).join('') : 'P'}
                      </div>
                      <p className="absolute bottom-3 left-3 text-[10px] font-black text-navy/40 uppercase tracking-widest bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                        Patient Presence
                      </p>
                      
                      {/* Local PIP Video */}
                      <div className="absolute bottom-3 right-3 w-28 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-xl bg-white">
                        {camOn ? (
                          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100">
                            <VideoOff size={16} className="text-navy/10" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-4 pt-3 border-t border-gray-100 shrink-0">
                    <button
                      type="button"
                      onClick={toggleMic}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer ${micOn ? 'bg-slate-100 hover:bg-slate-200 text-navy' : 'bg-red-500 text-white shadow-md shadow-red-500/20'}`}
                      title={micOn ? "Mute Microphone" : "Unmute Microphone"}
                    >
                      {micOn ? <Mic size={16} /> : <MicOff size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={toggleCam}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer ${camOn ? 'bg-slate-100 hover:bg-slate-200 text-navy' : 'bg-red-500 text-white shadow-md shadow-red-500/20'}`}
                      title={camOn ? "Stop Camera" : "Start Camera"}
                    >
                      {camOn ? <Video size={16} /> : <VideoOff size={16} />}
                    </button>
                  </div>
                </Card>

                {/* Right Card: Dialogue Chat */}
                <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-[32px] flex flex-col h-[320px] justify-between">
                  <div className="pb-3 border-b border-gray-100 flex items-center justify-between text-left shrink-0">
                    <span className="text-[10px] font-black uppercase text-navy/40 tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-[#0D9488]" /> Session Dialogue
                    </span>
                    <Badge className="bg-[#0D9488]/10 text-[#0D9488] border-none text-[8px] px-2 py-0.5 font-black uppercase tracking-widest">Secure Room</Badge>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto py-3 space-y-3 max-h-[160px] my-2 pr-1 custom-scrollbar">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-30 mt-6">
                        <MessageSquare size={20} className="mb-1" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Awaiting Communication</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMine = msg.role === 'doctor';
                        return (
                          <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm text-xs font-bold leading-normal ${isMine ? 'bg-[#0D9488] text-white rounded-br-sm' : 'bg-slate-100 text-navy/80 rounded-bl-sm border border-gray-100'}`}>
                              <p className="break-words">{msg.text}</p>
                              <p className="text-[8px] font-black text-right mt-1 opacity-40">{msg.time}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100 shrink-0">
                    <input
                      type="text"
                      placeholder="Type message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      className="flex-1 bg-slate-100 border border-transparent rounded-xl px-4 py-3 text-navy text-xs font-bold outline-none focus:bg-white focus:border-[#0D9488]/20 transition-all placeholder:text-navy/25"
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      className="w-10 h-10 rounded-xl bg-[#0D9488] hover:bg-[#0f766e] flex items-center justify-center text-white shadow-md shadow-[#0D9488]/10 shrink-0 transition-transform active:scale-95 cursor-pointer"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </Card>
              </div>
            )}

            {/* Main Clinical Consultation Form */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* Left Form Column: Details & Vitals */}
              <div className="xl:col-span-4 space-y-6 text-left">
                
                {/* Reason for Visit Card */}
                <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-[32px]">
                  <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-[#0D9488]/10 flex items-center justify-center text-[#0D9488]">
                      <ClipboardList size={16} />
                    </div>
                    <h3 className="text-xs font-black text-navy uppercase tracking-widest">Chief Complaint</h3>
                  </div>
                  <p className="text-sm font-bold text-navy leading-relaxed">
                    {appointment?.reason || 'No description provided.'}
                  </p>
                </Card>

                {/* Vitals Input/Display Card */}
                <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-[32px]">
                  <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                      <Activity size={16} />
                    </div>
                    <h3 className="text-xs font-black text-navy uppercase tracking-widest">Patient Vitals</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* BP */}
                    <div className="bg-gray-50 border border-gray-100/50 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart size={12} className="text-red-500" />
                        <span className="text-navy/40 uppercase text-[8px] font-black tracking-widest">BP (mmHg)</span>
                      </div>
                      {isReadOnly ? (
                        <p className="text-sm font-black text-navy">{vitalsForm.bp || 'N/A'}</p>
                      ) : (
                        <input
                          type="text"
                          placeholder="e.g. 120/80"
                          value={vitalsForm.bp}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, bp: e.target.value })}
                          className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none"
                        />
                      )}
                    </div>

                    {/* Pulse */}
                    <div className="bg-gray-50 border border-gray-100/50 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity size={12} className="text-blue-500" />
                        <span className="text-navy/40 uppercase text-[8px] font-black tracking-widest">Pulse (bpm)</span>
                      </div>
                      {isReadOnly ? (
                        <p className="text-sm font-black text-navy">{vitalsForm.pulse || 'N/A'}</p>
                      ) : (
                        <input
                          type="text"
                          placeholder="e.g. 72"
                          value={vitalsForm.pulse}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })}
                          className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none"
                        />
                      )}
                    </div>

                    {/* Temperature */}
                    <div className="bg-gray-50 border border-gray-100/50 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Thermometer size={12} className="text-orange-500" />
                        <span className="text-navy/40 uppercase text-[8px] font-black tracking-widest">Temp (°F)</span>
                      </div>
                      {isReadOnly ? (
                        <p className="text-sm font-black text-navy">{vitalsForm.temperature || 'N/A'}</p>
                      ) : (
                        <input
                          type="text"
                          placeholder="e.g. 98.6"
                          value={vitalsForm.temperature}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                          className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none"
                        />
                      )}
                    </div>

                    {/* Weight */}
                    <div className="bg-gray-50 border border-gray-100/50 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User size={12} className="text-purple-500" />
                        <span className="text-navy/40 uppercase text-[8px] font-black tracking-widest">Weight (kg)</span>
                      </div>
                      {isReadOnly ? (
                        <p className="text-sm font-black text-navy">{vitalsForm.weight || 'N/A'}</p>
                      ) : (
                        <input
                          type="text"
                          placeholder="e.g. 70"
                          value={vitalsForm.weight}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                          className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none"
                        />
                      )}
                    </div>
                  </div>

                  {/* Dynamic Custom Vitals (Thyroid, Cholesterol, etc.) */}
                  <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-navy/70 uppercase tracking-widest">Other Bio-markers</span>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={addCustomVital}
                          className="text-[9px] font-black text-[#0D9488] hover:text-[#115E59] uppercase tracking-widest flex items-center gap-1 transition-colors"
                        >
                          <Plus size={10} /> Add Field
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {customVitals.map((cv, idx) => (
                        <div key={idx} className="flex gap-2 items-center relative group">
                          {isReadOnly ? (
                            <div className="flex-1 bg-gray-50 border border-gray-100/50 rounded-2xl p-3 text-left">
                              <span className="text-navy/40 uppercase text-[7px] font-black tracking-widest block">{cv.name}</span>
                              <span className="text-xs font-black text-navy">{cv.value}</span>
                            </div>
                          ) : (
                            <>
                              <input
                                type="text"
                                placeholder="e.g. Cholesterol"
                                value={cv.name}
                                onChange={(e) => updateCustomVital(idx, 'name', e.target.value)}
                                required
                                className="w-1/2 bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none"
                              />
                              <input
                                type="text"
                                placeholder="e.g. 190 mg/dL"
                                value={cv.value}
                                onChange={(e) => updateCustomVital(idx, 'value', e.target.value)}
                                required
                                className="w-1/2 bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-navy outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => removeCustomVital(idx)}
                                className="text-red-500 hover:text-red-700 p-1 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                      {customVitals.length === 0 && (
                        <p className="text-[10px] text-navy/35 italic text-center py-2">No custom bio-markers added.</p>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Form Column: Diagnosis & Rx Form */}
              <div className="xl:col-span-8 space-y-6 text-left">
                
                {/* Diagnosis & Notes Card */}
                <Card className="p-8 bg-white border border-gray-100 shadow-sm rounded-[40px]">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-black text-navy uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FileText size={16} className="text-[#0D9488]" /> Assessment & Notes
                      </h3>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-navy/55 uppercase tracking-widest pl-1">Primary Diagnosis *</label>
                          {isReadOnly ? (
                            <p className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-navy">{prescriptionForm.diagnosis}</p>
                          ) : (
                            <input 
                              type="text"
                              placeholder="e.g. Acute Gastritis, Viral Bronchitis"
                              value={prescriptionForm.diagnosis}
                              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
                              required
                              className="w-full px-5 py-4 bg-gray-50/70 border border-transparent focus:border-[#0D9488]/30 focus:bg-white rounded-2xl text-sm font-bold text-navy outline-none transition-all placeholder:text-navy/35"
                            />
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-navy/55 uppercase tracking-widest pl-1">Clinical Notes & lifestyle advice</label>
                          {isReadOnly ? (
                            <p className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-navy/70 leading-relaxed whitespace-pre-line">{consultationNotes || 'No notes provided.'}</p>
                          ) : (
                            <textarea
                              placeholder="Clinical observations, instructions, diagnostic tests to schedule, follow up plan..."
                              value={consultationNotes}
                              onChange={(e) => {
                                setConsultationNotes(e.target.value);
                                setPrescriptionForm(prev => ({ ...prev, notes: e.target.value }));
                              }}
                              rows={3}
                              className="w-full px-5 py-4 bg-gray-50/70 border border-transparent focus:border-[#0D9488]/30 focus:bg-white rounded-2xl text-sm font-bold text-navy outline-none transition-all placeholder:text-navy/35 resize-none"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Prescriptions Form Card */}
                <Card className="p-8 bg-white border border-gray-100 shadow-sm rounded-[40px]">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-navy uppercase tracking-widest flex items-center gap-2">
                        <PlusCircle size={16} className="text-[#0D9488]" /> Medication Schedule
                      </h3>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={addMedicine}
                          className="text-[10px] font-black text-[#0D9488] hover:text-[#115E59] uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                        >
                          <Plus size={12} /> Add Drug
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {prescriptionForm.medicines.map((med, idx) => (
                        <div 
                          key={idx} 
                          className="bg-gray-50 border border-gray-100/50 rounded-3xl p-5 space-y-4 relative group shadow-sm transition-all hover:border-[#0D9488]/20"
                        >
                          {!isReadOnly && prescriptionForm.medicines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMedicine(idx)}
                              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-md border border-gray-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            {/* Medicine Name */}
                            <div className="md:col-span-5 space-y-1">
                              <label className="text-[8px] font-black text-navy/35 uppercase tracking-widest pl-1">Drug Name</label>
                              {isReadOnly ? (
                                <p className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-navy">{med.name || '-'}</p>
                              ) : (
                                <input 
                                  type="text"
                                  placeholder="e.g. Amoxicillin 500mg"
                                  value={med.name}
                                  onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                                  required
                                  className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-navy outline-none"
                                />
                              )}
                            </div>

                            {/* Dosage */}
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-[8px] font-black text-navy/35 uppercase tracking-widest pl-1">Dosage</label>
                              {isReadOnly ? (
                                <p className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-navy">{med.dosage || '-'}</p>
                              ) : (
                                <input 
                                  type="text"
                                  placeholder="e.g. 1 Tab / 5ml"
                                  value={med.dosage}
                                  onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                                  required
                                  className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-navy outline-none"
                                />
                              )}
                            </div>

                            {/* Frequency */}
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-[8px] font-black text-navy/35 uppercase tracking-widest pl-1">Frequency</label>
                              {isReadOnly ? (
                                <p className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-navy">{med.frequency || '-'}</p>
                              ) : (
                                <input 
                                  type="text"
                                  placeholder="e.g. 1-0-1 (BD)"
                                  value={med.frequency}
                                  onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)}
                                  required
                                  className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-navy outline-none"
                                />
                              )}
                            </div>

                            {/* Duration */}
                            <div className="md:col-span-3 space-y-1">
                              <label className="text-[8px] font-black text-navy/35 uppercase tracking-widest pl-1">Duration</label>
                              {isReadOnly ? (
                                <p className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-navy">{med.duration || '-'}</p>
                              ) : (
                                <input 
                                  type="text"
                                  placeholder="e.g. 5 Days"
                                  value={med.duration}
                                  onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                                  required
                                  className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-navy outline-none"
                                />
                              )}
                            </div>
                          </div>

                          {/* Instructions */}
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-navy/35 uppercase tracking-widest pl-1">Instructions</label>
                            {isReadOnly ? (
                              <p className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-navy">{med.instruction || '-'}</p>
                            ) : (
                              <input 
                                type="text"
                                placeholder="e.g. Take after meals with warm water"
                                value={med.instruction}
                                onChange={(e) => updateMedicine(idx, 'instruction', e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-navy outline-none"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Form Action Buttons */}
                {(isReadOnly || appointment?.status === 'no_show') && (
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      {isReadOnly && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate('/doctor/appointments')}
                          className="rounded-2xl px-8 border-gray-200 uppercase tracking-widest font-black text-[10px] h-14"
                        >
                          Appointments List
                        </Button>
                      )}
                      {appointment?.status === 'no_show' && (
                        <Button
                          type="button"
                          disabled={!isAppointmentStartable(appointment, queue, schedules)}
                          onClick={handleRestartConsultation}
                          className="bg-[#0D9488] hover:bg-[#0D9488]/90 text-white rounded-2xl px-8 uppercase tracking-widest font-black text-[10px] h-14 border-none shadow-xl shadow-[#0D9488]/20 disabled:bg-gray-200 disabled:text-navy/30 disabled:cursor-not-allowed"
                        >
                          Restart Consultation
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorConsultationPage;
