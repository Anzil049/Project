import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, Avatar, Input } from '../../components/common';
import { 
  Activity, ClipboardList, PlusCircle, Trash2, Calendar, 
  Clock, Heart, Thermometer, User, FileText, ChevronLeft, Plus, CheckCircle2 
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

const DoctorConsultationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appointment, setAppointment] = useState(null);

  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: '',
    notes: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '', instruction: '' }]
  });
  const [consultationNotes, setConsultationNotes] = useState('');

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        setLoading(true);
        const data = await doctorService.getAppointmentById(id);
        setAppointment(data);
        
        // If it was already completed or had draft prescription, pre-fill it
        if (data.prescription) {
          setPrescriptionForm({
            diagnosis: data.prescription.diagnosis || '',
            notes: data.prescription.notes || '',
            medicines: data.prescription.medicines?.length > 0 
              ? data.prescription.medicines 
              : [{ name: '', dosage: '', frequency: '', duration: '', instruction: '' }]
          });
        }
        if (data.consultation_notes) {
          setConsultationNotes(data.consultation_notes);
        }
      } catch (error) {
        toast.error('Failed to load appointment details');
        navigate('/doctor/appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentDetails();
  }, [id, navigate]);

  const addMedicine = () => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', frequency: '', duration: '', instruction: '' }]
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prescriptionForm.diagnosis.trim()) {
      toast.error('Please enter a diagnosis');
      return;
    }

    try {
      setSubmitting(true);
      await doctorService.completeAppointment(id, {
        prescription: prescriptionForm,
        consultation_notes: consultationNotes
      });
      toast.success('Consultation completed and prescription saved!');
      navigate('/doctor/appointments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete consultation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Active Consultation" role="doctor">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0D9488]" />
        </div>
      </DashboardLayout>
    );
  }

  const patient = appointment?.patient_id;
  const snapshot = appointment?.patient_snapshot;
  const patientName = patient?.name || snapshot?.name || 'Walk-in Patient';
  const patientGender = patient?.gender || snapshot?.gender || 'N/A';
  const patientAge = patient?.dob ? calculateAge(patient.dob) : (snapshot?.age || 'N/A');
  const patientPhone = patient?.phone || snapshot?.phone || 'N/A';

  const appointmentTime = appointment?.slot_id?.start_datetime 
    ? new Date(appointment.slot_id.start_datetime).toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : 'N/A';

  return (
    <DashboardLayout title="Clinical Consultation Room" role="doctor">
      <div className="max-w-7xl mx-auto space-y-8 pb-20 font-body animate-in fade-in duration-500">
        
        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/doctor/appointments')} 
            className="flex items-center gap-2 text-xs font-black text-navy/60 hover:text-navy uppercase tracking-widest transition-colors"
          >
            <ChevronLeft size={16} /> Back to Queue
          </button>
          <Badge className="bg-[#0D9488] text-white border-none text-[10px] px-6 py-2 font-black uppercase tracking-widest animate-pulse">
            Active Session
          </Badge>
        </div>

        {/* Patient Demographic Banner */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0D9488]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          
          <div className="flex items-center gap-6 relative z-10">
            <Avatar name={patientName} size="xl" className="ring-4 ring-gray-50 shadow-md" />
            <div>
              <h2 className="text-2xl font-black text-navy uppercase tracking-tight mb-1">{patientName}</h2>
              <div className="flex flex-wrap items-center gap-3 text-left">
                <Badge variant="outline" className="text-[10px] font-black border-gray-200">
                  {patientGender} • {patientAge} Years
                </Badge>
                <Badge variant="outline" className="text-[10px] font-black border-gray-200 text-red-500">
                  Blood: {patient?.bloodGroup || snapshot?.bloodGroup || 'N/A'}
                </Badge>
                <span className="text-xs text-navy/60 font-bold">Contact: {patientPhone}</span>
                <span className="text-xs text-navy/60 font-bold">Address: {patient?.address || snapshot?.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 relative z-10">
            <div className="text-center bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
              <span className="text-xs font-black text-navy/40 block uppercase tracking-wider mb-1">Time Slot</span>
              <span className="text-sm font-black text-navy">{appointmentTime}</span>
            </div>
            <div className="text-center bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
              <span className="text-xs font-black text-navy/40 block uppercase tracking-wider mb-1">Consultation</span>
              <span className="text-sm font-black text-[#0D9488] uppercase tracking-widest">{appointment?.consultation_type}</span>
            </div>
          </div>
        </div>

        {/* Consultation Layout */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Details & Vitals */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Reason for Visit Card */}
            <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-[32px]">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#0D9488]/10 flex items-center justify-center text-[#0D9488]">
                  <ClipboardList size={16} />
                </div>
                <h3 className="text-xs font-black text-navy uppercase tracking-widest">Chief Complaint</h3>
              </div>
              <p className="text-sm font-bold text-navy leading-relaxed">
                {appointment?.reason || 'No description provided.'}
              </p>
            </Card>

            {/* Vitals Input/Display Card */}
            <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-[32px]">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-4">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Activity size={16} />
                </div>
                <h3 className="text-xs font-black text-navy uppercase tracking-widest">Patient Vitals</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-100/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart size={12} className="text-red-500" />
                    <span className="text-navy/40 uppercase text-[8px] font-black tracking-widest">BP</span>
                  </div>
                  <p className="text-sm font-black text-navy">120/80 mmHg</p>
                </div>
                <div className="bg-gray-50 border border-gray-100/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity size={12} className="text-blue-500" />
                    <span className="text-navy/40 uppercase text-[8px] font-black tracking-widest">Pulse</span>
                  </div>
                  <p className="text-sm font-black text-navy">72 bpm</p>
                </div>
                <div className="bg-gray-50 border border-gray-100/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer size={12} className="text-orange-500" />
                    <span className="text-navy/40 uppercase text-[8px] font-black tracking-widest">Temp</span>
                  </div>
                  <p className="text-sm font-black text-navy">98.6 °F</p>
                </div>
                <div className="bg-gray-50 border border-gray-100/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={12} className="text-purple-500" />
                    <span className="text-navy/40 uppercase text-[8px] font-black tracking-widest">Weight</span>
                  </div>
                  <p className="text-sm font-black text-navy">70 kg</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Diagnosis & Rx Form */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Diagnosis & Notes Card */}
            <Card className="p-8 bg-white border border-gray-100 shadow-sm rounded-[40px]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black text-navy uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-[#0D9488]" /> Assessment & Notes
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-navy/55 uppercase tracking-widest pl-1">Primary Diagnosis *</label>
                      <input 
                        type="text"
                        placeholder="e.g. Acute Gastritis, Viral Bronchitis"
                        value={prescriptionForm.diagnosis}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
                        required
                        className="w-full px-5 py-4 bg-gray-50/70 border border-transparent focus:border-[#0D9488]/30 focus:bg-white rounded-2xl text-sm font-bold text-navy outline-none transition-all placeholder:text-navy/35"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-navy/55 uppercase tracking-widest pl-1">Clinical Notes & lifestyle advice</label>
                      <textarea
                        placeholder="Clinical observations, instructions, diagnostic tests to schedule, follow up plan..."
                        value={consultationNotes}
                        onChange={(e) => {
                          setConsultationNotes(e.target.value);
                          setPrescriptionForm(prev => ({ ...prev, notes: e.target.value }));
                        }}
                        rows={3}
                        className="w-full px-5 py-4 bg-gray-50/70 border border-transparent focus:border-[#0D9488]/30 focus:bg-white rounded-2xl text-sm font-bold text-navy outline-none transition-all placeholder:text-navy/35 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Prescriptions Form Card */}
            <Card className="p-8 bg-white border border-gray-100 shadow-sm rounded-[40px]">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-navy uppercase tracking-widest flex items-center gap-2">
                    <PlusCircle size={16} className="text-[#0D9488]" /> Medication Schedule
                  </h3>
                  <button
                    type="button"
                    onClick={addMedicine}
                    className="text-[10px] font-black text-[#0D9488] hover:text-[#115E59] uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                  >
                    <Plus size={12} /> Add Drug
                  </button>
                </div>

                <div className="space-y-4">
                  {prescriptionForm.medicines.map((med, idx) => (
                    <div 
                      key={idx} 
                      className="bg-gray-50 border border-gray-100/50 rounded-3xl p-5 space-y-4 relative group shadow-sm transition-all hover:border-[#0D9488]/20"
                    >
                      {prescriptionForm.medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedicine(idx)}
                          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-md border border-gray-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Medicine Name */}
                        <div className="md:col-span-5 space-y-1">
                          <label className="text-[8px] font-black text-navy/35 uppercase tracking-widest pl-1">Drug Name</label>
                          <input 
                            type="text"
                            placeholder="e.g. Amoxicillin 500mg"
                            value={med.name}
                            onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-navy outline-none"
                          />
                        </div>

                        {/* Dosage */}
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[8px] font-black text-navy/35 uppercase tracking-widest pl-1">Dosage</label>
                          <input 
                            type="text"
                            placeholder="e.g. 1 Tab / 5ml"
                            value={med.dosage}
                            onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-navy outline-none"
                          />
                        </div>

                        {/* Frequency */}
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[8px] font-black text-navy/35 uppercase tracking-widest pl-1">Frequency</label>
                          <input 
                            type="text"
                            placeholder="e.g. 1-0-1 (BD)"
                            value={med.frequency}
                            onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-navy outline-none"
                          />
                        </div>

                        {/* Duration */}
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[8px] font-black text-navy/35 uppercase tracking-widest pl-1">Duration</label>
                          <input 
                            type="text"
                            placeholder="e.g. 5 Days"
                            value={med.duration}
                            onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-navy outline-none"
                          />
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-navy/35 uppercase tracking-widest pl-1">Instructions</label>
                        <input 
                          type="text"
                          placeholder="e.g. Take after meals with warm water"
                          value={med.instruction}
                          onChange={(e) => updateMedicine(idx, 'instruction', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-navy outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Complete Consultation Button */}
            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/doctor/appointments')}
                className="rounded-2xl px-8 border-gray-200 uppercase tracking-widest font-black text-[10px] h-14"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={submitting}
                className="bg-[#0D9488] hover:bg-[#0D9488]/90 text-white rounded-2xl px-10 border-none shadow-xl shadow-[#0D9488]/20 uppercase tracking-widest font-black text-[10px] h-14 flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> Complete Consultation & Save
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default DoctorConsultationPage;
