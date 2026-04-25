import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Input, Badge } from '../../components/common';
import { 
  Clock, Save, Check, Copy, 
  Calendar, AlertCircle, Info,
  Unlock, Lock, ChevronRight, Plus, X, Video
} from 'lucide-react';

const Availability = () => {
  const [activeTab, setActiveTab] = useState('offline');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Online consultation slots state
  const [onlineSlots, setOnlineSlots] = useState([
    { id: 1, date: '2026-04-19', times: ['10:00 AM', '11:00 AM', '2:00 PM'] },
    { id: 2, date: '2026-04-21', times: ['9:30 AM', '10:30 AM', '3:00 PM'] },
  ]);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [slotSaved, setSlotSaved] = useState(false);

  const addDate = () => {
    if (!newDate) return;
    if (onlineSlots.find(s => s.date === newDate)) return;
    setOnlineSlots(prev => [...prev, { id: Date.now(), date: newDate, times: [] }]);
    setNewDate('');
  };

  const addTimeToDate = (dateId) => {
    if (!newTime) return;
    setOnlineSlots(prev => prev.map(s =>
      s.id === dateId && !s.times.includes(newTime)
        ? { ...s, times: [...s.times, newTime] }
        : s
    ));
    setNewTime('');
  };

  const removeTime = (dateId, time) => {
    setOnlineSlots(prev => prev.map(s =>
      s.id === dateId ? { ...s, times: s.times.filter(t => t !== time) } : s
    ));
  };

  const removeDate = (dateId) => {
    setOnlineSlots(prev => prev.filter(s => s.id !== dateId));
  };

  const saveOnlineSlots = () => {
    setSlotSaved(true);
    setTimeout(() => setSlotSaved(false), 3000);
  };
  
  const [availability, setAvailability] = useState([
    { id: 1, day: 'Monday', startTime: '09:00', endTime: '13:00', maxTokens: 25, active: true },
    { id: 2, day: 'Tuesday', startTime: '09:00', endTime: '13:00', maxTokens: 25, active: true },
    { id: 3, day: 'Wednesday', startTime: '09:00', endTime: '13:00', maxTokens: 25, active: true },
    { id: 4, day: 'Thursday', startTime: '09:00', endTime: '13:00', maxTokens: 25, active: true },
    { id: 5, day: 'Friday', startTime: '09:00', endTime: '13:00', maxTokens: 25, active: true },
    { id: 6, day: 'Saturday', startTime: '10:00', endTime: '14:00', maxTokens: 20, active: true },
    { id: 7, day: 'Sunday', startTime: '00:00', endTime: '00:00', maxTokens: 0, active: false }
  ]);

  const handleUpdate = (id, field, value) => {
    setAvailability(prev => prev.map(day => 
      day.id === id ? { ...day, [field]: value } : day
    ));
    setSaveSuccess(false);
  };

  const applyToAll = (sourceDay) => {
    setAvailability(prev => prev.map(day => ({
      ...day,
      startTime: sourceDay.startTime,
      endTime: sourceDay.endTime,
      maxTokens: sourceDay.maxTokens,
      active: true // Auto-activate if copying
    })));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1500);
  };

  const isValidTime = (start, end) => {
    if (!start || !end) return true;
    return start < end;
  };

  return (
    <DashboardLayout title="Availability Settings" role="doctor">
      <div className="max-w-5xl mx-auto space-y-8 pb-20 font-body animate-in fade-in duration-700">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Manage <span className="text-[#0D9488]">Schedule</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <Calendar size={14} className="text-[#0D9488]" /> Configure your weekly hours and online consultation slots
            </p>
          </div>
          {activeTab === 'offline' ? (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className={`${
                saveSuccess ? 'bg-green-500' : 'bg-navy'
              } text-white rounded-[24px] px-10 py-6 h-auto shadow-2xl shadow-navy/20 border-none transition-all flex items-center gap-3`}
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : saveSuccess ? (
                <><Check size={20} /> Changes Saved</>
              ) : (
                <><Save size={20} /> Save Changes</>
              )}
            </Button>
          ) : (
            <Button
              onClick={saveOnlineSlots}
              className={`${
                slotSaved ? 'bg-green-500' : 'bg-[#0D9488]'
              } text-white rounded-[24px] px-10 py-6 h-auto shadow-2xl shadow-[#0D9488]/20 border-none transition-all flex items-center gap-3`}
            >
              {slotSaved ? <><Check size={20} /> Saved!</> : <><Save size={20} /> Save Slots</>}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('offline')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'offline' ? 'bg-white text-navy shadow-sm' : 'text-navy/40 hover:text-navy'
            }`}
          >
            📅 Offline Hours
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'online' ? 'bg-white text-navy shadow-sm' : 'text-navy/40 hover:text-navy'
            }`}
          >
            🎥 Online Slots
          </button>
        </div>

        {/* Info Alert — only for offline tab */}
        {activeTab === 'offline' && (
          <div className="bg-[#E0F2FE] border border-blue-100 p-6 rounded-[32px] flex items-start gap-4 shadow-sm">
            <Info className="text-[#0D9488] shrink-0 mt-1" size={24} />
            <div className="space-y-1">
              <h4 className="text-xs font-black text-navy uppercase tracking-widest">Platform Sync</h4>
              <p className="text-xs text-navy/60 font-medium leading-relaxed">
                Your availability schedule is automatically synced with the patient booking portal.
              </p>
            </div>
          </div>
        )}

        {/* OFFLINE TAB */}
        {activeTab === 'offline' && (
          <div className="space-y-4">
            {availability.map((day) => {
              const timeWarning = !isValidTime(day.startTime, day.endTime);
              return (
                <Card
                  key={day.id}
                  className={`p-6 md:p-8 rounded-[40px] border transition-all duration-300 relative overflow-hidden ${
                    day.active ? 'bg-white border-gray-100 shadow-xl shadow-navy/5' : 'bg-gray-50/50 border-transparent opacity-60'
                  }`}
                >
                  {day.active && timeWarning && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
                  )}
                  <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12 relative z-10">
                    <div className="flex items-center justify-between lg:w-48 shrink-0">
                      <div className="flex flex-col gap-1">
                        <span className="text-lg font-black text-navy tracking-tight">{day.day}</span>
                        <Badge className={`text-[8px] px-2 py-0.5 rounded-full ${day.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                          {day.active ? 'ACTIVE' : 'OFF-DUTY'}
                        </Badge>
                      </div>
                      <button
                        onClick={() => handleUpdate(day.id, 'active', !day.active)}
                        className={`w-14 h-8 rounded-full transition-all duration-300 relative ${
                          day.active ? 'bg-[#0D9488]' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
                          day.active ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                      <div className="space-y-4 md:col-span-2 lg:col-span-2">
                        <div className="flex items-center gap-4">
                          <div className={`flex-1 transition-all ${timeWarning ? 'ring-2 ring-red-500 rounded-2xl' : ''}`}>
                            <Input label="Start Time" type="time" value={day.startTime} disabled={!day.active} onChange={(e) => handleUpdate(day.id, 'startTime', e.target.value)} />
                          </div>
                          <div className="text-navy/20 pt-6"><ChevronRight size={20} /></div>
                          <div className={`flex-1 transition-all ${timeWarning ? 'ring-2 ring-red-500 rounded-2xl' : ''}`}>
                            <Input label="End Time" type="time" value={day.endTime} disabled={!day.active} onChange={(e) => handleUpdate(day.id, 'endTime', e.target.value)} />
                          </div>
                        </div>
                        {day.active && timeWarning && (
                          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2 px-2">
                            <AlertCircle size={12} /> Start time must be before end time
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Input label="Max Tokens" type="number" value={day.maxTokens} disabled={!day.active} onChange={(e) => handleUpdate(day.id, 'maxTokens', e.target.value)} />
                        </div>
                        <button
                          onClick={() => applyToAll(day)}
                          disabled={!day.active || timeWarning}
                          className="p-4 bg-gray-50 text-navy/40 hover:text-[#0D9488] hover:bg-[#0D9488]/10 rounded-2xl transition-all group disabled:opacity-0"
                          title="Copy settings to all days"
                        >
                          <Copy size={20} className="group-hover:rotate-12 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ONLINE SLOTS TAB */}
        {activeTab === 'online' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="bg-[#E0F2FE] border border-blue-100 p-5 rounded-2xl flex items-start gap-3">
              <Video size={18} className="text-[#0D9488] shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-navy/60 leading-relaxed">
                Add specific dates and time slots when you are available for <strong>online consultations</strong>. Patients will see and book these slots from the patient portal.
              </p>
            </div>

            {/* Add new date */}
            <Card className="p-6 border border-gray-100 bg-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-navy/50 mb-4">Add Available Date</p>
              <div className="flex gap-3">
                <input
                  type="date"
                  value={newDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold text-navy outline-none focus:border-[#0D9488] transition-all"
                />
                <button
                  onClick={addDate}
                  disabled={!newDate}
                  className="flex items-center gap-2 bg-[#0D9488] text-white text-[10px] font-black uppercase tracking-widest px-5 rounded-2xl hover:bg-[#0f766e] transition-all disabled:opacity-40"
                >
                  <Plus size={16} /> Add Date
                </button>
              </div>
            </Card>

            {/* Date + slot cards */}
            {onlineSlots.length === 0 && (
              <div className="py-16 text-center">
                <Calendar size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm font-bold text-navy/40">No online slots added yet.</p>
              </div>
            )}

            {onlineSlots.map((slot) => (
              <Card key={slot.id} className="p-6 border border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 flex items-center justify-center">
                      <Calendar size={18} className="text-[#0D9488]" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-navy">
                        {new Date(slot.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] font-bold text-navy/40">{slot.times.length} time slot{slot.times.length !== 1 ? 's' : ''} added</p>
                    </div>
                  </div>
                  <button onClick={() => removeDate(slot.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all">
                    <X size={14} />
                  </button>
                </div>

                {/* Existing time chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {slot.times.map(t => (
                    <div key={t} className="flex items-center gap-1.5 bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 px-3 py-1.5 rounded-xl text-[10px] font-black">
                      <Clock size={10} /> {t}
                      <button onClick={() => removeTime(slot.id, t)} className="text-[#0D9488]/50 hover:text-red-500 ml-1"><X size={10} /></button>
                    </div>
                  ))}
                  {slot.times.length === 0 && (
                    <p className="text-[10px] font-bold text-navy/30">No time slots yet. Add one below.</p>
                  )}
                </div>

                {/* Add time */}
                <div className="flex gap-2">
                  <input
                    type="time"
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':');
                      const hr = parseInt(h);
                      const ampm = hr >= 12 ? 'PM' : 'AM';
                      const hr12 = hr % 12 || 12;
                      setNewTime(`${hr12}:${m} ${ampm}`);
                    }}
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-4 text-sm font-bold text-navy outline-none focus:border-[#0D9488] transition-all"
                  />
                  <button
                    onClick={() => addTimeToDate(slot.id)}
                    className="flex items-center gap-1.5 bg-navy text-white text-[10px] font-black uppercase tracking-widest px-4 rounded-xl hover:bg-[#0D9488] transition-all"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Availability;
