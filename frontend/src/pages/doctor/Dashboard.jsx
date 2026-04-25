import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Users, Calendar, Video, Star, 
  Activity, Clock, ChevronRight,
  MoreVertical, Search, CheckCircle2,
  VideoOff, MessageSquare, AlertCircle,
  FileText, Play, Plus, Trash2, PlusCircle,
  Heart, Thermometer, Info, User
} from 'lucide-react';
import { Card, Button, Badge, Avatar, Modal, Input } from '../../components/common';

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isIndependent, setIsIndependent] = useState(false);
  
  // Prescription Modal State
  const [isPrescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: '',
    notes: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '' }]
  });

  const handlePrescriptionClick = (patient) => {
    setSelectedPatient(patient);
    setPrescriptionForm({
      diagnosis: '',
      notes: '',
      medicines: [{ name: '', dosage: '', frequency: '', duration: '' }]
    });
    setPrescriptionModalOpen(true);
  };

  const addMedicine = () => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', frequency: '', duration: '' }]
    }));
  };

  const updateMedicine = (index, field, value) => {
    const updatedMedicines = [...prescriptionForm.medicines];
    updatedMedicines[index][field] = value;
    setPrescriptionForm(prev => ({ ...prev, medicines: updatedMedicines }));
  };

  const removeMedicine = (index) => {
    if (prescriptionForm.medicines.length > 1) {
      const updatedMedicines = prescriptionForm.medicines.filter((_, i) => i !== index);
      setPrescriptionForm(prev => ({ ...prev, medicines: updatedMedicines }));
    }
  };

  const handleSubmitPrescription = (e) => {
    e.preventDefault();
    console.log('Submitting Prescription:', { patient: selectedPatient, ...prescriptionForm });
    // Mock API call or transition to "Completed" status could happen here
    setPrescriptionModalOpen(false);
  };

  const rawAppointments = [
    { id: 1, patient: 'Rajesh Khanna', time: '10:00 AM', type: 'Physical', status: 'Consulting', token: 1, age: 45, gender: 'Male', reason: 'Persistent abdominal discomfort and mild fever since 3 days.', vitals: { bp: '132/88', pulse: '78', temp: '99.1°F', weight: '74kg' } },
    { id: 2, patient: 'Sneha Kapoor', time: '10:30 AM', type: 'Online', status: 'Next', token: 2, age: 28, gender: 'Female', reason: 'Post-op follow up and prescription renewal.', vitals: { bp: '110/70', pulse: '72', temp: '98.4°F', weight: '58kg' } },
    { id: 3, patient: 'Arjun Mehra', time: '11:00 AM', type: 'Physical', status: 'Scheduled', token: 3, age: 52, gender: 'Male', reason: 'Annual cardiac screening and cholesterol review.', vitals: { bp: '145/95', pulse: '84', temp: '98.6°F', weight: '88kg' } },
    { id: 4, patient: 'Priya Sharma', time: '11:30 AM', type: 'Online', status: 'Completed', token: 4, age: 34, gender: 'Female', reason: 'Follow up on laboratory results for chest pain.', vitals: { bp: '120/80', pulse: '70', temp: '98.6°F', weight: '65kg' } },
    { id: 5, patient: 'Amit Verma', time: '12:00 PM', type: 'Physical', status: 'Scheduled', token: 5, age: 19, gender: 'Male', reason: 'Routine sports physical and vaccination update.', vitals: { bp: '118/76', pulse: '64', temp: '98.2°F', weight: '70kg' } }
  ];

  const todayAppointments = isIndependent 
    ? rawAppointments 
    : rawAppointments.filter(app => app.type === 'Physical');

  const stats = [
    { label: 'Appointments Today', value: todayAppointments.length.toString(), icon: <Calendar size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    ...(isIndependent ? [{ label: 'Online Consultations', value: todayAppointments.filter(a => a.type === 'Online').length.toString().padStart(2, '0'), icon: <Activity size={20} />, color: 'text-purple-600', bg: 'bg-purple-50' }] : []),
    { label: 'Patients Treated', value: '840+', icon: <Users size={20} />, color: 'text-[#0D9488]', bg: 'bg-[#0D9488]/10' },
    { label: 'Average Rating', value: '4.9', icon: <Star size={20} />, color: 'text-amber-500', bg: 'bg-amber-50' }
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Consulting': return 'bg-[#0D9488] text-white border-blue-700 font-black shadow-md';
      case 'Next': return 'bg-purple-600 text-white border-purple-700 animate-pulse font-black shadow-lg';
      case 'In Queue': return 'bg-orange-500 text-white border-orange-600 font-black';
      case 'Scheduled': return 'bg-slate-100 text-navy/70 border-slate-300 font-bold';
      case 'Completed': return 'bg-[#0D9488] text-white border-[#0D9488] font-black';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const AppointmentCard = ({ app }) => (
    <div className="p-5 bg-white border border-gray-100 rounded-[32px] flex items-center justify-between hover:border-[#0D9488]/30 hover:shadow-xl hover:shadow-[#0D9488]/5 transition-all group">
       <div className="flex items-center gap-4">
          <div className={`w-12 h-10 rounded-2xl flex flex-col items-center justify-center font-black text-[10px] shadow-sm ${app.status === 'Consulting' ? 'bg-[#0D9488] text-white' : 'bg-navy text-white'}`}>
             <span className="text-[7px] text-white/50 leading-none">Token</span>
             T-{app.token}
          </div>
          <div>
             <p className="font-bold text-navy text-sm leading-tight">{app.patient}</p>
             <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-black text-navy/70 uppercase tracking-widest">{app.time}</span>
                <span className="w-1 h-1 bg-gray-200 rounded-full" />
                <Badge className={`text-[8px] px-3 ${getStatusStyle(app.status)}`}>{app.status}</Badge>
             </div>
          </div>
       </div>
       <div className="flex flex-col gap-2">
          {app.status === 'Completed' ? (
             <Button size="sm" onClick={() => handlePrescriptionClick(app)} className="bg-[#0D9488] text-white rounded-xl text-[9px] px-4 py-2 flex items-center gap-2 shadow-lg shadow-[#0D9488]/20">
                <FileText size={12} /> Prescription
             </Button>
          ) : app.status === 'Consulting' ? (
             <div className="flex flex-col gap-2">
                <Button size="sm" className="bg-red-500 text-white rounded-xl text-[9px] px-4 py-2 shadow-lg hover:bg-red-600 transition-colors">
                   End Session
                </Button>
                <Button size="sm" onClick={() => handlePrescriptionClick(app)} className="bg-[#0D9488] text-white shadow-lg border-none shadow-[#0D9488]/20 rounded-xl text-[9px] px-4 py-2 hover:bg-[#0D9488]/20 transition-all font-black">
                   Add Prescription
                </Button>
             </div>
          ) : app.status === 'Next' ? (
             <Button size="sm" className={`${app.type === 'Online' ? 'bg-purple-600' : 'bg-[#0D9488]'} text-white rounded-xl text-[9px] px-4 py-2 shadow-lg`}>
                {app.type === 'Online' ? 'Join Call' : 'Start Session'}
             </Button>
          ) : (
             <Button 
               variant="outline" 
               size="sm" 
               onClick={() => { setSelectedPatient(app); setDetailsModalOpen(true); }}
               className="rounded-xl border-gray-100 text-[9px] px-4 py-2 text-navy/70 font-black"
             >
                Details
             </Button>
          )}
       </div>
    </div>
  );

  return (
    <>
      <DashboardLayout title="Clinical Overview" role="doctor">
      <div className="max-w-7xl mx-auto space-y-10 pb-20 font-body animate-in fade-in duration-700">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="space-y-2">
              <div className="flex items-center gap-4">
                 <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
                   Welcome, <span className="text-[#0D9488]">Dr. Wilson</span>
                 </h1>
                 <button 
                  onClick={() => setIsIndependent(!isIndependent)}
                  className="px-4 py-1.5 bg-gray-100 rounded-full text-[9px] font-black uppercase tracking-widest text-navy/40 hover:bg-[#0D9488]/10 hover:text-[#0D9488] transition-all"
                 >
                    Switch to {isIndependent ? 'Hospital' : 'Independent'} Mode
                 </button>
              </div>
              <p className="text-[10px] font-black text-navy/70 uppercase tracking-[0.25em] flex items-center gap-2">
                 <Activity size={14} className="text-[#0D9488]" /> 
                 {isIndependent ? 'Independent Private Clinic' : 'City General Hospital • Cardiology'} • {todayAppointments.filter(a => a.status === 'Scheduled').length} Slots Remaining
              </p>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 lg:grid lg:grid-cols-4 lg:mx-0 lg:px-0 gap-6 no-scrollbar snap-x snap-mandatory">
           {stats.map((stat, idx) => (
             <Card key={idx} className="min-w-[280px] lg:min-w-0 snap-center p-8 bg-white border border-gray-100 shadow-xl shadow-navy/5 rounded-[40px] hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full -mr-12 -mt-12 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative z-10 flex flex-col gap-4">
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
                             <Video size={18} className="text-purple-600" /> Digital Clinic
                          </h3>
                          <span className="text-[9px] font-black text-navy/40 uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full">
                             {todayAppointments.filter(a => a.type === 'Online').length} Slots
                          </span>
                       </div>
                       <div className="space-y-4">
                          {todayAppointments.filter(a => a.type === 'Online').map(app => (
                             <AppointmentCard key={app.id} app={app} />
                          ))}
                       </div>
                    </div>

                    {/* Physical Clinic (Offline) */}
                    <div className="space-y-6">
                       <div className="flex items-center justify-between px-2">
                          <h3 className="text-xs font-black text-navy uppercase tracking-[0.2em] flex items-center gap-3">
                             <Activity size={18} className="text-[#0D9488]" /> Physical Clinic
                          </h3>
                          <span className="text-[9px] font-black text-navy/40 uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full">
                             {todayAppointments.filter(a => a.type === 'Physical').length} Slots
                          </span>
                       </div>
                       <div className="space-y-4">
                          {todayAppointments.filter(a => a.type === 'Physical').map(app => (
                             <AppointmentCard key={app.id} app={app} />
                          ))}
                       </div>
                    </div>
                 </div>
              ) : (
                 <div className="space-y-6 h-full">
                    <div className="flex items-center justify-between px-2 min-h-[40px]">
                       <div className="flex items-center gap-3">
                          <Users size={18} className="text-[#0D9488]" />
                          <h3 className="text-sm font-black text-navy uppercase tracking-widest">Hospital Consultations</h3>
                       </div>
                       <div className="flex items-center gap-4">
                          <Badge variant="success" className="text-[10px] px-4 font-black">ACTIVE SESSION</Badge>
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
                                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-navy/80">Department</th>
                                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-navy/80 text-right">Action</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-50">
                                {todayAppointments.map((app) => (
                                   <tr key={app.id} className="hover:bg-gray-50/50 transition-colors group">
                                      <td className="px-8 py-6">
                                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${app.status === 'Consulting' ? 'bg-[#0D9488] text-white' : 'bg-navy text-white'}`}>
                                            T-{app.token}
                                         </div>
                                      </td>
                                      <td className="px-8 py-6">
                                         <p className="font-bold text-navy text-sm leading-tight">{app.patient}</p>
                                         <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black text-navy/70 uppercase tracking-widest">{app.time}</span>
                                            <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                            <Badge className={`text-[8px] px-3 ${getStatusStyle(app.status)}`}>{app.status}</Badge>
                                         </div>
                                      </td>
                                      <td className="px-8 py-6">
                                         <div className="flex items-center gap-2 text-[10px] font-black text-navy/70 uppercase tracking-widest">
                                            {app.type === 'Online' ? <Video size={14} className="text-purple-500" /> : <Activity size={14} className="text-blue-500" />}
                                            {app.type}
                                         </div>
                                      </td>
                                      <td className="px-8 py-6 text-right">
                                         {app.status === 'Completed' ? (
                                            <Button size="sm" onClick={() => handlePrescriptionClick(app)} className="bg-[#0D9488] text-white rounded-xl text-[9px] px-5 py-2 flex items-center gap-2 shadow-lg shadow-[#0D9488]/10 ml-auto">
                                               <Plus size={12} /> Upload Prescription
                                            </Button>
                                         ) : app.status === 'Consulting' ? (
                                            <div className="flex items-center gap-2 ml-auto">
                                               <Button size="sm" className="bg-red-500 text-white rounded-xl text-[9px] px-5 py-2 shadow-lg shadow-red-500/10 border-none hover:bg-red-600 transition-colors">End Session</Button>
                                               <Button size="sm" onClick={() => handlePrescriptionClick(app)} className="bg-[#0D9488] text-white shadow-lg border-none shadow-[#0D9488]/20 rounded-xl text-[9px] px-5 py-2 hover:bg-[#0D9488]/90 transition-all font-black">Prescription</Button>
                                            </div>
                                         ) : (
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              onClick={() => { setSelectedPatient(app); setDetailsModalOpen(true); }}
                                              className="rounded-xl border-gray-200 text-[9px] px-5 py-2 text-navy/70 font-black ml-auto"
                                            >
                                               View Details
                                            </Button>
                                         )}
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </Card>
                 </div>
              )}
           </div>

           {/* Sidebar: Next Patient & Utility */}
           <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center justify-between px-2 min-h-[40px]">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-navy/40">Patient Status</h3>
              </div>

              {/* Next Patient Focus Card */}
              <Card className="bg-navy rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-navy/20">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                 <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#0D9488]/10 rounded-full -ml-16 -mb-16 blur-3xl opacity-50" />
                 
                 <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-white">Coming Up Next</h4>
                          <p className="text-xs font-black text-[#0D9488]">Token T-{todayAppointments.find(a => a.status === 'Next' || a.status === 'Scheduled')?.token || 'No'} • {todayAppointments.find(a => a.status === 'Next' || a.status === 'Scheduled')?.type === 'Online' ? 'Digital Queue' : 'Live Queue'}</p>
                       </div>
                       <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                          <Activity size={20} className="text-white" />
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-4 py-2">
                       <Avatar name={todayAppointments.find(a => a.status === 'Next' || a.status === 'Scheduled')?.patient || 'Next'} size="xl" className="ring-4 ring-white/10" />
                       <div>
                          <p className="font-heading font-black text-2xl leading-tight text-white">{todayAppointments.find(a => a.status === 'Next' || a.status === 'Scheduled')?.patient || 'No Patient'}</p>
                          <p className="text-[11px] font-black text-white/70 uppercase tracking-widest mt-1 italic">{todayAppointments.find(a => a.status === 'Next' || a.status === 'Scheduled')?.type === 'Online' ? 'Video Consult' : 'Physical Visit'} • {todayAppointments.find(a => a.status === 'Next' || a.status === 'Scheduled')?.time}</p>
                       </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase text-white/80 tracking-widest">Estimated Wait</span>
                          <span className="text-xs font-black text-white flex items-center gap-2 mt-1">
                             <Clock size={14} className="text-[#0D9488]" /> 12:40 mins
                          </span>
                       </div>
                       <Button size="sm" className="bg-[#0D9488] text-white font-black text-[11px] rounded-[18px] px-6 py-3 hover:bg-[#0D9488]/90 shadow-xl shadow-[#0D9488]/20 border-none transition-all">
                          {todayAppointments.find(a => a.status === 'Next' || a.status === 'Scheduled')?.type === 'Online' ? 'Join Call' : 'Call Next Patient'}
                       </Button>
                    </div>
                 </div>
              </Card>


           </div>
        </div>
        </div>
      </DashboardLayout>

      {/* Prescription Modal */}
      <Modal 
        isOpen={isPrescriptionModalOpen} 
        onClose={() => setPrescriptionModalOpen(false)}
        title="Generate Digital Prescription"
        size="lg"
      >
        <form onSubmit={handleSubmitPrescription} className="space-y-8">
          {/* Patient Header */}
          <div className="bg-[#0D9488]/5 p-6 rounded-[32px] border border-[#0D9488]/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={selectedPatient?.patient} size="lg" />
              <div>
                <p className="text-sm font-black text-navy uppercase tracking-widest leading-none mb-1">{selectedPatient?.patient}</p>
                <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-widest">Token T-{selectedPatient?.token} • {selectedPatient?.type} Visit</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.2em] mb-1">Session Date</p>
              <p className="text-xs font-black text-navy">{new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Diagnosis Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Primary Diagnosis" 
              placeholder="e.g. Viral Fever"
              value={prescriptionForm.diagnosis}
              onChange={(e) => setPrescriptionForm({...prescriptionForm, diagnosis: e.target.value})}
              icon={Activity}
              required
            />
            <Input 
              label="Clinical Notes" 
              placeholder="e.g. Bed rest, liquid diet"
              value={prescriptionForm.notes}
              onChange={(e) => setPrescriptionForm({...prescriptionForm, notes: e.target.value})}
              icon={FileText}
            />
          </div>

          {/* Medicines Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-navy uppercase tracking-[0.2em] flex items-center gap-3">
                <PlusCircle size={18} className="text-[#0D9488]" /> Medication Schedule
              </h3>
              <button 
                type="button"
                onClick={addMedicine}
                className="text-[10px] font-black text-[#0D9488] uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                Add Medicine <Plus size={12} />
              </button>
            </div>

            <div className="space-y-3">
              {prescriptionForm.medicines.map((med, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="col-span-12 md:col-span-5">
                    <Input 
                      placeholder="Medicine Name (e.g. Paracetamol)"
                      value={med.name}
                      onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Input 
                      placeholder="e.g. 500mg"
                      value={med.dosage}
                      onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Input 
                      placeholder="e.g. 1-0-1"
                      value={med.frequency}
                      onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <Input 
                      placeholder="e.g. 5d"
                      value={med.duration}
                      onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-1 pt-4 text-right">
                    <button 
                      type="button"
                      onClick={() => removeMedicine(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-20"
                      disabled={prescriptionForm.medicines.length === 1}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-8 border-t border-gray-100 flex items-center justify-end gap-4">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => setPrescriptionModalOpen(false)}
              className="rounded-2xl px-8 border-gray-200"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-[#0D9488] text-white rounded-2xl px-10 shadow-xl shadow-[#0D9488]/20 border-none"
            >
              Generate & Upload
            </Button>
          </div>
        </form>
      </Modal>

      {/* Appointment Details Modal */}
      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setDetailsModalOpen(false)}
        title="Appointment Details"
        size="lg"
      >
        <div className="space-y-8">
           {/* Patient Demographics */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 p-8 rounded-[40px] border border-slate-100">
              <div className="flex items-center gap-6">
                 <Avatar name={selectedPatient?.patient} size="xl" className="ring-4 ring-white shadow-xl" />
                 <div>
                    <h2 className="text-2xl font-black text-navy uppercase tracking-widest mb-1">{selectedPatient?.patient}</h2>
                    <div className="flex items-center gap-3">
                       <Badge className="bg-navy text-white text-[10px] px-4">Patient ID: #PAT-{selectedPatient?.id}024</Badge>
                       <span className="text-xs font-black text-navy/40 uppercase tracking-widest">{selectedPatient?.gender} • {selectedPatient?.age} Years</span>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <Badge variant={selectedPatient?.status === 'Completed' ? 'success' : 'warning'} className="text-[10px] px-6 py-2 font-black uppercase tracking-widest">
                    {selectedPatient?.status}
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
                       <span className="text-navy">{selectedPatient?.type} Visit</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold">
                       <span className="text-navy/40 uppercase text-[10px] tracking-widest">Preferred Time</span>
                       <span className="text-navy">{selectedPatient?.time}</span>
                    </div>
                    <div className="pt-4 border-t border-gray-50">
                       <span className="text-navy/40 uppercase text-[10px] tracking-widest block mb-2">Reason for Visit</span>
                       <p className="text-sm font-bold text-navy leading-relaxed">{selectedPatient?.reason}</p>
                    </div>
                 </div>
              </div>

              {/* Clinical Vitals */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                       <Activity size={18} />
                    </div>
                    <h3 className="text-xs font-black text-navy uppercase tracking-widest">Patient Vitals</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                       <div className="flex items-center gap-2 mb-2">
                          <Heart size={14} className="text-red-500" />
                          <span className="text-navy/40 uppercase text-[9px] font-black tracking-widest">Blood Pressure</span>
                       </div>
                       <p className="text-xl font-black text-navy leading-none">{selectedPatient?.vitals?.bp}</p>
                       <span className="text-[10px] font-bold text-navy/30">mmHg</span>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                       <div className="flex items-center gap-2 mb-2">
                          <Activity size={14} className="text-blue-500" />
                          <span className="text-navy/40 uppercase text-[9px] font-black tracking-widest">Pulse Rate</span>
                       </div>
                       <p className="text-xl font-black text-navy leading-none">{selectedPatient?.vitals?.pulse}</p>
                       <span className="text-[10px] font-bold text-navy/30">bpm</span>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                       <div className="flex items-center gap-2 mb-2">
                          <Thermometer size={14} className="text-orange-500" />
                          <span className="text-navy/40 uppercase text-[9px] font-black tracking-widest">Body Temp</span>
                       </div>
                       <p className="text-xl font-black text-navy leading-none">{selectedPatient?.vitals?.temp}</p>
                       <span className="text-[10px] font-bold text-navy/30">Fahrenheit</span>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                       <div className="flex items-center gap-2 mb-2">
                          <User size={14} className="text-purple-500" />
                          <span className="text-navy/40 uppercase text-[9px] font-black tracking-widest">Body Weight</span>
                       </div>
                       <p className="text-xl font-black text-navy leading-none">{selectedPatient?.vitals?.weight}</p>
                       <span className="text-[10px] font-bold text-navy/30">Kilograms</span>
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
              {selectedPatient?.status !== 'Completed' && (
                 <Button className="bg-navy text-white rounded-2xl px-10 shadow-xl shadow-navy/20 border-none">
                    Start Consultation
                 </Button>
              )}
           </div>
        </div>
      </Modal>
    </>
  );
};

export default DoctorDashboard;
