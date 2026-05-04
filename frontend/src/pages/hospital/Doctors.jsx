import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Input, Modal, Badge, Avatar, EmptyState } from '../../components/common';
import { 
  Plus, Search, Edit2, Trash2, Eye, 
  Mail, Phone, Clock, Stethoscope, 
  ChevronRight, MoreVertical, Calendar,
  AlertCircle, Hash, X, Check, Camera, Image as ImageIcon,
  Video, VideoOff
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import hospitalService from '../../services/hospitalService';

const doctorSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  maxTokens: z.coerce.number().min(1, 'Token limit must be at least 1').max(200, 'Limit exceeded'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  specialization: z.string().min(1, 'Please select a specialization'),
  customSpecialization: z.string().optional(),
  onlineConsultation: z.boolean().default(true),
  licenseNumber: z.string().min(3, 'License number is required'),
  experience: z.string().min(1, 'Experience is required'),
  slots: z.array(z.object({
    start: z.string(),
    end: z.string()
  })).min(1, 'At least one session is required'),
  availableDays: z.array(z.string()).min(1, 'Select at least one day'),
  image: z.any().optional()
}).refine(data => {
  if (data.specialization === 'Other' && !data.customSpecialization) {
    return false;
  }
  return true;
}, {
  message: "Please specify your specialization",
  path: ["customSpecialization"]
});

