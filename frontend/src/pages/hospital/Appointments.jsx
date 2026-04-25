import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, Avatar, EmptyState } from '../../components/common';
import { 
  Plus, Search, Check, X, Bell, 
  Calendar, Clock, User, Hash, 
  Filter, ChevronRight, MoreVertical,
  Volume2, CheckCircle2, AlertCircle,
  Receipt, MessageSquare, ChevronDown, 
  Activity, Users, ChevronUp, Stethoscope,
  CalendarDays, ArrowRight
} from 'lucide-react';

const HospitalAppointments = () => {
  const [activeTab, setActiveTab] = useState('Today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('all');
  const [expandedDoctors, setExpandedDoctors] = useState([]);
  const [doctorSlots, setDoctorSlots] = useState({ 1: 0, 2: 0, 3: 0 });
  
  // Date Filtering State
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Helper to get formatted dates
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Sync with doctors list
  const doctorsList = [
    { 
      id: 1, 
      name: 'Dr. Sarah Wilson', 
      image: '/images/doctors/sarah.png', 
      specialization: 'Cardiology',
      slots: [{ start: '09:00', end: '13:00' }, { start: '17:00', end: '20:00' }]
    },
    { 
      id: 2, 
      name: 'Dr. Anil Kumar', 
      image: '/images/doctors/anil.png', 
      specialization: 'Neurology',
      slots: [{ start: '11:00', end: '17:00' }]
    },
    { 
      id: 3, 
      name: 'Dr. James Chen', 
      image: '/images/doctors/james.png', 
      specialization: 'Orthopedics',
      slots: [{ start: '10:00', end: '14:00' }]
    }
  ];

  const appointmentsData = [
    // Dr. Sarah Wilson - Slot 0 (9-1)
    { id: 101, doctorId: 1, slotIndex: 0, token: 1, patientName: 'Rajesh Sharma', time: '09:00 AM', date: today, status: 'Completed', type: 'General Checkup' },
    { id: 102, doctorId: 1, slotIndex: 0, token: 2, patientName: 'Amit Verma', time: '09:15 AM', date: today, status: 'Consulting', type: 'Follow-up' },
    { id: 103, doctorId: 1, slotIndex: 0, token: 3, patientName: 'Sunita Paul', time: '09:30 AM', date: today, status: 'In Queue', type: 'Consultation' },
    { id: 104, doctorId: 1, slotIndex: 0, token: 4, patientName: 'Vikram Seth', time: '09:45 AM', date: today, status: 'Not Started Consulting', type: 'Heart Check' },
    
    // Dr. Sarah Wilson - Slot 1 (5-8)
    { id: 106, doctorId: 1, slotIndex: 1, token: 1, patientName: 'Rahul Mehra', time: '05:00 PM', date: today, status: 'Not Started Consulting', type: 'Consultation' },
    { id: 107, doctorId: 1, slotIndex: 1, token: 2, patientName: 'Sonia Gandhi', time: '05:15 PM', date: today, status: 'Not Started Consulting', type: 'BP Check' },

    { id: 105, doctorId: 1, slotIndex: 0, token: 5, patientName: 'Ananya Rai', time: '12:00 PM', date: today, status: 'Not Started Consulting', type: 'Routine' },
    
    { id: 201, doctorId: 2, slotIndex: 0, token: 1, patientName: 'Priyanka Das', time: '10:00 AM', date: today, status: 'Consulting', type: 'Neurology' },
    { id: 202, doctorId: 2, slotIndex: 0, token: 2, patientName: 'Kavita Iyer', time: '10:30 AM', date: today, status: 'In Queue', type: 'Checkup' },
    { id: 203, doctorId: 2, slotIndex: 0, token: 3, patientName: 'Sanjay Jain', time: '01:00 PM', date: today, status: 'Not Started Consulting', type: 'Brain Scan' },
    
    { id: 501, doctorId: 1, slotIndex: 0, token: 10, patientName: 'Past Patient 1', time: '04:00 PM', date: yesterday, status: 'Completed', type: 'Follow-up' },
    { id: 502, doctorId: 3, slotIndex: 0, token: 5, patientName: 'Past Patient 2', time: '02:00 PM', date: yesterday, status: 'Cancelled', type: 'Emergency' },
    
    { id: 301, doctorId: 3, slotIndex: 0, token: 1, patientName: 'Suresh Raina', time: '11:00 AM', date: tomorrow, status: 'Not Started Consulting', type: 'Orthopedic' },
    { id: 302, doctorId: 3, slotIndex: 0, token: 2, patientName: 'MS Dhoni', time: '11:30 AM', date: '2026-04-12', status: 'Not Started Consulting', type: 'Knee Check' }
  ];

  const tabs = ['Today', 'Yesterday', 'Tomorrow', 'Custom'];

  const toggleDoctor = (id) => {
    setExpandedDoctors(prev => 
      prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]
    );
  };

  const getStatusPriority = (status) => {
    switch (status) {
      case 'Consulting': return 1;
      case 'Next': return 2;
      case 'In Queue': return 3;
      case 'Not Started Consulting': return 4;
      case 'Scheduled': return 5;
      case 'Completed': return 6;
      case 'Cancelled': return 7;
      default: return 8;
    }
  };

  const getFilteredAppointments = (docId, slotIndex) => {
    let filtered = appointmentsData.filter(app => {
        const matchesDoctor = app.doctorId === docId;
        const matchesSlot = slotIndex === undefined || app.slotIndex === slotIndex;
        const matchesSearch = app.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              `T-${app.token}`.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesDoctor || !matchesSlot || !matchesSearch) return false;

        if (activeTab === 'Today') return app.date === today;
        if (activeTab === 'Yesterday') return app.date === yesterday;
        if (activeTab === 'Tomorrow') return app.date === tomorrow;
        if (activeTab === 'Custom') return app.date === customDate;
        return true;
    });

    // Automated "Next" Logic for TODAY or TOMORROW or CUSTOM view
    if (activeTab === 'Today' || activeTab === 'Tomorrow' || activeTab === 'Custom') {
        const firstInQueue = filtered
            .filter(a => a.status === 'In Queue')
            .sort((a, b) => a.token - b.token)[0];
        
        if (firstInQueue) {
            filtered = filtered.map(app => {
                if (app.id === firstInQueue.id) {
                    return { ...app, status: 'Next' };
                }
                return app;
            });
        }
    }

    // Natural Sorting: Date (Asc) -> Token (Asc)
    // Status priority is ignored for the main list order as per user request
    return filtered.sort((a, b) => {
        // First sort by Date
        if (a.date !== b.date) {
            return new Date(a.date) - new Date(b.date);
        }
        
        // Then by Token for ascending order
        return a.token - b.token;
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Next': return 'bg-purple-100 text-purple-900 border-purple-300 font-black animate-pulse';
      case 'Consulting': return 'bg-blue-100 text-blue-800 border-blue-300 font-black';
      case 'In Queue': return 'bg-orange-100 text-orange-900 border-orange-300 font-black';
      case 'Not Started Consulting': return 'bg-slate-100 text-slate-500 border-slate-200/60 font-black italic opacity-70';
      case 'Scheduled': return 'bg-slate-200/50 text-slate-700 border-slate-400/30 font-black';
      case 'Completed': return 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/30 font-black';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-300 font-black';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <DashboardLayout title="Operational Flow" role="hospital">
      <div className="max-w-7xl mx-auto space-y-8 pb-20 font-body">
        
        {/* Header & Advanced Filtering Navigation */}
        <div className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-heading font-black text-navy tracking-tight">Consultation Monitoring</h1>
              <div className="flex items-center gap-3">
                 <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-[0.25em] flex items-center gap-2">
                    <Activity size={14} /> Global Status Tracker
                 </p>
                 <span className="w-1 h-1 bg-gray-200 rounded-full" />
                 <p className="text-[10px] font-black text-navy/70 uppercase tracking-[0.25em]">
                    {selectedDoctorId === 'all' ? 'All Staff Active' : doctorsList.find(d => d.id === parseInt(selectedDoctorId))?.name}
                 </p>
              </div>
            </div>
            
            <div className="flex bg-gray-50 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto scroller-hidden">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                      activeTab === tab ? 'bg-white text-[#0D9488] shadow-lg shadow-navy/5' : 'text-navy/60 hover:text-navy/80'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
            </div>
          </div>

          {/* Contextual Date Controls */}
          {activeTab === 'Custom' && (
            <div className="flex flex-col md:flex-row items-end gap-6 p-6 bg-[#F0F9FF] rounded-[32px] animate-in fade-in slide-in-from-top-2 duration-300">
               <div className="relative flex-1 group">
                  <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-navy/20 group-focus-within:text-[#0D9488] transition-colors" />
                  <input 
                    type="text"
                    placeholder="Quick Search Patient..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-white border-2 border-transparent focus:border-[#0D9488]/20 rounded-2xl text-xs font-bold outline-none shadow-sm transition-all"
                  />
               </div>
               
               <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-navy/30 uppercase tracking-widest pl-1">Target Date</label>
                  <div className="relative">
                     <CalendarDays size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0D9488]" />
                     <input 
                       type="date" 
                       value={customDate}
                       onChange={(e) => setCustomDate(e.target.value)}
                       className="pl-11 pr-5 py-3.5 bg-white rounded-2xl border-none text-xs font-black text-navy shadow-sm outline-none ring-2 ring-transparent focus:ring-[#0D9488]/10"
                     />
                  </div>
               </div>
            </div>
          )}

          {activeTab !== 'Custom' && (
              <div className="flex flex-col md:flex-row items-center gap-4 w-full group">
                  <div className="relative flex-1 group">
                      <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-navy/40 group-focus-within:text-[#0D9488] transition-colors" />
                      <input 
                        type="text"
                        placeholder={`Monitor ${activeTab}'s Consultations (by Name or Token)...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-8 py-5 bg-gray-50 border-none rounded-[24px] text-sm font-bold text-navy outline-none focus:ring-2 focus:ring-[#0D9488]/10 focus:bg-white transition-all placeholder:text-navy/40 shadow-inner"
                      />
                  </div>

                  <div className="w-full md:w-72">
                     <div className="relative">
                        <select 
                           value={selectedDoctorId}
                           onChange={(e) => {
                              const val = e.target.value;
                              setSelectedDoctorId(val);
                              if (val !== 'all') setExpandedDoctors([parseInt(val)]);
                              else setExpandedDoctors([1, 2, 3]);
                           }}
                           className="w-full bg-gray-50 border-none rounded-[24px] px-6 py-5 text-xs font-black text-navy appearance-none outline-none focus:ring-2 focus:ring-[#0D9488]/10 transition-all cursor-pointer"
                        >
                           <option value="all">Display All Doctors</option>
                           {doctorsList.map(doc => (
                             <option key={doc.id} value={doc.id}>{doc.name}</option>
                           ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-navy/60 pointer-events-none" />
                     </div>
                  </div>
              </div>
          )}
        </div>

        {/* Doctor-Grouped Tables */}
        <div className="space-y-6">
           {doctorsList
             .filter(d => selectedDoctorId === 'all' || d.id === parseInt(selectedDoctorId))
             .map(doctor => {
              const selectedSlotIdx = doctorSlots[doctor.id] || 0;
              const docApps = getFilteredAppointments(doctor.id, selectedSlotIdx);
              const isExpanded = expandedDoctors.includes(doctor.id);
              
              return (
                 <div key={doctor.id} className="animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* Collapsible Header */}
                    <div 
                       className={`p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer group transition-all rounded-[32px] ${
                          isExpanded ? 'bg-white shadow-xl shadow-navy/5 mb-6 ring-1 ring-gray-100' : 'bg-white hover:bg-gray-50 border border-transparent'
                       }`}
                    >
                       <div 
                         onClick={() => toggleDoctor(doctor.id)}
                         className="flex items-center gap-5 flex-1"
                       >
                          <Avatar src={doctor.image} name={doctor.name} size="lg" className="shadow-lg shadow-[#0D9488]/5 ring-4 ring-white" />
                          <div>
                             <h3 className="text-base font-black text-navy flex items-center gap-2">
                                {doctor.name}
                                {docApps.some(a => a.status === 'Consulting') && (
                                   <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                                )}
                             </h3>
                             <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-[0.2em]">{doctor.specialization}</p>
                          </div>
                       </div>

                       <div className="flex flex-col md:flex-row items-center gap-6 mt-4 md:mt-0">
                          {/* Time Slot Dropdown - ONLY if multiple slots exist */}
                          {doctor.slots.length > 1 && (
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                               <select 
                                 value={selectedSlotIdx}
                                 onChange={(e) => setDoctorSlots(prev => ({ ...prev, [doctor.id]: parseInt(e.target.value) }))}
                                 className="pl-9 pr-8 py-2.5 bg-gray-50 hover:bg-gray-100 border-none rounded-xl text-[10px] font-black text-navy uppercase tracking-widest appearance-none outline-none focus:ring-2 focus:ring-[#0D9488]/10 transition-all cursor-pointer shadow-sm"
                               >
                                 {doctor.slots.map((slot, idx) => (
                                   <option key={idx} value={idx}>Slot: {slot.start} - {slot.end}</option>
                                 ))}
                               </select>
                               <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D9488]" />
                               <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/40 pointer-events-none" />
                            </div>
                          )}

                          {doctor.slots.length === 1 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-[9px] font-black text-navy/40 uppercase tracking-widest">
                               <Clock size={12} className="text-[#0D9488]/30" />
                               {doctor.slots[0].start} - {doctor.slots[0].end}
                            </div>
                          )}

                          <div className="flex items-center gap-6">
                            <div className="text-center px-4 border-r border-gray-100 hidden sm:block">
                               <p className="text-base font-black text-navy leading-none mb-1">{docApps.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled').length}</p>
                               <p className="text-[8px] font-black text-navy/60 uppercase tracking-widest">Active</p>
                            </div>
                            <div 
                              onClick={() => toggleDoctor(doctor.id)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isExpanded ? 'rotate-180 bg-[#0D9488] text-white' : 'bg-gray-100 text-navy/30'}`}
                            >
                               <ChevronDown size={20} />
                            </div>
                          </div>
                       </div>
                    </div>

                    {/* Patients List (Dropdown Content) */}
                    {isExpanded && (
                       <Card className="bg-white border border-gray-100 shadow-2xl shadow-navy/5 overflow-hidden rounded-[40px] animate-in zoom-in-95 duration-300 transform-gpu">
                          {docApps.length > 0 ? (
                             <div className="p-4 md:p-8 space-y-4">
                                <div className="flex items-center justify-between px-6 pb-2 border-b border-gray-50">
                                   <p className="text-[10px] font-black text-navy/20 uppercase tracking-[0.2em]">Patient / Identity</p>
                                   <p className="text-[10px] font-black text-navy/20 uppercase tracking-[0.2em]">Token & Live Status</p>
                                </div>
                                <div className="space-y-3">
                                   {docApps.map(app => (
                                      <div key={app.id} className="flex items-center justify-between p-5 bg-gray-50/50 hover:bg-[#F0F9FF]/50 rounded-[28px] transition-all border border-transparent hover:border-[#0D9488]/10 group">
                                         <div className="flex items-center gap-5">
                                            <div className={`w-12 h-10 rounded-2xl flex items-center justify-center font-black text-[10px] tracking-tight shadow-sm transition-all group-hover:scale-105 ${app.status === 'Next' ? 'bg-purple-600 text-white shadow-purple-200' : 'bg-navy text-white'}`}>
                                               T-{app.token}
                                            </div>
                                            <div>
                                               <p className="font-bold text-navy text-sm leading-tight group-hover:text-[#0D9488] transition-colors">{app.patientName}</p>
                                               <p className="text-[9px] font-black text-navy/20 uppercase tracking-tighter mt-1 flex items-center gap-2">
                                                  {app.type} <span className="w-1 h-1 bg-gray-200 rounded-full" /> {app.time}
                                               </p>
                                            </div>
                                         </div>
                                         <div className="flex items-center gap-4">
                                            <div className={`inline-flex px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest shadow-sm transition-all ${getStatusStyle(app.status)}`}>
                                               {app.status === 'Consulting' && <Activity size={10} className="mr-1.5 animate-pulse" />}
                                               {app.status === 'Next' && <Volume2 size={10} className="mr-1.5" />}
                                               {app.status}
                                            </div>
                                            <button className="p-2 text-navy/20 hover:text-navy hover:bg-white rounded-full transition-all opacity-0 group-hover:opacity-100">
                                               <MoreVertical size={16} />
                                            </button>
                                         </div>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          ) : (
                             <div className="p-16 text-center">
                                <Users size={40} className="mx-auto text-gray-100 mb-4" />
                                <p className="text-xs font-black text-navy/20 uppercase tracking-widest">No appointments registered for this slot.</p>
                             </div>
                          )}
                       </Card>
                    )}
                 </div>
              );
           })}
        </div>
        
      </div>
    </DashboardLayout>
  );
};

export default HospitalAppointments;
