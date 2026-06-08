import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button } from '../../components/common';
import { Calendar, Clock, Save, Video, Building2, Ban, Plus, Trash2 } from 'lucide-react';
import doctorService from '../../services/doctorService';
import toast from 'react-hot-toast';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const bookingWindowOptions = [7, 15, 30, 60];

const defaultSchedule = (consultationType) => ({
  consultation_type: consultationType,
  day_of_week: 'Mon',
  start_time: consultationType === 'online' ? '18:00' : '10:00',
  end_time: consultationType === 'online' ? '21:00' : '13:00',
  slot_duration: consultationType === 'online' ? 15 : 10,
  booking_limit: 1,
  follow_up_percentage: 0,
});

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

const SchedulePanel = ({ title, icon, consultationType, disabled, schedules, onChange }) => {
  const addSchedule = () => onChange([...schedules, defaultSchedule(consultationType)]);
  const removeSchedule = (index) => onChange(schedules.filter((_, i) => i !== index));
  const updateSchedule = (index, field, value) => {
    onChange(schedules.map((schedule, i) => (
      i === index ? { ...schedule, [field]: value } : schedule
    )));
  };

  return (
    <Card className="p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm bg-white">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center">
            {React.createElement(icon, { size: 22 })}
          </div>
          <div>
            <h2 className="text-sm font-black text-navy uppercase tracking-widest">{title}</h2>
            <p className="text-[10px] font-bold text-navy/35 uppercase tracking-wider">
              Separate days, timings, duration and limits
            </p>
          </div>
        </div>
        <Button
          type="button"
          disabled={disabled}
          onClick={addSchedule}
          className="bg-navy text-white rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest border-none flex items-center gap-2 disabled:opacity-40"
        >
          <Plus size={14} /> Add
        </Button>
      </div>

      <div className="space-y-4">
        {disabled && (
          <div className="rounded-2xl bg-gray-50 p-5 flex items-center gap-3 text-navy/45">
            <Ban size={18} />
            <p className="text-[11px] font-black uppercase tracking-widest">Not available for hospital-associated doctors</p>
          </div>
        )}

        {!disabled && schedules.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-100 p-8 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-navy/35">No schedule configured</p>
          </div>
        )}

        {schedules.map((schedule, index) => (
          <div key={`${consultationType}-${index}`} className="rounded-[24px] border border-gray-100 bg-[#F8FAFC] p-5 space-y-4">
            {(() => {
              const summary = calculateSlotSummary(schedule);
              return (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white border border-gray-100 p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-navy/30">Total Slots</p>
                    <p className="text-2xl font-black text-navy mt-1">{summary.total}</p>
                  </div>
                  <div className="rounded-2xl bg-white border border-gray-100 p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-navy/30">Patient Slots</p>
                    <p className="text-2xl font-black text-[#0D9488] mt-1">{summary.regular}</p>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase text-navy/35">Day</span>
                <select
                  disabled={disabled}
                  value={schedule.day_of_week}
                  onChange={(e) => updateSchedule(index, 'day_of_week', e.target.value)}
                  className="w-full rounded-2xl bg-white border border-gray-100 px-4 py-3 text-sm font-bold text-navy outline-none"
                >
                  {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase text-navy/35">Duration (Minutes)</span>
                <input
                  disabled={disabled}
                  type="number"
                  min="5"
                  value={schedule.slot_duration}
                  onChange={(e) => updateSchedule(index, 'slot_duration', Number(e.target.value))}
                  className="w-full rounded-2xl bg-white border border-gray-100 px-4 py-3 text-sm font-bold text-navy outline-none"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase text-navy/35">Starts</span>
                <input
                  disabled={disabled}
                  type="time"
                  value={schedule.start_time}
                  onChange={(e) => updateSchedule(index, 'start_time', e.target.value)}
                  className="w-full rounded-2xl bg-white border border-gray-100 px-4 py-3 text-sm font-bold text-navy outline-none"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase text-navy/35">Ends</span>
                <input
                  disabled={disabled}
                  type="time"
                  value={schedule.end_time}
                  onChange={(e) => updateSchedule(index, 'end_time', e.target.value)}
                  className="w-full rounded-2xl bg-white border border-gray-100 px-4 py-3 text-sm font-bold text-navy outline-none"
                />
              </label>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-widest text-navy/35">
              One patient can book one time slot. Every generated slot is available for normal booking until it is booked.
            </p>

            <button
              type="button"
              disabled={disabled}
              onClick={() => removeSchedule(index)}
              className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-30"
            >
              <Trash2 size={13} /> Remove Schedule
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
};

const Availability = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [bookingWindow, setBookingWindow] = useState(30);
  const [isAccepting, setIsAccepting] = useState(true);
  const [onlineEnabled, setOnlineEnabled] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [unavailability, setUnavailability] = useState([]);

  const isHospitalDoctor = Boolean(doctorProfile?.hospitalId);
  const onlineSchedules = useMemo(() => schedules.filter(s => s.consultation_type === 'online'), [schedules]);
  const offlineSchedules = useMemo(() => schedules.filter(s => s.consultation_type === 'offline'), [schedules]);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const data = await doctorService.getSchedules();
      setDoctorProfile(data.doctor);
      setBookingWindow(data.doctor?.booking_window_days || 30);
      setIsAccepting(data.doctor?.isAcceptingAppointments ?? true);
      setOnlineEnabled(data.doctor?.onlineConsultation ?? true);
      setUnavailability(data.doctor?.unavailability || []);
      setSchedules(data.schedules || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const setSchedulesForType = (type, nextSchedules) => {
    setSchedules(prev => [
      ...prev.filter(schedule => schedule.consultation_type !== type),
      ...nextSchedules.map(schedule => ({ ...schedule, consultation_type: type })),
    ]);
  };

  const validateSchedules = () => {
    for (const schedule of schedules) {
      if (schedule.start_time >= schedule.end_time) {
        toast.error('Schedule start time must be before end time');
        return false;
      }
      if (isHospitalDoctor && schedule.consultation_type === 'online') {
        toast.error('Hospital-associated doctors can only configure offline consultation');
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateSchedules()) return;
    try {
      setIsSaving(true);
      await doctorService.updateSchedules({
        booking_window_days: Number(bookingWindow),
        isAcceptingAppointments: isAccepting,
        onlineConsultation: isHospitalDoctor ? false : onlineEnabled,
        schedules: (isHospitalDoctor ? offlineSchedules : schedules).map(schedule => ({
          ...schedule,
          booking_limit: 1,
        })),
        unavailability,
      });
      await Promise.all(unavailability.map((leave) => doctorService.blockDoctorDate({
        doctor_id: doctorProfile._id,
        date: leave.date,
        reason: leave.reason,
        note: leave.note || 'Marked unavailable from doctor dashboard',
      })));
      toast.success('Schedule updated successfully');
      fetchSchedule();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const addLeaveDate = () => {
    setUnavailability(prev => [...prev, { date: new Date().toISOString().slice(0, 10), reason: 'leave', note: '' }]);
  };

  if (loading) {
    return (
      <DashboardLayout title="Availability" role="doctor">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0D9488]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Availability Settings" role="doctor">
      <div className="max-w-6xl mx-auto space-y-8 pb-20 font-body animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Appointment <span className="text-[#0D9488]">Schedules</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2 mt-2">
              <Calendar size={14} className="text-[#0D9488]" /> Rolling booking windows and independent slots
            </p>
          </div>
          {isHospitalDoctor ? (
            <div className="bg-amber-50 text-amber-700 border border-amber-200/50 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
              <Ban size={16} /> Managed by Associated Hospital
            </div>
          ) : (
            <Button
              onClick={handleSave}
              loading={isSaving}
              className="bg-[#0D9488] hover:bg-[#0D9488]/90 text-white rounded-2xl px-8 h-14 border-none flex items-center gap-2 text-xs font-black uppercase tracking-widest"
            >
              <Save size={18} /> Save
            </Button>
          )}
        </div>

        <Card className="p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase text-navy/35">Booking Window</span>
              <select
                disabled={isHospitalDoctor}
                value={bookingWindow}
                onChange={(e) => setBookingWindow(Number(e.target.value))}
                className="w-full rounded-2xl bg-[#F8FAFC] border border-gray-100 px-4 py-4 text-sm font-bold text-navy outline-none disabled:opacity-70"
              >
                {[...new Set([...bookingWindowOptions, bookingWindow])].map(days => (
                  <option key={days} value={days}>{days} days</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase text-navy/35">Custom Window</span>
              <input
                disabled={isHospitalDoctor}
                type="number"
                min="1"
                value={bookingWindow}
                onChange={(e) => setBookingWindow(Number(e.target.value))}
                className="w-full rounded-2xl bg-[#F8FAFC] border border-gray-100 px-4 py-4 text-sm font-bold text-navy outline-none disabled:opacity-70"
              />
            </label>
            <div className="flex items-center justify-between rounded-2xl bg-[#F8FAFC] border border-gray-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase text-navy/35">Accepting Appointments</p>
                <p className="text-xs font-bold text-navy/55">Applies to generated slots</p>
              </div>
              <input 
                type="checkbox" 
                disabled={isHospitalDoctor}
                checked={isAccepting} 
                onChange={(e) => setIsAccepting(e.target.checked)} 
                className="w-5 h-5 accent-[#0D9488] disabled:opacity-50" 
              />
            </div>
          </div>

          {!isHospitalDoctor && (
            <label className="mt-5 flex items-center justify-between rounded-2xl bg-[#F8FAFC] border border-gray-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase text-navy/35">Online Consultation</p>
                <p className="text-xs font-bold text-navy/55">Independent doctors can enable or disable online booking</p>
              </div>
              <input type="checkbox" checked={onlineEnabled} onChange={(e) => setOnlineEnabled(e.target.checked)} className="w-5 h-5 accent-[#0D9488]" />
            </label>
          )}
        </Card>

        <SchedulePanel
          title="Offline Consultation"
          icon={Building2}
          consultationType="offline"
          disabled={isHospitalDoctor}
          schedules={offlineSchedules}
          onChange={(next) => setSchedulesForType('offline', next)}
        />

        <SchedulePanel
          title="Online Consultation"
          icon={Video}
          consultationType="online"
          disabled={isHospitalDoctor || !onlineEnabled}
          schedules={onlineSchedules}
          onChange={(next) => setSchedulesForType('online', next)}
        />

        <Card className="p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm bg-white">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-[#0D9488]" />
              <h2 className="text-sm font-black text-navy uppercase tracking-widest">Doctor Unavailability</h2>
            </div>
            {!isHospitalDoctor && (
              <Button onClick={addLeaveDate} className="bg-navy text-white rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest border-none">
                <Plus size={14} /> Add Date
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {unavailability.map((leave, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 rounded-2xl bg-[#F8FAFC] p-4 items-center">
                <input
                  disabled={isHospitalDoctor}
                  type="date"
                  value={String(leave.date).slice(0, 10)}
                  onChange={(e) => setUnavailability(prev => prev.map((item, i) => i === index ? { ...item, date: e.target.value } : item))}
                  className="rounded-xl bg-white border border-gray-100 px-4 py-3 text-sm font-bold text-navy outline-none disabled:opacity-70"
                />
                <select
                  disabled={isHospitalDoctor}
                  value={leave.reason}
                  onChange={(e) => setUnavailability(prev => prev.map((item, i) => i === index ? { ...item, reason: e.target.value } : item))}
                  className="rounded-xl bg-white border border-gray-100 px-4 py-3 text-sm font-bold text-navy outline-none disabled:opacity-70"
                >
                  <option value="leave">Leave</option>
                  <option value="vacation">Vacation</option>
                  <option value="holiday">Holiday</option>
                  <option value="emergency_closure">Emergency Closure</option>
                </select>
                {!isHospitalDoctor && (
                  <button
                    type="button"
                    onClick={() => setUnavailability(prev => prev.filter((_, i) => i !== index))}
                    className="text-red-500 font-black uppercase text-[10px] flex items-center gap-2 justify-center"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
            ))}
            {unavailability.length === 0 && (
              <p className="text-[10px] font-black uppercase tracking-widest text-navy/30 py-3">No leave or closure dates configured</p>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Availability;
