import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, Avatar } from '../../components/common';
import { 
  User, Phone, Calendar, Hash, 
  Stethoscope, ChevronRight, Activity,
  Printer, CheckCircle2, Clock, 
  Search, Users, AlertCircle, Plus, Sparkles
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import hospitalService from '../../services/hospitalService';
import doctorService from '../../services/doctorService';
import toast from 'react-hot-toast';

const HospitalOfflineBooking = ({ role = 'hospital' }) => {
  const { user } = useAuthStore();
  
  const [doctorsList, setDoctorsList] = useState([]);
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    age: '',
    gender: 'Male',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

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
      const slotsData = await doctorService.getDoctorSlots(formData.doctorId, 'offline');
      const daySlots = slotsData.find(s => s.date === formData.date);
      setAvailableSlots(daySlots ? daySlots.times : []);
      setSelectedSlot(null);

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

        const appDate = new Date(app.slot_id.start_datetime).toISOString().split('T')[0];
        return appDate === formData.date;
      });

      setAppointmentsList(filtered);
    } catch (err) {
      console.error('Error loading slots/queue:', err);
    }
  };

  useEffect(() => {
    fetchSlotsAndQueue();
  }, [formData.doctorId, formData.date, role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.phone || !formData.age) {
      toast.error('Please fill in all patient details');
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
        age: formData.age,
        gender: formData.gender,
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
        age: '',
        gender: 'Male',
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
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                               min={new Date().toISOString().split('T')[0]}
                               onChange={(e) => setFormData({...formData, date: e.target.value})}
                               className="w-full pl-14 pr-6 py-5 bg-gray-50 border-none rounded-[24px] text-sm font-bold text-navy outline-none focus:ring-2 focus:ring-[#0D9488]/10 transition-all"
                            />
                         </div>
                      </div>
                   </div>

                   {/* Time Slots Selector */}
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.2em] ml-1">Select Time Slot</label>
                      {availableSlots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {availableSlots.map((slot) => {
                            const isBooked = slot.status === 'booked';
                            const isSelected = selectedSlot?.id === slot.id;
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                disabled={isBooked}
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-3.5 px-2 rounded-2xl text-[10px] font-black uppercase tracking-wider text-center transition-all ${
                                  isBooked 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent' 
                                    : isSelected
                                      ? 'bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/20 border border-teal-600'
                                      : 'bg-white border border-gray-200 text-navy hover:border-[#0D9488] hover:text-[#0D9488]'
                                }`}
                              >
                                {slot.time}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 bg-red-50 text-red-700/80 rounded-[24px] flex items-center gap-3 border border-red-100/50">
                           <AlertCircle size={18} />
                           <span className="text-xs font-black uppercase tracking-wide">No slots generated or available on this day.</span>
                        </div>
                      )}
                   </div>

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
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                   {/* Token display section */}
                   {selectedSlot && (
                     <div className="p-8 bg-navy rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-navy/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy to-[#0D9488]/20 group-hover:to-[#0D9488]/30 transition-all duration-500" />
                        <div className="relative z-10 space-y-2 text-center md:text-left">
                           <h4 className="text-xl font-black tracking-tight">Sequence Allocation</h4>
                           <p className="text-[10px] text-white/70 font-bold uppercase tracking-[0.25em]">Walk-in schedule sequence</p>
                        </div>
                        <div className="relative z-10 w-40 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center border border-white/10">
                           <span className="text-xs font-black text-[#0D9488] uppercase mb-1">Assigned Time</span>
                           <span className="text-lg font-heading font-black">{selectedSlot.time}</span>
                        </div>
                     </div>
                   )}

                   <Button 
                      type="submit" 
                      loading={submitting}
                      className={`w-full py-6 rounded-[24px] text-sm font-black uppercase tracking-[0.2em] shadow-2xl transition-all duration-500 ${
                         bookingSuccess 
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
                   {sortedQueue.length} Active
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
                   {sortedQueue.length > 0 ? (
                      <div className="space-y-1">
                        {sortedQueue.map((app, idx) => {
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
                                     T-{idx + 1}
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
                      <p className="text-xl font-heading font-black leading-none">{sortedQueue.length}</p>
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
