import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, Avatar, Modal } from '../../components/common';
import { 
  Users, Calendar, Video, Activity, Clock, 
  Search, CheckCircle2, ChevronRight, VideoOff,
  Stethoscope, FileText, Plus, Heart, Thermometer, User, PlusCircle, Trash2,
  Mail, Phone, MapPin, Droplet
} from 'lucide-react';
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

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const [appointmentTab, setAppointmentTab] = useState('Upcoming'); // 'Upcoming', 'Completed', 'Cancelled'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'yesterday', 'tomorrow', 'custom'
  const [customDate, setCustomDate] = useState(getLocalDateString(new Date()));
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await doctorService.getAppointments();
      setAppointments(data);
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Helper to check if a cancelled slot was rebooked by someone else
  const isSlotRebooked = (app) => {
    if (app.status !== 'cancelled') return false;
    const slotId = app.slot_id?._id || app.slot_id;
    return appointments.some(other => {
      const otherSlotId = other.slot_id?._id || other.slot_id;
      return otherSlotId?.toString() === slotId?.toString() &&
             ['booked', 'consulting', 'completed'].includes(other.status);
    });
  };

  // For Upcoming/queue logic: hide cancelled appointments if slot was rebooked
  const activeAndVisibleAppointments = appointments.filter(app => {
    if (app.status !== 'cancelled') return true;
    return !isSlotRebooked(app); // Only hide in non-cancelled contexts
  });

  // Compute tokens and details dynamically
  const sortedAppointments = [...activeAndVisibleAppointments].sort((a, b) => {
    if (!a.slot_id?.start_datetime || !b.slot_id?.start_datetime) return 0;
    return new Date(a.slot_id.start_datetime) - new Date(b.slot_id.start_datetime);
  });

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
      type: isOnline ? 'Online' : 'Physical',
      wasRebooked: isSlotRebooked(app),
    };
  });

  // For the Cancelled tab: show ALL cancelled appointments (including those whose slot was rebooked)
  const allCancelledProcessed = appointments
    .filter(app => app.status === 'cancelled')
    .sort((a, b) => {
      if (!a.slot_id?.start_datetime || !b.slot_id?.start_datetime) return 0;
      return new Date(a.slot_id.start_datetime) - new Date(b.slot_id.start_datetime);
    })
    .map(app => {
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
        type: isOnline ? 'Online' : 'Physical',
        wasRebooked: isSlotRebooked(app),
      };
    });


  const getFilterDateStr = (filterType) => {
    const today = new Date();
    if (filterType === 'today') {
      return getLocalDateString(today);
    } else if (filterType === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return getLocalDateString(yesterday);
    } else if (filterType === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return getLocalDateString(tomorrow);
    } else if (filterType === 'custom') {
      return customDate;
    }
    return null;
  };

  const getTabCount = (tabName) => {
    if (tabName === 'Cancelled') {
      // Count ALL cancelled appointments (including rebooked slots)
      return allCancelledProcessed.filter(app => {
        if (dateFilter !== 'all') {
          if (!app.slot_id?.start_datetime) return false;
          const appDate = getLocalDateString(app.slot_id.start_datetime);
          const targetDate = getFilterDateStr(dateFilter);
          if (appDate !== targetDate) return false;
        }
        return true;
      }).length;
    }
    return processedAppointments.filter(app => {
      let matchesTab = false;
      if (tabName === 'Upcoming') {
        matchesTab = ['booked', 'consulting'].includes(app.status);
      } else if (tabName === 'Completed') {
        matchesTab = app.status === 'completed';
      }
      if (!matchesTab) return false;

      if (dateFilter !== 'all') {
        if (!app.slot_id?.start_datetime) return false;
        const appDate = getLocalDateString(app.slot_id.start_datetime);
        const targetDate = getFilterDateStr(dateFilter);
        if (appDate !== targetDate) return false;
      }
      return true;
    }).length;
  };

  const todayStr = getLocalDateString(new Date());
  const todayAppointments = processedAppointments.filter(app => {
    if (!app.slot_id?.start_datetime) return false;
    const appDate = getLocalDateString(app.slot_id.start_datetime);
    return appDate === todayStr;
  });

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

  const filteredAppointments = appointmentTab === 'Cancelled'
    ? allCancelledProcessed.filter(app => {
        if (dateFilter !== 'all') {
          if (!app.slot_id?.start_datetime) return false;
          const appDate = getLocalDateString(app.slot_id.start_datetime);
          const targetDate = getFilterDateStr(dateFilter);
          if (appDate !== targetDate) return false;
        }
        return true;
      })
    : processedAppointments.filter(app => {
        let matchesTab = false;
        if (appointmentTab === 'Upcoming') {
          matchesTab = ['booked', 'consulting'].includes(app.status);
        } else if (appointmentTab === 'Completed') {
          matchesTab = app.status === 'completed';
        }
        if (!matchesTab) return false;

        if (dateFilter !== 'all') {
          if (!app.slot_id?.start_datetime) return false;
          const appDate = getLocalDateString(app.slot_id.start_datetime);
          const targetDate = getFilterDateStr(dateFilter);
          if (appDate !== targetDate) return false;
        }
        return true;
      });


  const getStatusStyle = (status) => {
    switch (status) {
      case 'consulting': return 'bg-[#0D9488] text-white border-teal-700 font-black shadow-md animate-pulse';
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

  if (loading) {
    return (
      <DashboardLayout title="Appointments & Consultations" role="doctor">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0D9488]" />
        </div>
      </DashboardLayout>
    );
  }

  const activeSession = processedAppointments.find(a => a.status === 'consulting');

  return (
    <DashboardLayout title="Appointments & Consultations" role="doctor">
      <div className="max-w-7xl mx-auto space-y-8 pb-20 font-body animate-in fade-in duration-700">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Consultation <span className="text-[#0D9488]">Queue</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <Calendar size={14} className="text-[#0D9488]" /> Manage your schedule and patient encounters
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex bg-[#EEF2F6] p-1 rounded-2xl border border-gray-150">
                {['all', 'today', 'yesterday', 'tomorrow', 'custom'].map(filterType => (
                   <button
                      key={filterType}
                      onClick={() => setDateFilter(filterType)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                         dateFilter === filterType 
                            ? 'bg-white text-navy shadow-md' 
                            : 'text-navy/50 hover:text-navy'
                      }`}
                   >
                      {filterType}
                   </button>
                ))}
             </div>
             {dateFilter === 'custom' && (
                <div className="relative animate-in slide-in-from-left-2 duration-200">
                   <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D9488]" />
                   <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-bold text-navy outline-none"
                   />
                </div>
             )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {['Upcoming', 'Completed', 'Cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setAppointmentTab(tab)}
              className={`px-8 py-4 text-sm font-black transition-all border-b-2 ${appointmentTab === tab ? 'border-[#0D9488] text-[#0D9488]' : 'border-transparent text-navy/40 hover:text-navy hover:bg-gray-50/50'}`}
            >
              {tab.toUpperCase()} ({getTabCount(tab)})
            </button>
          ))}
        </div>

        {/* Main List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* List Column */}
          <div className="lg:col-span-2 space-y-4">
             {filteredAppointments.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-[32px] p-12 text-center flex flex-col items-center">
                   <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                      <Calendar size={32} />
                   </div>
                   <h3 className="text-xl font-black text-navy">No {appointmentTab.toLowerCase()} appointments</h3>
                   <p className="text-sm font-bold text-navy/40 mt-2">Try changing your filters to see more results.</p>
                </div>
             ) : (
                filteredAppointments.map(app => (
                   <Card key={app.id} className={`p-6 bg-white border ${app.status === 'consulting' ? 'border-[#0D9488] shadow-lg shadow-[#0D9488]/5 ring-1 ring-[#0D9488]/10' : app.status === 'cancelled' ? 'border-red-100' : 'border-gray-100'} rounded-[32px] hover:-translate-y-1 transition-all duration-300 group`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                         
                         <div className="flex items-center gap-5">
                            <div className="relative">
                               <Avatar name={app.patient} size="lg" className={`${app.status === 'consulting' ? 'ring-4 ring-[#0D9488]/20' : app.status === 'cancelled' ? 'opacity-60' : ''}`} />
                               <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 border border-gray-100 shadow-sm">
                                  <Stethoscope size={14} className={app.status === 'cancelled' ? 'text-red-400' : 'text-[#0D9488]'} />
                               </div>
                            </div>
                            <div>
                               <h3 className={`text-base font-black leading-none mb-1 ${app.status === 'cancelled' ? 'text-navy/50' : 'text-navy'}`}>{app.patient}</h3>
                               <p className="text-[10px] font-black tracking-widest uppercase text-navy/40 flex items-center gap-2 mt-1">
                                  {app.date} • {app.time} • Token T-{app.token} • <span className="text-teal-600 font-bold">{app.type}</span>
                               </p>
                               {app.status === 'cancelled' && app.wasRebooked && (
                                  <p className="text-[9px] font-black tracking-widest uppercase text-orange-500 mt-1">⟳ Slot was rebooked by another patient</p>
                               )}
                               {app.status === 'cancelled' && app.cancellation_reason && (
                                  <p className="text-[9px] font-black text-red-400 mt-0.5 uppercase tracking-wider">Reason: {app.cancellation_reason}</p>
                               )}
                            </div>
                         </div>

                         <div className="flex flex-col sm:items-end gap-3">
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                               <Badge className={`text-[9px] px-4 py-1.5 ${getStatusStyle(app.status)}`}>
                                  {app.status === 'booked' ? 'SCHEDULED' : app.status.toUpperCase()}
                               </Badge>
                               {app.status === 'cancelled' && app.wasRebooked && (
                                  <Badge className="text-[9px] px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 font-bold">
                                     SLOT REBOOKED
                                  </Badge>
                               )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                               <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => { setSelectedAppointment(app); setDetailsModalOpen(true); }}
                                  className="rounded-xl border-gray-200 text-[10px] px-4 py-2 font-black"
                                >
                                  DETAILS
                               </Button>

                               {app.status === 'consulting' ? (
                                  <Button 
                                    size="sm" 
                                    onClick={() => navigate(`/doctor/appointments/${app.id}/consult`)} 
                                    className="bg-[#0D9488] text-white border-none shadow-lg shadow-[#0D9488]/20 rounded-xl text-[10px] px-4 py-2 font-black"
                                  >
                                    OPEN DETAILS
                                  </Button>
                               ) : app.status === 'booked' ? (
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleStartConsultation(app.id)} 
                                    className="bg-navy text-white rounded-xl text-[10px] px-4 py-2 font-black hover:bg-[#0D9488] transition-colors"
                                  >
                                    START CONSULTATION
                                  </Button>
                               ) : app.status === 'completed' ? (
                                  <Button 
                                    size="sm" 
                                    onClick={() => navigate(`/doctor/appointments/${app.id}/consult`)} 
                                    className="bg-gray-100 text-navy hover:bg-[#0D9488]/10 hover:text-[#0D9488] rounded-xl text-[10px] px-4 py-2 font-black border-transparent"
                                  >
                                    VIEW RX
                                  </Button>
                               ) : null}
                            </div>
                         </div>

                      </div>
                   </Card>
                ))
             )}
          </div>

          {/* Sidebar Area: Today's Summary & Active Session Focus */}
          <div className="lg:col-span-1 space-y-6 sticky top-[100px]">
             <div className="bg-[#0D9488] p-8 rounded-[40px] text-white shadow-xl shadow-[#0D9488]/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-4">Today's Summary</h3>
                <div className="space-y-6 relative z-10">
                   <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <span className="text-sm font-bold opacity-90">Total Patients</span>
                      <span className="text-2xl font-black">{processedAppointments.length}</span>
                   </div>
                   <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <span className="text-sm font-bold opacity-90">Completed</span>
                      <span className="text-xl font-black">{processedAppointments.filter(a => a.status === 'completed').length}</span>
                   </div>
                   <div className="flex items-center justify-between pb-2">
                      <span className="text-sm font-bold opacity-90 flex items-center gap-2"><Stethoscope size={14}/> Physical Visits</span>
                      <span className="text-xl font-black">{processedAppointments.filter(a => a.type === 'Physical').length}</span>
                   </div>
                </div>
             </div>

             {activeSession && (
                <div className="bg-navy p-6 rounded-[40px] text-white shadow-xl shadow-navy/20">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0D9488] mb-4 text-center">Active Session Focus</h3>
                   <div className="text-center space-y-2">
                      <Avatar name={activeSession.patient} size="xl" className="mx-auto ring-4 ring-white/10 mb-4" />
                      <h4 className="text-xl font-black">{activeSession.patient}</h4>
                      <p className="text-xs text-white/50">{activeSession.reason ? activeSession.reason.slice(0, 50) + '...' : 'General Checkup'}</p>
                      <Button 
                        onClick={() => navigate(`/doctor/appointments/${activeSession.id}/consult`)} 
                        className="mt-4 w-full bg-[#0D9488] text-white rounded-xl text-[10px] font-black uppercase tracking-widest border-none hover:bg-[#0D9488]/90"
                      >
                         Go to Consultation Room
                      </Button>
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Appointment Details Modal */}
      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setDetailsModalOpen(false)}
        title="Appointment Details"
        size="lg"
      >
        {selectedAppointment && (
          <div className="space-y-8">
             {/* Patient Demographics */}
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
                      {selectedAppointment.status === 'booked' ? 'SCHEDULED' : selectedAppointment.status}
                   </Badge>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visit Information */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#0D9488]/10 flex items-center justify-center text-[#0D9488]">
                         <Calendar size={18} />
                      </div>
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

                {/* Patient Details */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                         <User size={18} />
                      </div>
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

             {/* Actions */}
             <div className="pt-8 border-t border-gray-100 flex items-center justify-end gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setDetailsModalOpen(false)}
                  className="rounded-2xl px-8 border-gray-200"
                >
                   Close
                </Button>
                {selectedAppointment.status === 'booked' && (
                   <Button 
                      onClick={() => {
                        setDetailsModalOpen(false);
                        handleStartConsultation(selectedAppointment.id);
                      }} 
                      className="bg-[#0D9488] text-white rounded-2xl px-10 shadow-xl shadow-[#0D9488]/20 border-none font-black text-[10px] h-12 uppercase tracking-widest"
                   >
                      Start Consultation
                   </Button>
                )}
             </div>
          </div>
        )}
      </Modal>

    </DashboardLayout>
  );
};

export default DoctorAppointments;
