import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common';
import useConsultationStore from '../../store/consultationStore';
import { 
  Video, MessageCircle, Play, Bell, BellRing, 
  Clock, CheckCircle2, Stethoscope, ClipboardList, ChevronRight
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const TYPE_ICON = { video: <Video size={14} />, chat: <MessageCircle size={14} /> };

const DoctorConsultation = () => {
  const navigate = useNavigate();
  const { sessions, startSession } = useConsultationStore();

  // Only show sessions relevant to the doctor (all in this demo)
  const pending = sessions.filter(s => s.status === 'waiting');
  const active  = sessions.filter(s => s.status === 'active');
  const done    = sessions.filter(s => s.status === 'completed');

  const handleStart = (sessionId) => {
    startSession(sessionId);
    navigate(ROUTES.DOCTOR.ROOM.replace(':sessionId', sessionId));
  };

  const handleRejoin = (sessionId) => {
    navigate(ROUTES.DOCTOR.ROOM.replace(':sessionId', sessionId));
  };

  return (
    <DashboardLayout title="My Consultations" role="doctor">
      <div className="max-w-4xl mx-auto pb-20 font-body animate-in fade-in duration-700">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Online <span className="text-[#0D9488]">Consultations</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <Stethoscope size={14} className="text-[#0D9488]" /> Manage your virtual consultation sessions
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center bg-white border border-gray-100 rounded-2xl px-5 py-3">
              <span className="text-xl font-black text-navy block">{pending.length}</span>
              <span className="text-[10px] font-bold text-navy/40 uppercase tracking-widest">Pending</span>
            </div>
            <div className="text-center bg-[#0D9488]/10 border border-[#0D9488]/20 rounded-2xl px-5 py-3">
              <span className="text-xl font-black text-[#0D9488] block">{active.length}</span>
              <span className="text-[10px] font-bold text-[#0D9488]/60 uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        {active.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#0D9488] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse"></span> Active Now
            </h2>
            <div className="space-y-3">
              {active.map(s => (
                <Card key={s.id} className="p-5 border-2 border-[#0D9488]/30 bg-[#0D9488]/5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D9488]/20 to-[#0D9488]/5 flex items-center justify-center text-[#0D9488] text-xs font-black">{s.patientInitials}</div>
                    <div>
                      <p className="text-sm font-black text-navy">{s.patientName}</p>
                      <p className="text-[10px] font-bold text-navy/40 flex items-center gap-1.5 mt-0.5">
                        {TYPE_ICON[s.type]} {s.scheduledTime}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleRejoin(s.id)} className="flex items-center gap-2 bg-[#0D9488] text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-[#0f766e] transition-all">
                    Rejoin <ChevronRight size={14} />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Pending Sessions */}
        <div className="mb-8">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-navy/40 mb-4 flex items-center gap-2">
            <Clock size={14} /> Scheduled Sessions
          </h2>
          {pending.length === 0 ? (
            <Card className="p-10 text-center border border-gray-100">
              <CheckCircle2 size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-bold text-navy/40">No pending sessions.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pending.map(s => (
                <Card key={s.id} className="p-5 border border-gray-100 bg-white hover:shadow-lg transition-all flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D9488]/20 to-[#0D9488]/5 flex items-center justify-center text-[#0D9488] text-xs font-black">{s.patientInitials}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-black text-navy">{s.patientName}</p>
                        {s.pinged && (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                            <BellRing size={10} /> Patient notified
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-navy/40 flex items-center gap-1.5">
                        {TYPE_ICON[s.type]} {s.scheduledTime}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStart(s.id)}
                    className="flex items-center gap-2 bg-navy text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-[#0D9488] transition-all shadow-lg shadow-navy/10"
                  >
                    <Play size={12} /> Start Session
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed Sessions */}
        {done.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-navy/40 mb-4 flex items-center gap-2">
              <CheckCircle2 size={14} /> Completed
            </h2>
            <div className="space-y-3">
              {done.map(s => (
                <Card key={s.id} className="p-5 border border-gray-100 bg-gray-50/50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-black">{s.patientInitials}</div>
                    <div>
                      <p className="text-sm font-black text-navy/60">{s.patientName}</p>
                      <p className="text-[10px] font-bold text-navy/30 flex items-center gap-1.5">
                        {TYPE_ICON[s.type]} {s.scheduledTime}
                      </p>
                    </div>
                  </div>
                  {s.prescription && (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#0D9488] bg-[#0D9488]/5 border border-[#0D9488]/10 px-3 py-1.5 rounded-lg">
                      <ClipboardList size={12} /> Rx Issued
                    </span>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default DoctorConsultation;
