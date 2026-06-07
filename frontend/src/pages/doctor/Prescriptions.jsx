import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Avatar, Badge, Modal } from '../../components/common';
import { Calendar, Eye, FileText, History, Search } from 'lucide-react';
import doctorService from '../../services/doctorService';
import toast from 'react-hot-toast';

const DoctorPrescriptions = () => {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setAppointments(await doctorService.getAppointments());
      } catch (error) {
        toast.error('Failed to load prescription history');
      }
    };
    load();
  }, []);

  const prescriptions = useMemo(() => appointments
    .filter(item => item.status === 'completed' && item.prescription?.diagnosis)
    .filter(item => {
      const patient = item.patient_id?.name || item.patient_snapshot?.name || '';
      return `${patient} ${item.prescription?.diagnosis || ''}`.toLowerCase().includes(search.toLowerCase());
    }), [appointments, search]);

  return (
    <DashboardLayout title="Prescription Management" role="doctor">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <div>
          <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
            Patient <span className="text-[#0D9488]">Prescriptions</span>
          </h1>
          <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2 mt-2">
            <History size={14} className="text-[#0D9488]" /> Saved after completed consultations
          </p>
        </div>

        <div className="flex items-center bg-white p-4 rounded-[28px] border border-gray-100 shadow-sm gap-4">
          <Search className="text-navy/30 ml-2" size={20} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name or diagnosis"
            className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-navy"
          />
        </div>

        {prescriptions.length === 0 ? (
          <Card className="p-16 text-center border-gray-100">
            <FileText size={44} className="mx-auto text-navy/15 mb-4" />
            <h3 className="text-xl font-black text-navy">No prescription history yet</h3>
            <p className="text-sm font-bold text-navy/35 mt-2">Complete a consultation with a prescription to see it here.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prescriptions.map(item => {
              const patient = item.patient_id?.name || item.patient_snapshot?.name || 'Walk-in Patient';
              const date = item.slot_id?.start_datetime
                ? new Date(item.slot_id.start_datetime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Completed';
              return (
                <Card key={item._id} className="p-7 bg-white border border-gray-100 shadow-sm rounded-[32px]">
                  <div className="flex items-start justify-between mb-6">
                    <Badge className="bg-[#0D9488]/10 text-[#0D9488] border-none text-[9px] uppercase">{item.consultation_type}</Badge>
                    <span className="text-[10px] font-bold text-navy/30 uppercase tracking-widest">{date}</span>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar name={patient} />
                    <div>
                      <h4 className="text-lg font-black text-navy">{patient}</h4>
                      <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-[0.2em]">{item.prescription.diagnosis}</p>
                    </div>
                  </div>
                  <p className="text-[11px] font-bold text-navy/55 mb-6">
                    {item.prescription.medicines?.length || 0} medicines prescribed
                  </p>
                  <Button onClick={() => setSelected(item)} className="w-full bg-navy text-white border-none rounded-2xl text-[10px]">
                    <Eye size={14} /> View Prescription
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Prescription Details" size="lg">
        {selected && (
          <div className="space-y-6">
            <div className="bg-[#0D9488]/5 p-6 rounded-[28px] border border-[#0D9488]/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={selected.patient_id?.name || selected.patient_snapshot?.name || 'Patient'} size="lg" />
                <div>
                  <p className="text-sm font-black text-navy uppercase tracking-widest leading-none mb-1">
                    {selected.patient_id?.name || selected.patient_snapshot?.name || 'Patient'}
                  </p>
                  <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-widest">Token T-{selected.token_number || '-'}</p>
                </div>
              </div>
              <Calendar size={20} className="text-navy/30" />
            </div>
            <div>
              <p className="text-[10px] font-black text-navy/35 uppercase tracking-widest mb-2">Diagnosis</p>
              <p className="text-sm font-bold text-navy">{selected.prescription?.diagnosis}</p>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-navy/35 uppercase tracking-widest">Medicines</p>
              {(selected.prescription?.medicines || []).map((medicine, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl bg-gray-50 p-4 text-sm font-bold text-navy">
                  <span>{medicine.name}</span>
                  <span>{medicine.dosage}</span>
                  <span>{medicine.frequency}</span>
                  <span>{medicine.duration}</span>
                </div>
              ))}
            </div>
            {selected.consultation_notes && (
              <div>
                <p className="text-[10px] font-black text-navy/35 uppercase tracking-widest mb-2">Notes</p>
                <p className="text-sm font-bold text-navy/65">{selected.consultation_notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default DoctorPrescriptions;
