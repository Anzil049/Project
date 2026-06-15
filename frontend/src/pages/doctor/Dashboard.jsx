import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Users, Calendar, Video, Star, 
  Activity, Clock, ChevronRight,
  MoreVertical, Search, CheckCircle2,
  VideoOff, MessageSquare, AlertCircle,
  FileText, Play, Plus, Trash2, PlusCircle,
  Heart, Thermometer, Info, User, Stethoscope,
  Mail, Phone, MapPin, Droplet
} from 'lucide-react';
import { Card, Button, Badge, Avatar, Modal, Input } from '../../components/common';
import doctorService from '../../services/doctorService';
import toast from 'react-hot-toast';

const calculateAge = (dobString) => {
  if (!dobString) return 'N/A';
  const dob = new Date(dobString);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const getLocalDateString = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await doctorService.getAppointments();
      setAppointments(data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const activeAndVisibleAppointments = appointments.filter(app => {
    if (app.status !== 'cancelled') return true;
    const slotId = app.slot_id?._id || app.slot_id;
    const hasActiveBooking = appointments.some(other => {
      const otherSlotId = other.slot_id?._id || other.slot_id;
      return otherSlotId?.toString() === slotId?.toString() &&
             ['booked', 'consulting', 'completed'].includes(other.status);
    });
    return !hasActiveBooking;
  });

  const sortedAppointments = [...activeAndVisibleAppointments].sort((a, b) => {
    if (!a.slot_id?.start_datetime || !b.slot_id?.start_datetime) return 0;
    return new Date(a.slot_id.start_datetime) - new Date(b.slot_id.start_datetime);
  });

  const todayStr = getLocalDateString(new Date());

  const processedAppointments = sortedAppointments.map((app, index) => {
    const isOnline = app.consultation_type === 'online';
    const start = app.slot_id?.start_datetime;
    const dateStr = start 
      ? new Date(start).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'N/A';
    const timeStr = start
      ? new Date(start).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
      : 'N/A';

    return {
      ...app,
      id: app._id,
      patient: app.patient_id?.name || app.patient_snapshot?.name || 'Walk-in Patient',
      email: app.patient_id?.email || app.patient_snapshot?.email || '',
      phone: app.patient_id?.phone || app.patient_snapshot?.phone || 'N/A',
      gender: app.patient_id?.gender || app.patient_snapshot?.gender || 'N/A',
      age: app.patient_id?.dob ? calculateAge(app.patient_id.dob) : (app.patient_snapshot?.age || 'N/A'),
      bloodGroup: app.patient_id?.bloodGroup || app.patient_snapshot?.bloodGroup || 'N/A',
      address: app.patient_id?.address || app.patient_snapshot?.address || 'N/A',
      date: dateStr,
      time: timeStr,
      token: app.token_number,
      type: isOnline ? 'Online' : 'Physical'
    };
  });

  // Filter for today's appointments
  const todayAppointments = processedAppointments.filter(app => {
    if (!app.slot_id?.start_datetime) return false;
    const appDate = getLocalDateString(app.slot_id.start_datetime);
    return appDate === todayStr;
  });

  const isIndependent = !user?.doctorProfile?.hospitalId;

  // Dynamically calculate average rating from real feedback ratings
  const ratedAppointments = appointments.filter(a => a.feedback?.doctor_rating > 0);
  const averageRatingStr = ratedAppointments.length > 0
    ? (ratedAppointments.reduce((sum, a) => sum + a.feedback.doctor_rating, 0) / ratedAppointments.length).toFixed(1)
    : 'N/A';

  const stats = [
    { label: 'Appointments Today', value: todayAppointments.filter(a => a.status !== 'cancelled').length.toString(), icon: <Calendar size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    ...(isIndependent ? [{ label: 'Online Consultations', value: todayAppointments.filter(a => a.type === 'Online' && a.status !== 'cancelled').length.toString().padStart(2, '0'), icon: <Video size={20} />, color: 'text-purple-600', bg: 'bg-purple-50' }] : []),
    { label: 'Completed Today', value: todayAppointments.filter(a => a.status === 'completed').length.toString(), icon: <CheckCircle2 size={20} />, color: 'text-[#0D9488]', bg: 'bg-[#0D9488]/10' },
    { label: 'Average Rating', value: averageRatingStr, icon: <Star size={20} />, color: 'text-amber-500', bg: 'bg-amber-50' }
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'consulting': return 'bg-[#0D9488] text-white border-blue-700 font-black shadow-md';
      case 'booked': return 'bg-purple-600 text-white border-purple-700 font-black';
      case 'completed': return 'bg-slate-100 text-navy/70 border-slate-300 font-bold';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-200 font-bold';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleStartConsultation = async (appId) => {
    try {
      toast.loading('Starting consultation...', { id: 'start-consult' });
      await doctorService.startAppointment(appId);
      toast.success('Consultation started!', { id: 'start-consult' });
      navigate(`/doctor/appointments/${appId}/consult`);
    } catch (error) {
      toast.error('Failed to start consultation', { id: 'start-consult' });
    }
  };

  const AppointmentCard = ({ app }) => (
    <div className="p-5 bg-white border border-gray-100 rounded-[32px] flex items-center justify-between hover:border-[#0D9488]/30 hover:shadow-xl hover:shadow-[#0D9488]/5 transition-all group">
       <div className="flex items-center gap-4">
          <div className={`w-12 h-10 rounded-2xl flex flex-col items-center justify-center font-black text-[10px] shadow-sm ${app.status === 'consulting' ? 'bg-[#0D9488] text-white' : 'bg-navy text-white'}`}>
             <span className="text-[7px] text-white/50 leading-none">Token</span>
             T-{app.token}
          </div>
          <div className="text-left">
             <p className="font-bold text-navy text-sm leading-tight">{app.patient}</p>
             <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-black text-navy/70 uppercase tracking-widest">{app.time}</span>
                <span className="w-1 h-1 bg-gray-200 rounded-full" />
                <Badge className={`text-[8px] px-3 ${getStatusStyle(app.status)}`}>{app.status === 'booked' ? 'scheduled' : app.status}</Badge>
             </div>
          </div>
       </div>
       <div className="flex flex-col gap-2">
          {app.status === 'completed' ? (
             <Button size="sm" onClick={() => navigate(`/doctor/appointments/${app.id}/consult`)} className="bg-[#0D9488] text-white rounded-xl text-[9px] px-4 py-2 flex items-center gap-2 shadow-lg shadow-[#0D9488]/20">
                <FileText size={12} /> View Rx
             </Button>
          ) : app.status === 'consulting' ? (
             <Button size="sm" onClick={() => navigate(`/doctor/appointments/${app.id}/consult`)} className="bg-[#0D9488] text-white shadow-lg border-none shadow-[#0D9488]/20 rounded-xl text-[9px] px-4 py-2 hover:bg-[#0D9488]/90 transition-all font-black">
                Prescribe
             </Button>
          ) : app.status === 'booked' ? (
             <Button size="sm" onClick={() => handleStartConsultation(app.id)} className="bg-navy text-white rounded-xl text-[9px] px-4 py-2 shadow-lg hover:bg-[#0D9488] transition-all">
                Start Session
             </Button>
          ) : (
             <Button 
               variant="outline" 
               size="sm" 
               onClick={() => { setSelectedAppointment(app); setDetailsModalOpen(true); }}
               className="rounded-xl border-gray-100 text-[9px] px-4 py-2 text-navy/70 font-black"
             >
                Details
             </Button>
          )}
       </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout title="Clinical Overview" role="doctor">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0D9488]" />
        </div>
      </DashboardLayout>
    );
  }

  // Find next upcoming patient in queue
  const nextPatient = todayAppointments.find(a => a.status === 'booked');
  const activeSession = todayAppointments.find(a => a.status === 'consulting');

  const calculateWaitTime = (appointmentId) => {
    const uncompleted = todayAppointments.filter(a => ['booked', 'consulting'].includes(a.status));
    const idx = uncompleted.findIndex(a => a.id === appointmentId);
    if (idx === -1) return 0;
    
    let mins = 0;
    for (let i = 0; i < idx; i++) {
      if (uncompleted[i].status === 'consulting') {
        mins += 10;
      } else {
        mins += 15;
      }
    }
    return mins;
  };

  return (
    <>
      <DashboardLayout title="Clinical Overview" role="doctor">
      <div className="max-w-7xl mx-auto space-y-10 pb-20 font-body animate-in fade-in duration-700">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="space-y-2 text-left">
              <div className="flex items-center gap-4">
                 <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
                   Welcome, <span className="text-[#0D9488]">Dr. {user?.name?.split(' ').pop()}</span>
                 </h1>
              </div>
              <p className="text-[10px] font-black text-navy/70 uppercase tracking-[0.25em] flex items-center gap-2">
                 <Activity size={14} className="text-[#0D9488]" /> 
                 {isIndependent ? 'Independent Private Clinic' : 'Hospital Practitioner'} • Cardiology • {todayAppointments.filter(a => a.status === 'booked').length} Slots Remaining
              </p>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 lg:grid lg:grid-cols-4 lg:mx-0 lg:px-0 gap-6 no-scrollbar snap-x snap-mandatory">
           {stats.map((stat, idx) => (
             <Card key={idx} className="min-w-[280px] lg:min-w-0 snap-center p-8 bg-white border border-gray-100 shadow-xl shadow-navy/5 rounded-[40px] hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full -mr-12 -mt-12 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative z-10 flex flex-col gap-4 text-left">
                   <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm`}>
                      {stat.icon}
                   </div>
                   <div>
                      <h4 className="text-3xl font-heading font-black text-navy leading-none mb-1">{stat.value}</h4>
                      <p className="text-[11px] font-black text-navy/70 uppercase tracking-[0.05em]">{stat.label}</p>
                   </div>
                </div>
             </Card>
           ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
           
           {/* Section: Unified vs Split View */}
           <div className="lg:col-span-8 space-y-8">
              {isIndependent ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Digital Clinic (Online) */}
                    <div className="space-y-6">
                       <div className="flex items-center justify-between px-2">
                          <h3 className="text-xs font-black text-navy uppercase tracking-[0.2em] flex items-center gap-3">
                             <Video size={18} className="text-purple-600" /> Digital Clinic (Online)
                          </h3>
                          <span className="text-[9px] font-black text-navy/40 uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full">
                             {todayAppointments.filter(a => a.type === 'Online').length} Slots
                          </span>
                       </div>
                       <div className="space-y-4">
                          {todayAppointments.filter(a => a.type === 'Online').length > 0 ? (
                            todayAppointments.filter(a => a.type === 'Online').map(app => (
                               <AppointmentCard key={app.id} app={app} />
                            ))
                          ) : (
                            <p className="text-xs font-bold text-navy/30 italic text-left p-4">No online slots booked today</p>
                          )}
                       </div>
                    </div>

                    {/* Physical Clinic (Offline) */}
                    <div className="space-y-6">
                       <div className="flex items-center justify-between px-2">
                          <h3 className="text-xs font-black text-navy uppercase tracking-[0.2em] flex items-center gap-3">
                             <Activity size={18} className="text-[#0D9488]" /> Physical Clinic (Offline)
                          </h3>
                          <span className="text-[9px] font-black text-navy/40 uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full">
                             {todayAppointments.filter(a => a.type === 'Physical').length} Slots
                          </span>
                       </div>
                       <div className="space-y-4">
                          {todayAppointments.filter(a => a.type === 'Physical').length > 0 ? (
                            todayAppointments.filter(a => a.type === 'Physical').map(app => (
                               <AppointmentCard key={app.id} app={app} />
                            ))
                          ) : (
                            <p className="text-xs font-bold text-navy/30 italic text-left p-4">No physical walk-ins booked today</p>
                          )}
                       </div>
                    </div>
                 </div>
              ) : (
                 <div className="space-y-6 h-full text-left">
                    <div className="flex items-center justify-between px-2 min-h-[40px]">
                       <div className="flex items-center gap-3">
                          <Users size={18} className="text-[#0D9488]" />
                          <h3 className="text-sm font-black text-navy uppercase tracking-widest">Hospital Consultations</h3>
                       </div>
                       <div className="flex items-center gap-4">
                          <Badge variant="success" className="text-[10px] px-4 font-black bg-[#0D9488] text-white">ACTIVE QUEUE</Badge>
                          <Link to="/doctor/appointments" className="text-[10px] font-black text-[#0D9488] hover:text-[#0D9488]/80 uppercase tracking-widest flex items-center gap-1 transition-colors">
                             View All <ChevronRight size={12} />
                          </Link>
                       </div>
                    </div>

                    <Card className="bg-white border border-gray-100 shadow-2xl shadow-navy/5 rounded-[48px] overflow-hidden">
                       <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                             <thead>
                                <tr className="bg-gray-100/50 border-b border-gray-200">
                                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-navy/80">Token</th>
                                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-navy/80">Patient Name</th>
                                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-navy/80">Mode</th>
                                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-navy/80 text-right">Action</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-50">
                                {todayAppointments.length > 0 ? (
                                  todayAppointments.map((app) => (
                                     <tr key={app.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${app.status === 'consulting' ? 'bg-[#0D9488] text-white' : 'bg-navy text-white'}`}>
                                              T-{app.token}
                                           </div>
                                        </td>
                                        <td className="px-8 py-6">
                                           <p className="font-bold text-navy text-sm leading-tight">{app.patient}</p>
                                           <div className="flex items-center gap-2 mt-1">
                                              <span className="text-[10px] font-black text-navy/70 uppercase tracking-widest">{app.time}</span>
                                              <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                              <Badge className={`text-[8px] px-3 ${getStatusStyle(app.status)}`}>{app.status === 'booked' ? 'scheduled' : app.status}</Badge>
                                           </div>
                                        </td>
                                        <td className="px-8 py-6">
                                           <div className="flex items-center gap-2 text-[10px] font-black text-navy/70 uppercase tracking-widest">
                                              {app.type === 'Online' ? <Video size={14} className="text-purple-500" /> : <Activity size={14} className="text-[#0D9488]" />}
                                              {app.type}
                                           </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                           {app.status === 'completed' ? (
                                              <Button size="sm" onClick={() => navigate(`/doctor/appointments/${app.id}/consult`)} className="bg-[#0D9488] text-white rounded-xl text-[9px] px-5 py-2 flex items-center gap-2 shadow-lg shadow-[#0D9488]/10 ml-auto border-none">
                                                 <FileText size={12} /> View Rx
                                              </Button>
                                           ) : app.status === 'consulting' ? (
                                              <Button size="sm" onClick={() => navigate(`/doctor/appointments/${app.id}/consult`)} className="bg-[#0D9488] text-white shadow-lg border-none shadow-[#0D9488]/20 rounded-xl text-[9px] px-5 py-2 hover:bg-[#0D9488]/90 transition-all font-black ml-auto">
                                                 Prescribe
                                              </Button>
                                           ) : app.status === 'booked' ? (
                                              <Button size="sm" onClick={() => handleStartConsultation(app.id)} className="bg-navy text-white rounded-xl text-[9px] px-5 py-2 shadow-lg hover:bg-[#0D9488] transition-all ml-auto border-none">
                                                 Start Session
                                              </Button>
                                           ) : (
                                              <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => { setSelectedAppointment(app); setDetailsModalOpen(true); }}
                                                className="rounded-xl border-gray-200 text-[9px] px-5 py-2 text-navy/70 font-black ml-auto"
                                              >
                                                 View Details
                                              </Button>
                                           )}
                                        </td>
                                     </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="px-8 py-10 text-center text-xs font-bold text-navy/35 italic">No appointments booked today</td>
                                  </tr>
                                )}
                             </tbody>
                          </table>
                       </div>
                    </Card>
                 </div>
               )}
           </div>
 
           {/* Sidebar: Next Patient */}
           <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center justify-between px-2 min-h-[40px]">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-navy/40">Queue Status</h3>
              </div>
 
              {/* Next Patient Focus Card */}
              <Card className="bg-navy rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-navy/20">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                 <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#0D9488]/10 rounded-full -ml-16 -mb-16 blur-3xl opacity-50" />
                 
                 <div className="relative z-10 space-y-8 text-left">
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-white">Coming Up Next</h4>
                          <p className="text-xs font-black text-[#0D9488]">
                            {nextPatient ? `Token T-${nextPatient.token} • ${nextPatient.type} Visit` : 'No upcoming patients'}
                          </p>
                       </div>
                       <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                          <Activity size={20} className="text-white" />
                       </div>
                    </div>
                    
                    {nextPatient ? (
                      <>
                        <div className="flex items-center gap-4 py-2">
                           <Avatar name={nextPatient.patient} size="xl" className="ring-4 ring-white/10" />
                           <div>
                              <p className="font-heading font-black text-2xl leading-tight text-white">{nextPatient.patient}</p>
                              <p className="text-[11px] font-black text-white/70 uppercase tracking-widest mt-1 italic">{nextPatient.type === 'Online' ? 'Video Consult' : 'Physical Visit'} • {nextPatient.time}</p>
                           </div>
                        </div>

                        <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                           <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase text-white/80 tracking-widest">Est. Wait Time</span>
                              <span className="text-xs font-black text-white flex items-center gap-2 mt-1">
                                 <Clock size={14} className="text-[#0D9488]" /> {calculateWaitTime(nextPatient.id)} mins
                              </span>
                           </div>
                           <Button 
                             onClick={() => handleStartConsultation(nextPatient.id)}
                             size="sm" 
                             className="bg-[#0D9488] text-white font-black text-[11px] rounded-[18px] px-6 py-3 hover:bg-[#0f766e] shadow-xl border-none transition-all"
                           >
                              Call Patient
                           </Button>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 text-center text-white/40 font-bold text-xs italic">
                        All scheduled patients have been served for today.
                      </div>
                    )}
                 </div>
              </Card>
           </div>
        </div>
      </div>
      </DashboardLayout>

      {/* Details Modal */}
      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setDetailsModalOpen(false)}
        title="Appointment Details"
        size="lg"
      >
        {selectedAppointment && (
          <div className="space-y-8">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                <div className="flex items-center gap-6">
                   <Avatar name={selectedAppointment.patient} size="xl" className="ring-4 ring-white shadow-xl" />
                   <div>
                      <h2 className="text-2xl font-black text-navy uppercase tracking-widest mb-1">{selectedAppointment.patient}</h2>
                      <div className="flex items-center gap-3">
                         <Badge className="bg-navy text-white text-[10px] px-4">Token T-{selectedAppointment.token}</Badge>
                         <span className="text-xs font-black text-navy/40 uppercase tracking-widest">{selectedAppointment.gender} • {selectedAppointment.age} Years</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <Badge className={`text-[10px] px-6 py-2 font-black uppercase tracking-widest ${getStatusStyle(selectedAppointment.status)}`}>
                      {selectedAppointment.status === 'booked' ? 'scheduled' : selectedAppointment.status}
                   </Badge>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6 text-left">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#0D9488]/10 flex items-center justify-center text-[#0D9488]"><Calendar size={18} /></div>
                      <h3 className="text-xs font-black text-navy uppercase tracking-widest">Visit Information</h3>
                   </div>
                   <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center text-sm font-bold">
                         <span className="text-navy/40 uppercase text-[10px] tracking-widest">Appointment Type</span>
                         <span className="text-navy">{selectedAppointment.type} Visit</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold">
                         <span className="text-navy/40 uppercase text-[10px] tracking-widest">Preferred Time</span>
                         <span className="text-navy">{selectedAppointment.time}</span>
                      </div>
                      {selectedAppointment.status === 'booked' && (
                         <div className="flex justify-between items-center text-sm font-bold">
                            <span className="text-navy/40 uppercase text-[10px] tracking-widest">Est. Wait Time</span>
                            <span className="text-navy">{calculateWaitTime(selectedAppointment.id)} mins</span>
                         </div>
                      )}
                      <div className="pt-4 border-t border-gray-50">
                         <span className="text-navy/40 uppercase text-[10px] tracking-widest block mb-2">Reason for Visit</span>
                         <p className="text-sm font-bold text-navy leading-relaxed">{selectedAppointment.reason || 'No description provided'}</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-6 text-left">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><User size={18} /></div>
                      <h3 className="text-xs font-black text-navy uppercase tracking-widest">Patient Details</h3>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                         <div className="flex items-center gap-2 mb-2">
                            <Mail size={14} className="text-blue-500" />
                            <span className="text-navy/40 uppercase text-[9px] font-black tracking-widest">Email</span>
                         </div>
                         <p className="text-xs font-bold text-navy truncate" title={selectedAppointment.email}>{selectedAppointment.email || 'N/A'}</p>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                         <div className="flex items-center gap-2 mb-2">
                            <Phone size={14} className="text-green-500" />
                            <span className="text-navy/40 uppercase text-[9px] font-black tracking-widest">Phone</span>
                         </div>
                         <p className="text-sm font-black text-navy">{selectedAppointment.phone || 'N/A'}</p>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                         <div className="flex items-center gap-2 mb-2">
                            <Droplet size={14} className="text-red-500" />
                            <span className="text-navy/40 uppercase text-[9px] font-black tracking-widest">Blood Group</span>
                         </div>
                         <p className="text-sm font-black text-navy">{selectedAppointment.bloodGroup || 'N/A'}</p>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                         <div className="flex items-center gap-2 mb-2">
                            <MapPin size={14} className="text-orange-500" />
                            <span className="text-navy/40 uppercase text-[9px] font-black tracking-widest">Address</span>
                         </div>
                         <p className="text-xs font-bold text-navy truncate" title={selectedAppointment.address}>{selectedAppointment.address || 'N/A'}</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="pt-8 border-t border-gray-100 flex items-center justify-end gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setDetailsModalOpen(false)}
                  className="rounded-2xl px-8 border-gray-200 font-bold"
                >
                   Close
                </Button>
                {selectedAppointment.status === 'booked' && (
                   <Button 
                      onClick={() => {
                        setDetailsModalOpen(false);
                        handleStartConsultation(selectedAppointment.id);
                      }} 
                      className="bg-[#0D9488] text-white rounded-2xl px-10 shadow-xl border-none font-black text-[10px] h-12 uppercase tracking-widest"
                   >
                      Start Consultation
                   </Button>
                )}
             </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default DoctorDashboard;
