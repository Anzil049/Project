import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button } from '../../components/common';
import { 
  Clock, Save, Calendar, Info,
  Plus, Trash2, Building2, Edit2
} from 'lucide-react';
import doctorService from '../../services/doctorService';
import toast from 'react-hot-toast';

const Availability = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);
  
  const [isAccepting, setIsAccepting] = useState(true);
  const [isOnlineAccepting, setIsOnlineAccepting] = useState(true);
  const [selectedDays, setSelectedDays] = useState([]);
  const [sessions, setSessions] = useState([{ start: '09:00', end: '12:00' }]);
  
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await doctorService.getProfile();
      const profile = data.doctorProfile;
      setDoctorProfile(profile);
      
      if (profile) {
        setIsAccepting(profile.isAcceptingAppointments ?? true);
        setIsOnlineAccepting(profile.onlineConsultation ?? true);
        setSelectedDays(profile.availableDays || []);
        setSessions(profile.slots?.length > 0 ? profile.slots : [{ start: '09:00', end: '12:00' }]);
      }
    } catch (error) {
      toast.error('Failed to load availability settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day) => {
    if (!isEditing || doctorProfile?.hospitalId) return;
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const addSession = () => {
    if (!isEditing || doctorProfile?.hospitalId) return;
    setSessions(prev => [...prev, { start: '09:00', end: '17:00' }]);
  };

  const removeSession = (index) => {
    if (!isEditing || doctorProfile?.hospitalId) return;
    if (sessions.length <= 1) {
      toast.error('At least one session is required');
      return;
    }
    setSessions(prev => prev.filter((_, i) => i !== index));
  };

  const updateSession = (index, field, value) => {
    if (!isEditing || doctorProfile?.hospitalId) return;
    setSessions(prev => prev.map((s, i) => 
      i === index ? { ...s, [field]: value } : s
    ));
  };

  const validateSlots = () => {
    // Check if start time is before end time for all slots
    for (let i = 0; i < sessions.length; i++) {
      if (sessions[i].start >= sessions[i].end) {
        toast.error(`Session ${i + 1}: Start time must be before end time`);
        return false;
      }
    }

    // Check for overlapping slots
    for (let i = 0; i < sessions.length; i++) {
      for (let j = i + 1; j < sessions.length; j++) {
        const s1 = sessions[i];
        const s2 = sessions[j];
        
        if (s1.start < s2.end && s2.start < s1.end) {
          toast.error(`Session ${i + 1} and Session ${j + 1} overlap`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateSlots()) return;

    try {
      setIsSaving(true);
      await doctorService.updateProfile({
        isAcceptingAppointments: isAccepting,
        onlineConsultation: isOnlineAccepting,
        availableDays: selectedDays,
        slots: sessions
      });
      toast.success('Schedule updated successfully');
      setIsEditing(false); // Go back to view mode after saving
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const isHospitalAdded = !!doctorProfile?.hospitalId;
  const canEdit = !isHospitalAdded;

  if (loading) {
    return (
      <DashboardLayout title="Availability" role="doctor">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0D9488]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Availability Settings" role="doctor">
      <div className="max-w-4xl mx-auto space-y-8 pb-20 font-body animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Manage Doctor <span className="text-[#0D9488]">Schedule</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <Calendar size={14} className="text-[#0D9488]" /> Configure your active sessions and working days
            </p>
          </div>

          {canEdit && (
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      fetchProfile(); // Reset changes
                    }}
                    variant="outline"
                    className="rounded-2xl px-6 h-14 text-xs font-black uppercase tracking-widest border-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    loading={isSaving}
                    className="bg-[#0D9488] hover:bg-[#0D9488]/90 text-white rounded-2xl px-8 h-14 shadow-xl shadow-[#0D9488]/20 border-none transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                  >
                    <Save size={18} /> Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-navy hover:bg-navy/90 text-white rounded-2xl px-8 h-14 shadow-xl shadow-navy/20 border-none transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                >
                  <Edit2 size={18} /> Edit Schedule
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Hospital Disclaimer */}
        {isHospitalAdded && (
          <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-[32px] flex items-start gap-4 shadow-sm animate-in slide-in-from-top-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
               <Building2 className="text-amber-600" size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-navy uppercase tracking-widest">Hospital Managed Schedule</h4>
              <p className="text-xs text-navy/60 font-bold leading-relaxed">
                Your practice hours are currently managed by your affiliated hospital. 
                <span className="text-amber-700 block mt-1 underline">Please contact the hospital administration for any schedule adjustments.</span>
              </p>
            </div>
          </div>
        )}

        {/* Main Configuration Card */}
        <Card className="p-8 md:p-10 rounded-[48px] border-none shadow-2xl shadow-navy/5 bg-white relative overflow-hidden">
          
          <div className="space-y-10">
            {/* Status Toggle */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-[32px] border ${(!isEditing || isHospitalAdded) ? 'bg-gray-50/30 border-gray-100' : 'bg-gray-50/50 border-gray-100 ring-2 ring-[#0D9488]/10'}`}>
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isAccepting ? 'bg-amber-50 text-amber-500' : 'bg-gray-100 text-gray-400'}`}>
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-navy uppercase tracking-widest">Accepting Appointments</h3>
                  <p className="text-[10px] font-bold text-navy/40 uppercase mt-1">
                    {isHospitalAdded ? 'Status managed by platform' : isEditing ? 'Toggle availability status' : 'Current booking status'}
                  </p>
                </div>
              </div>
              <button
                disabled={!isEditing || isHospitalAdded}
                onClick={() => setIsAccepting(!isAccepting)}
                className={`w-16 h-9 rounded-full transition-all duration-300 relative shadow-inner ${
                  isAccepting ? 'bg-amber-500' : 'bg-gray-300'
                } ${(!isEditing || isHospitalAdded) ? 'cursor-default opacity-80' : 'hover:scale-105 active:scale-95'}`}
              >
                <div className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-lg transition-all duration-300 ${
                  isAccepting ? 'left-8' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Online Consultation Toggle */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-[32px] border ${(!isEditing || isHospitalAdded) ? 'bg-gray-50/30 border-gray-100' : 'bg-gray-50/50 border-gray-100 ring-2 ring-[#0D9488]/10'}`}>
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isOnlineAccepting ? 'bg-[#0D9488]/10 text-[#0D9488]' : 'bg-gray-100 text-gray-400'}`}>
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-navy uppercase tracking-widest">Online Consultations</h3>
                  <p className="text-[10px] font-bold text-navy/40 uppercase mt-1">
                    {isHospitalAdded ? 'Independent doctors only' : isEditing ? 'Toggle online appointment status' : 'Current online status'}
                  </p>
                </div>
              </div>
              <button
                disabled={!isEditing || isHospitalAdded}
                onClick={() => setIsOnlineAccepting(!isOnlineAccepting)}
                className={`w-16 h-9 rounded-full transition-all duration-300 relative shadow-inner ${
                  isOnlineAccepting ? 'bg-[#0D9488]' : 'bg-gray-300'
                } ${(!isEditing || isHospitalAdded) ? 'cursor-default opacity-80' : 'hover:scale-105 active:scale-95'}`}
              >
                <div className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-lg transition-all duration-300 ${
                  isOnlineAccepting ? 'left-8' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Working Days */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <h3 className="text-[10px] font-black text-navy/30 uppercase tracking-[0.2em]">Working Days</h3>
                <div className="flex-1 h-[1px] bg-gray-100" />
              </div>
              
              <div className="flex flex-wrap gap-3">
                {daysOfWeek.map((day) => {
                  const isActive = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      disabled={!isEditing || isHospitalAdded}
                      onClick={() => toggleDay(day)}
                      className={`
                        w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-300
                        ${isActive 
                          ? 'bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/30 scale-110' 
                          : 'bg-white border-2 border-gray-100 text-navy/30 hover:border-[#0D9488]/30'}
                        ${(!isEditing || isHospitalAdded) && isActive ? 'opacity-100 ring-4 ring-[#0D9488]/10' : ''}
                        ${(!isEditing || isHospitalAdded) && !isActive ? 'opacity-40 grayscale-[0.5]' : ''}
                        ${(!isEditing || isHospitalAdded) ? 'cursor-default' : 'hover:scale-110 active:scale-95'}
                      `}
                      title={isActive ? `${day} (Active)` : day}
                    >
                      {day.charAt(0)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Sessions */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Clock size={16} className="text-[#0D9488]" />
                   <h3 className="text-[10px] font-black text-navy uppercase tracking-[0.2em]">Active Sessions</h3>
                </div>
                {isEditing && !isHospitalAdded && (
                  <button 
                    onClick={addSession}
                    className="flex items-center gap-2 text-[10px] font-black text-[#0D9488] uppercase tracking-widest hover:bg-[#0D9488]/5 px-4 py-2 rounded-xl transition-all"
                  >
                    <Plus size={14} /> Add Session
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {sessions.map((session, index) => (
                  <div key={index} className={`group relative rounded-[28px] p-6 border transition-all ${isEditing ? 'bg-white border-[#0D9488]/20 shadow-xl shadow-navy/5' : 'bg-gray-50/30 border-gray-100'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-navy/30 uppercase ml-2">Starts</label>
                        <div className="relative">
                          <input 
                            type="time" 
                            disabled={!isEditing || isHospitalAdded}
                            value={session.start}
                            onChange={(e) => updateSession(index, 'start', e.target.value)}
                            className={`w-full bg-white border-2 rounded-2xl py-4 px-5 text-sm font-black outline-none transition-all ${(!isEditing || isHospitalAdded) ? 'text-navy/80 cursor-default border-dashed border-gray-100' : 'text-navy border-[#0D9488]/10 focus:border-[#0D9488]'}`}
                          />
                        </div>
                      </div>
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-navy/30 uppercase ml-2">Ends</label>
                        <div className="relative">
                          <input 
                            type="time" 
                            disabled={!isEditing || isHospitalAdded}
                            value={session.end}
                            onChange={(e) => updateSession(index, 'end', e.target.value)}
                            className={`w-full bg-white border-2 rounded-2xl py-4 px-5 text-sm font-black outline-none transition-all ${(!isEditing || isHospitalAdded) ? 'text-navy/80 cursor-default border-dashed border-gray-100' : 'text-navy border-[#0D9488]/10 focus:border-[#0D9488]'}`}
                          />
                        </div>
                      </div>
                    </div>

                    {isEditing && !isHospitalAdded && sessions.length > 1 && (
                      <button 
                        onClick={() => removeSession(index)}
                        className="absolute -right-3 -top-3 w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#0D9488]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-navy/5 rounded-full blur-3xl pointer-events-none" />
        </Card>

        {/* Action Help */}
        {!isHospitalAdded && (
          <div className="flex items-center gap-3 px-8 text-navy/40">
             <Info size={16} />
             <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
               {isEditing 
                 ? "You are currently modifying your schedule. Don't forget to save your changes to update the public patient portal."
                 : "Your schedule is currently in view mode. Click 'Edit Schedule' to make any changes to your working hours."
               }
             </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Availability;