const HospitalDoctors = () => {
  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const fileInputRef = useRef(null);

  // Mock Data
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

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
        image: doc.user?.certificate || '', // Assuming image is handled here or mock it
        slots: doc.slots || [],
        availableDays: doc.availableDays || [],
        maxTokens: doc.maxTokens,
        onlineConsultation: doc.onlineConsultation,
        appointmentsToday: 0, // Mock for now
        status: 'On Duty'
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: '',
      specialization: '',
      customSpecialization: '',
      email: '',
      phone: '',
      maxTokens: 20,
      slots: [{ start: '09:00', end: '17:00' }],
      availableDays: allDays,
      onlineConsultation: true,
      image: null
    }
  });

  const specialization = watch('specialization');
  const availableDays = watch('availableDays');
  const slots = watch('slots');
  const onlineConsultation = watch('onlineConsultation');
  const image = watch('image');

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
        maxTokens: doctor.maxTokens || 20,
        slots: [...doctor.slots],
        availableDays: [...doctor.availableDays],
        onlineConsultation: doctor.onlineConsultation ?? true,
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
        maxTokens: 20,
        slots: [{ start: '09:00', end: '17:00' }],
        availableDays: allDays,
        onlineConsultation: true,
        image: null
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (doctor) => {
    setViewingDoctor(doctor);
    setIsViewModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setValue('image', imageUrl);
    }
  };

  const handleDayToggle = (day) => {
    const newDays = availableDays.includes(day)
      ? availableDays.filter(d => d !== day)
      : [...availableDays, day];
    setValue('availableDays', newDays, { shouldValidate: true });
  };

  const handleAddSlot = () => {
    setValue('slots', [...slots, { start: '09:00', end: '17:00' }]);
  };

  const handleRemoveSlot = (index) => {
    if (slots.length > 1) {
      const newSlots = slots.filter((_, i) => i !== index);
      setValue('slots', newSlots);
    }
  };

  const handleSlotChange = (index, field, value) => {
    const newSlots = [...slots];
    newSlots[index][field] = value;
    setValue('slots', newSlots);
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-bold text-navy">Are you sure you want to delete this record?</p>
        <div className="flex gap-2">
          <Button 
            variant="danger" 
            className="h-8 py-0 text-[10px] font-black uppercase tracking-widest px-4 border-none"
            onClick={() => {
              setDoctors(doctors.filter(d => d.id !== id));
              toast.success('Doctor record deleted', { id: t.id });
            }}
          >Delete</Button>
          <Button 
            variant="outline" 
            className="h-8 py-0 text-[10px] font-black uppercase tracking-widest px-4"
            onClick={() => toast.dismiss(t.id)}
          >Cancel</Button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const onFormSubmit = async (data) => {
    const finalSpecialization = data.specialization === 'Other' 
      ? data.customSpecialization 
      : data.specialization;

    try {
      if (editingDoctor) {
        // Handle edit (not implemented yet)
        toast.error('Editing doctor is not implemented yet.');
      } else {
        const response = await hospitalService.addDoctor({
          ...data,
          specialization: finalSpecialization
        });
        toast.success(response.message || 'New doctor registered successfully!');
        fetchDoctors(); // Refresh the list
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process request.');
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
                                 <Calendar size={10} /> {formatDays(doctor.availableDays)}
                              </p>
                              {doctor.onlineConsultation ? (
                                <div className="flex items-center gap-1 text-[9px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                                   <Video size={10} /> ONLINE
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-[9px] font-black text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                   <VideoOff size={10} /> OFFLINE
                                </div>
                              )}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col gap-1.5">
                              {doctor.slots.map((slot, i) => (
                                <div key={i} className="inline-flex items-center self-start gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-wider border border-blue-100/50">
                                   <Clock size={10} /> {slot.start} - {slot.end}
                                </div>
                              ))}
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
                             <button onClick={() => handleOpenModal(doctor)} className="p-2 text-navy/30 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Edit Profile">
                                <Edit2 size={18} />
                             </button>
                             <button onClick={() => handleOpenViewModal(doctor)} className="p-2 text-navy/30 hover:text-[#0D9488] hover:bg-[#0D9488]/10 rounded-xl transition-all" title="View Public Profile">
                                <Eye size={18} />
                             </button>
                             <button onClick={() => handleDelete(doctor.id)} className="p-2 text-navy/30 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete Record">
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
                              <p className="text-[10px] font-bold text-navy/40 uppercase tracking-wider text-[#0D9488]">{formatDays(doctor.availableDays)}</p>
                              {doctor.onlineConsultation ? (
                                <span className="text-[8px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                                   <Video size={10} /> Online
                                </span>
                              ) : (
                                <span className="text-[8px] font-black text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                                   <VideoOff size={10} /> Offline
                                </span>
                              )}
                           </div>
                        </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleOpenViewModal(doctor)} className="p-2 text-[#0D9488] bg-[#0D9488]/10 rounded-lg"><Eye size={16} /></button>
                      <button onClick={() => handleOpenModal(doctor)} className="p-2 text-blue-500 bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(doctor.id)} className="p-2 text-red-500 bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 text-left">
                      <div className="p-4 bg-gray-50 rounded-2xl">
                         <p className="text-[8px] font-black text-navy/30 uppercase tracking-widest mb-2 flex items-center justify-between">
                            Availability Sessions
                            <span className="text-[#0D9488]">{doctor.specialization}</span>
                         </p>
                         <div className="flex flex-wrap gap-2">
                            {doctor.slots.map((slot, i) => (
                              <p key={i} className="text-[9px] font-bold text-navy/70 flex items-center gap-1.5 uppercase bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">
                                 <Clock size={10} className="text-[#0D9488]" /> {slot.start} - {slot.end}
                              </p>
                            ))}
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
               <Card className="p-5 border-gray-100 shadow-none bg-white">
                  <p className="text-[8px] font-black text-navy/30 uppercase tracking-widest mb-3">Consultation Status</p>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           {viewingDoctor.onlineConsultation ? (
                             <>
                                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Video size={16}/></div>
                                <span className="text-sm font-black text-navy uppercase tracking-tight">Virtual Sessions Enabled</span>
                             </>
                           ) : (
                             <>
                                <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center"><VideoOff size={16}/></div>
                                <span className="text-sm font-black text-navy/40 uppercase tracking-tight">Offline Only</span>
                             </>
                           )}
                         </div>
                         <div className={`w-2 h-2 rounded-full ${viewingDoctor.onlineConsultation ? 'bg-[#0D9488] animate-pulse' : 'bg-gray-300'}`} />
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-xl">
                         <div className="w-6 h-6 rounded-lg bg-[#0D9488] text-white flex items-center justify-center"><Check size={12}/></div>
                         <span className="text-[9px] font-black text-green-700 uppercase tracking-tight">Verified Practitioner</span>
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
                         <span key={day} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${viewingDoctor.availableDays.includes(day) ? 'bg-[#0D9488] text-white shadow-md shadow-[#0D9488]/10' : 'bg-white text-navy/20 border border-gray-100'}`}>
                           {day}
                         </span>
                       ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-navy/30 uppercase tracking-widest mb-3">Time Slots</p>
                    <div className="space-y-2">
                       {viewingDoctor.slots.map((slot, i) => (
                         <div key={i} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm group-hover:border-[#0D9488]/30 transition-all">
                            <span className="text-[10px] font-black text-navy/30 uppercase tracking-widest italic">Session {i+1}</span>
                            <span className="text-[10px] font-black text-[#0D9488]">{slot.start} - {slot.end}</span>
                         </div>
                       ))}
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
                           onClick={() => setValue('image', null)}
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

             {/* Weekly Consultation Days */}
             <div className="space-y-3">
                <div className="flex items-center justify-between pr-1">
                   <label className="text-xs font-bold text-navy/40 uppercase tracking-widest pl-1">Consultation Days</label>
                   <div className="flex gap-3">
                      <button 
                         type="button" 
                         onClick={() => setValue('availableDays', allDays, { shouldValidate: true })}
                         className="text-[9px] font-black text-[#0D9488] uppercase tracking-tighter hover:underline"
                      >
                         All Days
                      </button>
                      <button 
                         type="button" 
                         onClick={() => setValue('availableDays', weekdays, { shouldValidate: true })}
                         className="text-[9px] font-black text-[#0D9488] uppercase tracking-tighter hover:underline"
                      >
                         Weekdays
                      </button>
                   </div>
                </div>
                <div className="flex justify-between items-center bg-gray-50 rounded-2xl p-3 border border-gray-100 transition-colors">
                   {allDays.map((day) => {
                     const isSelected = availableDays.includes(day);
                     return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`
                            w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-200
                            ${isSelected 
                              ? 'bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/20 scale-110' 
                              : 'bg-white text-navy/30 hover:bg-white hover:text-[#0D9488]'}
                          `}
                        >
                          {day.charAt(0)}
                        </button>
                     );
                   })}
                </div>
                {errors.availableDays && (
                   <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest px-2">{errors.availableDays.message}</p>
                )}
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

             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gray-50 rounded-[32px] border border-gray-100 transition-colors text-left">
                <div className="flex items-center gap-3 text-left">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${onlineConsultation ? 'bg-[#0D9488]/10 text-[#0D9488]' : 'bg-gray-200 text-gray-400'}`}>
                      {onlineConsultation ? <Video size={20} /> : <VideoOff size={20} />}
                   </div>
                   <div className="text-left">
                      <p className="text-sm font-black text-navy uppercase tracking-tight">Online Consultation</p>
                      <p className="text-[10px] font-bold text-navy/40 uppercase tracking-widest">Enable virtual sessions for this doctor</p>
                   </div>
                </div>
                <button 
                   type="button"
                   onClick={() => setValue('onlineConsultation', !onlineConsultation)}
                   className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors outline-none ring-2 ring-transparent focus:ring-[#0D9488]/20 ${onlineConsultation ? 'bg-[#0D9488]' : 'bg-gray-200'}`}
                >
                   <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${onlineConsultation ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
             </div>

             <div className="p-6 bg-teal-50/50 rounded-[32px] border border-teal-100 space-y-5 text-left transition-colors">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-left">
                      <Clock size={16} className="text-[#0D9488]" />
                      <p className="text-xs font-black text-[#0D9488] uppercase tracking-widest">Availability Sessions</p>
                   </div>
                   <button 
                      type="button"
                      onClick={handleAddSlot}
                      className="text-[10px] font-black text-[#0D9488] uppercase tracking-wider flex items-center gap-1 hover:text-[#115E59] transition-colors"
                   >
                      <Plus size={14} /> Add Session
                   </button>
                </div>
                
                <div className="space-y-4">
                   {slots.map((slot, index) => (
                     <div key={index} className="grid grid-cols-[1fr,1fr,auto] gap-4 items-end animate-in fade-in slide-in-from-top-1 text-left">
                        <div className="space-y-1.5 text-left">
                           <p className="text-[9px] font-bold text-navy/30 uppercase tracking-widest pl-1">Starts</p>
                           <input 
                              type="time" 
                              value={slot.start}
                              onChange={(e) => handleSlotChange(index, 'start', e.target.value)}
                              className="w-full bg-white border border-teal-100 rounded-xl px-4 py-2 text-xs font-bold text-navy outline-none" 
                           />
                        </div>
                        <div className="space-y-1.5 text-left">
                           <p className="text-[9px] font-bold text-navy/30 uppercase tracking-widest pl-1">Ends</p>
                           <input 
                              type="time" 
                              value={slot.end}
                              onChange={(e) => handleSlotChange(index, 'end', e.target.value)}
                              className="w-full bg-white border border-teal-100 rounded-xl px-4 py-2 text-xs font-bold text-navy outline-none" 
                           />
                        </div>
                        {slots.length > 1 && (
                          <button 
                             type="button" 
                             onClick={() => handleRemoveSlot(index)}
                             className="p-2 text-red-400 hover:bg-red-50 rounded-lg mb-0.5 transition-colors"
                          >
                             <Trash2 size={16} />
                          </button>
                        )}
                     </div>
                   ))}
                </div>
                {errors.slots && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest px-2">{errors.slots.message}</p>}
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
                   className="flex-[2] bg-[#0D9488] hover:bg-[#115E59] shadow-lg shadow-[#0D9488]/20 h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest border-none"
                >
                   {editingDoctor ? 'Save Changes' : 'Register Doctor'}
                </Button>
             </div>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default HospitalDoctors;
