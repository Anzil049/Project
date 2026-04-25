import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, Avatar, Modal, Input } from '../../components/common';
import { 
  Users, Calendar, Video, Activity, Clock, 
  Search, CheckCircle2, ChevronRight, VideoOff,
  Stethoscope, FileText, Plus, Heart, Thermometer, User, PlusCircle, Trash2
} from 'lucide-react';

const DoctorAppointments = () => {
  const [appointmentTab, setAppointmentTab] = useState('Upcoming'); // 'Upcoming', 'Completed', 'Cancelled'
  
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [isPrescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: '',
    notes: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '' }]
  });

  // Mock data matching Dashboard
  const rawAppointments = [
    { id: 1, patient: 'Rajesh Khanna', time: '10:00 AM', date: 'April 16, 2026', type: 'Physical', status: 'Consulting', token: 1, age: 45, gender: 'Male', reason: 'Persistent abdominal discomfort and mild fever since 3 days.', vitals: { bp: '132/88', pulse: '78', temp: '99.1°F', weight: '74kg' } },
    { id: 2, patient: 'Sneha Kapoor', time: '10:30 AM', date: 'April 16, 2026', type: 'Online', status: 'Upcoming', token: 2, age: 28, gender: 'Female', reason: 'Post-op follow up and prescription renewal.', vitals: { bp: '110/70', pulse: '72', temp: '98.4°F', weight: '58kg' } },
    { id: 3, patient: 'Arjun Mehra', time: '11:00 AM', date: 'April 16, 2026', type: 'Physical', status: 'Upcoming', token: 3, age: 52, gender: 'Male', reason: 'Annual cardiac screening and cholesterol review.', vitals: { bp: '145/95', pulse: '84', temp: '98.6°F', weight: '88kg' } },
    { id: 4, patient: 'Priya Sharma', time: '11:30 AM', date: 'April 15, 2026', type: 'Online', status: 'Completed', token: 4, age: 34, gender: 'Female', reason: 'Follow up on laboratory results for chest pain.', vitals: { bp: '120/80', pulse: '70', temp: '98.6°F', weight: '65kg' } },
    { id: 5, patient: 'Amit Verma', time: '12:00 PM', date: 'April 15, 2026', type: 'Physical', status: 'Cancelled', token: 5, age: 19, gender: 'Male', reason: 'Routine sports physical and vaccination update.', vitals: { bp: '118/76', pulse: '64', temp: '98.2°F', weight: '70kg' } }
  ];

  const filteredAppointments = rawAppointments.filter(app => {
    const matchesTab = 
      (appointmentTab === 'Upcoming' && ['Consulting', 'Upcoming'].includes(app.status)) ||
      (appointmentTab === 'Completed' && app.status === 'Completed') ||
      (appointmentTab === 'Cancelled' && app.status === 'Cancelled');
      
    const matchesType = app.type === 'Physical';
    return matchesTab && matchesType;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Consulting': return 'bg-[#0D9488] text-white border-teal-700 font-black shadow-md animate-pulse';
      case 'Upcoming': return 'bg-purple-600 text-white border-purple-700 font-black';
      case 'Completed': return 'bg-slate-100 text-navy/70 border-slate-300 font-bold';
      case 'Cancelled': return 'bg-red-50 text-red-600 border-red-200 font-bold';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

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
    setPrescriptionModalOpen(false);
  };

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
              <Calendar size={14} className="text-[#0D9488]" /> Manage your daily schedule and patient encounters
            </p>
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
              {tab.toUpperCase()}
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
                   <Card key={app.id} className={`p-6 bg-white border ${app.status === 'Consulting' ? 'border-[#0D9488] shadow-lg shadow-[#0D9488]/5 ring-1 ring-[#0D9488]/10' : 'border-gray-100'} rounded-[32px] hover:-translate-y-1 transition-all duration-300 group`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                         
                         <div className="flex items-center gap-5">
                            <div className="relative">
                               <Avatar name={app.patient} size="lg" className={`${app.status === 'Consulting' ? 'ring-4 ring-[#0D9488]/20' : ''}`} />
                               <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 border border-gray-100 shadow-sm">
                                  <Stethoscope size={14} className="text-[#0D9488]" />
                               </div>
                            </div>
                            <div>
                               <h3 className="text-lg font-black text-navy leading-none mb-1">{app.patient}</h3>
                               <p className="text-[10px] font-black tracking-widest uppercase text-navy/40 flex items-center gap-2">
                                  {app.date} • {app.time} • Token {app.token}
                               </p>
                            </div>
                         </div>

                         <div className="flex flex-col sm:items-end gap-3">
                            <Badge className={`text-[9px] px-4 py-1.5 ${getStatusStyle(app.status)}`}>
                               {app.status === 'Upcoming' ? 'SCHEDULED' : app.status.toUpperCase()}
                            </Badge>
                            
                            <div className="flex items-center gap-2">
                               <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => { setSelectedPatient(app); setDetailsModalOpen(true); }}
                                  className="rounded-xl border-gray-200 text-[10px] px-4 py-2 font-black"
                               >
                                  DETAILS
                               </Button>

                               {app.status === 'Consulting' ? (
                                  <div className="flex items-center gap-2">
                                     <Button size="sm" onClick={() => handlePrescriptionClick(app)} className="bg-[#0D9488] text-white border-none shadow-lg shadow-[#0D9488]/20 rounded-xl text-[10px] px-4 py-2 font-black">
                                        PRESCRIBE
                                     </Button>
                                  </div>
                               ) : app.status === 'Upcoming' ? (
                                  <Button size="sm" className="bg-navy text-white rounded-xl text-[10px] px-4 py-2 font-black">
                                     CALL NEXT
                                  </Button>
                               ) : app.status === 'Completed' ? (
                                  <Button size="sm" onClick={() => handlePrescriptionClick(app)} className="bg-gray-100 text-navy hover:bg-[#0D9488]/10 hover:text-[#0D9488] rounded-xl text-[10px] px-4 py-2 font-black border-transparent">
                                     UPDATE RX
                                  </Button>
                               ) : null}
                            </div>
                         </div>

                      </div>
                   </Card>
                ))
             )}
          </div>

          {/* Sidebar Area: Quick Stats or Consulting Context */}
          <div className="lg:col-span-1 space-y-6 sticky top-[100px]">
             <div className="bg-[#0D9488] p-8 rounded-[40px] text-white shadow-xl shadow-[#0D9488]/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-4">Today's Summary</h3>
                <div className="space-y-6 relative z-10">
                   <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <span className="text-sm font-bold opacity-90">Total Patients</span>
                      <span className="text-2xl font-black">42</span>
                   </div>
                   <div className="flex items-center justify-between pb-2">
                      <span className="text-sm font-bold opacity-90 flex items-center gap-2"><Stethoscope size={14}/> Physical</span>
                      <span className="text-xl font-black">24</span>
                   </div>
                </div>
             </div>

             {rawAppointments.some(a => a.status === 'Consulting') && (
                <div className="bg-navy p-6 rounded-[40px] text-white shadow-xl shadow-navy/20">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0D9488] mb-4 text-center">Active Session Focus</h3>
                   <div className="text-center space-y-2">
                      <Avatar name={rawAppointments.find(a => a.status === 'Consulting')?.patient} size="xl" className="mx-auto ring-4 ring-white/10 mb-4" />
                      <h4 className="text-xl font-black">{rawAppointments.find(a => a.status === 'Consulting')?.patient}</h4>
                      <p className="text-xs text-white/50">{rawAppointments.find(a => a.status === 'Consulting')?.reason.slice(0, 40)}...</p>
                      <Button onClick={() => setDetailsModalOpen(true)} className="mt-4 w-full bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border-none hover:bg-white/20">
                         View Complete Details
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
                 <Badge variant={selectedPatient?.status === 'Completed' ? 'success' : selectedPatient?.status === 'Cancelled' ? 'danger' : 'warning'} className="text-[10px] px-6 py-2 font-black uppercase tracking-widest">
                    {selectedPatient?.status === 'Upcoming' ? 'SCHEDULED' : selectedPatient?.status}
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
                       <p className="text-xl font-black text-navy leading-none">{selectedPatient?.vitals?.bp || '--'}</p>
                       <span className="text-[10px] font-bold text-navy/30">mmHg</span>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                       <div className="flex items-center gap-2 mb-2">
                          <Activity size={14} className="text-blue-500" />
                          <span className="text-navy/40 uppercase text-[9px] font-black tracking-widest">Pulse Rate</span>
                       </div>
                       <p className="text-xl font-black text-navy leading-none">{selectedPatient?.vitals?.pulse || '--'}</p>
                       <span className="text-[10px] font-bold text-navy/30">bpm</span>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                       <div className="flex items-center gap-2 mb-2">
                          <Thermometer size={14} className="text-orange-500" />
                          <span className="text-navy/40 uppercase text-[9px] font-black tracking-widest">Body Temp</span>
                       </div>
                       <p className="text-xl font-black text-navy leading-none">{selectedPatient?.vitals?.temp || '--'}</p>
                       <span className="text-[10px] font-bold text-navy/30">Fahrenheit</span>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                       <div className="flex items-center gap-2 mb-2">
                          <User size={14} className="text-purple-500" />
                          <span className="text-navy/40 uppercase text-[9px] font-black tracking-widest">Body Weight</span>
                       </div>
                       <p className="text-xl font-black text-navy leading-none">{selectedPatient?.vitals?.weight || '--'}</p>
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
              {selectedPatient?.status === 'Upcoming' && (
                 <Button className="bg-[#0D9488] text-white rounded-2xl px-10 shadow-xl shadow-[#0D9488]/20 border-none">
                    Start Consultation
                 </Button>
              )}
           </div>
        </div>
      </Modal>

      {/* Prescription Modal */}
      <Modal 
        isOpen={isPrescriptionModalOpen} 
        onClose={() => setPrescriptionModalOpen(false)}
        title="Digital Prescription"
        size="lg"
      >
        <form onSubmit={handleSubmitPrescription} className="space-y-8">
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
                   <div key={idx} className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-12 md:col-span-5">
                         <Input placeholder="Medicine Name" value={med.name} onChange={(e) => updateMedicine(idx, 'name', e.target.value)} required />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                         <Input placeholder="Dosage" value={med.dosage} onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)} required />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                         <Input placeholder="Freq." value={med.frequency} onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)} required />
                      </div>
                      <div className="col-span-3 md:col-span-2">
                         <Input placeholder="Dur." value={med.duration} onChange={(e) => updateMedicine(idx, 'duration', e.target.value)} required />
                      </div>
                      <div className="col-span-1 pt-4 text-right">
                         <button type="button" onClick={() => removeMedicine(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl" disabled={prescriptionForm.medicines.length === 1}>
                            <Trash2 size={18} />
                         </button>
                      </div>
                   </div>
                ))}
             </div>
          </div>
          <div className="pt-8 border-t border-gray-100 flex items-center justify-end gap-4">
             <Button variant="outline" type="button" onClick={() => setPrescriptionModalOpen(false)} className="rounded-2xl px-8 border-gray-200">Cancel</Button>
             <Button type="submit" className="bg-[#0D9488] text-white rounded-2xl px-10 shadow-xl shadow-[#0D9488]/20 border-none">Save Prescription</Button>
          </div>
        </form>
      </Modal>

    </DashboardLayout>
  );
};

export default DoctorAppointments;
