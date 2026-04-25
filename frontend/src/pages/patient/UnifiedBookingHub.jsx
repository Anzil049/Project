import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge } from '../../components/common';
import { 
  Search, Calendar, Clock, MapPin, Video, Stethoscope, 
  ChevronRight, CheckCircle2, X, BadgeCheck, ShieldCheck, 
  CreditCard, Building2, Info, Star as LucideStar 
} from 'lucide-react';
import { DOCTORS, HOSPITALS, SPECIALIZATIONS } from '../../data/mockData';
import useBookingStore from '../../store/bookingStore';
import { ROUTES } from '../../constants/routes';

const UnifiedBookingHub = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookAppointment = useBookingStore(s => s.bookAppointment);
  
  const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' | 'online'
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  
  // States
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Auto-selection logic
  useEffect(() => {
    if (location.state?.initialMode) {
      setActiveTab(location.state.initialMode);
    }
    
    if (location.state?.doctorId) {
      const doc = DOCTORS.find(d => d.id === location.state.doctorId);
      if (doc) {
        setSelectedDoc(doc);
      }
    }
    window.history.replaceState({}, document.title);
  }, [location.state]);

  const filteredDoctors = DOCTORS.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          d.specialization.toLowerCase().includes(search.toLowerCase());
    const matchesMode = activeTab === 'clinical' ? d.isOffline : d.isOnline;
    return matchesSearch && matchesMode;
  });

  const selectDoctor = (doc) => {
    setSelectedDoc(doc);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const processPayment = () => {
    setProcessing(true);
    setTimeout(() => {
      bookAppointment({
        doctorId: selectedDoc.id,
        doctorName: selectedDoc.name,
        doctorInitials: selectedDoc.initials,
        specialization: selectedDoc.specialization,
        doctorGradient: selectedDoc.gradient,
        hospitalId: selectedDoc.hospitalId,
        hospitalName: selectedDoc.hospitalName,
        type: activeTab,
        totalFee: selectedDoc.fee,
        scheduledTime: `${selectedDate} at ${selectedTime}`,
      });
      setProcessing(false);
      setShowPayment(false);
      setConfirmed(true);
    }, 2000);
  };

  const fmtDate = (ds) => new Date(ds).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

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
                    onClick={() => { setActiveTab('clinical'); setSelectedDoc(null); }}
                    className={`px-8 py-3.5 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                       activeTab === 'clinical' ? 'bg-white text-navy shadow-xl shadow-navy/5' : 'text-navy/40 hover:text-navy/60'
                    }`}
                 >
                    <Building2 size={15} /> Clinical Visits
                 </button>
                 <button 
                    onClick={() => { setActiveTab('online'); setSelectedDoc(null); }}
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
                       {filteredDoctors.map(doc => {
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
                                   <h3 className="text-lg font-heading font-black text-navy leading-none mb-1">{doc.name}</h3>
                                   <p className="text-[11px] font-bold text-navy/30 flex items-center gap-1.5 min-w-0">
                                      {doc.hospitalId ? <Building2 size={12} className="shrink-0" /> : <Stethoscope size={12} className="shrink-0" />} <span className="truncate">{doc.hospitalName}</span>
                                   </p>
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
                    </div>
                 </div>

                 <div className="lg:col-span-12 xl:col-span-5 relative">
                    <div className="sticky top-32 space-y-6">
                       {selectedDoc ? (
                          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 space-y-8 animate-in fade-in duration-500">
                             <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-navy/30 mb-6">Schedule Selection</h3>
                                <div className="space-y-3">
                                   {selectedDoc.slots.map(slot => (
                                      <div key={slot.date} className="space-y-4">
                                         <button 
                                            onClick={() => { setSelectedDate(slot.date); setSelectedTime(null); }}
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
                                            <div className="flex flex-wrap gap-2 px-1 animate-in fade-in duration-300">
                                               {slot.times.map(t => (
                                                  <button 
                                                     key={t}
                                                     onClick={() => setSelectedTime(t)}
                                                     className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        selectedTime === t ? 'bg-navy text-white' : 'bg-white border-2 border-gray-50 text-navy/40 hover:border-primary/30'
                                                     }`}
                                                  >
                                                     {t}
                                                  </button>
                                               ))}
                                            </div>
                                         )}
                                      </div>
                                   ))}
                                </div>
                             </div>

                             <div className="border-t border-gray-50 pt-8 space-y-6">
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
            <div className="relative w-full max-w-md bg-white rounded-[48px] overflow-hidden shadow-2xl z-10 animate-in zoom-in-95 duration-300">
               <div className="bg-navy p-10 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <CreditCard size={32} className="text-primary mx-auto mb-6" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Secure Settlement</h3>
                  <p className="text-4xl font-black text-white tracking-tight">₹{activeTab === 'online' ? selectedDoc.fee : Math.round(selectedDoc.fee * 0.3)}</p>
               </div>
               <div className="p-10 space-y-8">
                  <div className="space-y-4">
                     <div className="flex justify-between items-center text-[11px] font-black uppercase text-navy/40">
                        <span>Professional Fee</span>
                        <span className="text-navy">₹{selectedDoc.fee}</span>
                     </div>
                     <div className="flex justify-between items-center text-[11px] font-black uppercase text-navy/40">
                        <span>Service Type</span>
                        <span className="text-navy">{activeTab === 'online' ? '100% Online' : '30% Deposit'}</span>
                     </div>
                  </div>
                  <div className="space-y-3">
                     <Button 
                        disabled={processing}
                        onClick={processPayment}
                        className="w-full bg-primary text-white hover:bg-navy py-5 rounded-[24px] font-black text-[12px] uppercase border-none shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3"
                     >
                        {processing ? <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : 'Swipe to Pay'}
                     </Button>
                     {!processing && (
                        <button onClick={() => setShowPayment(false)} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-navy/30 hover:text-navy transition-all">
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
