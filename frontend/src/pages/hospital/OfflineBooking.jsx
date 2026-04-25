import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Input, Avatar, Badge } from '../../components/common';
import { 
  User, Phone, Calendar, Hash, 
  Stethoscope, ChevronRight, Activity,
  Printer, CheckCircle2, Clock, 
  Search, Users, AlertCircle, Plus
} from 'lucide-react';

const HospitalOfflineBooking = () => {
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    doctorId: '1',
    date: new Date().toISOString().split('T')[0],
  });
  
  const [suggestedToken, setSuggestedToken] = useState(1);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Sync with main app data
  const doctorsList = [
    { id: 1, name: 'Dr. Sarah Wilson', image: '/images/doctors/sarah.png', specialization: 'Cardiology' },
    { id: 2, name: 'Dr. Anil Kumar', image: '/images/doctors/anil.png', specialization: 'Neurology' },
    { id: 3, name: 'Dr. James Chen', image: '/images/doctors/james.png', specialization: 'Orthopedics' }
  ];

  const initialAppointments = [
    { id: 101, doctorId: 1, token: 1, patientName: 'Rajesh Sharma', time: '09:00 AM', date: new Date().toISOString().split('T')[0], status: 'Completed', type: 'General Checkup' },
    { id: 102, doctorId: 1, token: 2, patientName: 'Amit Verma', time: '09:15 AM', date: new Date().toISOString().split('T')[0], status: 'Consulting', type: 'Follow-up' },
    { id: 103, doctorId: 1, token: 3, patientName: 'Sunita Paul', time: '09:30 AM', date: new Date().toISOString().split('T')[0], status: 'In Queue', type: 'Consultation' },
    { id: 104, doctorId: 1, token: 4, patientName: 'Vikram Seth', time: '09:45 AM', date: new Date().toISOString().split('T')[0], status: 'In Queue', type: 'Heart Check' },
    { id: 201, doctorId: 2, token: 1, patientName: 'Priyanka Das', time: '10:00 AM', date: new Date().toISOString().split('T')[0], status: 'Consulting', type: 'Neurology' },
    { id: 301, doctorId: 3, token: 1, patientName: 'Suresh Raina', time: '11:00 AM', date: new Date().toISOString().split('T')[0], status: 'Scheduled', type: 'Orthopedic' }
  ];

  const [appointments, setAppointments] = useState(initialAppointments);

  // Auto-calculate token whenever doctor or date changes
  useEffect(() => {
    const existing = appointments.filter(
      app => app.doctorId === parseInt(formData.doctorId) && app.date === formData.date
    );
    const maxToken = existing.length > 0 ? Math.max(...existing.map(a => a.token)) : 0;
    setSuggestedToken(maxToken + 1);
  }, [formData.doctorId, formData.date, appointments]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.phone) return;

    const newBooking = {
      id: Date.now(),
      doctorId: parseInt(formData.doctorId),
      token: suggestedToken,
      patientName: formData.patientName,
      phone: formData.phone,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: formData.date,
      status: 'In Queue',
      type: 'Offline Booking'
    };

    setAppointments(prev => [...prev, newBooking]);
    setBookingSuccess(true);
    
    // Reset name/phone but keep doctor/date
    setFormData(prev => ({ ...prev, patientName: '', phone: '' }));
    
    setTimeout(() => setBookingSuccess(false), 3000);
  };

  const currentQueue = appointments
    .filter(app => app.doctorId === parseInt(formData.doctorId) && app.date === formData.date)
    .sort((a,b) => a.token - b.token);

  const selectedDoctor = doctorsList.find(d => d.id === parseInt(formData.doctorId));

  return (
    <DashboardLayout title="Offline Registration" role="hospital">
      <div className="max-w-7xl mx-auto space-y-8 pb-20 font-body animate-in fade-in duration-500">
        
        {/* Page Header */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
             <h1 className="text-3xl font-heading font-black text-navy tracking-tight">Manual Queue Entry</h1>
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
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Patient Name */}
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.2em] ml-1">Patient Identity</label>
                         <div className="relative group">
                            <User size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0D9488]/70 group-focus-within:text-[#0D9488] transition-colors" />
                            <input 
                               type="text"
                               placeholder="Enter Full Name"
                               value={formData.patientName}
                               onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                               required
                               className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border-2 border-transparent focus:border-[#0D9488]/20 focus:bg-white rounded-[24px] text-sm font-bold text-navy outline-none transition-all placeholder:text-navy/40"
                            />
                         </div>
                      </div>

                      {/* Phone Number */}
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.2em] ml-1">Contact Number</label>
                         <div className="relative group">
                            <Phone size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0D9488]/70 group-focus-within:text-[#0D9488] transition-colors" />
                            <input 
                               type="tel"
                               placeholder="+91 XXXXX XXXXX"
                               value={formData.phone}
                               onChange={(e) => setFormData({...formData, phone: e.target.value})}
                               required
                               className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border-2 border-transparent focus:border-[#0D9488]/20 focus:bg-white rounded-[24px] text-sm font-bold text-navy outline-none transition-all placeholder:text-navy/40"
                            />
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Doctor Selection */}
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
                                 <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialization})</option>
                               ))}
                            </select>
                            <ChevronRight size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-navy/60 rotate-90" />
                         </div>
                      </div>

                      {/* Date Selection */}
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-navy/70 uppercase tracking-[0.2em] ml-1">Appointment Date</label>
                         <div className="relative group">
                            <Calendar size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0D9488]/70" />
                            <input 
                               type="date"
                               value={formData.date}
                               onChange={(e) => setFormData({...formData, date: e.target.value})}
                               className="w-full pl-14 pr-6 py-5 bg-gray-50 border-none rounded-[24px] text-sm font-bold text-navy outline-none focus:ring-2 focus:ring-[#0D9488]/10 transition-all"
                            />
                         </div>
                      </div>
                   </div>

                   {/* Token Display Section */}
                   <div className="p-8 bg-navy rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-navy/20 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy to-[#0D9488]/20 group-hover:to-[#0D9488]/30 transition-all duration-500" />
                      <div className="relative z-10 space-y-2 text-center md:text-left">
                         <h4 className="text-xl font-black tracking-tight">Assigned Sequence</h4>
                         <p className="text-[10px] text-white/70 font-bold uppercase tracking-[0.25em]">Automated Token Calculation for selected session</p>
                      </div>
                      <div className="relative z-10 w-32 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center border border-white/10">
                         <span className="text-xs font-black text-[#0D9488] uppercase mb-1">Token No</span>
                         <span className="text-3xl font-heading font-black">T-{suggestedToken}</span>
                      </div>
                   </div>

                   <Button 
                      type="submit" 
                      className={`w-full py-6 rounded-[24px] text-sm font-black uppercase tracking-[0.2em] shadow-2xl transition-all duration-500 ${
                         bookingSuccess 
                         ? 'bg-green-500 hover:bg-green-600 scale-[0.98]' 
                         : 'bg-[#0D9488] hover:bg-[#0D9488]/90 shadow-[#0D9488]/20 hover:-translate-y-1'
                      }`}
                   >
                     {bookingSuccess ? (
                        <span className="flex items-center gap-3"><CheckCircle2 size={24} /> Registration Successful</span>
                     ) : (
                        <span className="flex items-center gap-3"><Activity size={20} /> Finalize Offline Booking</span>
                     )}
                   </Button>
                </form>
             </Card>

             {/* Booking Guidance */}
             <div className="flex items-start gap-4 p-6 bg-blue-50/50 rounded-[32px] border border-blue-100/50">
                <AlertCircle className="text-blue-500 shrink-0 mt-1" size={20} />
                <p className="text-[10px] text-blue-900/60 font-medium leading-relaxed uppercase tracking-wider">
                  Offline bookings are registered as <span className="font-black text-blue-600">"In Queue"</span> by default. The patient will immediately appear on the doctor's live monitoring screen. Ensure the patient's phone number is correct for SMS updates.
                </p>
             </div>
          </div>

          {/* Right Column: Queue View */}
          <div className="lg:col-span-5 space-y-6">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-3">
                   <Users size={18} className="text-[#0D9488]" /> Live Queue Preview
                </h3>
                <Badge variant="outline" className="bg-white text-[10px] px-4 py-1.5 rounded-full border-gray-200 font-black text-navy/70">
                   {currentQueue.length} Registered
                </Badge>
             </div>

             <Card className="bg-white border border-gray-100 shadow-xl shadow-navy/5 rounded-[48px] overflow-hidden">
                <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center gap-4">
                   <Avatar src={selectedDoctor?.image} name={selectedDoctor?.name} size="md" className="ring-2 ring-white shadow-sm" />
                   <div>
                      <p className="text-xs font-black text-navy leading-tight">{selectedDoctor?.name}</p>
                      <p className="text-[9px] font-black text-[#0D9488] uppercase tracking-widest">{selectedDoctor?.specialization}</p>
                   </div>
                </div>

                <div className="p-2 scroller-hidden h-[400px] overflow-y-auto">
                   {currentQueue.length > 0 ? (
                      <div className="space-y-1">
                        {currentQueue.map((app, idx) => (
                          <div key={app.id} className={`p-5 rounded-[32px] flex items-center justify-between transition-all ${
                             app.status === 'Consulting' ? 'bg-[#F0F9FF] border border-[#0D9488]/10' : 'hover:bg-gray-50'
                          }`}>
                             <div className="flex items-center gap-5">
                                <div className={`w-12 h-10 rounded-2xl flex flex-col items-center justify-center font-black text-[10px] shadow-sm ${
                                   app.status === 'Consulting' ? 'bg-[#0D9488] text-white' : 'bg-navy text-white'
                                }`}>
                                   <span className="text-[7px] text-white/50 leading-none">Token</span>
                                   {app.token}
                                </div>
                                <div>
                                   <p className="font-bold text-navy text-xs leading-tight">{app.patientName}</p>
                                   <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[9px] font-black text-navy/70 uppercase tracking-widest">{app.time}</span>
                                      <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                                         app.status === 'Consulting' ? 'text-[#0D9488]' : 'text-navy/70'
                                      }`}>{app.status}</span>
                                   </div>
                                </div>
                             </div>
                             {app.status === 'Consulting' && (
                                <Activity className="text-[#0D9488] animate-pulse" size={18} />
                             )}
                          </div>
                        ))}
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
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Next Arrival</p>
                      <p className="text-xs font-black">Waiting for Entry</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-[#0D9488] uppercase tracking-widest">Last Token</p>
                      <p className="text-xl font-heading font-black leading-none">T-{suggestedToken - 1}</p>
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
