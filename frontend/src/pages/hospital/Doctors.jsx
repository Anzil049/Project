import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Input, Modal, Badge, Avatar, EmptyState } from '../../components/common';
import { 
  Plus, Search, Edit2, Trash2, Eye, 
  Mail, Phone, Clock, Stethoscope, 
  ChevronRight, MoreVertical, Calendar,
  AlertCircle, Hash, X, Check, Camera, Image as ImageIcon,
  Video, VideoOff, ShieldOff, Lock, Unlock, ShieldCheck, Loader2,
  CalendarCheck
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import hospitalService from '../../services/hospitalService';
import { hospitalDoctorSchema } from '../../utils/validationSchemas';

const minutesFromTime = (time) => {
  const [hour, minute] = String(time).split(':').map(Number);
  return (hour * 60) + minute;
};

const calculateSlotSummary = (schedule) => {
  const start = minutesFromTime(schedule.start_time);
  const end = minutesFromTime(schedule.end_time);
  const duration = Number(schedule.slot_duration);
  const total = Number.isFinite(start) && Number.isFinite(end) && duration > 0 && end > start
    ? Math.floor((end - start) / duration)
    : 0;
  return {
    total,
    regular: total,
  };
};

const HospitalDoctors = () => {
  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const fileInputRef = useRef(null);

  const getAvailableDaysFromSchedules = (schedules) => {
    if (!schedules || schedules.length === 0) return [];
    const days = schedules.map(s => s.day_of_week);
    return allDays.filter(d => days.includes(d));
  };

  // Mock Data
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await hospitalService.getDoctors();
      // Map data to match the UI format
      const formattedDoctors = data.map(doc => ({
        id: doc._id,
        name: doc.user?.name || 'Unknown',
        email: doc.user?.email || '',
        phone: doc.user?.phone || '',
        specialization: doc.specialization,
        licenseNumber: doc.licenseNumber,
        experience: doc.experience,
        qualifications: doc.qualifications || '',
        image: doc.user?.image || '',
        schedules: doc.schedules || [],
        slots: doc.slots || [],
        availableDays: doc.availableDays || [],
        maxTokens: doc.maxTokens,
        booking_window_days: doc.booking_window_days || 30,
        unavailability: doc.unavailability || [],
        isAcceptingAppointments: doc.isAcceptingAppointments ?? true,
        appointmentsToday: 0, // Mock for now
        status: doc.user?.status || 'active'
      }));
      setDoctors(formattedDoctors);
    } catch (err) {
      toast.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [viewingDoctor, setViewingDoctor] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDoctor, setScheduleDoctor] = useState(null);
  const [tempSchedules, setTempSchedules] = useState([]);
  const [bookingWindow, setBookingWindow] = useState(30);
  const [isAccepting, setIsAccepting] = useState(true);
  const [unavailability, setUnavailability] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(hospitalDoctorSchema),
  });
  const image = watch('image');
  const specialization = watch('specialization');

  const specializations = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 
    'Dermatology', 'Gastroenterology', 'General Medicine'
  ];

  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (doctor = null) => {
    if (doctor) {
      setEditingDoctor(doctor);
      reset({
        name: doctor.name,
        specialization: specializations.includes(doctor.specialization) ? doctor.specialization : 'Other',
        customSpecialization: specializations.includes(doctor.specialization) ? '' : doctor.specialization,
        email: doctor.email,
        phone: doctor.phone,
        licenseNumber: doctor.licenseNumber || '',
        experience: doctor.experience || '',
        qualifications: doctor.qualifications || '',
        maxTokens: doctor.maxTokens || 20,
        image: doctor.image || null
      });
    } else {
      setEditingDoctor(null);
      reset({
        name: '',
        specialization: '',
        customSpecialization: '',
        email: '',
        phone: '',
        licenseNumber: '',
        experience: '',
        qualifications: '',
        maxTokens: 20,
        image: null
      });
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (doctor) => {
    setViewingDoctor(doctor);
    setIsViewModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setValue('image', imageUrl);
    }
  };

  const handleOpenScheduleModal = (doctor) => {
    setScheduleDoctor(doctor);
    setTempSchedules(doctor.schedules && doctor.schedules.length > 0 
      ? doctor.schedules.map(s => ({
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          slot_duration: s.slot_duration || 15,
          follow_up_percentage: s.follow_up_percentage || 0,
        }))
      : [{ day_of_week: 'Mon', start_time: '10:00', end_time: '13:00', slot_duration: 15, follow_up_percentage: 0 }]
    );
    setBookingWindow(doctor.booking_window_days || 30);
    setIsAccepting(doctor.isAcceptingAppointments ?? true);
    setUnavailability(doctor.unavailability ? [...doctor.unavailability] : []);
    setIsScheduleModalOpen(true);
  };

  const handleAddScheduleRow = () => {
    setTempSchedules(prev => [
      ...prev,
      { day_of_week: 'Mon', start_time: '10:00', end_time: '13:00', slot_duration: 15, follow_up_percentage: 0 }
    ]);
  };

  const handleRemoveScheduleRow = (index) => {
    setTempSchedules(prev => prev.filter((_, i) => i !== index));
  };

  const handleScheduleRowChange = (index, field, value) => {
    setTempSchedules(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleAddLeaveDate = () => {
    setUnavailability(prev => [...prev, { date: new Date().toISOString().slice(0, 10), reason: 'leave', note: '' }]);
  };

  const handleRemoveLeaveDate = (index) => {
    setUnavailability(prev => prev.filter((_, i) => i !== index));
  };

  const handleLeaveDateChange = (index, field, value) => {
    setUnavailability(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const validateSchedules = (schedulesToValidate) => {
    for (const schedule of schedulesToValidate) {
      if (!schedule.start_time || !schedule.end_time) {
        return 'All schedules must have a start and end time';
      }
      if (schedule.start_time >= schedule.end_time) {
        return `Start time (${schedule.start_time}) must be before end time (${schedule.end_time})`;
      }
      if (!schedule.slot_duration || schedule.slot_duration < 5) {
        return 'Slot duration must be at least 5 minutes';
      }
    }
    return null;
  };

  const submitSchedule = async () => {
    const error = validateSchedules(tempSchedules);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      setSubmitting(true);
      const response = await hospitalService.updateDoctor(scheduleDoctor.id, {
        isAcceptingAppointments: isAccepting,
        booking_window_days: Number(bookingWindow),
        schedules: tempSchedules,
        unavailability: unavailability
      });
      toast.success(response.message || 'Doctor schedule updated successfully!');
      setIsScheduleModalOpen(false);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await hospitalService.toggleDoctorStatus(id);
      toast.success(response.message || 'Status updated successfully');
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle doctor status');
    }
  };

  const handleDelete = (id) => {
    const doctor = doctors.find(d => d.id === id);
    if (!doctor) return;
    toast((t) => (
      <div className="flex flex-col gap-4 p-1">
        <div>
          <p className="font-black text-navy text-sm uppercase tracking-tight">Manage Practitioner</p>
          <p className="text-[10px] font-bold text-navy/40 uppercase tracking-widest mt-1">Choose action for {doctor.name}</p>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <Button 
            className="bg-red-500 hover:bg-red-600 text-white h-10 py-0 text-[10px] font-black uppercase tracking-widest rounded-xl border-none shadow-lg shadow-red-500/20"
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await hospitalService.deleteDoctor(id);
                toast.success('Doctor record deleted completely');
                fetchDoctors();
              } catch (err) {
                toast.error('Failed to delete doctor');
              }
            }}
          >
            <Trash2 size={14} className="mr-2" /> Delete Completely
          </Button>
          
          <Button 
            className="bg-amber-500 hover:bg-amber-600 text-white h-10 py-0 text-[10px] font-black uppercase tracking-widest rounded-xl border-none shadow-lg shadow-amber-500/20"
            onClick={() => {
              toast.dismiss(t.id);
              handleToggleStatus(id);
            }}
          >
            <Lock size={14} className="mr-2" /> {doctor.status === 'active' ? 'Block Access' : 'Unblock Access'}
          </Button>
          
          <Button 
            variant="ghost" 
            className="h-10 py-0 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-100"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </Button>
        </div>
      </div>
    ), { 
      duration: 6000,
      position: 'top-center',
      style: {
        minWidth: '320px',
        padding: '16px',
        borderRadius: '24px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }
    });
  };

  const onFormSubmit = async (data) => {
    const finalSpecialization = data.specialization === 'Other' 
      ? data.customSpecialization 
      : data.specialization;

    try {
      setSubmitting(true);
      
      let imageUrl = data.image;
      if (selectedFile) {
        imageUrl = await hospitalService.uploadImage(selectedFile);
      }

      if (editingDoctor) {
        const response = await hospitalService.updateDoctor(editingDoctor.id, {
          ...data,
          image: imageUrl,
          specialization: finalSpecialization
        });
        toast.success(response.message || 'Doctor record updated!');
        fetchDoctors();
        setIsModalOpen(false);
      } else {
        const response = await hospitalService.addDoctor({
          ...data,
          image: imageUrl,
          specialization: finalSpecialization
        });
        toast.success(response.message || 'New doctor registered successfully!');
        fetchDoctors(); // Refresh the list
        setIsModalOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process request.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDays = (days) => {
    if (!days) return '';
    if (days.length === 7) return 'Every Day';
    if (days.length === 5 && weekdays.every(d => days.includes(d))) return 'Weekdays';
    return days.join(', ');
  };

  return (
    <DashboardLayout title="Doctor Management" role="hospital">
      <div className="max-w-7xl mx-auto space-y-8 pb-20 font-body">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">Medical <span className="text-[#0D9488]">Registry</span></h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2 mt-2">
              <Stethoscope size={14} className="text-[#0D9488]" /> Verified Healthcare Professionals
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/20 group-focus-within:text-[#0D9488] transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search by name or specialty..."
                className="pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-navy placeholder:text-navy/20 focus:border-[#0D9488]/30 focus:ring-4 focus:ring-[#0D9488]/5 transition-all w-full md:w-80 shadow-sm"
              />
            </div>
            <Button 
              onClick={() => handleOpenModal()}
              className="bg-[#0D9488] hover:bg-[#115E59] shadow-xl shadow-[#0D9488]/20 h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 border-none"
            >
              <Plus size={20} /> Add New Doctor
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="p-4 bg-white border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative w-full md:w-96">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/30" />
            <input 
              type="text"
              placeholder="Search by name or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0D9488]/20 focus:bg-white transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-8 px-4">
               <div className="text-center">
                  <p className="text-xs font-black text-navy/30 uppercase tracking-widest leading-none mb-1">Total</p>
                  <p className="text-lg font-black text-[#0D9488]">{doctors.length}</p>
               </div>
          </div>
        </Card>

        {/* Content View */}
        {filteredDoctors.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <Card className="hidden lg:block bg-white border border-gray-100 shadow-sm overflow-hidden rounded-[32px]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-navy/30">Doctor Identity</th>
                      <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-navy/30">Spec. & Days</th>
                      <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-navy/30">Sessions</th>
                      <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-navy/30 text-center">Total Bookings</th>
                      <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-navy/30 text-right">Administrative</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDoctors.map((doctor) => (
                      <tr key={doctor.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <Avatar src={doctor.image} name={doctor.name} size="lg" className="bg-[#0D9488]/5 text-[#0D9488] border border-[#0D9488]/10 font-black shadow-none" />
                            <div>
                              <p className="font-bold text-navy group-hover:text-[#0D9488] transition-colors">{doctor.name}</p>
                              <p className="text-[10px] font-bold text-navy/40 mt-1 uppercase tracking-wider">{doctor.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2 text-xs font-bold text-navy/80 capitalize">
                              <Stethoscope size={14} className="text-[#0D9488]/40" /> {doctor.specialization}
                           </div>
                           <div className="flex items-center gap-4 mt-1.5">
                              <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-wider flex items-center gap-1">
                                 <Calendar size={10} /> {formatDays(getAvailableDaysFromSchedules(doctor.schedules))}
                              </p>

                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col gap-1.5">
                              {!doctor.isAcceptingAppointments && (
                                 <div className="inline-flex items-center self-start gap-1.5 px-2 py-0.5 bg-red-50 text-red-600 rounded text-[8px] font-black uppercase tracking-tighter border border-red-100 mb-1">
                                    <X size={10} /> Booking Paused
                                 </div>
                              )}
                              {doctor.schedules && doctor.schedules.length > 0 ? doctor.schedules.map((schedule, i) => (
                                 <div key={i} className="inline-flex items-center self-start gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-wider border border-blue-100/50">
                                    <Clock size={10} /> {schedule.day_of_week}: {schedule.start_time} - {schedule.end_time} ({schedule.slot_duration}m)
                                 </div>
                              )) : (
                                 <p className="text-[10px] font-bold text-navy/20 italic">No schedules defined</p>
                              )}
                           </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                           <div className="inline-flex flex-col items-center">
                              <p className="text-sm font-black text-navy">{doctor.appointmentsToday}</p>
                              <p className="text-[9px] font-black text-navy/20 uppercase tracking-widest border-t border-gray-100 pt-1 mt-1">
                                Limit: {doctor.maxTokens}
                              </p>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-end gap-2">
                             <button onClick={() => handleOpenScheduleModal(doctor)} className="p-2 text-navy/30 hover:text-[#0D9488] hover:bg-[#0D9488]/10 rounded-xl transition-all" title="Manage Schedule">
                                <CalendarCheck size={18} />
                             </button>
                             <button onClick={() => handleOpenModal(doctor)} className="p-2 text-navy/30 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Edit Profile">
                                <Edit2 size={18} />
                             </button>
                             <button onClick={() => handleOpenViewModal(doctor)} className="p-2 text-navy/30 hover:text-[#0D9488] hover:bg-[#0D9488]/10 rounded-xl transition-all" title="View Public Profile">
                                <Eye size={18} />
                             </button>
                             <button 
                                onClick={() => handleToggleStatus(doctor.id)} 
                                className={`p-2 rounded-xl transition-all ${doctor.status === 'active' ? 'text-navy/30 hover:text-amber-500 hover:bg-amber-50' : 'text-amber-500 bg-amber-50 hover:bg-amber-100'}`} 
                                title={doctor.status === 'active' ? 'Block Doctor' : 'Unblock Doctor'}
                             >
                                {doctor.status === 'active' ? <Unlock size={18} /> : <Lock size={18} />}
                             </button>
                             <button onClick={() => handleDelete(doctor.id)} className="p-2 text-navy/30 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Manage Record">
                                 <Trash2 size={18} />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-5">
              {filteredDoctors.map((doctor) => (
                <Card key={doctor.id} className="p-6 bg-white border border-gray-100 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar src={doctor.image} name={doctor.name} size="lg" className="bg-[#0D9488]/5 text-[#0D9488] font-black shadow-none" />
                        <div>
                           <p className="font-bold text-navy">{doctor.name}</p>
                           <div className="flex items-center gap-2 mt-1">
                              <p className="text-[10px] font-bold text-navy/40 uppercase tracking-wider text-[#0D9488]">{formatDays(getAvailableDaysFromSchedules(doctor.schedules))}</p>

                           </div>
                        </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleOpenScheduleModal(doctor)} className="p-2 text-[#0D9488] bg-[#0D9488]/10 rounded-lg" title="Schedule"><CalendarCheck size={16} /></button>
                      <button onClick={() => handleOpenViewModal(doctor)} className="p-2 text-[#0D9488] bg-[#0D9488]/10 rounded-lg"><Eye size={16} /></button>
                      <button onClick={() => handleOpenModal(doctor)} className="p-2 text-blue-500 bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button 
                        onClick={() => handleToggleStatus(doctor.id)} 
                        className={`p-2 rounded-lg ${doctor.status === 'active' ? 'text-amber-500 bg-amber-50' : 'text-white bg-amber-500'}`}
                      >
                        {doctor.status === 'active' ? <Unlock size={16} /> : <Lock size={16} />}
                      </button>
                      <button onClick={() => handleDelete(doctor.id)} className="p-2 text-red-500 bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 text-left">
                      <div className="p-4 bg-gray-50 rounded-2xl">
                         <p className="text-[8px] font-black text-navy/30 uppercase tracking-widest mb-2 flex items-center justify-between">
                            Availability Sessions
                            <div className="flex items-center gap-2">
                               {!doctor.isAcceptingAppointments && (
                                 <span className="text-[8px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">Paused</span>
                                )}
                               <span className="text-[#0D9488]">{doctor.specialization}</span>
                            </div>
                         </p>
                         <div className="flex flex-wrap gap-2">
                            {doctor.schedules && doctor.schedules.length > 0 ? doctor.schedules.map((schedule, i) => (
                              <p key={i} className="text-[9px] font-bold text-navy/70 flex items-center gap-1.5 uppercase bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">
                                 <Clock size={10} className="text-[#0D9488]" /> {schedule.day_of_week}: {schedule.start_time} - {schedule.end_time}
                              </p>
                            )) : (
                              <p className="text-[10px] font-bold text-navy/20 italic">No schedules defined</p>
                            )}
                         </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                         <div>
                            <p className="text-[8px] font-black text-navy/30 uppercase tracking-widest mb-1.5">Total Bookings</p>
                            <p className="text-[10px] font-bold text-navy/70 flex items-center gap-1.5 uppercase">
                               <Calendar size={12} className="text-blue-500" /> {doctor.appointmentsToday} Tokens
                            </p>
                         </div>
                         <div className="text-right">
                            <p className="text-[8px] font-black text-navy/30 uppercase tracking-widest mb-1.5">Daily Limit</p>
                            <p className="text-[11px] font-black text-[#0D9488] uppercase tracking-tighter">{doctor.maxTokens}</p>
                         </div>
                      </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <EmptyState 
            title="No practitioners found" 
            description="We couldn't find any doctor matching your current search parameters."
            icon={Stethoscope}
            action={{ label: "Add Your First Doctor", onClick: () => handleOpenModal() }}
          />
        )}
      </div>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Doctor Profile Information"
        size="md"
      >
        {viewingDoctor && (
          <div className="space-y-8">
            <div className="flex items-center gap-6 p-6 bg-[#0D9488]/5 rounded-[32px] border border-[#0D9488]/10">
                <Avatar src={viewingDoctor.image} name={viewingDoctor.name} size="xl" className="shadow-xl shadow-[#0D9488]/20" />
                <div>
                   <h3 className="text-2xl font-black text-navy tracking-tight">{viewingDoctor.name}</h3>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="px-3 py-1 bg-[#0D9488]/10 text-[#0D9488] text-[10px] font-black uppercase tracking-widest rounded-lg">
                        {viewingDoctor.specialization}
                      </span>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Card className="p-5 border-gray-100 shadow-none bg-white">
                  <p className="text-[8px] font-black text-navy/30 uppercase tracking-widest mb-3">Contact Details</p>
                  <div className="space-y-3">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 text-navy/40 flex items-center justify-center"><Mail size={16}/></div>
                        <div>
                           <p className="text-[9px] font-bold text-navy/30 uppercase leading-none mb-1">Email Address</p>
                           <p className="text-sm font-bold text-navy truncate">{viewingDoctor.email}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 text-navy/40 flex items-center justify-center"><Phone size={16}/></div>
                        <div>
                           <p className="text-[9px] font-bold text-navy/30 uppercase leading-none mb-1">Phone Number</p>
                           <p className="text-sm font-bold text-navy">{viewingDoctor.phone}</p>
                        </div>
                     </div>
                  </div>
               </Card>
            </div>

            <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 shadow-sm transition-all hover:bg-[#0D9488]/5 group">
               <p className="text-[10px] font-black text-navy/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Clock size={14} className="text-[#0D9488]" /> Consultation Schedule
               </p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-[9px] font-bold text-navy/30 uppercase tracking-widest mb-3">Working Days</p>
                    <div className="flex flex-wrap gap-2">
                       {allDays.map(day => (
                         <span key={day} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${getAvailableDaysFromSchedules(viewingDoctor.schedules).includes(day) ? 'bg-[#0D9488] text-white shadow-md shadow-[#0D9488]/10' : 'bg-white text-navy/20 border border-gray-100'}`}>
                           {day}
                         </span>
                       ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-navy/30 uppercase tracking-widest mb-3">Time Slots</p>
                    <div className="space-y-2">
                       {viewingDoctor.schedules && viewingDoctor.schedules.length > 0 ? viewingDoctor.schedules.map((schedule, i) => (
                         <div key={i} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm group-hover:border-[#0D9488]/30 transition-all">
                            <span className="text-[10px] font-black text-navy/30 uppercase tracking-widest italic">{schedule.day_of_week} ({schedule.slot_duration}m)</span>
                            <span className="text-[10px] font-black text-[#0D9488]">{schedule.start_time} - {schedule.end_time}</span>
                         </div>
                       )) : (
                          <p className="text-[10px] font-bold text-navy/20 italic">No schedules configured</p>
                       )}
                    </div>
                  </div>
               </div>
            </div>

            <Button 
               onClick={() => setIsViewModalOpen(false)}
               className="w-full h-14 bg-gray-50 text-navy/60 hover:bg-gray-100 rounded-2xl font-black text-[11px] uppercase tracking-widest border-none"
            >
               Close Profile
            </Button>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingDoctor ? 'Edit Doctor Record' : 'Register New Doctor'}
        size="md"
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
             {/* Profile Photo Upload */}
             <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100 transition-colors">
                <div className="relative group">
                   <Avatar 
                      src={image} 
                      name={watch('name') || '?'} 
                      size="xl" 
                      className="bg-white border-4 border-white shadow-lg shadow-[#0D9488]/10" 
                   />
                   <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-[#0D9488] text-white rounded-full shadow-lg hover:scale-110 transition-all border-2 border-white"
                   >
                      <Camera size={16} />
                   </button>
                </div>
                <div className="space-y-1 flex-1 text-left">
                   <h4 className="text-sm font-black text-navy tracking-tight">Profile Photo</h4>
                   <p className="text-[10px] font-bold text-navy/40 leading-relaxed uppercase tracking-widest bg-white/50 inline-block px-2 py-1 rounded">Optional</p>
                   <div className="flex gap-2 pt-2">
                      <Button 
                         type="button" 
                         variant="outline" 
                         onClick={() => fileInputRef.current?.click()}
                         className="h-9 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest border border-gray-100"
                      >
                         <ImageIcon size={14} className="mr-2" /> Select Image
                      </Button>
                      {image && (
                        <button 
                           type="button"
                           onClick={() => { setValue('image', null); setSelectedFile(null); }}
                           className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
                        >
                           Remove
                        </button>
                      )}
                   </div>
                   <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden" 
                      accept="image/*"
                   />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                    label="Full Professional Name"
                    placeholder="e.g. Dr. Jane Smith"
                    {...register('name')}
                    error={errors.name?.message}
                />
                <Input 
                    label="Daily Token Limit"
                    type="number"
                    placeholder="e.g. 20"
                    icon={Hash}
                    {...register('maxTokens')}
                    error={errors.maxTokens?.message}
                />
             </div>

             <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-navy/40 uppercase tracking-widest pl-1">Primary Specialization</label>
                <select 
                   className={`w-full bg-white border-2 rounded-2xl px-4 py-4 focus:border-[#0D9488] transition-all outline-none font-body text-sm font-bold text-navy ${errors.specialization ? 'border-red-500' : 'border-gray-100'}`}
                   {...register('specialization')}
                >
                   <option value="" disabled>Select specialization</option>
                   {specializations.map(s => <option key={s} value={s}>{s}</option>)}
                   <option value="Other">Other Specialist...</option>
                </select>
                {errors.specialization && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest px-2">{errors.specialization.message}</p>}
             </div>

             {specialization === 'Other' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <Input 
                    label="Custom Specialization"
                    placeholder="Enter specialist type"
                    {...register('customSpecialization')}
                    error={errors.customSpecialization?.message}
                  />
                </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Input 
                  label="Official Email"
                  disabled={!!editingDoctor}
                  type="email"
                  placeholder="name@hospital.com"
                  {...register('email')}
                  error={errors.email?.message}
               />
               <Input 
                  label="Contact Phone"
                  placeholder="+91 XXXXX XXXXX"
                  {...register('phone')}
                  error={errors.phone?.message}
               />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Input 
                  label="License Number"
                  placeholder="e.g. MD-12345"
                  {...register('licenseNumber')}
                  error={errors.licenseNumber?.message}
               />
               <Input 
                  label="Years of Experience"
                  placeholder="e.g. 10"
                  {...register('experience')}
                  error={errors.experience?.message}
               />
             </div>
             
             <Input 
                label="Medical Qualifications"
                placeholder="e.g. MBBS, MD, FRCS"
                {...register('qualifications')}
                error={errors.qualifications?.message}
             />
           </div>

             <div className="flex gap-3 pt-4">
                <Button 
                   type="button"
                   variant="outline"
                   onClick={() => setIsModalOpen(false)}
                   className="flex-1 h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest border-2"
                >
                   Cancel
                </Button>
                <Button 
                   type="submit"
                   disabled={submitting}
                   className="flex-[2] bg-[#0D9488] hover:bg-[#115E59] shadow-lg shadow-[#0D9488]/20 h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest border-none disabled:opacity-70"
                >
                   {submitting ? (
                     <span className="flex items-center gap-2">
                       <Loader2 size={16} className="animate-spin" />
                       Processing...
                     </span>
                   ) : (
                     editingDoctor ? 'Save Changes' : 'Register Doctor'
                   )}
                </Button>
             </div>

        </form>
      </Modal>

      {/* Schedule Management Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Manage Doctor Schedule"
        size="md"
      >
        {scheduleDoctor && (
          <div className="space-y-8">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
               <Avatar src={scheduleDoctor.image} name={scheduleDoctor.name} size="md" />
               <div>
                  <p className="font-black text-navy">{scheduleDoctor.name}</p>
                  <p className="text-[10px] font-bold text-[#0D9488] uppercase tracking-widest">{scheduleDoctor.specialization}</p>
               </div>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center justify-between p-6 bg-amber-50/50 rounded-[32px] border border-amber-100">
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAccepting ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-400'}`}>
                     <Calendar size={20} />
                  </div>
                  <div className="text-left">
                     <p className="text-sm font-black text-navy uppercase tracking-tight">Accepting Appointments</p>
                     <p className="text-[10px] font-bold text-navy/40 uppercase tracking-widest">Enable or disable booking for this doctor</p>
                  </div>
               </div>
               <button 
                  type="button"
                  onClick={() => setIsAccepting(!isAccepting)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors outline-none ${isAccepting ? 'bg-amber-500' : 'bg-gray-300'}`}
               >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isAccepting ? 'translate-x-6' : 'translate-x-1'}`} />
               </button>
            </div>

            {/* Booking Window Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-[#F8FAFC] rounded-[24px] border border-gray-100">
              <label className="space-y-2 text-left">
                <span className="text-[10px] font-black uppercase text-navy/35">Booking Window</span>
                <select
                  value={bookingWindow}
                  onChange={(e) => setBookingWindow(Number(e.target.value))}
                  className="w-full rounded-2xl bg-white border border-gray-100 px-4 py-3 text-sm font-bold text-navy outline-none"
                >
                  {[7, 15, 30, 60, bookingWindow].filter((v, i, a) => a.indexOf(v) === i).map(days => (
                    <option key={days} value={days}>{days} days</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-left">
                <span className="text-[10px] font-black uppercase text-navy/35">Custom Window (Days)</span>
                <input
                  type="number"
                  min="1"
                  value={bookingWindow}
                  onChange={(e) => setBookingWindow(Number(e.target.value))}
                  className="w-full rounded-2xl bg-white border border-gray-100 px-4 py-3 text-sm font-bold text-navy outline-none"
                />
              </label>
            </div>

            {/* Offline Consultation Schedules */}
            <div className="p-6 bg-teal-50/30 rounded-[32px] border border-teal-100/50 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-[#0D9488]" />
                  <p className="text-xs font-black text-[#0D9488] uppercase tracking-widest">Offline Schedules</p>
                </div>
                <button 
                  type="button"
                  onClick={handleAddScheduleRow}
                  className="text-[10px] font-black text-[#0D9488] uppercase tracking-wider flex items-center gap-1 hover:underline text-left border-none bg-transparent"
                >
                  <Plus size={14} /> Add Schedule
                </button>
              </div>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {tempSchedules.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-gray-100 p-8 text-center bg-white">
                    <p className="text-[10px] font-black uppercase tracking-widest text-navy/35">No schedules configured</p>
                  </div>
                ) : (
                  tempSchedules.map((schedule, index) => {
                    const summary = calculateSlotSummary(schedule);
                    return (
                      <div key={index} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-4 text-left shadow-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-gray-50 border border-gray-100/50 p-2.5">
                            <p className="text-[8px] font-black uppercase tracking-widest text-navy/30">Total Slots</p>
                            <p className="text-lg font-black text-navy mt-0.5">{summary.total}</p>
                          </div>
                          <div className="rounded-xl bg-gray-50 border border-gray-100/50 p-2.5">
                            <p className="text-[8px] font-black uppercase tracking-widest text-navy/30">Patient Slots</p>
                            <p className="text-lg font-black text-[#0D9488] mt-0.5">{summary.regular}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <label className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-navy/35">Day</span>
                            <select
                              value={schedule.day_of_week}
                              onChange={(e) => handleScheduleRowChange(index, 'day_of_week', e.target.value)}
                              className="w-full rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 text-xs font-bold text-navy outline-none"
                            >
                              {allDays.map(day => <option key={day} value={day}>{day}</option>)}
                            </select>
                          </label>
                          <label className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-navy/35">Duration (mins)</span>
                            <input
                              type="number"
                              min="5"
                              value={schedule.slot_duration}
                              onChange={(e) => handleScheduleRowChange(index, 'slot_duration', Number(e.target.value))}
                              className="w-full rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 text-xs font-bold text-navy outline-none"
                            />
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <label className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-navy/35">Starts</span>
                            <input
                              type="time"
                              value={schedule.start_time}
                              onChange={(e) => handleScheduleRowChange(index, 'start_time', e.target.value)}
                              className="w-full rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 text-xs font-bold text-navy outline-none"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-navy/35">Ends</span>
                            <input
                              type="time"
                              value={schedule.end_time}
                              onChange={(e) => handleScheduleRowChange(index, 'end_time', e.target.value)}
                              className="w-full rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 text-xs font-bold text-navy outline-none"
                            />
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveScheduleRow(index)}
                          className="text-red-500 hover:text-red-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 text-left border-none bg-transparent"
                        >
                          <Trash2 size={12} /> Remove Schedule
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Unavailability Section */}
            <div className="p-6 bg-amber-50/30 rounded-[32px] border border-amber-100/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-amber-600" />
                  <h2 className="text-xs font-black text-navy uppercase tracking-widest">Doctor Unavailability</h2>
                </div>
                <button 
                  type="button"
                  onClick={handleAddLeaveDate} 
                  className="bg-navy text-white rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border-none flex items-center gap-1 hover:bg-navy/95 text-left"
                >
                  <Plus size={12} /> Add Date
                </button>
              </div>
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                {unavailability.length === 0 ? (
                  <p className="text-[9px] font-black uppercase tracking-widest text-navy/30 py-3 text-left">No leave or closure dates configured</p>
                ) : (
                  unavailability.map((leave, index) => (
                    <div key={index} className="grid grid-cols-[1.5fr_1.5fr_auto] gap-2 rounded-xl bg-white p-3 border border-gray-100 items-center">
                      <input
                        type="date"
                        value={leave.date ? String(leave.date).slice(0, 10) : ''}
                        onChange={(e) => handleLeaveDateChange(index, 'date', e.target.value)}
                        className="rounded-lg bg-gray-50 border border-gray-100 px-2 py-1.5 text-xs font-bold text-navy outline-none"
                      />
                      <select
                        value={leave.reason}
                        onChange={(e) => handleLeaveDateChange(index, 'reason', e.target.value)}
                        className="rounded-lg bg-gray-50 border border-gray-100 px-2 py-1.5 text-xs font-bold text-navy outline-none"
                      >
                        <option value="leave">Leave</option>
                        <option value="vacation">Vacation</option>
                        <option value="holiday">Holiday</option>
                        <option value="emergency_closure">Emergency Closure</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveLeaveDate(index)}
                        className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50 border-none bg-transparent"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest">
                Cancel
              </Button>
              <Button onClick={submitSchedule} disabled={submitting} loading={submitting} className="flex-[2] bg-[#0D9488] h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest">
                Save Schedule
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default HospitalDoctors;
