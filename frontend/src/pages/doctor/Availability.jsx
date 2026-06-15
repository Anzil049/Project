import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button } from '../../components/common';
import { Calendar, Clock, Save, Video, Building2, Ban, Plus, Trash2 } from 'lucide-react';
import doctorService from '../../services/doctorService';
import toast from 'react-hot-toast';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const bookingWindowOptions = [7, 15, 30, 60];

const defaultSchedule = (consultationType, customDateMode = false) => ({
  consultation_type: consultationType,
  day_of_week: customDateMode ? null : 'Mon',
  custom_date: customDateMode ? new Date().toISOString().slice(0, 10) : null,
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

const formatTime12 = (timeStr) => {
  if (!timeStr) return '';
  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minuteStr} ${ampm}`;
};

const SchedulePanel = ({ title, icon, consultationType, disabled, isEditing, schedules, onChange, isHospitalDoctor, customDateMode }) => {
  const addSchedule = () => onChange([...schedules, defaultSchedule(consultationType, customDateMode)]);
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
              {isEditing ? 'Separate days, timings, duration and limits' : 'Configured timings and details'}
            </p>
          </div>
        </div>
        {isEditing && !isHospitalDoctor && (
          <Button
            type="button"
            disabled={disabled}
            onClick={addSchedule}
            className="bg-navy text-white rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest border-none flex items-center gap-2 disabled:opacity-40"
          >
            <Plus size={14} /> Add
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {isHospitalDoctor && (
          <div className="rounded-2xl bg-gray-50 p-5 flex items-center gap-3 text-navy/45">
            <Ban size={18} />
            <p className="text-[11px] font-black uppercase tracking-widest">Not available for hospital-associated doctors</p>
          </div>
        )}

        {!isHospitalDoctor && schedules.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-100 p-8 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-navy/35">No schedule configured</p>
          </div>
        )}

        {schedules.map((schedule, index) => (
          <div key={`${consultationType}-${index}`} className="rounded-[24px] border border-gray-100 bg-[#F8FAFC] p-5 space-y-4">
            {isEditing ? (
              <>
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
                    <span className="text-[10px] font-black uppercase text-navy/35">{customDateMode ? 'Date' : 'Day'}</span>
                    {customDateMode ? (
                      <input
                        disabled={disabled}
                        type="date"
                        value={schedule.custom_date ? String(schedule.custom_date).slice(0, 10) : ''}
                        onChange={(e) => updateSchedule(index, 'custom_date', e.target.value)}
                        className="w-full rounded-2xl bg-white border border-gray-100 px-4 py-3 text-sm font-bold text-navy outline-none"
                      />
                    ) : (
                      <select
                        disabled={disabled}
                        value={schedule.day_of_week || 'Mon'}
                        onChange={(e) => updateSchedule(index, 'day_of_week', e.target.value)}
                        className="w-full rounded-2xl bg-white border border-gray-100 px-4 py-3 text-sm font-bold text-navy outline-none"
                      >
                        {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                      </select>
                    )}
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
                  className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-30 border-none bg-transparent hover:underline cursor-pointer"
                >
                  <Trash2 size={13} /> Remove Schedule
                </button>
              </>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-navy/5 text-navy flex items-center justify-center font-black text-[11px] uppercase shrink-0">
                    {customDateMode ? 'DATE' : (schedule.day_of_week || 'MON')}
                  </div>
                  <div>
                    <p className="text-sm font-black text-navy uppercase tracking-tight">
                      {customDateMode ? (schedule.custom_date ? new Date(schedule.custom_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No Date') : `Every ${schedule.day_of_week || 'Monday'}`}
                    </p>
                    <p className="text-[10px] font-bold text-navy/40 uppercase mt-0.5">
                      {schedule.start_time && schedule.end_time ? `${formatTime12(schedule.start_time)} - ${formatTime12(schedule.end_time)}` : 'No Time Configured'}
                      <span className="mx-2 text-navy/20">•</span>
                      {schedule.slot_duration ? `${schedule.slot_duration} Min Slots` : 'No duration'}
                    </p>
                  </div>
                </div>
                {(() => {
                  const summary = calculateSlotSummary(schedule);
                  return (
                    <div className="flex items-center gap-3">
                      <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-right shadow-sm">
                        <span className="text-[8px] font-black text-navy/35 uppercase block">Total Slots</span>
                        <span className="text-sm font-black text-navy">{summary.total}</span>
                      </div>
                      <div className="bg-[#0D9488]/5 border border-[#0D9488]/10 rounded-xl px-4 py-2 text-right shadow-sm">
                        <span className="text-[8px] font-black text-[#0D9488]/60 uppercase block">Patient Slots</span>
                        <span className="text-sm font-black text-[#0D9488]">{summary.regular}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

const Availability = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [bookingWindow, setBookingWindow] = useState(30);
  const [isAccepting, setIsAccepting] = useState(true);
  const [onlineEnabled, setOnlineEnabled] = useState(true);
  const [customDateMode, setCustomDateMode] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [unavailability, setUnavailability] = useState([]);

  const isHospitalDoctor = Boolean(doctorProfile?.hospitalId);
  const onlineSchedules = useMemo(() => 
    schedules.filter(s => s.consultation_type === 'online' && (customDateMode ? !!s.custom_date : !!s.day_of_week)), 
    [schedules, customDateMode]
  );
  const offlineSchedules = useMemo(() => 
    schedules.filter(s => s.consultation_type === 'offline' && (customDateMode ? !!s.custom_date : !!s.day_of_week)), 
    [schedules, customDateMode]
  );

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
      setCustomDateMode(data.doctor?.custom_date_mode ?? false);
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

const getDateForDayOfWeek = (dayStr) => {
  const dayStringToNum = {
    'Sun': 0,
    'Mon': 1,
    'Tue': 2,
    'Wed': 3,
    'Thu': 4,
    'Fri': 5,
    'Sat': 6
  };
  const targetDayNum = dayStringToNum[dayStr];
  if (targetDayNum === undefined) {
    return new Date().toISOString().slice(0, 10);
  }
  const result = new Date();
  const currentDayNum = result.getDay();
  let difference = targetDayNum - currentDayNum;
  if (difference < 0) {
    difference += 7;
  }
  result.setDate(result.getDate() + difference);
  return result.toISOString().slice(0, 10);
};

const getDayOfWeekFromDate = (dateStr) => {
  if (!dateStr) return 'Mon';
  const dateObj = new Date(dateStr);
  const daysArray = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return daysArray[dateObj.getDay()] || 'Mon';
};

  const handleToggleCustomDateMode = (enabled) => {
    if (enabled) {
      setCustomDateMode(true);
      
      const proceed = () => {
        setSchedules(prev => prev.map(s => {
          let dateStr = s.custom_date;
          if (!dateStr && s.day_of_week) {
            dateStr = getDateForDayOfWeek(s.day_of_week);
          }
          return {
            ...s,
            custom_date: dateStr || new Date().toISOString().slice(0, 10),
            day_of_week: null,
          };
        }));
      };

      toast((t) => (
        <div className="flex flex-col gap-3 p-1">
          <p className="text-xs font-semibold text-navy leading-normal">
            ⚠️ If there are already bookings done for other days, they will be cancelled. Do you want to proceed?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                proceed();
              }}
              className="bg-[#0D9488] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-none cursor-pointer hover:bg-[#0D9488]/90"
            >
              Confirm
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setCustomDateMode(false);
              }}
              className="bg-gray-100 text-navy hover:bg-gray-200 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-none cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ), {
        duration: Infinity,
        position: 'top-center',
        style: {
          borderRadius: '16px',
          background: '#FFF',
          color: '#000',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        }
      });
    } else {
      setCustomDateMode(false);
      setSchedules(prev => prev.map(s => {
        let dayName = s.day_of_week;
        if (!dayName && s.custom_date) {
          dayName = getDayOfWeekFromDate(s.custom_date);
        }
        return {
          ...s,
          day_of_week: dayName || 'Mon',
          custom_date: null,
        };
      }));
    }
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
        custom_date_mode: customDateMode,
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
      setIsEditing(false);
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
            <div className="flex items-center gap-4">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      fetchSchedule();
                    }}
                    className="rounded-2xl font-bold text-xs px-6 border-gray-200 h-14"
                  >
                    Discard
                  </Button>
                  <Button
                    onClick={handleSave}
                    loading={isSaving}
                    className="bg-[#0D9488] hover:bg-[#0D9488]/90 text-white rounded-2xl px-8 h-14 border-none flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                  >
                    <Save size={18} /> Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-navy hover:bg-navy/90 text-white rounded-2xl px-8 h-14 border-none flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                >
                  Edit Settings
                </Button>
              )}
            </div>
          )}
        </div>

        <Card className="p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase text-navy/35">Booking Window (Days)</span>
              <input
                disabled={isHospitalDoctor || !isEditing}
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
                disabled={isHospitalDoctor || !isEditing}
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
              <input type="checkbox" disabled={!isEditing} checked={onlineEnabled} onChange={(e) => setOnlineEnabled(e.target.checked)} className="w-5 h-5 accent-[#0D9488] disabled:opacity-55" />
            </label>
          )}

          <label className="mt-5 flex items-center justify-between rounded-2xl bg-[#F8FAFC] border border-gray-100 px-5 py-4">
            <div>
              <p className="text-[10px] font-black uppercase text-navy/35">Specific Calendar Dates Mode</p>
              <p className="text-xs font-bold text-navy/55">Enable this if you are only available on specific dates (e.g. once or twice a month) instead of weekly recurring days</p>
            </div>
            <input 
              type="checkbox" 
              disabled={isHospitalDoctor || !isEditing} 
              checked={customDateMode} 
              onChange={(e) => handleToggleCustomDateMode(e.target.checked)} 
              className="w-5 h-5 accent-[#0D9488] disabled:opacity-55" 
            />
          </label>
        </Card>

        <SchedulePanel
          title="Offline Consultation"
          icon={Building2}
          consultationType="offline"
          disabled={isHospitalDoctor || !isEditing}
          isEditing={isEditing}
          isHospitalDoctor={isHospitalDoctor}
          customDateMode={customDateMode}
          schedules={offlineSchedules}
          onChange={(next) => setSchedulesForType('offline', next)}
        />

        {onlineEnabled && (
          <SchedulePanel
            title="Online Consultation"
            icon={Video}
            consultationType="online"
            disabled={isHospitalDoctor || !onlineEnabled || !isEditing}
            isEditing={isEditing}
            isHospitalDoctor={isHospitalDoctor}
            customDateMode={customDateMode}
            schedules={onlineSchedules}
            onChange={(next) => setSchedulesForType('online', next)}
          />
        )}

        <Card className="p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm bg-white">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-[#0D9488]" />
              <h2 className="text-sm font-black text-navy uppercase tracking-widest">Doctor Unavailability</h2>
            </div>
            {!isHospitalDoctor && (
              <Button onClick={addLeaveDate} disabled={!isEditing} className="bg-navy text-white rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest border-none disabled:opacity-40">
                <Plus size={14} /> Add Date
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {unavailability.map((leave, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 rounded-2xl bg-[#F8FAFC] p-4 items-center">
                <input
                  disabled={isHospitalDoctor || !isEditing}
                  type="date"
                  value={String(leave.date).slice(0, 10)}
                  onChange={(e) => setUnavailability(prev => prev.map((item, i) => i === index ? { ...item, date: e.target.value } : item))}
                  className="rounded-xl bg-white border border-gray-100 px-4 py-3 text-sm font-bold text-navy outline-none disabled:opacity-70"
                />
                <select
                  disabled={isHospitalDoctor || !isEditing}
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
                    disabled={!isEditing}
                    onClick={() => setUnavailability(prev => prev.filter((_, i) => i !== index))}
                    className="text-red-500 font-black uppercase text-[10px] flex items-center gap-2 justify-center disabled:opacity-30"
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
