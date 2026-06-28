import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, Avatar, Modal } from '../../components/common';
import {
  Calendar, Clock, Search, ChevronRight, ChevronDown,
  Stethoscope, Mail, Phone, MapPin, Droplet, User, Activity, Download
} from 'lucide-react';
import hospitalService from '../../services/hospitalService';
import { generatePrescriptionPDF } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const calculateAge = (dobString) => {
  if (!dobString) return 'N/A';
  const dob = new Date(dobString);
  return Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970);
};

const getLocalDateString = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatTime12 = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'consulting': return 'bg-[#0D9488] text-white border-teal-700 font-black shadow-md animate-pulse';
    case 'booked': return 'bg-purple-600 text-white border-purple-700 font-black';
    case 'completed': return 'bg-slate-100 text-navy/70 border-slate-300 font-bold';
    case 'cancelled': return 'bg-red-50 text-red-600 border-red-200 font-bold';
    case 'no_show': return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const statusLabel = (status) => {
  if (status === 'booked') return 'SCHEDULED';
  if (status === 'no_show') return 'NO-SHOW';
  return status.toUpperCase();
};

// ─── Appointment Card ──────────────────────────────────────────────────────────

const AppointmentCard = ({ app, showDoctor = false, onDetails, onViewRx }) => (
  <Card
    className={`p-6 bg-white border ${app.displayStatus === 'consulting'
        ? 'border-[#0D9488] shadow-lg shadow-[#0D9488]/5 ring-1 ring-[#0D9488]/10'
        : app.displayStatus === 'cancelled'
          ? 'border-red-100'
          : 'border-gray-100'
      } rounded-[32px] hover:-translate-y-1 transition-all duration-300 group`}
  >
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <div className="relative">
          <Avatar
            name={app.patient}
            size="lg"
            className={
              app.displayStatus === 'consulting' ? 'ring-4 ring-[#0D9488]/20'
                : app.displayStatus === 'cancelled' ? 'opacity-60' : ''
            }
          />
          <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 border border-gray-100 shadow-sm">
            <Stethoscope size={14} className={app.displayStatus === 'cancelled' ? 'text-red-400' : 'text-[#0D9488]'} />
          </div>
        </div>
        <div>
          <h3 className={`text-base font-black leading-none mb-1 ${app.displayStatus === 'cancelled' ? 'text-navy/50' : 'text-navy'}`}>
            {app.patient}
          </h3>
          <p className="text-[10px] font-black tracking-widest uppercase text-navy/40 flex items-center gap-2 mt-1">
            {app.date} • {app.time} • Token T-{app.token}
          </p>
          {showDoctor && (
            <p className="text-[10px] font-black tracking-wider uppercase text-[#0D9488]/70 mt-0.5 flex items-center gap-1">
              <Stethoscope size={9} /> {app.doctorName}
            </p>
          )}
          {app.displayStatus === 'cancelled' && app.wasRebooked && (
            <p className="text-[9px] font-black tracking-widest uppercase text-orange-500 mt-1">⟳ Slot rebooked by another patient</p>
          )}
          {app.displayStatus === 'cancelled' && app.cancellation_reason && (
            <p className="text-[9px] font-black text-red-400 mt-0.5 uppercase tracking-wider">Reason: {app.cancellation_reason}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:items-end gap-3">
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Badge className={`text-[9px] px-4 py-1.5 ${getStatusStyle(app.displayStatus)}`}>
            {statusLabel(app.displayStatus)}
          </Badge>
          {app.displayStatus === 'cancelled' && app.wasRebooked && (
            <Badge className="text-[9px] px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 font-bold">
              SLOT REBOOKED
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDetails(app)}
            className="rounded-xl border-gray-200 text-[10px] px-6 py-2.5 font-black uppercase tracking-wider"
          >
            Details
          </Button>
          {app.displayStatus === 'completed' && (
            <Button
              size="sm"
              onClick={() => onViewRx(app)}
              className="rounded-xl bg-[#0D9488] hover:bg-[#0D9488]/90 text-white text-[10px] px-6 py-2.5 font-black uppercase tracking-wider border-none shadow-sm"
            >
              View Rx
            </Button>
          )}
        </div>
      </div>
    </div>
  </Card>
);

// ─── Grouped view (one accordion per doctor) ─────────────────────────────────

const DoctorGroup = ({ doctor, appointments, onDetails, onViewRx, dateStr }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Upcoming');

  // Get matching schedules (sessions) for the doctor on this date
  const sessions = useMemo(() => {
    if (!dateStr || !doctor?.schedules) return [];

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const targetDayOfWeek = DAYS[targetDate.getDay()];

    const relevant = doctor.schedules.filter(s => {
      return s.custom_date === dateStr || s.day_of_week === targetDayOfWeek;
    });

    // Remove duplicates
    const seen = new Set();
    const unique = [];
    for (const s of relevant) {
      const key = `${s.start_time}-${s.end_time}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(s);
      }
    }
    // Sort chronologically
    return unique.sort((a, b) => {
      const [ah, am] = a.start_time.split(':').map(Number);
      const [bh, bm] = b.start_time.split(':').map(Number);
      return (ah * 60 + am) - (bh * 60 + bm);
    });
  }, [doctor, dateStr]);

  const hasMultipleSessions = sessions.length > 1;
  const [selectedSessionIdx, setSelectedSessionIdx] = useState(0);

  // Filter all doctor appointments to the selected session first
  const sessionFilteredAppointments = useMemo(() => {
    if (sessions.length === 0) return appointments;
    const currentSession = sessions[hasMultipleSessions ? selectedSessionIdx : 0];
    if (!currentSession) return appointments;

    const [sh, sm] = currentSession.start_time.split(':').map(Number);
    const [eh, em] = currentSession.end_time.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    return appointments.filter(app => {
      if (!app.slot_id?.start_datetime) return false;
      const t = new Date(app.slot_id.start_datetime);
      const m = t.getHours() * 60 + t.getMinutes();
      return m >= startMin && m < endMin;
    });
  }, [appointments, sessions, selectedSessionIdx, hasMultipleSessions]);

  // Compute status lists and tab counts from the session-filtered appointments
  const upcoming = useMemo(() => sessionFilteredAppointments.filter(a => ['booked', 'consulting'].includes(a.status) && a.displayStatus !== 'cancelled'), [sessionFilteredAppointments]);
  const completed = useMemo(() => sessionFilteredAppointments.filter(a => a.status === 'completed'), [sessionFilteredAppointments]);
  const cancelled = useMemo(() => sessionFilteredAppointments.filter(a => a.status === 'cancelled' || a.status === 'no_show' || a.displayStatus === 'cancelled'), [sessionFilteredAppointments]);

  const visibleAppointments = useMemo(() => {
    if (activeTab === 'Upcoming') return upcoming;
    if (activeTab === 'Completed') return completed;
    return cancelled;
  }, [activeTab, upcoming, completed, cancelled]);

  if (!appointments.length) return null;

  return (
    <div className="rounded-[32px] border border-gray-100 overflow-hidden bg-white shadow-sm">
      {/* Doctor header / toggle */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <Avatar name={doctor?.user?.name} src={doctor?.user?.image} size="md" className="ring-2 ring-[#0D9488]/20" />
          <div className="text-left">
            <p className="font-black text-navy text-sm">{doctor?.user?.name || 'Doctor'}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#0D9488]">
              {doctor?.specialization} • {appointments.length} patient{appointments.length !== 1 ? 's' : ''}
              {hasMultipleSessions && ` • ${sessions.length} sessions`}
            </p>
          </div>
        </div>
        {open
          ? <ChevronDown size={18} className="text-navy/40" />
          : <ChevronRight size={18} className="text-navy/40" />
        }
      </button>

      {/* Appointments */}
      {open && (
        <div className="border-t border-gray-100">
          {/* Session pill selector — shown ABOVE status tabs so it filters counts below */}
          {hasMultipleSessions && (
            <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-gray-100 bg-gray-50/30">
              {sessions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedSessionIdx(i)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${selectedSessionIdx === i
                      ? 'bg-[#0D9488] text-white border-[#0D9488]'
                      : 'bg-gray-50 text-navy/50 border-gray-200 hover:text-navy hover:bg-gray-100'
                    }`}
                >
                  <Clock size={9} />
                  {formatTime12(s.start_time)} – {formatTime12(s.end_time)}
                </button>
              ))}
            </div>
          )}

          {/* Sub tabs inside DoctorGroup */}
          <div className="flex border-b border-gray-150 px-4 bg-gray-50/50">
            {['Upcoming', 'Completed', 'Cancelled'].map(tab => {
              const count = tab === 'Upcoming' ? upcoming.length : tab === 'Completed' ? completed.length : cancelled.length;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-[10px] font-black tracking-wider transition-all border-b-2 -mb-[2px] ${activeTab === tab
                      ? 'border-[#0D9488] text-[#0D9488]'
                      : 'border-transparent text-navy/40 hover:text-navy'
                    }`}
                >
                  {tab === 'Cancelled' ? 'CANCELLED / NO-SHOW' : tab.toUpperCase()} ({count})
                </button>
              );
            })}
          </div>

          <div className="px-4 pb-4 space-y-3">
            <div className="h-2" />
            {visibleAppointments.map(app => (
              <AppointmentCard key={app.id} app={app} showDoctor={false} onDetails={onDetails} onViewRx={onViewRx} />
            ))}
            {visibleAppointments.length === 0 && (
              <p className="text-[10px] font-bold text-navy/30 italic px-2">No appointments in this session.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const HospitalAppointments = () => {
  const [allAppointments, setAllAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [appointmentTab, setAppointmentTab] = useState('Upcoming');
  const [dateFilter, setDateFilter] = useState('today');
  const [customDate, setCustomDate] = useState(getLocalDateString(new Date()));
  const [doctorFilter, setDoctorFilter] = useState('all'); // 'all' | doctorId string
  const [selectedSession, setSelectedSession] = useState('');
  const [search, setSearch] = useState('');

  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  
  const [isPrescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [selectedPrescriptionApp, setSelectedPrescriptionApp] = useState(null);

  const now = useMemo(() => new Date(), []);

  const fetchAppointments = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const data = await hospitalService.getAppointments();
      setAllAppointments(data.appointments || []);
      setDoctors(data.doctors || []);
    } catch {
      if (showSpinner) toast.error('Failed to load appointments');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  // ── Fetch on load + Background Polling ────────────────────────────────────
  useEffect(() => {
    fetchAppointments(true);

    const interval = setInterval(() => {
      fetchAppointments(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // ── Date helper ───────────────────────────────────────────────────────────
  const getFilterDateStr = (ft) => {
    const today = new Date();
    if (ft === 'today') return getLocalDateString(today);
    if (ft === 'yesterday') { const d = new Date(today); d.setDate(today.getDate() - 1); return getLocalDateString(d); }
    if (ft === 'tomorrow') { const d = new Date(today); d.setDate(today.getDate() + 1); return getLocalDateString(d); }
    if (ft === 'custom') return customDate;
    return null;
  };

  const isSlotRebooked = (app) => {
    if (app.status !== 'cancelled') return false;
    const slotId = app.slot_id?._id || app.slot_id;
    return allAppointments.some(o => {
      const oSlot = o.slot_id?._id || o.slot_id;
      return oSlot?.toString() === slotId?.toString() && ['booked', 'consulting', 'completed'].includes(o.status);
    });
  };

  // ── Session list (derived from doctor schedules) ───────────────────────────
  const sessionsList = useMemo(() => {
    const targetDateStr = getFilterDateStr(dateFilter);
    if (!targetDateStr || doctorFilter === 'all') return [];

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const targetDayOfWeek = DAYS[new Date(targetDateStr + 'T00:00:00').getDay()];

    const doc = doctors.find(d => d._id === doctorFilter);
    const schedules = (doc?.schedules || []).filter(
      s => s.day_of_week === targetDayOfWeek || s.custom_date === targetDateStr
    );

    const seen = new Set();
    return schedules
      .map(s => {
        const key = `${s.start_time}-${s.end_time}`;
        if (seen.has(key)) return null;
        seen.add(key);
        return { key, start: s.start_time, end: s.end_time, label: `${formatTime12(s.start_time)} – ${formatTime12(s.end_time)}` };
      })
      .filter(Boolean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAppointments, doctors, doctorFilter, dateFilter, customDate]);

  useEffect(() => {
    if (sessionsList.length > 0) {
      if (!selectedSession || !sessionsList.some(s => s.key === selectedSession)) {
        setSelectedSession(sessionsList[0].key);
      }
    } else {
      setSelectedSession('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionsList]);

  // ── Process one appointment into display-ready object ─────────────────────
  const processApp = (app) => {
    const start = app.slot_id?.start_datetime;
    const isPast = start && new Date(start) < now;
    const displayStatus = (app.status === 'booked' && isPast) ? 'cancelled' : app.status;
    const drId = (app.doctor_id?._id || app.doctor_id)?.toString();
    const doc = doctors.find(d => d._id === drId);
    return {
      ...app,
      id: app._id,
      patient: app.patient_id?.name || app.patient_snapshot?.name || 'Walk-in Patient',
      email: app.patient_id?.email || app.patient_snapshot?.email || '',
      phone: app.patient_id?.phone || app.patient_snapshot?.phone || 'N/A',
      gender: app.patient_id?.gender || app.patient_snapshot?.gender || 'N/A',
      age: app.patient_id?.dob ? calculateAge(app.patient_id.dob) : (app.patient_snapshot?.age || 'N/A'),
      bloodGroup: app.patient_id?.bloodGroup || app.patient_snapshot?.bloodGroup || 'N/A',
      address: app.patient_id?.address || app.patient_snapshot?.address || 'N/A',
      date: start ? new Date(start).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A',
      time: start ? new Date(start).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A',
      token: app.token_number,
      doctorName: doc?.user?.name || app.doctor_id?.user?.name || 'Doctor',
      doctorId: drId,
      wasRebooked: isSlotRebooked(app),
      displayStatus,
    };
  };

  // ── Derived: visible (non-rebooked-cancelled) sorted list ─────────────────
  const processed = useMemo(() => {
    return allAppointments
      .filter(app => app.status !== 'cancelled' || !isSlotRebooked(app))
      .sort((a, b) => new Date(a.slot_id?.start_datetime) - new Date(b.slot_id?.start_datetime))
      .map(processApp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAppointments, doctors, now]);

  const allCancelledProcessed = useMemo(() =>
    allAppointments
      .filter(app => {
        const isPast = app.slot_id?.start_datetime && new Date(app.slot_id.start_datetime) < now;
        return app.status === 'cancelled' || app.status === 'no_show' || (app.status === 'booked' && isPast);
      })
      .sort((a, b) => new Date(a.slot_id?.start_datetime) - new Date(b.slot_id?.start_datetime))
      .map(processApp),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allAppointments, doctors, now]);


  // ── Apply filters (doctor, date, session, search) ─────────────────────────
  const applyFilters = (list) => {
    const targetDate = getFilterDateStr(dateFilter);
    return list.filter(app => {
      if (doctorFilter !== 'all' && app.doctorId !== doctorFilter) return false;
      if (targetDate) {
        if (getLocalDateString(app.slot_id?.start_datetime) !== targetDate) return false;
      }
      if (selectedSession && doctorFilter !== 'all') {
        if (!app.slot_id?.start_datetime) return false;
        const dashIdx = selectedSession.indexOf('-', 3);
        const [sH, sM] = selectedSession.slice(0, dashIdx).split(':').map(Number);
        const [eH, eM] = selectedSession.slice(dashIdx + 1).split(':').map(Number);
        const slotStart = new Date(app.slot_id.start_datetime);
        const slotMin = slotStart.getHours() * 60 + slotStart.getMinutes();
        if (slotMin < sH * 60 + sM || slotMin >= eH * 60 + eM) return false;
      }
      if (search && !app.patient.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  };

  const filteredAppointments = useMemo(() => {
    const source = appointmentTab === 'Cancelled' ? allCancelledProcessed : processed;
    const base = applyFilters(source);
    if (appointmentTab === 'Upcoming') return base.filter(a => ['booked', 'consulting', 'no_show'].includes(a.status) && a.displayStatus !== 'cancelled');
    if (appointmentTab === 'Completed') return base.filter(a => a.status === 'completed');
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processed, allCancelledProcessed, appointmentTab, doctorFilter, dateFilter, customDate, selectedSession, search]);

  const getTabCount = (tab) => {
    const source = tab === 'Cancelled' ? allCancelledProcessed : processed;
    const base = applyFilters(source);
    if (tab === 'Upcoming') return base.filter(a => ['booked', 'consulting', 'no_show'].includes(a.status) && a.displayStatus !== 'cancelled').length;
    if (tab === 'Completed') return base.filter(a => a.status === 'completed').length;
    return base.length;
  };

  // ── Today summary ─────────────────────────────────────────────────────────
  const todayStr = getLocalDateString(new Date());
  const todaySummary = useMemo(() => {
    const today = processed.filter(a => getLocalDateString(a.slot_id?.start_datetime) === todayStr);
    return {
      total: today.length,
      completed: today.filter(a => a.status === 'completed').length,
      upcoming: today.filter(a => ['booked', 'consulting'].includes(a.status)).length,
    };
  }, [processed, todayStr]);

  const allFilteredAppointments = useMemo(() => {
    const combined = [...processed];
    for (const c of allCancelledProcessed) {
      if (!combined.some(o => o.id === c.id)) {
        combined.push(c);
      }
    }
    return applyFilters(combined);
  }, [processed, allCancelledProcessed, doctorFilter, dateFilter, customDate, selectedSession, search]);

  // ── Grouped by doctor (for "All Doctors" view) ────────────────────────────
  const groupedByDoctor = useMemo(() => {
    if (doctorFilter !== 'all') return null;
    const groups = [];
    for (const doc of doctors) {
      const appts = allFilteredAppointments.filter(a => a.doctorId === doc._id);
      groups.push({ doctor: doc, appointments: appts });
    }
    return groups;
  }, [doctors, allFilteredAppointments, doctorFilter]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout title="Appointments" role="hospital">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0D9488]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Appointments" role="hospital">
      <div className="max-w-7xl mx-auto space-y-8 pb-20 font-body animate-in fade-in duration-700">

        {/* ── Page Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Hospital <span className="text-[#0D9488]">Appointments</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <Activity size={14} className="text-[#0D9488]" /> Monitor all doctor consultations
            </p>
          </div>

          {/* ── Filters (no doctor dropdown here) ── */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date filter pills */}
            <div className="flex bg-[#EEF2F6] p-1 rounded-2xl border border-gray-150">
              {['today', 'yesterday', 'tomorrow', 'custom'].map(ft => (
                <button
                  key={ft}
                  type="button"
                  onClick={() => setDateFilter(ft)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${dateFilter === ft ? 'bg-white text-navy shadow-md' : 'text-navy/50 hover:text-navy'
                    }`}
                >
                  {ft}
                </button>
              ))}
            </div>

            {dateFilter === 'custom' && (
              <div className="relative animate-in slide-in-from-left-2 duration-200">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D9488]" />
                <input
                  type="date"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-bold text-navy outline-none"
                />
              </div>
            )}

            {/* Session selector — only when a single doctor is selected */}
            {sessionsList.length > 0 && doctorFilter !== 'all' && (
              <div className="relative animate-in slide-in-from-left-2 duration-200">
                <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0D9488]" />
                <select
                  value={selectedSession}
                  onChange={e => setSelectedSession(e.target.value)}
                  className="pl-9 pr-9 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-navy appearance-none outline-none"
                >
                  {sessionsList.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/50 pointer-events-none" />
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search patient..."
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-bold text-navy outline-none w-44"
              />
            </div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        {doctorFilter !== 'all' && (
          <div className="flex border-b border-gray-200">
            {['Upcoming', 'Completed', 'Cancelled'].map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setAppointmentTab(tab)}
                className={`px-8 py-4 text-sm font-black transition-all border-b-2 -mb-[2px] ${appointmentTab === tab
                    ? 'border-[#0D9488] text-[#0D9488]'
                    : 'border-transparent text-navy/40 hover:text-navy hover:bg-gray-50/50'
                  }`}
              >
                {tab === 'Cancelled' ? 'CANCELLED / NO-SHOW' : tab.toUpperCase()} ({getTabCount(tab)})
              </button>
            ))}
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ── Left: Appointment list ── */}
          <div className="lg:col-span-2 space-y-4">
            {filteredAppointments.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-[32px] p-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                  <Calendar size={32} />
                </div>
                <h3 className="text-xl font-black text-navy">No {appointmentTab.toLowerCase()} appointments</h3>
                <p className="text-sm font-bold text-navy/40 mt-2">Try changing your filters to see more results.</p>
              </div>
            ) : doctorFilter === 'all' ? (
              /* ── Grouped by doctor with accordion ── */
              <div className="space-y-4">
                {groupedByDoctor?.map(({ doctor, appointments: appts }) =>
                  appts.length > 0 ? (
                    <DoctorGroup
                      key={doctor._id}
                      doctor={doctor}
                      appointments={appts}
                      dateStr={getFilterDateStr(dateFilter)}
                      onDetails={app => { setSelectedApp(app); setDetailsOpen(true); }}
                      onViewRx={app => { setSelectedPrescriptionApp(app); setPrescriptionModalOpen(true); }}
                    />
                  ) : null
                )}
              </div>
            ) : (
              /* ── Flat list for single doctor ── */
              filteredAppointments.map(app => (
                <AppointmentCard
                  key={app.id}
                  app={app}
                  showDoctor={false}
                  onDetails={app => { setSelectedApp(app); setDetailsOpen(true); }}
                  onViewRx={app => { setSelectedPrescriptionApp(app); setPrescriptionModalOpen(true); }}
                />
              ))
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1 space-y-6 sticky top-[100px]">
            {/* Today's summary */}
            <div className="bg-[#0D9488] p-8 rounded-[40px] text-white shadow-xl shadow-[#0D9488]/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-4">Today's Summary</h3>
              <div className="space-y-6 relative z-10">
                {[
                  { label: 'Total Patients', value: todaySummary.total },
                  { label: 'Completed', value: todaySummary.completed },
                  { label: 'Upcoming', value: todaySummary.upcoming },
                ].map(({ label, value }, i, arr) => (
                  <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? 'border-b border-white/10 pb-4' : ''}`}>
                    <span className="text-sm font-bold opacity-90">{label}</span>
                    <span className={`font-black ${i === 0 ? 'text-2xl' : 'text-xl'}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctors panel */}
            {doctors.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-navy/40 mb-4">Doctors</h3>
                <div className="space-y-2">
                  {/* "All Doctors" row */}
                  <button
                    type="button"
                    onClick={() => setDoctorFilter('all')}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${doctorFilter === 'all' ? 'bg-[#0D9488]/10 border border-[#0D9488]/20' : 'hover:bg-gray-50'
                      }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-navy/5 flex items-center justify-center flex-shrink-0">
                      <Stethoscope size={16} className="text-navy/40" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-navy">All Doctors</p>
                      <p className="text-[9px] font-bold text-navy/40 uppercase tracking-wider">{doctors.length} doctors</p>
                    </div>
                  </button>

                  {/* Individual doctor rows */}
                  {doctors.map(doc => (
                    <button
                      key={doc._id}
                      type="button"
                      onClick={() => setDoctorFilter(doctorFilter === doc._id ? 'all' : doc._id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${doctorFilter === doc._id ? 'bg-[#0D9488]/10 border border-[#0D9488]/20' : 'hover:bg-gray-50'
                        }`}
                    >
                      <Avatar name={doc.user?.name} src={doc.user?.image} size="sm" className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-navy truncate">{doc.user?.name}</p>
                        <p className="text-[9px] font-bold text-[#0D9488] uppercase tracking-wider truncate">{doc.specialization}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Details Modal ── */}
      <Modal isOpen={isDetailsOpen} onClose={() => setDetailsOpen(false)} title="Appointment Details" size="lg">
        {selectedApp && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 p-8 rounded-[40px] border border-slate-100">
              <div className="flex items-center gap-6">
                <Avatar name={selectedApp.patient} size="xl" className="ring-4 ring-white shadow-xl" />
                <div>
                  <h2 className="text-2xl font-black text-navy uppercase tracking-widest mb-1">{selectedApp.patient}</h2>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-navy text-white text-[10px] px-4">Token T-{selectedApp.token}</Badge>
                    <span className="text-xs font-black text-navy/40 uppercase tracking-widest">{selectedApp.gender} • {selectedApp.age} Years</span>
                  </div>
                </div>
              </div>
              <Badge className={`text-[10px] px-6 py-2 font-black uppercase tracking-widest ${getStatusStyle(selectedApp.displayStatus)}`}>
                {statusLabel(selectedApp.displayStatus)}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0D9488]/10 flex items-center justify-center text-[#0D9488]"><Calendar size={18} /></div>
                  <h3 className="text-xs font-black text-navy uppercase tracking-widest">Visit Information</h3>
                </div>
                <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-sm">
                  {[
                    { label: 'Doctor', value: selectedApp.doctorName },
                    { label: 'Date', value: selectedApp.date },
                    { label: 'Time', value: selectedApp.time },
                    { label: 'Booked By', value: selectedApp.booked_by_role },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center text-sm font-bold">
                      <span className="text-navy/40 uppercase text-[10px] tracking-widest">{label}</span>
                      <span className="text-navy capitalize">{value}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-50">
                    <span className="text-navy/40 uppercase text-[10px] tracking-widest block mb-2">Reason for Visit</span>
                    <p className="text-sm font-bold text-navy leading-relaxed">{selectedApp.reason || 'No description provided'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><User size={18} /></div>
                  <h3 className="text-xs font-black text-navy uppercase tracking-widest">Patient Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: <Mail size={14} className="text-blue-500" />, label: 'Email', value: selectedApp.email, small: true },
                    { icon: <Phone size={14} className="text-green-500" />, label: 'Phone', value: selectedApp.phone },
                    { icon: <Droplet size={14} className="text-red-500" />, label: 'Blood Group', value: selectedApp.bloodGroup },
                    { icon: <MapPin size={14} className="text-orange-500" />, label: 'Address', value: selectedApp.address, small: true },
                  ].map(({ icon, label, value, small }) => (
                    <div key={label} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-navy/40 uppercase text-[9px] font-black tracking-widest">{label}</span></div>
                      <p className={`font-bold text-navy ${small ? 'text-xs truncate' : 'text-sm'}`} title={value}>{value || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100 flex justify-end">
              <Button variant="outline" onClick={() => setDetailsOpen(false)} className="rounded-2xl px-8 border-gray-200 uppercase tracking-widest font-black text-[10px]">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Prescription Preview Modal */}
      <Modal 
        isOpen={isPrescriptionModalOpen} 
        onClose={() => setPrescriptionModalOpen(false)}
        title="Prescription Details"
        size="lg"
      >
        {selectedPrescriptionApp && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header / Demographics info */}
            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
              <div>
                <span className="text-[9px] font-black text-navy/40 uppercase tracking-widest block">Patient Name</span>
                <h3 className="text-xl font-black text-navy">{selectedPrescriptionApp.patient}</h3>
                <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-wider mt-0.5">
                  Token T-{selectedPrescriptionApp.token} • {selectedPrescriptionApp.date} • {selectedPrescriptionApp.time}
                </p>
              </div>
              <Badge className="bg-navy text-white text-[9px] px-4 py-1.5 uppercase font-black tracking-widest border-none">
                Completed Visit
              </Badge>
            </div>

            {/* Vitals & Bio-markers Grid */}
            <div className="space-y-3 text-left">
              <span className="text-[10px] font-black text-navy/40 uppercase tracking-widest pl-1">Recorded Vitals</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4">
                  <span className="text-[8px] font-black text-navy/40 uppercase tracking-widest block mb-1">Blood Pressure</span>
                  <span className="text-sm font-black text-navy">{selectedPrescriptionApp.vitals?.bp || 'N/A'}</span>
                </div>
                <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4">
                  <span className="text-[8px] font-black text-navy/40 uppercase tracking-widest block mb-1">Pulse (bpm)</span>
                  <span className="text-sm font-black text-navy">{selectedPrescriptionApp.vitals?.pulse || 'N/A'}</span>
                </div>
                <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4">
                  <span className="text-[8px] font-black text-navy/40 uppercase tracking-widest block mb-1">Temp (°F)</span>
                  <span className="text-sm font-black text-navy">{selectedPrescriptionApp.vitals?.temperature || 'N/A'}</span>
                </div>
                <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4">
                  <span className="text-[8px] font-black text-navy/40 uppercase tracking-widest block mb-1">Weight (kg)</span>
                  <span className="text-sm font-black text-navy">{selectedPrescriptionApp.vitals?.weight || 'N/A'}</span>
                </div>
              </div>

              {selectedPrescriptionApp.custom_vitals && selectedPrescriptionApp.custom_vitals.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-3">
                  {selectedPrescriptionApp.custom_vitals.map((cv, idx) => (
                    <div key={idx} className="bg-teal-50/20 border border-teal-100/50 rounded-2xl p-4">
                      <span className="text-[8px] font-black text-teal-700/60 uppercase tracking-widest block mb-1 truncate" title={cv.name}>{cv.name}</span>
                      <span className="text-xs font-black text-teal-900">{cv.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assessment & Clinical Notes */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
              <div className="md:col-span-4 bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-2">
                <span className="text-[9px] font-black text-navy/40 uppercase tracking-widest block">Primary Diagnosis</span>
                <p className="text-sm font-black text-navy leading-snug">{selectedPrescriptionApp.prescription?.diagnosis || 'N/A'}</p>
              </div>
              <div className="md:col-span-8 bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-2">
                <span className="text-[9px] font-black text-navy/40 uppercase tracking-widest block">Lifestyle advice / Clinical notes</span>
                <p className="text-xs font-bold text-navy/70 leading-relaxed whitespace-pre-line">{selectedPrescriptionApp.prescription?.notes || 'No lifestyle advice or clinical notes provided.'}</p>
              </div>
            </div>

            {/* Medication Schedule Table */}
            <div className="space-y-3 text-left">
              <span className="text-[10px] font-black text-navy/40 uppercase tracking-widest pl-1">Medication Schedule</span>
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-150">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-[9px] font-black text-navy/40 uppercase tracking-widest">Drug Name</th>
                      <th className="px-5 py-3 text-left text-[9px] font-black text-navy/40 uppercase tracking-widest">Dosage</th>
                      <th className="px-5 py-3 text-left text-[9px] font-black text-navy/40 uppercase tracking-widest">Frequency</th>
                      <th className="px-5 py-3 text-left text-[9px] font-black text-navy/40 uppercase tracking-widest">Duration</th>
                      <th className="px-5 py-3 text-left text-[9px] font-black text-navy/40 uppercase tracking-widest">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {selectedPrescriptionApp.prescription?.medicines && selectedPrescriptionApp.prescription.medicines.length > 0 ? (
                      selectedPrescriptionApp.prescription.medicines.map((med, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 text-xs font-black text-navy">{med.name || '-'}</td>
                          <td className="px-5 py-3 text-xs font-bold text-navy/70">{med.dosage || '-'}</td>
                          <td className="px-5 py-3 text-xs font-bold text-navy/70">{med.frequency || '-'}</td>
                          <td className="px-5 py-3 text-xs font-bold text-navy/70">{med.duration || '-'}</td>
                          <td className="px-5 py-3 text-[11px] font-bold text-navy/50">{med.instruction || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-5 py-6 text-center text-xs font-bold text-navy/35 italic">No medications prescribed.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer actions */}
            <div className="pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
              <Button
                type="button"
                onClick={() => {
                  generatePrescriptionPDF({
                    ...selectedPrescriptionApp,
                    patient_id: selectedPrescriptionApp.patient_id || {
                      name: selectedPrescriptionApp.patient,
                      gender: selectedPrescriptionApp.gender,
                      dob: selectedPrescriptionApp.patient_id?.dob,
                      bloodGroup: selectedPrescriptionApp.bloodGroup,
                      address: selectedPrescriptionApp.address,
                      phone: selectedPrescriptionApp.phone,
                      email: selectedPrescriptionApp.email
                    }
                  });
                }}
                className="bg-[#0D9488] hover:bg-[#0D9488]/90 text-white rounded-2xl px-6 py-2.5 font-black text-[10px] uppercase tracking-widest border-none shadow-md flex items-center gap-2"
              >
                <Download size={14} /> Download PDF
              </Button>

              <Button 
                type="button"
                variant="outline" 
                onClick={() => setPrescriptionModalOpen(false)}
                className="rounded-2xl px-8 border-gray-200 uppercase tracking-widest font-black text-[10px]"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default HospitalAppointments;
