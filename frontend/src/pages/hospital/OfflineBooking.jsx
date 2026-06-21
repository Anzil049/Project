import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, Avatar } from '../../components/common';
import { 
  User, Phone, Calendar, Hash, Mail,
  Stethoscope, ChevronRight, Activity,
  Printer, CheckCircle2, Clock, 
  Search, Users, AlertCircle, Plus, Sparkles
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import hospitalService from '../../services/hospitalService';
import doctorService from '../../services/doctorService';
import toast from 'react-hot-toast';


const getLocalDateString = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getSessionsFromSlots = (slots) => {
  const formatTimeStr = (timeStr) => {
    if (!timeStr) return '';
    const [hourStr, minuteStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minuteStr} ${ampm}`;
  };

  const sessionsList = [];
  const seen = new Set();
  for (const slot of slots) {
    if (slot.session_start_time && slot.session_end_time) {
      const key = `${slot.session_start_time}-${slot.session_end_time}`;
      if (!seen.has(key)) {
        seen.add(key);
        sessionsList.push({
          key,
          start: slot.session_start_time,
          end: slot.session_end_time,
          label: `${formatTimeStr(slot.session_start_time)} - ${formatTimeStr(slot.session_end_time)}`
        });
      }
    }
  }
  return sessionsList;
};

const HospitalOfflineBooking = ({ role = 'hospital' }) => {
  const { user } = useAuthStore();
  
  const [doctorsList, setDoctorsList] = useState([]);
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    email: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    address: '',
    doctorId: '',
    date: getLocalDateString(new Date()),
    reason: '',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isBookingClosed, setIsBookingClosed] = useState(false);

  const handleSearchPatient = async () => {
    if (!formData.email) {
      toast.error('Please enter an email address to search');
      return;
    }
    try {
      toast.loading('Searching patient database...', { id: 'search-patient' });
      let patientData;
      if (role === 'hospital') {
        patientData = await hospitalService.searchPatientByEmail(formData.email);
      } else {
        patientData = await doctorService.searchPatientByEmail(formData.email);
      }
      
      // Calculate age from dob if it exists
      let ageStr = '';
      if (patientData.dob) {
        const dob = new Date(patientData.dob);
        const diffMs = Date.now() - dob.getTime();
        const ageDate = new Date(diffMs);
        ageStr = String(Math.abs(ageDate.getUTCFullYear() - 1970));
      }

      setFormData(prev => ({
        ...prev,
        patientName: patientData.name || '',
        phone: patientData.phone || '',
        age: ageStr || prev.age,
        gender: patientData.gender || 'Male',
        bloodGroup: patientData.bloodGroup || 'O+',
        address: patientData.address || '',
      }));

      toast.success('Patient details found and autofilled!', { id: 'search-patient' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Patient not found in database. You can register them as a new patient.', { id: 'search-patient' });
    }
  };

  const handleToggleBooking = async () => {
    if (!formData.doctorId || !formData.date) return;
    const action = isBookingClosed ? 'open' : 'close';
    try {
      setLoading(true);
      await doctorService.toggleCloseBooking({
        doctor_id: formData.doctorId,
        date: formData.date,
        action,
        consultation_type: 'all'
      });
      toast.success(`Booking successfully ${action === 'close' ? 'closed/stopped' : 'reopened'}!`);
      await fetchSlotsAndQueue();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} booking`);
    } finally {
      setLoading(false);
    }
  };

  // 1. Fetch doctors on mount
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true);
        if (role === 'hospital') {
          const docs = await hospitalService.getDoctors();
          const activeDocs = docs.filter(d => d.user?.status === 'active');
          setDoctorsList(activeDocs);
          if (activeDocs.length > 0) {
            setFormData(prev => ({ ...prev, doctorId: activeDocs[0].id || activeDocs[0]._id }));
          }
        } else if (role === 'doctor') {
          const doc = user?.doctorProfile;
          if (doc) {
            const docData = {
              _id: doc._id,
              user: { name: user.name, image: user.image },
              specialization: doc.specialization,
            };
            setDoctorsList([docData]);
            setFormData(prev => ({ ...prev, doctorId: doc._id }));
          }
        }
      } catch (err) {
        console.error('Error loading doctors:', err);
        toast.error('Failed to load doctors list');
      } finally {
        setLoading(false);
      }
    };
    loadDoctors();
  }, [role, user]);

  // 2. Fetch slots and appointments when doctor or date changes
  const fetchSlotsAndQueue = async () => {
    if (!formData.doctorId) return;
    try {
      // Fetch slots
      const slotsData = await doctorService.getDoctorSlots(formData.doctorId, 'offline', false, true);
      const daySlots = slotsData.find(s => s.date === formData.date);
      const allTimes = daySlots ? daySlots.times : [];

      // Client-side guard: filter out slots whose end_datetime has already passed
      const now = new Date();
      const times = allTimes.filter(s => {
        const endTime = s.end_datetime ? new Date(s.end_datetime) : null;
        // If no end_datetime, assume 15-min duration from start
        const slotEnd = endTime || new Date(new Date(s.start_datetime).getTime() + 15 * 60 * 1000);
        return slotEnd > now;
      });

      setAvailableSlots(allTimes);
      setIsBookingClosed(daySlots ? !!daySlots.bookingClosed : false);

      // Compute unique sessions and set range list
      const computedSessions = getSessionsFromSlots(allTimes);
      setSessions(computedSessions);

      let currentSessionKey = selectedSession;
      if (!computedSessions.some(s => s.key === currentSessionKey)) {
        currentSessionKey = computedSessions[0]?.key || '';
        setSelectedSession(currentSessionKey);
      }

      // Filter slots for the selected session
      const slotsInSession = times.filter(s => {
        if (!currentSessionKey) return true;
        return `${s.session_start_time}-${s.session_end_time}` === currentSessionKey;
      });

      // Fetch appointments
      let apps = [];
      if (role === 'hospital') {
        const res = await hospitalService.getAppointments();
        apps = res.appointments || [];
      } else {
        apps = await doctorService.getAppointments();
      }

      // Filter for current doctor & selected date
      const filtered = apps.filter(app => {
        const appDocId = app.doctor_id?._id || app.doctor_id;
        const isSameDoctor = appDocId?.toString() === formData.doctorId.toString();
        if (!isSameDoctor || !app.slot_id) return false;

        const appDate = getLocalDateString(app.slot_id.start_datetime);
        return appDate === formData.date;
      });

      // Filter out cancelled bookings on slots that have since been booked/active
      const activeAndVisible = filtered.filter(app => {
        if (app.status !== 'cancelled') return true;
        const slotId = app.slot_id?._id || app.slot_id;
        const hasActiveBooking = filtered.some(other => {
          const otherSlotId = other.slot_id?._id || other.slot_id;
          return otherSlotId?.toString() === slotId?.toString() &&
                 ['booked', 'consulting', 'completed'].includes(other.status);
        });
        return !hasActiveBooking;
      });

      setAppointmentsList(activeAndVisible);

      // Auto-select next available slot in the selected session:
      // Only consider slots that haven't ended yet
      const nowTime = new Date().getTime();
      const availableNotExpired = slotsInSession.filter(
        s => s.status === 'available' && new Date(s.start_datetime).getTime() >= nowTime - 60000 // allow 1 min grace
      );

      // Prefer the first available slot after the latest active booking in this session
      const activeApps = activeAndVisible.filter(app => {
        if (app.status === 'cancelled' || !app.slot_id?.start_datetime) return false;
        if (currentSessionKey) {
          const appSlotStart = new Date(app.slot_id.start_datetime);
          const [sH, sM] = currentSessionKey.split('-')[0].split(':').map(Number);
          const [eH, eM] = currentSessionKey.split('-')[1].split(':').map(Number);
          const sMin = sH * 60 + sM;
          const eMin = eH * 60 + eM;
          const slotMin = appSlotStart.getHours() * 60 + appSlotStart.getMinutes();
          return slotMin >= sMin && slotMin < eMin;
        }
        return true;
      });

      let nextAvailableSlot = null;
      if (activeApps.length > 0) {
        const latestStart = activeApps.reduce((latest, app) => {
          const appTime = new Date(app.slot_id.start_datetime).getTime();
          return appTime > latest ? appTime : latest;
        }, 0);
        nextAvailableSlot = availableNotExpired.find(
          s => new Date(s.start_datetime).getTime() > latestStart
        );
      }

      // Fallback: first available non-expired slot
      if (!nextAvailableSlot) {
        nextAvailableSlot = availableNotExpired[0] || null;
      }

      setSelectedSlot(nextAvailableSlot || null);
    } catch (err) {
      console.error('Error loading slots/queue:', err);
    }
  };

  useEffect(() => {
    fetchSlotsAndQueue();
  }, [formData.doctorId, formData.date, selectedSession, role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.phone || !formData.email || !formData.age || !formData.bloodGroup || !formData.address) {
      toast.error('Please fill in all patient details (including email, blood group, and address)');
      return;
    }
    if (!selectedSlot) {
      toast.error('Please select an available time slot');
      return;
    }

    try {
      setSubmitting(true);
      const bookingPayload = {
        doctor_id: formData.doctorId,
        start_datetime: selectedSlot.start_datetime,
        patientName: formData.patientName,
        phone: formData.phone,
        email: formData.email,
        age: formData.age,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        address: formData.address,
        reason: formData.reason
      };

      if (role === 'hospital') {
        await hospitalService.createOfflineAppointment(bookingPayload);
      } else {
        await doctorService.createOfflineAppointment(bookingPayload);
      }

      setBookingSuccess(true);
      toast.success('Offline booking registered successfully!');
      
      // Reset input fields
      setFormData(prev => ({
        ...prev,
        patientName: '',
        phone: '',
        email: '',
        age: '',
        gender: 'Male',
        bloodGroup: 'O+',
        address: '',
        reason: ''
      }));
      setSelectedSlot(null);

      // Refetch
      await fetchSlotsAndQueue();

      setTimeout(() => setBookingSuccess(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create offline booking');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctor = doctorsList.find(d => (d.id || d._id)?.toString() === formData.doctorId?.toString());
  const selectedDoctorName = selectedDoctor?.user?.name || selectedDoctor?.name || 'Practitioner';

  // Sort queue by slot time to assign clean token numbers
  const sortedQueue = [...appointmentsList].sort((a, b) => {
    if (!a.slot_id || !b.slot_id) return 0;
    return new Date(a.slot_id.start_datetime) - new Date(b.slot_id.start_datetime);
  });

  // Filter queue by the selected session's time range
  const filteredQueue = sortedQueue.filter(app => {
    if (!selectedSession) return true;
    if (!app.slot_id?.start_datetime) return false;
    const appSlotStart = new Date(app.slot_id.start_datetime);
    const [sH, sM] = selectedSession.split('-')[0].split(':').map(Number);
    const [eH, eM] = selectedSession.split('-')[1].split(':').map(Number);
    const sMin = sH * 60 + sM;
    const eMin = eH * 60 + eM;
    const slotMin = appSlotStart.getHours() * 60 + appSlotStart.getMinutes();
    return slotMin >= sMin && slotMin < eMin;
  });

  return (
    <DashboardLayout title="Offline Walk-In Registration" role={role}>
      <div className="max-w-7xl mx-auto space-y-8 pb-20 font-body animate-in fade-in duration-500">
        
        {/* Page Header */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
             <h1 className="text-3xl font-heading font-black text-navy tracking-tight">Manual Walk-In Entry</h1>
             <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-[0.25em] flex items-center gap-2">
                <Plus size={14} /> Direct Receptionist Portal
             </p>
          </div>
          <div className="flex items-center gap-4 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
             <Calendar size={18} className="text-[#0D9488]" />
             <span className="text-xs font-black text-navy uppercase tracking-widest">
               {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
             </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7 space-y-6">
             <Card className="p-8 md:p-10 bg-white border border-gray-100 shadow-2xl shadow-navy/5 rounded-[48px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#0D9488]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                
                <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                   
                   {/* Doctor & Date Selection */}
                   <div className={`grid grid-cols-1 ${sessions.length > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-8`}>
                      {/* Doctor Selection (Only show if hospital) */}
                      {role === 'hospital' ? (
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.2em] ml-1">Assign Practitioner</label>
                           <div className="relative group">
                              <Stethoscope size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0D9488]" />
                              <select 
                                 value={formData.doctorId}
                                 onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                                 className="w-full pl-14 pr-12 py-5 bg-gray-50 border-none rounded-[24px] text-sm font-bold text-navy appearance-none outline-none focus:ring-2 focus:ring-[#0D9488]/10 transition-all cursor-pointer"
                              >
                                 {doctorsList.map(doc => (
                                   <option key={doc.id || doc._id} value={doc.id || doc._id}>
                                     {doc.user?.name || doc.name} ({doc.specialization})
                                   </option>
                                 ))}
                              </select>
                              <ChevronRight size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-navy/60 rotate-90" />
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.2em] ml-1">Practitioner Profile</label>
                           <div className="flex items-center gap-4 bg-gray-50 px-6 py-4 rounded-[24px]">
                             <Avatar src={selectedDoctor?.user?.image} name={selectedDoctorName} size="md" />
                             <div>
                               <p className="text-xs font-black text-navy leading-none mb-1">{selectedDoctorName}</p>
                               <p className="text-[9px] font-black text-[#0D9488] uppercase tracking-widest">{selectedDoctor?.specialization}</p>
                             </div>
                           </div>
                        </div>
                      )}

                      {/* Date Selection */}
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.2em] ml-1">Appointment Date</label>
                         <div className="relative group">
                            <Calendar size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0D9488]/70" />
                            <input 
                               type="date"
                               value={formData.date}
                               min={getLocalDateString(new Date())}
                               onChange={(e) => setFormData({...formData, date: e.target.value})}
                               className="w-full pl-14 pr-6 py-5 bg-gray-50 border-none rounded-[24px] text-sm font-bold text-navy outline-none focus:ring-2 focus:ring-[#0D9488]/10 transition-all"
                            />
                         </div>
                      </div>

                      {/* Session selection drop-down if there are multiple sessions */}
                      {sessions.length > 0 && (
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.2em] ml-1">Select Time Session</label>
                           <div className="relative group">
                              <Clock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0D9488]" />
                              <select 
                                 value={selectedSession}
                                 onChange={(e) => setSelectedSession(e.target.value)}
                                 className="w-full pl-14 pr-12 py-5 bg-gray-50 border-none rounded-[24px] text-sm font-bold text-navy appearance-none outline-none focus:ring-2 focus:ring-[#0D9488]/10 transition-all cursor-pointer"
                              >
                                 {sessions.map(s => (
                                   <option key={s.key} value={s.key}>
                                     {s.label}
                                   </option>
                                 ))}
                              </select>
                              <ChevronRight size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-navy/60 rotate-90" />
                           </div>
                        </div>
                      )}
                   </div>

                     {/* Token & Slot Allocation Info Card */}
                     <div className="space-y-3">
                        <div className="flex items-center justify-between ml-1">
                           <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.2em]">Token & Slot Allocation</label>
                           {formData.doctorId && formData.date && (
                              <button
                                 type="button"
                                 onClick={handleToggleBooking}
                                 className={`text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full transition-all border ${
                                    isBookingClosed
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                 }`}
                              >
                                 {isBookingClosed ? 'Open Booking' : 'Close Booking'}
                              </button>
                           )}
                        </div>
                        {isBookingClosed ? (
                          <div className="p-6 bg-red-50 text-red-700 border border-red-100/80 rounded-[24px] flex flex-col gap-2">
                             <div className="flex items-center gap-3">
                                <AlertCircle size={18} className="text-red-500" />
                                <span className="text-xs font-black uppercase tracking-wide">Booking Has Been Stopped</span>
                             </div>
                             <p className="text-[10px] font-medium text-red-600/70 leading-normal uppercase">
                                Registration has been closed manually by receptionist or provider. No slots can be booked.
                             </p>
                          </div>
                        ) : selectedSlot ? (() => {
                            // Filter slots to only include those in the same session range
                            const sessionSlots = availableSlots.filter(s => 
                              s.session_start_time === selectedSlot.session_start_time &&
                              s.session_end_time === selectedSlot.session_end_time
                            );
                            // Compute correct token: position of selectedSlot in session-specific sorted slot list
                            const allSortedSlots = [...sessionSlots].sort(
                              (a, b) => new Date(a.start_datetime) - new Date(b.start_datetime)
                            );
                            const slotPosition = allSortedSlots.findIndex(
                              s => new Date(s.start_datetime).getTime() === new Date(selectedSlot.start_datetime).getTime()
                            );
                            const nextToken = slotPosition !== -1 ? slotPosition + 1 : '?';
                            return (
                          <div className="bg-slate-50 border border-slate-100 p-6 rounded-[24px] space-y-4">
                             <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                                <span className="text-[9px] font-black text-[#0D9488] uppercase tracking-wider block">Next Token to Book</span>
                                <span className="text-xl font-black text-[#0D9488]">
                                   T-{nextToken}
                                </span>
                             </div>
                             <div className="flex items-center justify-between pt-2">
                                <span className="text-xs font-bold text-navy/60">Automatically Allocated Slot</span>
                                <span className="text-sm font-black text-navy bg-white border border-gray-150 px-4 py-2 rounded-xl shadow-sm">
                                   {selectedSlot.time}
                                </span>
                             </div>
                          </div>
                           );
                        })() : (
                          <div className="p-6 bg-red-50 text-red-700/80 rounded-[24px] flex items-center gap-3 border border-red-100/50">
                             <AlertCircle size={18} />
                             <span className="text-xs font-black uppercase tracking-wide">
                                {availableSlots.length === 0 
                                   ? "No slots available on this day." 
                                   : "No slots available in this range."
                                }
                             </span>
                          </div>
                        )}
                     </div>

                     <fieldset disabled={isBookingClosed} className="space-y-8 p-0 m-0 border-none">
                   {/* Patient Info Fields */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Patient Name */}
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.2em] ml-1">Patient Full Name *</label>
                         <div className="relative group">
                            <User size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0D9488]/70 group-focus-within:text-[#0D9488] transition-colors" />
                            <input 
                               type="text"
                               placeholder="Enter patient name"
                               value={formData.patientName}
                               onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                               required
                               className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border-2 border-transparent focus:border-[#0D9488]/20 focus:bg-white rounded-[24px] text-sm font-bold text-navy outline-none transition-all placeholder:text-navy/40"
                            />
                         </div>
                      </div>

                      {/* Email Address */}
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.2em] ml-1">Patient Email Address *</label>
                         <div className="relative group">
                            <Mail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0D9488]/70 group-focus-within:text-[#0D9488] transition-colors" />
                            <input 
                               type="email"
                               placeholder="e.g. patient@example.com"
                               value={formData.email}
                               onChange={(e) => setFormData({...formData, email: e.target.value})}
                               required
                               className="w-full pl-14 pr-32 py-5 bg-gray-50/50 border-2 border-transparent focus:border-[#0D9488]/20 focus:bg-white rounded-[24px] text-sm font-bold text-navy outline-none transition-all placeholder:text-navy/40"
                            />
                            <button
                               type="button"
                               onClick={handleSearchPatient}
                               className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2.5 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white rounded-xl text-[10px] font-black uppercase tracking-wider border-none cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
                            >
                               <Search size={12} /> Search
                            </button>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Phone Number */}
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.2em] ml-1">Contact Phone *</label>
                         <div className="relative group">
                            <Phone size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0D9488]/70 group-focus-within:text-[#0D9488] transition-colors" />
                            <input 
                               type="tel"
                               placeholder="e.g. +91 9999999999"
                               value={formData.phone}
                               onChange={(e) => setFormData({...formData, phone: e.target.value})}
                               required
                               className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border-2 border-transparent focus:border-[#0D9488]/20 focus:bg-white rounded-[24px] text-sm font-bold text-navy outline-none transition-all placeholder:text-navy/40"
                            />
                         </div>
                      </div>

                      {/* Patient Age */}
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.2em] ml-1">Patient Age (Years) *</label>
                         <div className="relative group">
                            <Hash size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0D9488]/70 group-focus-within:text-[#0D9488] transition-colors" />
                            <input 
                               type="number"
                               placeholder="e.g. 30"
                               min="1"
                               max="120"
                               value={formData.age}
                               onChange={(e) => setFormData({...formData, age: e.target.value})}
                               required
                               className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border-2 border-transparent focus:border-[#0D9488]/20 focus:bg-white rounded-[24px] text-sm font-bold text-navy outline-none transition-all placeholder:text-navy/40"
                            />
                         </div>
                      </div>

                      {/* Gender Selector */}
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.2em] ml-1">Patient Gender</label>
                         <div className="relative group">
                            <User size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0D9488]" />
                            <select 
                               value={formData.gender}
                               onChange={(e) => setFormData({...formData, gender: e.target.value})}
                               className="w-full pl-14 pr-12 py-5 bg-gray-50 border-none rounded-[24px] text-sm font-bold text-navy appearance-none outline-none focus:ring-2 focus:ring-[#0D9488]/10 transition-all cursor-pointer"
                            >
                               <option value="Male">Male</option>
                               <option value="Female">Female</option>
                               <option value="Other">Other</option>
                            </select>
                            <ChevronRight size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-navy/60 rotate-90" />
                         </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       {/* Blood Group */}
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.2em] ml-1">Blood Group *</label>
                          <div className="relative group">
                             <User size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0D9488]" />
                             <select 
                                value={formData.bloodGroup}
                                onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                                required
                                className="w-full pl-14 pr-12 py-5 bg-gray-50 border-none rounded-[24px] text-sm font-bold text-navy appearance-none outline-none focus:ring-2 focus:ring-[#0D9488]/10 transition-all cursor-pointer"
                             >
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                   <option key={bg} value={bg}>{bg}</option>
                                ))}
                             </select>
                             <ChevronRight size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-navy/60 rotate-90" />
                          </div>
                       </div>

                       {/* Address */}
                       <div className="space-y-3 md:col-span-2">
                          <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.2em] ml-1">Home Address *</label>
                          <div className="relative group">
                             <input 
                                type="text"
                                placeholder="Enter home address"
                                value={formData.address}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                required
                                className="w-full px-6 py-5 bg-gray-50/50 border-2 border-transparent focus:border-[#0D9488]/20 focus:bg-white rounded-[24px] text-sm font-bold text-navy outline-none transition-all placeholder:text-navy/40"
                             />
                          </div>
                       </div>
                    </div>

                   {/* Reason for Visit */}
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.2em] ml-1">Reason for Visit</label>
                      <textarea
                         placeholder="e.g. Cough, check-up, test review"
                         value={formData.reason}
                         onChange={(e) => setFormData({...formData, reason: e.target.value})}
                         rows={2}
                         className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent focus:border-[#0D9488]/20 focus:bg-white rounded-[24px] text-sm font-bold text-navy outline-none transition-all placeholder:text-navy/40 resize-none"
                      />
                   </div>

                    <Button 
                       type="submit" 
                       loading={submitting}
                       disabled={isBookingClosed}
                       className={`w-full py-6 rounded-[24px] text-sm font-black uppercase tracking-[0.2em] shadow-2xl transition-all duration-500 ${
                          isBookingClosed
                          ? 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
                          : bookingSuccess 
                          ? 'bg-green-500 hover:bg-green-600 scale-[0.98]' 
                          : 'bg-[#0D9488] hover:bg-[#0D9488]/90 shadow-[#0D9488]/20 hover:-translate-y-1'
                       }`}
                    >
                      {bookingSuccess ? (
                         <span className="flex items-center gap-3"><CheckCircle2 size={24} /> Walk-in Registered</span>
                      ) : (
                         <span className="flex items-center gap-3"><Activity size={20} /> Register Walk-In Booking</span>
                      )}
                    </Button>
                     </fieldset>
                 </form>
             </Card>

             {/* Guidance info */}
             <div className="flex items-start gap-4 p-6 bg-blue-50/50 rounded-[32px] border border-blue-100/50">
                <AlertCircle className="text-blue-500 shrink-0 mt-1" size={20} />
                <p className="text-[10px] text-blue-900/60 font-medium leading-relaxed uppercase tracking-wider">
                  Offline bookings are registered directly into the active calendar sequence. The patient will show up in the doctor's queue page. Ensure the contact phone number is input accurately.
                </p>
             </div>
          </div>

          {/* Right Column: Live Queue View */}
          <div className="lg:col-span-5 space-y-6">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-3">
                   <Users size={18} className="text-[#0D9488]" /> Live Queue (Today)
                </h3>
                <Badge variant="outline" className="bg-white text-[10px] px-4 py-1.5 rounded-full border-gray-200 font-black text-navy/70">
                   {filteredQueue.length} Active
                </Badge>
             </div>

             <Card className="bg-white border border-gray-100 shadow-xl shadow-navy/5 rounded-[48px] overflow-hidden">
                <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center gap-4">
                   <Avatar src={selectedDoctor?.user?.image} name={selectedDoctorName} size="md" className="ring-2 ring-white shadow-sm" />
                   <div>
                      <p className="text-xs font-black text-navy leading-tight">{selectedDoctorName}</p>
                      <p className="text-[9px] font-black text-[#0D9488] uppercase tracking-widest">{selectedDoctor?.specialization}</p>
                   </div>
                </div>

                <div className="p-2 scroller-hidden h-[400px] overflow-y-auto">
                   {filteredQueue.length > 0 ? (
                      <div className="space-y-1">
                        {filteredQueue.map((app, idx) => {
                          const slotTime = app.slot_id?.start_datetime
                            ? new Date(app.slot_id.start_datetime).toLocaleTimeString('en-IN', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })
                            : 'N/A';
                          const isConsulting = app.status === 'consulting';
                          
                          return (
                            <div key={app._id} className={`p-5 rounded-[32px] flex items-center justify-between transition-all ${
                               isConsulting ? 'bg-[#F0F9FF] border border-[#0D9488]/10' : 'hover:bg-gray-50'
                            }`}>
                               <div className="flex items-center gap-5">
                                  <div className={`w-12 h-10 rounded-2xl flex flex-col items-center justify-center font-black text-[10px] shadow-sm ${
                                     isConsulting ? 'bg-[#0D9488] text-white' : 'bg-navy text-white'
                                  }`}>
                                     <span className="text-[7px] text-white/50 leading-none">Token</span>
                                     T-{app.token_number || '-'}
                                  </div>
                                  <div>
                                     <p className="font-bold text-navy text-xs leading-tight">
                                       {app.patient_id?.name || app.patient_snapshot?.name || 'Walk-in'}
                                     </p>
                                     <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-black text-navy/70 uppercase tracking-widest">{slotTime}</span>
                                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${
                                           isConsulting ? 'text-[#0D9488]' : 'text-navy/70'
                                        }`}>{app.status}</span>
                                     </div>
                                  </div>
                               </div>
                               {isConsulting && (
                                  <Activity className="text-[#0D9488] animate-pulse" size={18} />
                                )}
                            </div>
                          );
                        })}
                      </div>
                   ) : (
                      <div className="flex flex-col items-center justify-center h-full opacity-20 filter grayscale">
                         <Users size={60} className="mb-4" />
                         <p className="font-black uppercase text-[10px] tracking-widest">No patients in queue</p>
                      </div>
                   )}
                </div>

                {/* Queue Summary Footer */}
                <div className="p-6 bg-navy text-white flex items-center justify-between">
                   <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Live Queue</p>
                      <p className="text-xs font-black">Patients Booked</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-[#0D9488] uppercase tracking-widest">Total</p>
                      <p className="text-xl font-heading font-black leading-none">{filteredQueue.length}</p>
                   </div>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HospitalOfflineBooking;
