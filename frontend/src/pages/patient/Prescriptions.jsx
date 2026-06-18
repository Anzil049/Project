import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Avatar, Modal } from '../../components/common';
import { Calendar, Download, Eye, FileText, Search, Stethoscope, Video } from 'lucide-react';
import appointmentService from '../../services/appointmentService';
import { generatePrescriptionPDF } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';

const PatientPrescriptions = () => {
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setAppointments(await appointmentService.getMyAppointments());
      } catch (error) {
        toast.error('Failed to load prescriptions');
      }
    };
    load();
  }, []);

  const prescriptions = useMemo(() => appointments
    .filter(item => item.status === 'completed')
    .filter(item => activeTab === 'all' || item.consultation_type === activeTab)
    .filter(item => {
      if (!dateFilter) return true;
      const apptDateStr = item.slot_id?.start_datetime
        ? new Date(item.slot_id.start_datetime).toISOString().split('T')[0]
        : '';
      return apptDateStr === dateFilter;
    })
    .filter(item => {
      const doctorName = item.doctor_id?.user?.name || '';
      const hospitalName = item.doctor_id?.hospitalId?.name || '';
      return `${doctorName} ${hospitalName} ${item.prescription?.diagnosis || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    }), [appointments, activeTab, dateFilter, searchQuery]);

  return (
    <DashboardLayout title="Prescriptions" role="patient">
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <div>
          <h1 className="text-3xl font-heading font-black text-navy tracking-tight">Prescriptions</h1>
          <p className="text-sm text-navy/40 font-bold mt-1">Digital prescriptions saved from completed consultations</p>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
          {['all', 'offline', 'online'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeTab === tab ? 'bg-white text-navy shadow-sm' : 'text-navy/40 hover:text-navy'}`}
            >
              {tab === 'online' ? <Video size={13} /> : <Stethoscope size={13} />}
              {tab}
            </button>
          ))}
        </div>

        <Card className="p-3 bg-white border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/25 pointer-events-none" size={16} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctor, hospital or diagnosis"
                className="w-full pl-11 pr-4 h-11 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-sm text-navy"
              />
            </div>
            <div className="relative flex gap-2 items-center">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/25 pointer-events-none" size={16} />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-11 pr-8 h-11 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-sm text-navy w-full sm:w-[180px]"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy text-xs font-bold bg-transparent border-none cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <Card className="p-16 text-center border-gray-100">
              <FileText size={42} className="mx-auto text-navy/15 mb-4" />
              <h3 className="text-xl font-black text-navy">No prescriptions found</h3>
              <p className="text-sm font-bold text-navy/35 mt-2">Completed consultations with prescriptions will appear here.</p>
            </Card>
          ) : prescriptions.map(item => {
            const doctorName = item.doctor_id?.user?.name || 'Doctor';
            const date = item.slot_id?.start_datetime
              ? new Date(item.slot_id.start_datetime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Completed';
            return (
              <Card key={item._id} className="p-6 bg-white border border-gray-100 rounded-[28px] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <Avatar src={item.doctor_id?.user?.image} name={doctorName} size="lg" />
                  <div>
                    <h3 className="text-lg font-black text-navy">{doctorName}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#0D9488] mt-1">{item.doctor_id?.specialization || 'Consultation'} • {item.consultation_type}</p>
                    <p className="text-xs font-bold text-navy/40 mt-2 flex items-center gap-2"><Calendar size={13} /> {date}</p>
                  </div>
                </div>
                <div className="flex-1 bg-gray-50 rounded-2xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-navy/35">Diagnosis</p>
                  <p className="text-sm font-bold text-navy mt-1">{item.prescription?.diagnosis || 'Routine Consultation'}</p>
                  <p className="text-xs font-bold text-navy/45 mt-2">{item.prescription?.medicines?.length || 0} medicines prescribed</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedPrescription(item)} className="rounded-xl text-[10px]">
                    <Eye size={14} /> Preview
                  </Button>
                  <Button onClick={() => generatePrescriptionPDF(item)} className="bg-[#0D9488] text-white border-none rounded-xl text-[10px] flex items-center gap-1">
                    <Download size={14} /> Download PDF
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Modal isOpen={Boolean(selectedPrescription)} onClose={() => setSelectedPrescription(null)} title="Prescription" size="lg">
        {selectedPrescription && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
              <div>
                <h2 className="text-2xl font-black text-navy">{selectedPrescription.doctor_id?.user?.name || 'Doctor'}</h2>
                <p className="text-xs font-black uppercase tracking-widest text-[#0D9488] mt-1">{selectedPrescription.doctor_id?.specialization}</p>
              </div>
              <p className="text-xs font-bold text-navy/40">Token T-{selectedPrescription.token_number || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-navy/35 mb-2">Diagnosis</p>
              <p className="text-sm font-bold text-navy">{selectedPrescription.prescription?.diagnosis}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-navy/35 uppercase tracking-widest mb-3">Medicines</p>
              <div className="hidden md:grid grid-cols-4 gap-3 px-4 mb-2 text-[10px] font-black text-navy/40 uppercase tracking-widest">
                <span>Drug Name</span>
                <span>Dosage</span>
                <span>Frequency</span>
                <span>Duration</span>
              </div>
              <div className="space-y-3">
                {(selectedPrescription.prescription?.medicines || []).map((medicine, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl bg-gray-50 p-4 text-sm font-bold text-navy">
                    <span className="flex flex-col md:block">
                      <span className="text-[9px] font-black text-navy/30 uppercase tracking-widest md:hidden mb-1">Drug Name</span>
                      {medicine.name}
                    </span>
                    <span className="flex flex-col md:block">
                      <span className="text-[9px] font-black text-navy/30 uppercase tracking-widest md:hidden mb-1">Dosage</span>
                      {medicine.dosage || '-'}
                    </span>
                    <span className="flex flex-col md:block">
                      <span className="text-[9px] font-black text-navy/30 uppercase tracking-widest md:hidden mb-1">Frequency</span>
                      {medicine.frequency || '-'}
                    </span>
                    <span className="flex flex-col md:block">
                      <span className="text-[9px] font-black text-navy/30 uppercase tracking-widest md:hidden mb-1">Duration</span>
                      {medicine.duration || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Vitals block in Patient Preview */}
            {((selectedPrescription.vitals && (selectedPrescription.vitals.bp || selectedPrescription.vitals.pulse || selectedPrescription.vitals.temperature || selectedPrescription.vitals.weight)) || (selectedPrescription.custom_vitals && selectedPrescription.custom_vitals.length > 0)) && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-navy/35">Vitals & Measurements</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedPrescription.vitals?.bp && (
                    <div className="bg-gray-50 rounded-xl p-3 text-left">
                      <span className="text-navy/40 uppercase text-[7px] font-black tracking-widest block">BP</span>
                      <span className="text-xs font-black text-navy">{selectedPrescription.vitals.bp}</span>
                    </div>
                  )}
                  {selectedPrescription.vitals?.pulse && (
                    <div className="bg-gray-50 rounded-xl p-3 text-left">
                      <span className="text-navy/40 uppercase text-[7px] font-black tracking-widest block">Pulse</span>
                      <span className="text-xs font-black text-navy">{selectedPrescription.vitals.pulse} bpm</span>
                    </div>
                  )}
                  {selectedPrescription.vitals?.temperature && (
                    <div className="bg-gray-50 rounded-xl p-3 text-left">
                      <span className="text-navy/40 uppercase text-[7px] font-black tracking-widest block">Temp</span>
                      <span className="text-xs font-black text-navy">{selectedPrescription.vitals.temperature} °F</span>
                    </div>
                  )}
                  {selectedPrescription.vitals?.weight && (
                    <div className="bg-gray-50 rounded-xl p-3 text-left">
                      <span className="text-navy/40 uppercase text-[7px] font-black tracking-widest block">Weight</span>
                      <span className="text-xs font-black text-navy">{selectedPrescription.vitals.weight} kg</span>
                    </div>
                  )}
                  {selectedPrescription.custom_vitals?.map((cv, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-3 text-left">
                      <span className="text-navy/40 uppercase text-[7px] font-black tracking-widest block">{cv.name}</span>
                      <span className="text-xs font-black text-navy">{cv.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPrescription.consultation_notes && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-navy/35 mb-2">Notes</p>
                <p className="text-sm font-bold text-navy/70 whitespace-pre-line">{selectedPrescription.consultation_notes}</p>
              </div>
            )}

            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedPrescription(null)} className="rounded-xl text-[10px]">
                Close
              </Button>
              <Button onClick={() => generatePrescriptionPDF(selectedPrescription)} className="bg-[#0D9488] text-white border-none rounded-xl text-[10px] flex items-center gap-1.5">
                <Download size={13} /> Download PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default PatientPrescriptions;
