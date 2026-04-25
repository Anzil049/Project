import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Input, Modal, Avatar, Badge } from '../../components/common';
import { 
  FilePlus, History, Search, Eye, Edit2, 
  Trash2, PlusCircle, Plus, FileText, 
  Activity, Send, Check
} from 'lucide-react';

const DoctorPrescriptions = () => {
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'new'
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Unified Prescription Form State (Same as Dashboard)
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientId: '',
    appointmentId: '',
    diagnosis: '',
    notes: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '' }]
  });

  // Mock Data for Prescriptions History
  const [prescriptions, setPrescriptions] = useState([
    { 
      id: 101, 
      patient: 'Rajesh Khanna', 
      date: 'April 10, 2026', 
      type: 'Digital', 
      diagnosis: 'Viral Fever', 
      notes: 'Bed rest for 2 days',
      medicines: [{ name: 'Paracetamol', dosage: '500mg', frequency: '1-0-1', duration: '5d' }]
    },
    { 
      id: 103, 
      patient: 'Arjun Mehra', 
      date: 'April 08, 2026', 
      type: 'Digital', 
      diagnosis: 'Hypertension', 
      notes: 'Avoid salty food',
      medicines: [
        { name: 'Amlodipine', dosage: '5mg', frequency: '0-0-1', duration: '30d' },
        { name: 'Atorvastatin', dosage: '10mg', frequency: '0-0-1', duration: '30d' }
      ]
    }
  ]);

  const addMedicine = () => {
    setPrescriptionForm({
      ...prescriptionForm,
      medicines: [...prescriptionForm.medicines, { name: '', dosage: '', frequency: '', duration: '' }]
    });
  };

  const updateMedicine = (index, field, value) => {
    const updated = [...prescriptionForm.medicines];
    updated[index][field] = value;
    setPrescriptionForm({ ...prescriptionForm, medicines: updated });
  };

  const removeMedicine = (index) => {
    if (prescriptionForm.medicines.length > 1) {
      const updated = prescriptionForm.medicines.filter((_, i) => i !== index);
      setPrescriptionForm({ ...prescriptionForm, medicines: updated });
    }
  };

  const handleEdit = (p) => {
    setSelectedPrescription(p);
    setPrescriptionForm({
      ...p,
      patientId: p.patient, // Mock binding
      appointmentId: `#APT-${p.id}`,
      medicines: p.medicines || [{ name: '', dosage: '', frequency: '', duration: '' }]
    });
    setEditModalOpen(true);
  };



  return (
    <DashboardLayout title="Prescription Management" role="doctor">
      <div className="max-w-6xl mx-auto space-y-10 pb-20 font-body animate-in fade-in duration-700">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Patient <span className="text-[#0D9488]">Prescriptions</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <History size={14} className="text-[#0D9488]" /> Track and manage digital and manual prescription records
            </p>
          </div>
          <div className="flex items-center bg-white p-1.5 rounded-[24px] border border-gray-100 shadow-sm">
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-8 py-3 rounded-[20px] text-xs font-black transition-all ${activeTab === 'history' ? 'bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/20' : 'text-navy/40 hover:text-navy'}`}
            >
              HISTORY
            </button>
            <button 
              onClick={() => setActiveTab('new')}
              className={`px-8 py-3 rounded-[20px] text-xs font-black transition-all ${activeTab === 'new' ? 'bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/20' : 'text-navy/40 hover:text-navy'}`}
            >
              CREATE NEW
            </button>
          </div>
        </div>

        {activeTab === 'new' ? (
          <div className="animate-in slide-in-from-right-4 duration-500">
             <Card className="p-10 bg-white border border-gray-100 shadow-2xl shadow-navy/5 rounded-[48px] overflow-hidden">
                <div className="flex items-center justify-between mb-10">
                   <h3 className="text-2xl font-black text-navy tracking-tight">New Prescription Form</h3>
                </div>

                <form className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Input label="Select Patient" placeholder="Search patient name..." icon={Search} required />
                      <Input label="Appointment ID" placeholder="e.g. #APT-2024" icon={FileText} required />
                      <div className="md:col-span-2">
                         <Input 
                           label="Primary Diagnosis" 
                           placeholder="e.g. Viral Fever, Hypertension" 
                           icon={Activity} 
                           required 
                         />
                      </div>
                   </div>

                   <div className="space-y-6 pt-4">
                      <div className="flex items-center justify-between">
                         <h4 className="text-[10px] font-black text-navy uppercase tracking-[0.2em] flex items-center gap-3">
                            <Check size={18} className="text-[#0D9488]" /> Medication Schedule
                         </h4>
                         <button 
                           type="button"
                           onClick={addMedicine}
                           className="text-[10px] font-black text-[#0D9488] uppercase tracking-widest flex items-center gap-2 hover:underline"
                         >
                            Add Medicine <Plus size={14} />
                         </button>
                      </div>
                      <div className="space-y-4">
                         {prescriptionForm.medicines.map((med, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-4 items-end">
                               <div className="col-span-5"><Input placeholder="Medicine Name" value={med.name} onChange={(e) => updateMedicine(idx, 'name', e.target.value)} /></div>
                               <div className="col-span-2"><Input placeholder="Dosage" value={med.dosage} onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)} /></div>
                               <div className="col-span-2"><Input placeholder="Freq" value={med.frequency} onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)} /></div>
                               <div className="col-span-2"><Input placeholder="Dur" value={med.duration} onChange={(e) => updateMedicine(idx, 'duration', e.target.value)} /></div>
                               <div className="col-span-1 pb-4 flex justify-center">
                                  <button type="button" onClick={() => removeMedicine(idx)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div className="pt-10 flex justify-end gap-6">
                      <Button variant="outline" className="px-10 rounded-2xl border-gray-200" onClick={() => setActiveTab('history')}>Discard</Button>
                      <Button className="bg-navy text-white px-12 rounded-2xl shadow-xl shadow-navy/20 flex items-center gap-3 border-none">
                         <Send size={18} /> Send to Patient
                      </Button>
                   </div>
                </form>
             </Card>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-6">
             {/* Search/Filter Bar */}
             <div className="flex items-center bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm gap-4">
                <Search className="text-navy/30 ml-4" size={20} />
                <input placeholder="Search by patient name or diagnosis..." className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-navy" />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prescriptions.map(p => (
                   <Card key={p.id} className="p-8 bg-white border border-gray-100 shadow-xl shadow-navy/5 rounded-[40px] hover:-translate-y-2 transition-all duration-300 group">
                      <div className="flex items-start justify-between mb-6">
                         <Badge className={`text-[9px] px-3 font-black uppercase tracking-widest ${p.type === 'Digital' ? 'bg-[#0D9488]/10 text-[#0D9488]' : 'bg-purple-100 text-purple-600'}`}>
                            {p.type} Record
                         </Badge>
                         <span className="text-[10px] font-bold text-navy/30 uppercase tracking-widest">{p.date}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-6">
                         <Avatar name={p.patient} />
                         <div>
                            <h4 className="text-lg font-black text-navy">{p.patient}</h4>
                            <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-[0.2em]">{p.diagnosis}</p>
                         </div>
                      </div>

                      <div className="space-y-3 mb-8">
                         <p className="text-[11px] font-bold text-navy/60">
                            Includes {p.medicines?.length || 0} medications: {p.medicines?.map(m => m.name).join(', ')}
                         </p>
                      </div>

                      <div className="flex items-center gap-3 pt-6 border-t border-gray-50">
                         <button 
                           onClick={() => handleEdit(p)}
                           className="flex-1 bg-gray-50 text-navy/60 py-3 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black hover:bg-[#0D9488]/5 hover:text-[#0D9488] transition-all"
                         >
                            <Eye size={14} /> VIEW
                         </button>
                         <button 
                           onClick={() => handleEdit(p)}
                           className="flex-1 bg-navy text-white py-3 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black hover:bg-black transition-all"
                         >
                            <Edit2 size={14} /> EDIT
                         </button>
                      </div>
                   </Card>
                ))}
             </div>
          </div>
        )}

        {/* Unified Edit Modal */}
        <Modal 
          isOpen={isEditModalOpen} 
          onClose={() => setEditModalOpen(false)}
          title="Prescription Details"
          size="lg"
        >
           <form className="space-y-8">
              <div className="bg-[#0D9488]/5 p-6 rounded-[32px] border border-[#0D9488]/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar name={selectedPrescription?.patient} size="lg" />
                  <div>
                    <p className="text-sm font-black text-navy uppercase tracking-widest leading-none mb-1">{selectedPrescription?.patient}</p>
                    <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-widest">ID: #REC-{selectedPrescription?.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-navy/40 uppercase tracking-widest mb-1 shadow-sm">Created Date</p>
                  <p className="text-xs font-black text-navy">{selectedPrescription?.date}</p>
                </div>
              </div>

              <div className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Diagnosis" value={prescriptionForm.diagnosis} onChange={(e) => setPrescriptionForm({...prescriptionForm, diagnosis: e.target.value})} />
                    <Input label="Notes" value={prescriptionForm.notes} onChange={(e) => setPrescriptionForm({...prescriptionForm, notes: e.target.value})} />
                 </div>

                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-navy uppercase tracking-widest">Medication Details</h4>
                       <div className="space-y-3">
                          {prescriptionForm.medicines.map((med, idx) => (
                             <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                                <div className="col-span-5"><Input placeholder="Medicine" value={med.name} onChange={(e) => updateMedicine(idx, 'name', e.target.value)} /></div>
                                <div className="col-span-2"><Input placeholder="Dose" value={med.dosage} onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)} /></div>
                                <div className="col-span-2"><Input placeholder="Freq" value={med.frequency} onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)} /></div>
                                <div className="col-span-2"><Input placeholder="Dur" value={med.duration} onChange={(e) => updateMedicine(idx, 'duration', e.target.value)} /></div>
                                <div className="col-span-1 pb-4"><button type="button" onClick={() => removeMedicine(idx)} className="text-red-400 p-1"><Trash2 size={16}/></button></div>
                             </div>
                          ))}
                          <button type="button" onClick={addMedicine} className="text-[10px] font-black text-[#0D9488] flex items-center gap-1 uppercase tracking-widest"><Plus size={14}/> Add Row</button>
                       </div>
                    </div>
              </div>

              <div className="pt-10 flex justify-end gap-4 border-t border-gray-100">
                 <Button variant="outline" className="px-8 rounded-2xl" onClick={() => setEditModalOpen(false)}>Close</Button>
                 <Button className="bg-[#0D9488] text-white px-10 rounded-2xl shadow-xl shadow-[#0D9488]/20 border-none">Save Changes</Button>
              </div>
           </form>
        </Modal>

      </div>
    </DashboardLayout>
  );
};

export default DoctorPrescriptions;
