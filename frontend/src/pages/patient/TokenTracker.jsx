import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Avatar, Badge } from '../../components/common';
import { Activity, BellRing, Calendar, Clock, Users, Video } from 'lucide-react';
import appointmentService from '../../services/appointmentService';
import toast from 'react-hot-toast';

const TokenTracker = () => {
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [selectedId, setSelectedId] = useState(location.state?.appointmentId || '');
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);

  const trackedAppointments = useMemo(() => (
    appointments.filter(item => ['booked', 'consulting'].includes(item.status))
  ), [appointments]);

  const selectedAppointment = trackedAppointments.find(item => item._id === selectedId) || trackedAppointments[0];

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getMyAppointments();
      setAppointments(data);
      if (!selectedId && data.length > 0) {
        const firstActive = data.find(item => ['booked', 'consulting'].includes(item.status));
        if (firstActive) setSelectedId(firstActive._id);
      }
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const loadQueue = async (id) => {
    if (!id) return;
    try {
      setQueue(await appointmentService.getQueuePreview(id));
    } catch (error) {
      setQueue(null);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    const id = selectedAppointment?._id;
    if (!id) return;
    loadQueue(id);
    const interval = setInterval(() => loadQueue(id), 30000);
    return () => clearInterval(interval);
  }, [selectedAppointment?._id]);

  const doctorName = selectedAppointment?.doctor_id?.user?.name || 'Doctor';
  const start = selectedAppointment?.slot_id?.start_datetime ? new Date(selectedAppointment.slot_id.start_datetime) : null;
  const isTurn = queue?.token_number && queue?.current_token === queue?.token_number;
  const progress = queue?.queue?.length
    ? Math.min(100, ((queue.current_token || 0) / Math.max(queue.token_number || 1, 1)) * 100)
    : 0;

  return (
    <DashboardLayout title="Live Token Tracker" role="patient">
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div>
          <h1 className="text-4xl font-heading font-black text-navy tracking-tight">Live Token Tracker</h1>
          <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] mt-2">
            Queue position and estimated consultation start
          </p>
        </div>

        {loading ? (
          <div className="h-56 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0D9488]" />
          </div>
        ) : trackedAppointments.length === 0 ? (
          <Card className="p-12 text-center border-gray-100">
            <Activity size={42} className="mx-auto text-navy/20 mb-4" />
            <h3 className="text-xl font-black text-navy">No active appointment to track</h3>
            <p className="text-sm font-bold text-navy/35 mt-2">Booked appointments appear here before consultation.</p>
          </Card>
        ) : (
          <>
            <div className="bg-white border border-gray-100 rounded-3xl p-2 shadow-sm">
              <select
                value={selectedAppointment?._id || ''}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full rounded-2xl px-5 py-4 text-sm font-bold text-navy outline-none bg-gray-50"
              >
                {trackedAppointments.map(item => {
                  const itemStart = item.slot_id?.start_datetime ? new Date(item.slot_id.start_datetime) : null;
                  return (
                    <option key={item._id} value={item._id}>
                      T-{item.token_number || '-'} • {item.doctor_id?.user?.name || 'Doctor'} • {itemStart ? itemStart.toLocaleString('en-IN') : 'Not scheduled'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="bg-navy rounded-[40px] p-8 text-white relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-5">
                  <Avatar src={selectedAppointment?.doctor_id?.user?.image} name={doctorName} size="xl" />
                  <div>
                    <Badge className="bg-[#0D9488] text-white border-none text-[10px] mb-3">LIVE QUEUE</Badge>
                    <h2 className="text-3xl font-heading font-black">{doctorName}</h2>
                    <p className="text-white/60 text-sm font-bold mt-2 flex items-center gap-2">
                      <Calendar size={15} /> {start ? start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not scheduled'}
                      <Clock size={15} /> {start ? start.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
                    </p>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-white/45 text-[10px] font-black uppercase tracking-widest mb-1">Your Token</p>
                  <p className="text-7xl font-heading font-black text-[#99F6E4]">#{queue?.token_number || selectedAppointment?.token_number || '-'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 text-center border-gray-100">
                <Activity size={26} className="mx-auto text-[#0D9488] mb-3" />
                <p className="text-[10px] font-black uppercase text-navy/35">Serving Now</p>
                <p className="text-4xl font-black text-navy mt-2">{queue?.current_token ? `#${queue.current_token}` : 'Not started'}</p>
              </Card>
              <Card className="p-6 text-center border-gray-100">
                <Users size={26} className="mx-auto text-orange-500 mb-3" />
                <p className="text-[10px] font-black uppercase text-navy/35">Tokens Ahead</p>
                <p className="text-4xl font-black text-navy mt-2">{queue?.tokens_ahead ?? '-'}</p>
              </Card>
              <Card className="p-6 text-center border-gray-100 bg-teal-50">
                <Clock size={26} className="mx-auto text-[#0D9488] mb-3" />
                <p className="text-[10px] font-black uppercase text-teal-700/55">Estimated Wait</p>
                <p className="text-4xl font-black text-[#0D9488] mt-2">{isTurn ? 'Now' : `${queue?.estimated_wait_minutes ?? 0}m`}</p>
              </Card>
            </div>

            <Card className="p-8 border-gray-100">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-xl font-black text-navy">Queue Progress</h3>
                  <p className="text-sm font-bold text-navy/40">Updates every 30 seconds while this page is open.</p>
                </div>
                <span className="text-xs font-black text-[#0D9488]">{Math.round(progress)}%</span>
              </div>
              <div className="h-5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-[#0D9488] transition-all" style={{ width: `${progress}%` }} />
              </div>

              {isTurn && (
                <div className="mt-6 flex items-start gap-3 bg-teal-50 border border-teal-100 p-5 rounded-2xl text-[#0D9488]">
                  <BellRing size={22} className="shrink-0 animate-bounce" />
                  <p className="text-sm font-black">It is your turn. Please join or proceed to the consultation room.</p>
                </div>
              )}

              {selectedAppointment?.consultation_type === 'online' && (
                <Button className="mt-6 bg-navy text-white border-none rounded-2xl px-6">
                  <Video size={16} /> Join Online Session
                </Button>
              )}
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TokenTracker;
