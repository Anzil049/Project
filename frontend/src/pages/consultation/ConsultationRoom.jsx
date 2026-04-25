import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useConsultationStore from '../../store/consultationStore';
import useAuthStore from '../../store/authStore';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Send, FileText, ChevronUp, ChevronDown,
  MessageSquare, Stethoscope, X, CheckCircle2, AlertCircle, Plus, Trash2
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const ConsultationRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getSession, sendMessage, endSession, issuePrescription } = useConsultationStore();

  const session = getSession(sessionId);
  const isDoctor = user?.role === 'doctor' || !user; // fallback for demo

  // --- Camera State ---
  const localVideoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [camError, setCamError] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // --- Chat State ---
  const [chatInput, setChatInput] = useState('');

  // --- Prescription State ---
  const [rxOpen, setRxOpen] = useState(false);
  const [rx, setRx] = useState({ 
    diagnosis: '', 
    medicines: [{ name: '', dosage: '', duration: '', instruction: '' }], 
    notes: '' 
  });
  const [rxSent, setRxSent] = useState(false);



  // --- Start webcam ---
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setCamError('Camera/Microphone permission denied. Please allow access and reload.');
      }
    };
    startCamera();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const toggleMic = () => {
    stream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicOn(p => !p);
  };

  const toggleCam = () => {
    stream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOn(p => !p);
  };

  const handleEndCall = () => {
    stream?.getTracks().forEach(t => t.stop());
    endSession(sessionId);
    navigate(isDoctor ? ROUTES.DOCTOR.CONSULTATION_SESSIONS : ROUTES.PATIENT.SESSIONS);
  };

  const handleSend = () => {
    if (!chatInput.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    sendMessage(sessionId, {
      role: isDoctor ? 'doctor' : 'patient',
      text: chatInput.trim(),
      time: now,
    });
    setChatInput('');
  };

  const handleIssuePrescription = () => {
    // Basic validation: must have diagnosis or at least one medicine with a name
    if (!rx.diagnosis.trim() && !rx.medicines.some(m => m.name.trim())) return;
    issuePrescription(sessionId, rx);
    setRxSent(true);
    setTimeout(() => setRxSent(false), 3000);
  };

  const addMedicine = () => {
    setRx(p => ({
      ...p,
      medicines: [...p.medicines, { name: '', dosage: '', duration: '', instruction: '' }]
    }));
  };

  const removeMedicine = (index) => {
    if (rx.medicines.length <= 1) return;
    setRx(p => ({
      ...p,
      medicines: p.medicines.filter((_, i) => i !== index)
    }));
  };

  const updateMedicine = (index, field, value) => {
    setRx(p => ({
      ...p,
      medicines: p.medicines.map((m, i) => i === index ? { ...m, [field]: value } : m)
    }));
  };



  const messages = useConsultationStore(s => s.sessions.find(x => x.id === sessionId)?.messages || []);
  const chatBottomRef = useRef(null);
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (!session) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 font-body">
        <div className="w-20 h-20 bg-navy/5 rounded-full flex items-center justify-center text-navy/20 mb-6">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-xl font-black text-navy mb-2">Session Not Found</h2>
        <p className="text-navy/40 font-medium text-sm mb-8 text-center max-w-xs">
          The consultation session you're looking for doesn't exist or has already been concluded.
        </p>
        <button 
          onClick={() => navigate(-1)}
          className="bg-navy text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-[20px] hover:bg-[#0D9488] transition-all shadow-xl shadow-navy/20"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden font-body">
      
      {/* Top Bar */}
      <div className="h-14 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse"></div>
          <span className="text-navy font-black text-sm">
            {isDoctor ? session.patientName : session.doctorName}
          </span>
          <span className="text-navy/30 text-[10px] font-bold uppercase tracking-widest">
            · {session.specialization}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#0D9488] bg-[#0D9488]/5 px-3 py-1.5 rounded-full border border-[#0D9488]/10">
            {session.type === 'video' ? '🎥 Video' : '💬 Chat'} Session
          </span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT: Video Area */}
        <div className="flex-1 flex flex-col relative bg-slate-50">
          
          {camError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <AlertCircle size={48} className="text-red-500 mb-4" />
              <p className="text-navy/60 font-bold text-sm">{camError}</p>
            </div>
          ) : (
            <>
              {/* Remote Video Placeholder (other person) */}
              <div className="flex-1 flex items-center justify-center relative">
                <div className="w-full h-full bg-slate-100/50 flex flex-col items-center justify-center">
                  <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${isDoctor ? 'from-[#0D9488]/20 to-[#0D9488]/5' : 'from-slate-200 to-slate-100'} flex items-center justify-center text-navy text-2xl font-black mb-4 shadow-xl border-4 border-white`}>
                    {isDoctor ? session.patientInitials : session.doctorInitials}
                  </div>
                  <p className="text-navy font-bold text-sm">
                    {isDoctor ? session.patientName : session.doctorName}
                  </p>
                  <p className="text-navy/20 text-[10px] font-bold uppercase tracking-widest mt-1">Connecting Presence…</p>
                </div>
              </div>

              {/* Local Video (small pip) */}
              <div className="absolute bottom-24 right-6 w-36 h-28 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-white">
                {camOn ? (
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                    <VideoOff size={24} className="text-navy/10" />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Controls */}
          <div className="h-20 bg-white/80 backdrop-blur-md flex items-center justify-center gap-6 shrink-0 border-t border-gray-100 shadow-lg">
            <button
              onClick={toggleMic}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${micOn ? 'bg-slate-100 hover:bg-slate-200 text-navy' : 'bg-red-500 text-white shadow-red-500/20'}`}
            >
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button
              onClick={handleEndCall}
              className="w-14 h-14 rounded-2xl bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-xl shadow-red-500/40 transform hover:scale-105"
            >
              <PhoneOff size={22} />
            </button>
            <button
              onClick={toggleCam}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${camOn ? 'bg-slate-100 hover:bg-slate-200 text-navy' : 'bg-red-500 text-white shadow-red-500/20'}`}
            >
              {camOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
          </div>
        </div>

        {/* RIGHT: Chat + Prescription Panel */}
        <div className="w-[360px] bg-white border-l border-gray-100 flex flex-col shrink-0 shadow-2xl">
          
          {/* Chat Header */}
          <div className="px-6 py-5 border-b border-gray-100 shrink-0">
            <h3 className="text-navy font-black text-sm tracking-tight">Session Dialogue</h3>
            <p className="text-navy/30 text-[10px] font-bold uppercase tracking-widest mt-0.5">Secure Transmission</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-slate-50/50">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-12 text-center px-4">
                 <div className="w-12 h-12 bg-[#0D9488]/5 rounded-full flex items-center justify-center text-[#0D9488]/20 mb-3">
                   <MessageSquare size={24} />
                 </div>
                 <p className="text-navy/20 text-xs font-bold uppercase tracking-widest">Awaiting Communication</p>
              </div>
            )}
            {messages.map((msg, idx) => {
              const isMine = (isDoctor && msg.role === 'doctor') || (!isDoctor && msg.role === 'patient');
              return (
                <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-5 py-3 rounded-2xl shadow-sm ${isMine ? 'bg-[#0D9488] text-white rounded-br-sm' : 'bg-white text-navy/70 rounded-bl-sm border border-gray-100'}`}>
                    <p className="text-xs font-bold leading-relaxed">{msg.text}</p>
                    <p className={`text-[9px] font-black mt-2 uppercase tracking-tighter opacity-40`}>{msg.time}</p>
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input */}
          <div className="p-6 border-t border-gray-100 bg-white shrink-0">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-slate-100/50 border border-transparent rounded-[20px] px-5 py-3.5 text-navy text-xs font-bold placeholder:text-navy/20 outline-none focus:bg-white focus:border-[#0D9488]/30 transition-all"
              />
              <button
                onClick={handleSend}
                className="w-12 h-12 rounded-[20px] bg-[#0D9488] hover:bg-[#0f766e] flex items-center justify-center text-white shadow-lg shadow-[#0D9488]/20 transition-all shrink-0 hover:scale-105 active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
          </div>

          {/* Doctor-only Prescription Panel */}
          {isDoctor && (
            <div className="border-t border-gray-100 shrink-0 bg-slate-50/80">
              <button
                onClick={() => setRxOpen(p => !p)}
                className="w-full flex items-center justify-between px-6 py-5 text-[#0D9488] hover:bg-[#0D9488]/5 transition-all"
              >
                <span className="flex items-center gap-3 text-xs font-black uppercase tracking-widest">
                  <FileText size={16} /> Digital Prescription
                </span>
                {rxOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
              {rxOpen && (
                <div className="px-6 pb-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-y-auto max-h-[60vh] custom-scrollbar">
                  {/* Diagnosis */}
                  <div>
                    <p className="text-[10px] font-black uppercase text-navy/30 tracking-widest mb-2 px-1">Clinical Diagnosis</p>
                    <textarea
                      placeholder="Enter patient diagnosis..."
                      value={rx.diagnosis}
                      onChange={(e) => setRx(p => ({ ...p, diagnosis: e.target.value }))}
                      rows={2}
                      className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-navy text-xs font-bold placeholder:text-navy/40 outline-none focus:border-[#0D9488]/30 transition-all resize-none shadow-sm"
                    />
                  </div>

                  {/* Medicines List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] font-black uppercase text-navy/30 tracking-widest">Medications</p>
                      <button 
                        onClick={addMedicine}
                        className="text-[9px] font-black uppercase text-[#0D9488] hover:text-[#115E59] flex items-center gap-1 transition-colors"
                      >
                        <Plus size={10} /> Add Drug
                      </button>
                    </div>

                    <div className="space-y-4">
                      {rx.medicines.map((m, idx) => (
                        <div key={idx} className="bg-white border border-gray-100 rounded-[24px] p-4 space-y-3 relative group shadow-sm transition-all hover:border-[#0D9488]/20">
                          {rx.medicines.length > 1 && (
                            <button 
                              onClick={() => removeMedicine(idx)}
                              className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-xl border border-gray-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          <input
                            type="text"
                            placeholder="Medicine name"
                            value={m.name}
                            onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                            className="w-full bg-slate-50 border border-transparent rounded-xl px-3 py-2 text-navy text-xs font-bold placeholder:text-navy/40 outline-none focus:bg-white focus:border-[#0D9488]/20 transition-all"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                               <p className="text-[8px] font-black text-navy/20 uppercase tracking-widest px-1">Dosage</p>
                               <input
                                 type="text"
                                 placeholder="1-0-1"
                                 value={m.dosage}
                                 onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                                 className="w-full bg-slate-50 border border-transparent rounded-xl px-3 py-2 text-navy text-[10px] font-bold placeholder:text-navy/40 outline-none focus:bg-white focus:border-[#0D9488]/20 transition-all"
                               />
                            </div>
                            <div className="space-y-1">
                               <p className="text-[8px] font-black text-navy/20 uppercase tracking-widest px-1">Duration</p>
                               <input
                                 type="text"
                                 placeholder="5 Days"
                                 value={m.duration}
                                 onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                                 className="w-full bg-slate-50 border border-transparent rounded-xl px-3 py-2 text-navy text-[10px] font-bold placeholder:text-navy/40 outline-none focus:bg-white focus:border-[#0D9488]/20 transition-all"
                               />
                            </div>
                          </div>
                          <input
                            type="text"
                            placeholder="Usage instructions..."
                            value={m.instruction}
                            onChange={(e) => updateMedicine(idx, 'instruction', e.target.value)}
                            className="w-full bg-slate-50 border border-transparent rounded-xl px-3 py-2 text-navy text-[10px] font-bold placeholder:text-navy/40 outline-none focus:bg-white focus:border-[#0D9488]/20 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <p className="text-[10px] font-black uppercase text-navy/30 tracking-widest mb-2 px-1">Advisory Notes</p>
                    <textarea
                      placeholder="Clinical advice, lifestyle recommendations..."
                      value={rx.notes}
                      onChange={(e) => setRx(p => ({ ...p, notes: e.target.value }))}
                      rows={2}
                      className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-navy text-xs font-bold placeholder:text-navy/40 outline-none focus:border-[#0D9488]/30 transition-all resize-none shadow-sm"
                    />
                  </div>

                  <button
                    onClick={handleIssuePrescription}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-[20px] bg-[#0D9488] hover:bg-[#0f766e] text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-[#0D9488]/20 transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {rxSent ? <><CheckCircle2 size={16} /> Prescription Issued!</> : <><FileText size={16} /> Transmit Prescription</>}
                  </button>
                </div>
              )}
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default ConsultationRoom;
