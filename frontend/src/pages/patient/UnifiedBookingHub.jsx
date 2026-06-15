import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge } from '../../components/common';
import { 
  Search, Calendar, Clock, MapPin, Video, Stethoscope, 
  ChevronRight, CheckCircle2, X, BadgeCheck, ShieldCheck, 
  CreditCard, Building2, Info, Star as LucideStar, Mail, Phone, User
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import doctorService from '../../services/doctorService';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const UnifiedBookingHub = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' | 'online'
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState(null);

  const [patientDetails, setPatientDetails] = useState({
     phone: '',
     email: '',
     dob: '',
     gender: 'Male',
     bloodGroup: 'O+',
     address: '',
  });

  useEffect(() => {
     if (user) {
        setPatientDetails({
           phone: user.phone || '',
           email: user.email || '',
           dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
           gender: user.gender || 'Male',
           bloodGroup: user.bloodGroup || 'O+',
           address: user.address || '',
        });
     }
  }, [user]);

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const data = await doctorService.getDoctors({
          mode: activeTab === 'online' ? 'Online' : 'Offline'
        });
        
        const transformed = data.map(d => ({
          id: d._id || d.id,
          name: d.user?.name || 'Dr. Specialist',
          specialization: d.specialization || '',
          fee: d.fee || 500,
          rating: 4.8,
          experience: d.experience,
          hospitalId: d.hospitalId?._id || d.hospitalId,
          hospitalName: d.hospitalId?.name || 'Independent Clinic',
          initials: (d.user?.name || 'D').split(' ').map(n => n[0]).join('').substring(0, 2),
          gradient: 'from-[#0D9488] to-[#115E59]',
          isOnline: d.onlineConsultation && !d.hospitalId,
          isOffline: true,
          location: d.address || ''
        }));
        
        setDoctors(transformed);

        // If doctorId passed in state, select it
        if (location.state?.doctorId) {
          const doc = transformed.find(d => d.id === location.state.doctorId);
          if (doc) {
            setSelectedDoc(doc);
          }
        }
      } catch {
        toast.error("Failed to fetch doctors");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [activeTab, location.state?.doctorId]);

  // Auto-selection logic for state updates
  useEffect(() => {
    if (location.state?.initialMode) {
      setActiveTab(location.state.initialMode);
    }
    window.history.replaceState({}, document.title);
  }, [location.state]);

  const filteredDoctors = doctors.filter(d => 
    (d.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (d.specialization || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectDoctor = (doc) => {
    setSelectedDoc(doc);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedSlot(null);
  };

  const handleDateSelect = (slot) => {
    setSelectedDate(slot.date);
    if (slot.bookingClosed) {
      setSelectedTime(null);
      setSelectedSlot(null);
      return;
    }
    const earliestTime = slot.times?.find(t => t.status === 'available' && !t.is_reserved);
    if (earliestTime) {
      setSelectedTime(earliestTime.time);
      setSelectedSlot(earliestTime);
    } else {
      setSelectedTime(null);
      setSelectedSlot(null);
    }
  };

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDoc) {
        setAvailableSlots([]);
        return;
      }

      try {
        setSlotsLoading(true);
        const consultationType = activeTab === 'online' ? 'online' : 'offline';
        const data = await doctorService.getDoctorSlots(selectedDoc.id, consultationType);
        setAvailableSlots(data);
      } catch (error) {
        setAvailableSlots([]);
        toast.error(error.response?.data?.message || 'Failed to load slots');
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDoc, activeTab]);

  useEffect(() => {
    if (availableSlots && availableSlots.length > 0) {
      let found = null;
      for (const slot of availableSlots) {
        if (slot.bookingClosed) continue;
        const firstAvailableTime = slot.times?.find(t => t.status === 'available' && !t.is_reserved);
        if (firstAvailableTime) {
          found = { date: slot.date, slot: firstAvailableTime };
          break;
        }
      }
      
      if (found) {
        setSelectedDate(found.date);
        setSelectedTime(found.slot.time);
        setSelectedSlot(found.slot);
      } else {
        setSelectedDate(null);
        setSelectedTime(null);
        setSelectedSlot(null);
      }
    } else {
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedSlot(null);
    }
  }, [availableSlots]);

  const processPayment = async () => {
    if (!selectedSlot) {
      toast.error('Please select a slot');
      return;
    }

    if (!patientDetails.phone || !patientDetails.dob || !patientDetails.gender || !patientDetails.bloodGroup || !patientDetails.address) {
      toast.error('Please fill in all medical and contact details in the checkout form');
      return;
    }

    setProcessing(true);
    try {
      const consultationType = activeTab === 'online' ? 'online' : 'offline';
      const res = await doctorService.bookAppointment({
        doctor_id: selectedDoc.id,
        consultation_type: consultationType,
        start_datetime: selectedSlot.start_datetime,
        phone: patientDetails.phone,
        email: patientDetails.email,
        dob: patientDetails.dob,
        gender: patientDetails.gender,
        bloodGroup: patientDetails.bloodGroup,
        address: patientDetails.address,
      });

      setBookedAppointment(res.appointment);

      // Update frontend user store
      updateUser({
        ...user,
        phone: patientDetails.phone,
        dob: patientDetails.dob,
        gender: patientDetails.gender,
        bloodGroup: patientDetails.bloodGroup,
        address: patientDetails.address,
      });

      setProcessing(false);
      setShowPayment(false);
      setConfirmed(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to book selected slot');
      setProcessing(false);
    }
  };

  const fmtDate = (ds) => {
    if (!ds) return '';
    const date = new Date(ds);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <DashboardLayout title="Booking Hub" role="patient">
      <div className="max-w-6xl mx-auto pb-20 font-body animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="mb-10 space-y-4">
           <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Medical <span className="text-primary text-glow">Booking Hub</span>
           </h1>
           <p className="text-xs font-black text-navy/30 uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck size={14} className="text-primary" /> Secure clinical & virtual consultations
           </p>
        </div>

        {confirmed ? (
           <div className="bg-white rounded-[40px] p-16 text-center shadow-sm border border-gray-100 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-green-50/50">
                 <CheckCircle2 size={48} className="text-green-500" />
              </div>
              <h2 className="text-3xl font-heading font-black text-navy mb-2 uppercase italic tracking-tight">Payment Successful!</h2>
              <p className="text-navy/40 font-bold max-w-sm mx-auto mb-10">
                 Your appointment is confirmed. You can now view your schedule and join sessions from your dashboard.
              </p>
              
              <div className="flex flex-col items-center gap-8">
                 <div className="w-full max-w-xs bg-gray-50 rounded-2xl p-6 flex flex-col gap-3 mx-auto">
                    <div className="flex justify-between text-[10px] font-black uppercase text-navy/40">
                       <span>Reference ID</span>
                       <span className="text-navy">{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase text-navy/40">
                       <span>Token Number</span>
                       <span className="text-navy font-bold text-[#0D9488]">T-{bookedAppointment?.token_number || '-'}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase text-navy/40">
                       <span>Service Type</span>
                       <span className="text-navy">{activeTab === 'clinical' ? 'Physical Visit' : 'Virtual Session'}</span>
                    </div>
                 </div>

                 <Button 
                    onClick={() => navigate(ROUTES.PATIENT.MY_BOOKINGS)}
                    className="bg-[#0C1A2E] text-white hover:bg-primary px-12 py-5 rounded-[24px] font-black text-[12px] uppercase tracking-widest border-none shadow-2xl shadow-navy/20"
                 >
                    View My Bookings
                 </Button>
              </div>
           </div>
        ) : (
           <>
              <div className="flex bg-[#EEF2F6] p-1.5 rounded-[24px] mb-10 w-fit">
                 <button 
                    onClick={() => { setActiveTab('clinical'); setSelectedDoc(null); setAvailableSlots([]); }}
                    className={`px-8 py-3.5 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                       activeTab === 'clinical' ? 'bg-white text-navy shadow-xl shadow-navy/5' : 'text-navy/40 hover:text-navy/60'
                    }`}
                 >
                    <Building2 size={15} /> Clinical Visits
                 </button>
                 <button 
                    onClick={() => { setActiveTab('online'); setSelectedDoc(null); setAvailableSlots([]); }}
                    className={`px-8 py-3.5 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                       activeTab === 'online' ? 'bg-white text-navy shadow-xl shadow-navy/5' : 'text-navy/40 hover:text-navy/60'
                    }`}
                 >
                    <Video size={15} /> Online Consulting
                 </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                 <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                    <div className="relative group">
                       <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-navy/40 group-focus-within:text-primary transition-colors" />
                       <input 
                          type="text"
                          placeholder="Find doctor by name or specialty..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full bg-white border-none rounded-[28px] py-6 pl-16 pr-8 text-sm font-bold text-navy outline-none shadow-sm focus:ring-4 focus:ring-primary/5 transition-all"
                       />
                    </div>

                    <div className="space-y-3">
                       {loading ? (
                         <div className="py-20 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-primary mx-auto mb-4"></div>
                            <p className="text-navy/40 font-bold uppercase tracking-widest text-[10px]">Fetching Specialists...</p>
                         </div>
                       ) : filteredDoctors.map(doc => {
                          const isSelected = selectedDoc?.id === doc.id;
                          return (
                             <button 
                                key={doc.id}
                                onClick={() => selectDoctor(doc)}
                                className={`w-full text-left p-6 rounded-[32px] border-2 transition-all flex items-center gap-6 group hover:shadow-xl hover:shadow-navy/5 ${
                                   isSelected ? 'border-primary bg-primary/5' : 'border-white bg-white hover:border-primary/20'
                                }`}
                             >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${doc.gradient} flex items-center justify-center text-white text-lg font-black group-hover:scale-105 transition-transform`}>
                                   {doc.initials}
                                </div>
                                <div className="flex-1">
                                   <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{doc.specialization}</p>
                                   <h3 className="text-lg font-heading font-black text-navy leading-none mb-1 uppercase tracking-tight">{doc.name}</h3>
                                   <p className="text-[11px] font-bold text-navy/30 flex items-center gap-1.5 min-w-0">
                                      {doc.hospitalId ? <Building2 size={12} className="shrink-0" /> : <Stethoscope size={12} className="shrink-0" />} <span className="truncate">{doc.hospitalName}</span>
                                   </p>
                                    {doc.location && (
                                       <p className="text-[9px] font-bold text-navy/20 flex items-center gap-1.5 mt-1">
                                          <MapPin size={10} className="text-primary/50" /> <span className="truncate">{doc.location}</span>
                                       </p>
                                    )}
                                </div>
                                <div className="text-right">
                                   <p className="text-lg font-black text-navy">₹{doc.fee}</p>
                                   <div className="flex items-center gap-1 text-amber-500 justify-end">
                                      <LucideStar size={12} fill="currentColor" /> <span className="text-[10px] font-black">{doc.rating}</span>
                                   </div>
                                </div>
                             </button>
                          );
                       })}
                       {!loading && filteredDoctors.length === 0 && (
                         <div className="py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                            <Stethoscope size={48} className="mx-auto text-gray-200 mb-4" />
                            <h3 className="text-lg font-black text-navy/40">No specialists found</h3>
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="lg:col-span-12 xl:col-span-5 relative">
                    <div className="sticky top-32 space-y-6">
                       {selectedDoc ? (
                          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 flex flex-col max-h-[650px] animate-in fade-in duration-500">
                             <div className="flex-1 overflow-y-auto pr-1 scroller-hidden space-y-6">
                                <div>
                                   <h3 className="text-xs font-black uppercase tracking-widest text-navy/30 mb-6">Schedule Selection</h3>
                                   <div className="space-y-3">
                                   {slotsLoading ? (
                                     <div className="py-10 text-center bg-gray-50 rounded-2xl">
                                        <div className="animate-spin rounded-full h-7 w-7 border-t-4 border-primary mx-auto mb-4"></div>
                                        <p className="text-[10px] font-black uppercase text-navy/30">Loading rolling slots...</p>
                                     </div>
                                   ) : availableSlots && availableSlots.length > 0 ? availableSlots.map(slot => (
                                      <div key={slot.date} className="space-y-4">
                                         <button 
                                            onClick={() => handleDateSelect(slot)}
                                            className={`w-full flex items-center justify-between p-5 rounded-[20px] transition-all ${
                                               selectedDate === slot.date ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-[#F8FAFC] text-navy hover:bg-[#EEF2F6]'
                                            }`}
                                         >
                                            <div className="flex items-center gap-3">
                                               <Calendar size={16} /> 
                                               <span className="text-xs font-black uppercase tracking-widest">{fmtDate(slot.date)}</span>
                                            </div>
                                            <ChevronRight size={16} className={selectedDate === slot.date ? 'text-white' : 'text-navy/40'} />
                                         </button>
                                         
                                         {selectedDate === slot.date && (
                                              <div className="bg-[#0D9488]/5 border border-[#0D9488]/10 rounded-[32px] p-6 text-left space-y-5 animate-in fade-in duration-300">
                                                 {/* Alert banners */}
                                                 {slot.bookingClosed && (
                                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 text-red-900 animate-in fade-in duration-300">
                                                       <X className="text-red-500 shrink-0 mt-0.5" size={16} />
                                                       <div>
                                                          <h4 className="text-[10px] font-black uppercase tracking-wider text-red-800">Booking Stopped</h4>
                                                          <p className="text-[9px] font-bold text-red-600/80 mt-0.5 leading-normal uppercase">
                                                             Slot booking has been stopped for this date. No further appointments are being accepted.
                                                          </p>
                                                       </div>
                                                    </div>
                                                 )}
                                                 {!slot.bookingClosed && slot.times?.some(t => t.status === 'direct_visit') && (
                                                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 text-amber-900 animate-in fade-in duration-300">
                                                       <Info className="text-amber-500 shrink-0 mt-0.5" size={16} />
                                                       <div>
                                                          <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-800">Direct Visit Ticket Required</h4>
                                                          <p className="text-[9px] font-bold text-amber-700/80 mt-0.5 leading-normal uppercase">
                                                             Online booking is closed. Please visit the hospital directly for walk-in slots.
                                                          </p>
                                                       </div>
                                                    </div>
                                                 )}
                                                 {!slot.bookingClosed && slot.times?.length > 0 && slot.times?.every(t => t.status === 'booked') && (
                                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 text-red-900 animate-in fade-in duration-300">
                                                       <X className="text-red-500 shrink-0 mt-0.5" size={16} />
                                                       <div>
                                                          <h4 className="text-[10px] font-black uppercase tracking-wider text-red-800">All Sessions Fully Booked</h4>
                                                          <p className="text-[9px] font-bold text-red-600/80 mt-0.5 leading-normal uppercase">
                                                             No slots are available for booking on this date.
                                                          </p>
                                                       </div>
                                                    </div>
                                                 )}
 
                                                 {!slot.bookingClosed && (
                                                    <>
                                                       <div>
                                                          <p className="text-[10px] font-black uppercase tracking-widest text-navy/40 mb-3 ml-1">Select Available Time Range</p>
                                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                             {(slot.times || []).map(t => {
                                                                const isBooked = t.status !== 'available';
                                                                const isSelected = selectedTime === t.time;
                                                                return (
                                                                   <button
                                                                      key={t.id}
                                                                      type="button"
                                                                      disabled={isBooked}
                                                                      onClick={() => {
                                                                         setSelectedTime(t.time);
                                                                         setSelectedSlot(t);
                                                                      }}
                                                                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                                                                         isSelected
                                                                            ? 'bg-[#0D9488] text-white border-transparent shadow-lg shadow-[#0D9488]/20'
                                                                            : isBooked
                                                                            ? 'bg-gray-50 text-navy/30 border-gray-100 cursor-not-allowed opacity-75'
                                                                            : 'bg-white text-navy border-gray-150 hover:border-[#0D9488] hover:bg-[#0D9488]/5'
                                                                      }`}
                                                                   >
                                                                      <div className="flex items-center justify-between w-full">
                                                                         <span className="text-xs font-black uppercase tracking-wider">{t.time}</span>
                                                                         {t.status === 'direct_visit' && (
                                                                            <span className="text-[8px] font-black uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                                                                               Direct Visit
                                                                            </span>
                                                                         )}
                                                                         {t.status === 'booked' && (
                                                                            <span className="text-[8px] font-black uppercase bg-red-100 text-red-800 px-2 py-0.5 rounded-md">
                                                                               Full
                                                                            </span>
                                                                         )}
                                                                         {t.status === 'available' && (
                                                                            <span className="text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                                                                               Available
                                                                            </span>
                                                                         )}
                                                                      </div>
                                                                      {t.status === 'direct_visit' && (
                                                                         <p className="text-[9px] font-bold text-amber-600 mt-2 leading-none">
                                                                            Visit hospital directly to book
                                                                         </p>
                                                                      )}
                                                                      {t.status === 'booked' && (
                                                                         <p className="text-[9px] font-bold text-red-500 mt-2 leading-none">
                                                                            All slots full
                                                                         </p>
                                                                      )}
                                                                      {t.status === 'available' && (
                                                                         <p className={`text-[9px] font-bold mt-2 leading-none ${isSelected ? 'text-white/80' : 'text-navy/40'}`}>
                                                                            Online booking open
                                                                         </p>
                                                                      )}
                                                                   </button>
                                                                );
                                                             })}
                                                          </div>
                                                       </div>
 
                                                       {selectedTime && selectedSlot ? (
                                                          <div className="border-t border-[#0D9488]/10 pt-4 space-y-4">
                                                             <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 flex items-center justify-center text-[#0D9488]">
                                                                   <Clock size={18} />
                                                                </div>
                                                                <div>
                                                                   <p className="text-[9px] font-black uppercase tracking-widest text-navy/40 leading-none mb-1">Selected Session Slot</p>
                                                                   <p className="text-sm font-black text-[#0D9488] uppercase leading-none">{selectedTime}</p>
                                                                </div>
                                                             </div>
                                                             <div className="flex items-start gap-3 border-t border-[#0D9488]/10 pt-4">
                                                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mt-0.5 shrink-0">
                                                                   <Info size={18} />
                                                                </div>
                                                                <div>
                                                                   <p className="text-[9px] font-black uppercase tracking-widest text-navy/40 leading-none mb-1">Queue & Est. Consultation Start</p>
                                                                   <p className="text-xs font-black text-navy leading-normal">
                                                                      Estimated to start at <span className="text-[#0D9488]">{selectedSlot.start_datetime ? new Date(selectedSlot.start_datetime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) : selectedTime}</span>
                                                                   </p>
                                                                   <p className="text-[10px] font-medium text-navy/40 mt-1 leading-normal">
                                                                      You are booking slot <span className="font-bold text-navy">#{selectedSlot.slot_index + 1}</span> ({selectedTime}) for this session. A sequential token number will be assigned upon confirmation.
                                                                   </p>
                                                                </div>
                                                             </div>
                                                          </div>
                                                       ) : (
                                                          <div className="py-2 text-center border-t border-[#0D9488]/10 pt-4">
                                                             <p className="text-xs font-bold text-red-500 italic">No slot selected or available.</p>
                                                          </div>
                                                       )}
                                                    </>
                                                 )}
                                              </div>
                                           )}
                                      </div>
                                   )) : (
                                     <div className="py-10 text-center bg-gray-50 rounded-2xl">
                                        <p className="text-[10px] font-black uppercase text-navy/30">No slots available currently</p>
                                     </div>
                                   )}
                                </div>
                                </div>
                             </div>

                             <div className="border-t border-gray-50 pt-6 mt-4 space-y-6 shrink-0 bg-white">
                                <div className="flex flex-col gap-4">
                                   <div className="flex justify-between items-center bg-[#F8FAFC] p-5 rounded-[24px]">
                                      <div>
                                         <p className="text-[10px] font-black uppercase tracking-widest text-navy/30 mb-1">Estimated Charge</p>
                                         <p className="text-[11px] font-black text-navy uppercase">{activeTab === 'online' ? '100% Upfront' : '30% Deposit'}</p>
                                      </div>
                                      <p className="text-2xl font-black text-primary tracking-tight">
                                         ₹{activeTab === 'online' ? selectedDoc.fee : Math.round(selectedDoc.fee * 0.3)}
                                      </p>
                                   </div>
                                </div>

                                <Button 
                                   disabled={!selectedDate || !selectedTime}
                                   onClick={() => setShowPayment(true)}
                                   className="w-full bg-[#0C1A2E] text-white hover:bg-primary py-5 rounded-[24px] font-black text-[12px] uppercase tracking-widest border-none shadow-2xl shadow-navy/20 transition-all disabled:opacity-40"
                                >
                                   Proceed to Checkout
                                </Button>
                             </div>
                          </div>
                       ) : (
                          <div className="h-[400px] flex flex-col items-center justify-center text-center p-12 bg-gray-50 rounded-[40px] border-4 border-dashed border-gray-100">
                             <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-gray-200 mb-8 shadow-sm">
                                <Stethoscope size={32} />
                             </div>
                             <h3 className="text-lg font-black text-navy/40 mb-2">No Doctor Selected</h3>
                             <p className="text-xs font-bold text-navy/20 uppercase tracking-widest leading-relaxed">
                                Select a specialist from the left to view their clinical schedule.
                             </p>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           </>
        )}
      </div>

      {showPayment && selectedDoc && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-navy/60 backdrop-blur-md" onClick={() => !processing && setShowPayment(false)} />
            <div className="relative w-full max-w-4xl bg-white rounded-[48px] overflow-hidden shadow-2xl z-10 animate-in zoom-in-95 duration-300 grid grid-cols-1 md:grid-cols-12">
               
               {/* Left Column - Billing details */}
               <div className="md:col-span-5 bg-navy p-10 text-center md:text-left flex flex-col justify-between relative overflow-hidden text-white">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <div className="space-y-6 relative z-10">
                     <CreditCard size={32} className="text-primary mx-auto md:mx-0 mb-6" />
                     <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Secure Settlement</h3>
                     <p className="text-4xl font-black text-white tracking-tight">₹{activeTab === 'online' ? selectedDoc.fee : Math.round(selectedDoc.fee * 0.3)}</p>
                     
                     <div className="space-y-4 pt-6 border-t border-white/10 text-left">
                        <div className="flex justify-between items-center text-[11px] font-black uppercase text-white/50">
                           <span>Professional Fee</span>
                           <span className="text-white">₹{selectedDoc.fee}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-black uppercase text-white/50">
                           <span>Service Type</span>
                           <span className="text-white">{activeTab === 'online' ? '100% Online' : '30% Deposit'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-black uppercase text-white/50">
                           <span>Doctor</span>
                           <span className="text-white">{selectedDoc.name}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-black uppercase text-white/50">
                           <span>Date</span>
                           <span className="text-white">{fmtDate(selectedDate)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-black uppercase text-white/50">
                           <span>Time Slot</span>
                           <span className="text-white">{selectedTime}</span>
                        </div>
                     </div>
                  </div>
                  <div className="pt-8 text-xs font-bold text-white/35 text-center md:text-left">
                     Confirming payment establishes clinical queue placement.
                  </div>
               </div>

               {/* Right Column - Demographic inputs */}
               <div className="md:col-span-7 p-10 space-y-6 text-left max-h-[80vh] overflow-y-auto">
                  <div>
                     <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Confirm Demographics</h2>
                     <p className="text-xs text-navy/40 font-bold mt-1">Please confirm your medical and contact profile details before booking.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     {/* Full Name (Read-only) */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-navy/60 uppercase tracking-[0.1em] ml-1">Full Name</label>
                        <input type="text" value={user?.name || ''} disabled className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-xs font-bold text-navy outline-none cursor-not-allowed opacity-80" />
                     </div>

                     {/* Email (Read-only) */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-navy/60 uppercase tracking-[0.1em] ml-1">Email Address</label>
                        <input type="text" value={user?.email || ''} disabled className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-xs font-bold text-navy outline-none cursor-not-allowed opacity-80" />
                     </div>

                     {/* Contact Phone (Required) */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.1em] ml-1">Contact Phone *</label>
                        <input 
                           type="tel" 
                           required 
                           value={patientDetails.phone}
                           onChange={(e) => setPatientDetails({...patientDetails, phone: e.target.value})}
                           className="w-full px-5 py-4 bg-[#F8FAFC] border-2 border-transparent focus:border-primary/20 rounded-2xl text-xs font-bold text-navy outline-none transition-all" 
                        />
                     </div>

                     {/* Date of Birth (Required) */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.1em] ml-1">Date of Birth *</label>
                        <input 
                           type="date" 
                           required 
                           value={patientDetails.dob}
                           onChange={(e) => setPatientDetails({...patientDetails, dob: e.target.value})}
                           className="w-full px-5 py-4 bg-[#F8FAFC] border-2 border-transparent focus:border-primary/20 rounded-2xl text-xs font-bold text-navy outline-none transition-all" 
                        />
                     </div>

                     {/* Patient Gender (Required) */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.1em] ml-1">Gender *</label>
                        <select 
                           value={patientDetails.gender}
                           onChange={(e) => setPatientDetails({...patientDetails, gender: e.target.value})}
                           className="w-full px-5 py-4 bg-[#F8FAFC] border-none rounded-2xl text-xs font-bold text-navy outline-none appearance-none cursor-pointer"
                        >
                           <option value="Male">Male</option>
                           <option value="Female">Female</option>
                           <option value="Other">Other</option>
                        </select>
                     </div>

                     {/* Blood Group (Required) */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.1em] ml-1">Blood Group *</label>
                        <select 
                           value={patientDetails.bloodGroup}
                           onChange={(e) => setPatientDetails({...patientDetails, bloodGroup: e.target.value})}
                           className="w-full px-5 py-4 bg-[#F8FAFC] border-none rounded-2xl text-xs font-bold text-navy outline-none appearance-none cursor-pointer"
                        >
                           {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                              <option key={bg} value={bg}>{bg}</option>
                           ))}
                        </select>
                     </div>
                  </div>

                  {/* Home Address (Required) */}
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.1em] ml-1">Home Address *</label>
                     <input 
                        type="text" 
                        required 
                        placeholder="Enter street and house details"
                        value={patientDetails.address}
                        onChange={(e) => setPatientDetails({...patientDetails, address: e.target.value})}
                        className="w-full px-5 py-4 bg-[#F8FAFC] border-2 border-transparent focus:border-primary/20 rounded-2xl text-xs font-bold text-navy outline-none transition-all" 
                     />
                  </div>

                  <div className="pt-6 border-t border-gray-50 space-y-3">
                     <Button 
                        disabled={processing}
                        onClick={processPayment}
                        className="w-full bg-[#0C1A2E] text-white hover:bg-primary py-5 rounded-[24px] font-black text-[12px] uppercase border-none shadow-xl shadow-navy/20 transition-all flex items-center justify-center gap-3"
                     >
                        {processing ? <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm & Complete Booking'}
                     </Button>
                     {!processing && (
                        <button onClick={() => setShowPayment(false)} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-navy/30 hover:text-navy transition-all text-center">
                           Cancel Transaction
                        </button>
                     )}
                  </div>
               </div>

            </div>
         </div>
      )}
    </DashboardLayout>
  );
};

export default UnifiedBookingHub;
