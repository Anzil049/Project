import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Avatar, Modal, EmptyState } from '../../components/common';
import { 
  FileText, Scan, Download, Eye, Search, 
  Calendar, MapPin, Stethoscope, DownloadCloud,
  Clock, Printer, AlertCircle, Activity, Filter,
  CheckCircle2, Video, MessageCircle
} from 'lucide-react';

const PatientPrescriptions = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter]   = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [activeTab, setActiveTab]     = useState('offline'); // 'offline' | 'online'

  // Mock Prescriptions
  const prescriptions = [
    {
      id: "PR-8821",
      doctor: "Dr. Arjun Mehta",
      specialty: "Cardiologist",
      hospital: "Apollo Hospitals",
      date: "2026-10-24",
      dateLabel: "Oct 24, 2026",
      status: "Latest",
      medicines: [
        { name: "Telmisartan 40mg", dosage: "1-0-0", duration: "30 Days", instruction: "Before Breakfast" },
        { name: "Atorvastatin 10mg", dosage: "0-0-1", duration: "15 Days", instruction: "After Dinner" },
        { name: "Aspirin 75mg", dosage: "0-1-0", duration: "30 Days", instruction: "After Lunch" }
      ],
      diagnosis: "Stage 1 Hypertension. Patient needs to monitor BP daily and reduce salt intake."
    },
    {
      id: "PR-7542",
      doctor: "Dr. Sarah Johnson",
      specialty: "General Physician",
      hospital: "Medanta Medicity",
      date: "2026-09-12",
      dateLabel: "Sep 12, 2026",
      status: "Old",
      medicines: [
        { name: "Amoxicillin 500mg", dosage: "1-1-1", duration: "5 Days", instruction: "After Meals" },
        { name: "Paracetamol 650mg", dosage: "1-0-1", duration: "3 Days", instruction: "If fever > 100 F" }
      ],
      diagnosis: "Viral Fever with throat infection. Recommended rest and plenty of fluids."
    },
    {
      id: "PR-6102",
      doctor: "Dr. James Wilson",
      specialty: "Dermatologist",
      hospital: "Fortis Escorts",
      date: "2026-08-05",
      dateLabel: "Aug 05, 2026",
      status: "Old",
      medicines: [
        { name: "Desonide Cream 0.05%", dosage: "2 times a day", duration: "10 Days", instruction: "External Apply" },
        { name: "Cetirizine 10mg", dosage: "0-0-1", duration: "30 Days", instruction: "At Bedtime" }
      ],
      diagnosis: "Mild Contact Dermatitis. Avoid harsh soaps and perfumes."
    }
  ];

  // Online prescriptions (issued by doctors during video/chat consultations)
  const onlinePrescriptions = [
    {
      id: 'OP-3341',
      doctor: 'Dr. Arjun Mehta',
      specialty: 'Neurologist',
      sessionType: 'video',
      date: '2026-04-15',
      dateLabel: 'Apr 15, 2026',
      status: 'Latest',
      medicines: [
        { name: 'Levetiracetam 500mg', dosage: '1-0-1', duration: '30 Days', instruction: 'After Meals' },
        { name: 'Mecobalamin 500mcg', dosage: '0-0-1', duration: '60 Days', instruction: 'After Dinner' },
      ],
      diagnosis: 'Tension-type headache. Advised adequate sleep and stress management techniques.',
    },
    {
      id: 'OP-2210',
      doctor: 'Dr. Priya Sharma',
      specialty: 'Dermatologist',
      sessionType: 'chat',
      date: '2026-04-10',
      dateLabel: 'Apr 10, 2026',
      status: 'Old',
      medicines: [
        { name: 'Clindamycin Gel 1%', dosage: 'Apply once daily', duration: '14 Days', instruction: 'External use — clean skin' },
        { name: 'Doxycycline 100mg', dosage: '1-0-0', duration: '10 Days', instruction: 'Before Breakfast' },
      ],
      diagnosis: 'Moderate acne vulgaris. Avoid oily foods, use non-comedogenic moisturiser.',
    },
  ];

  const activePrescriptions = activeTab === 'offline' ? prescriptions : onlinePrescriptions;

  const filteredPrescriptions = activePrescriptions.filter(p =>
    (p.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (p.hospital || '').toLowerCase().includes(searchQuery.toLowerCase())) &&
    (dateFilter === '' || p.date === dateFilter)
  );

  const handlePreview = (p) => {
    setSelectedPrescription(p);
    setShowModal(true);
  };

  const handleDownload = (p) => {
    alert(`Downloading Prescription ${p.id}...`);
  };

  return (
    <DashboardLayout title="Prescriptions" role="patient">
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-heading font-black text-navy tracking-tight">Prescriptions</h1>
            <p className="text-sm text-navy/40 font-bold">Your digital medical records and prescription history</p>
          </div>
          <Button 
            className="bg-[#0D9488] hover:bg-[#115E59] shadow-lg shadow-teal-500/10 font-black rounded-xl border-none h-11 px-6 flex items-center gap-2 uppercase tracking-widest text-[10px]"
            onClick={() => alert("Downloading all records...")}
          >
            <DownloadCloud size={16} /> Export All History
          </Button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('offline')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'offline' ? 'bg-white text-navy shadow-sm' : 'text-navy/40 hover:text-navy'
            }`}
          >
            <Stethoscope size={13} /> In-Clinic
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'online' ? 'bg-white text-navy shadow-sm' : 'text-navy/40 hover:text-navy'
            }`}
          >
            <Video size={13} /> Online Consultation
          </button>
        </div>

        {/* Improved Search & Filters */}
        <Card className="p-3 bg-white border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="flex-1 w-full relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/20 group-focus-within:text-[#0D9488] transition-colors" size={16} />
              <input 
                type="text"
                placeholder="Search by doctor or hospital..." 
                className="w-full pl-10 pr-4 h-10 bg-gray-50 border border-gray-100/50 rounded-xl outline-none focus:border-[#0D9488]/30 focus:bg-white focus:ring-4 focus:ring-[#0D9488]/5 transition-all font-medium text-sm placeholder:text-navy/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-56 relative group">
              <input 
                type="date"
                className="w-full px-4 h-10 bg-gray-50 border border-gray-100/50 rounded-xl outline-none focus:border-[#0D9488]/30 focus:bg-white focus:ring-4 focus:ring-[#0D9488]/5 transition-all font-bold text-[11px] text-navy/60 uppercase tracking-wider cursor-pointer"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
               {dateFilter && (
                 <button 
                  onClick={() => setDateFilter('')}
                  className="px-3 h-10 text-navy/40 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest transition-colors"
                 >
                   Clear
                 </button>
               )}
               <Button 
                variant="outline" 
                className="rounded-xl h-10 px-5 font-black flex items-center gap-2 border-gray-100 text-navy/30 hover:bg-gray-50 text-[10px] uppercase tracking-[0.2em] w-full md:w-auto shrink-0"
               >
                 <Filter size={14} /> Filter
               </Button>
            </div>
          </div>
        </Card>

        {/* Prescription Cards */}
        <div className="space-y-4">
          {filteredPrescriptions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
               <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <FileText size={32} className="text-navy/10" />
               </div>
               <h3 className="text-xl font-black text-navy mb-2">No Records Found</h3>
               <p className="text-navy/40 text-sm font-medium">Try reflecting your search or adjusting the date filter.</p>
            </div>
          ) : (
            filteredPrescriptions.map((p) => (
              <Card key={p.id} className="p-5 md:p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-[#0D9488]/30 transition-all flex flex-col md:flex-row gap-6 md:items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Doctor Info */}
                <div className="flex items-center gap-4 md:w-[28%] shrink-0">
                  <Avatar size="lg" name={p.doctor} className={`shrink-0 shadow-inner text-white ${activeTab === 'online' ? 'bg-gradient-to-br from-[#7C3AED] to-[#5B21B6]' : 'bg-gradient-to-br from-[#0D9488] to-[#115E59]'}`} />
                  <div>
                    <h3 className="font-bold text-navy text-base md:text-lg leading-tight">{p.doctor}</h3>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-teal-50 text-[#0D9488] text-[9px] font-black uppercase tracking-widest rounded-full border border-teal-100/50">
                      {p.specialty}
                    </span>
                    {activeTab === 'online' && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {p.sessionType === 'video' ? (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-full">
                            <Video size={9} /> Video Session
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                            <MessageCircle size={9} /> Chat Session
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-[10px] font-bold text-navy/30 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1.5"><MapPin size={10} /> {activeTab === 'online' ? 'Session Type' : 'Hospital'}</p>
                    <p className="text-sm font-bold text-navy/70 truncate">{activeTab === 'online' ? 'Online Consultation' : p.hospital}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-navy/30 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1.5"><Clock size={10} /> Date Issued</p>
                    <p className="text-sm font-bold text-navy/70">{p.dateLabel}</p>
                  </div>
                  <div className="col-span-2 lg:col-span-1 border-t lg:border-none border-gray-50 pt-3 lg:pt-0">
                    <p className="text-[10px] font-bold text-navy/30 uppercase tracking-[0.2em] mb-1.5">Prescription ID</p>
                    <p className="inline-flex py-1 px-2.5 bg-gray-50 text-navy/40 text-[11px] font-black rounded-lg tracking-widest border border-gray-100">
                      #{p.id}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 md:w-auto md:shrink-0 pt-4 md:pt-0 border-t border-gray-50 md:border-t-0">
                  <Button 
                    variant="outline" 
                    className="border-gray-100 text-navy/60 hover:bg-gray-50 font-bold px-6 rounded-xl flex-1 md:flex-initial flex items-center justify-center gap-2 h-11 text-xs" 
                    onClick={() => handlePreview(p)}
                  >
                    <Eye size={16} /> Preview
                  </Button>
                  <Button 
                    variant="primary" 
                    className="bg-[#0D9488] hover:bg-[#115E59] shadow-lg shadow-teal-500/10 font-bold px-6 rounded-xl border-none flex-1 md:flex-initial flex items-center justify-center gap-2 h-11 text-xs"
                    onClick={() => handleDownload(p)}
                  >
                    <Download size={16} /> Download
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title="Document Preview"
        size="lg"
        noPadding={true}
      >
        {selectedPrescription && (
          <div className="flex flex-col md:flex-row h-full max-h-[75vh] bg-white overflow-hidden shadow-2xl">
            {/* Left Column: PDF Viewer Canvas */}
            <div className="flex-1 bg-[#525659] flex flex-col overflow-hidden shadow-inner">
              {/* Virtual Toolbar - Fixed at top */}
              <div className="w-full bg-[#323639] text-white p-3 flex justify-between items-center z-10 shadow-lg shrink-0">
                 <div className="flex items-center gap-4 px-4">
                   <div className="p-1.5 bg-teal-500 rounded-md shadow-lg shadow-teal-500/20">
                     <FileText size={14} className="text-white" />
                   </div>
                   <span className="text-[10px] font-bold opacity-80 truncate max-w-[200px] uppercase tracking-[0.2em]">
                     prescription_{selectedPrescription.id.toLowerCase()}.pdf
                   </span>
                 </div>
                 <div className="flex items-center gap-5 pr-4">
                    <div className="hidden sm:flex items-center gap-4 border-r border-white/10 pr-4">
                      <Printer size={15} className="opacity-40 hover:opacity-100 cursor-pointer transition-all" />
                      <Download size={15} className="opacity-40 hover:opacity-100 cursor-pointer transition-all" />
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold bg-white/10 px-3 py-1 rounded-full leading-none">Page 1 / 1</span>
                    </div>
                 </div>
              </div>

              {/* Scrollable Paper Container */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-white flex flex-col items-center">
                {/* Virtual Paper Surface - Simplified Full Width */}
                <div className="bg-white w-full p-8 md:p-14 aspect-[1/1.414] relative animate-in zoom-in-95 duration-500 origin-top flex flex-col font-serif">
                   {/* Prescription Header */}
                   <div className="flex justify-between items-start mb-8 border-b-2 border-gray-100 pb-8">
                      <div className="space-y-1 font-body">
                        <div className="flex items-center gap-3 mb-1">
                           <h4 className="text-xl font-black text-navy tracking-tight uppercase">{selectedPrescription.doctor}</h4>
                           <div className="flex items-center gap-1.5 px-2 py-0.5 bg-teal-50 text-[#0D9488] rounded-full border border-teal-100">
                              <CheckCircle2 size={10} />
                              <span className="text-[8px] font-black uppercase tracking-wider">Verified</span>
                           </div>
                        </div>
                        <p className="text-[10px] font-bold text-[#0D9488] uppercase tracking-[0.2em] mb-4">{selectedPrescription.specialty}</p>
                        <div className="space-y-1 pt-3">
                          <p className="text-[9px] font-bold text-navy/50 flex items-center gap-2"> {selectedPrescription.hospital}</p>
                          <p className="text-[9px] font-bold text-navy/50">Phone: +91 98765 43210 | Lic: MED-992-X</p>
                        </div>
                      </div>
                   </div>

                   {/* Patient Info Block */}
                   <div className="grid grid-cols-2 gap-8 mb-10 py-4 border-b border-gray-50">
                      <div className="space-y-0.5">
                         <p className="text-[8px] font-black text-navy/25 uppercase tracking-widest">Patient Details</p>
                         <p className="text-sm font-bold text-navy tracking-tight">Sarah Johnson</p>
                      </div>
                      <div className="text-right space-y-0.5">
                         <p className="text-[8px] font-black text-navy/25 uppercase tracking-widest">Issuance Date</p>
                         <p className="text-sm font-bold text-navy tracking-tight">{selectedPrescription.dateLabel}</p>
                      </div>
                   </div>

                   {/* Body Content */}
                   <div className="space-y-10">
                      {/* Clinical Notes */}
                      <div>
                         <p className="text-[8px] font-black text-navy/20 uppercase tracking-[0.2em] mb-3 border-b border-gray-50 pb-2">
                            Diagnosis & Clinical Observations
                         </p>
                         <p className="text-xs font-medium text-navy/60 leading-relaxed italic">
                            {selectedPrescription.diagnosis}
                         </p>
                      </div>

                      {/* Medications Manifest */}
                      <div className="space-y-6">
                         <p className="text-[8px] font-black text-navy/20 uppercase tracking-[0.2em] mb-2">Prescribed Medications</p>
                         <div className="space-y-4">
                            {selectedPrescription.medicines.map((m, idx) => (
                              <div key={idx} className="flex justify-between items-center pb-4 border-b border-gray-50 border-dotted last:border-0 last:pb-0">
                                 <div className="space-y-1">
                                    <p className="text-sm font-bold text-navy tracking-tight">{m.name}</p>
                                    <p className="text-[9px] font-medium text-navy/40">{m.instruction}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] font-black text-navy/60 uppercase tracking-widest mb-0.5">{m.dosage}</p>
                                    <p className="text-[8px] font-medium text-navy/20 uppercase tracking-widest">{m.duration}</p>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>

                   {/* Premium Official Footer */}
                   <div className="mt-12 pt-8 border-t border-gray-100/50 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-8 pb-10">
                      {/* Brand & Verification Area */}
                      <div className="flex items-center gap-5 group cursor-default">
                         <div className="p-2 border border-gray-100 rounded-lg bg-white shadow-sm group-hover:bg-gray-50 transition-colors">
                            {/* Simulated QR Code Icon */}
                            <div className="w-12 h-12 grid grid-cols-4 gap-0.5 opacity-20">
                               {[...Array(16)].map((_, i) => (
                                 <div key={i} className={`rounded-sm ${Math.random() > 0.4 ? 'bg-navy' : 'bg-transparent'}`} />
                               ))}
                            </div>
                         </div>
                         <div className="space-y-1">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-teal-50 text-[#0D9488] rounded-full border border-teal-100 w-fit">
                               <CheckCircle2 size={9} />
                               <span className="text-[7px] font-black uppercase tracking-widest">Digitally Signed</span>
                            </div>
                            <p className="text-[8px] font-medium text-navy/30 max-w-[120px] leading-tight mt-1.5">
                               Scan for instant verification of medical credentials.
                            </p>
                         </div>
                      </div>
                      
                      {/* Authorized Signature Area */}
                      <div className="text-center sm:text-right space-y-6">
                         <div className="relative inline-block mt-4 sm:mt-0">
                            {/* Seal Overlay */}
                            <div className="absolute -top-10 -left-6 w-20 h-20 border-2 border-[#0D9488]/5 rounded-full flex items-center justify-center -rotate-12 pointer-events-none">
                               <div className="w-16 h-16 border border-dashed border-[#0D9488]/10 rounded-full flex items-center justify-center p-2">
                                  <div className="text-[6px] font-black text-[#0D9488]/20 uppercase text-center leading-[1.1]">
                                     MedCare<br/>Official<br/>Authority
                                  </div>
                               </div>
                            </div>
                            
                            {/* Main Signature Block */}
                            <div className="space-y-1.5 relative z-10">
                               <div className="h-[1px] w-48 bg-navy/20 ml-auto" />
                               <p className="text-xs font-black text-navy uppercase tracking-[0.2em] pt-1">Authorized Medical Signature</p>
                               <p className="text-[10px] font-bold text-[#0D9488]/60 italic pr-1">{selectedPrescription.doctor}</p>
                            </div>
                         </div>
                         
                         <div className="flex flex-col gap-0.5 pr-1">
                            <p className="text-[7px] font-black text-navy/10 uppercase tracking-[0.3em]">Licensed Practitioner: REG-X992-00</p>
                            <p className="text-[7px] font-black text-navy/10 uppercase tracking-[0.3em]">Document Ref: PR-{selectedPrescription.id}</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default PatientPrescriptions;
