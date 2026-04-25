import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Avatar } from '../../components/common';
import { Activity, Clock, MapPin, Users, BellRing, UserCheck, AlertCircle } from 'lucide-react';

const TokenTracker = () => {
  // Simulating a WebSocket hook state for a frontend-only application
  const [currentToken, setCurrentToken] = useState(3);
  const yourToken = 8;
  const totalTokens = 25;

  useEffect(() => {
    // Mocking WebSocket message payload
    const simInterval = setInterval(() => {
      setCurrentToken(prev => {
        if (prev < yourToken) return prev + 1;
        clearInterval(simInterval);
        return prev;
      });
    }, 8000); // Accelerating the interval to 8 seconds for visual demo purposes

    return () => clearInterval(simInterval);
  }, [yourToken]);

  const remaining = yourToken - currentToken;
  const isTurn = remaining <= 0;
  const progressPercent = Math.min((currentToken / yourToken) * 100, 100);
  const estimatedWait = remaining > 0 ? remaining * 15 : 0;

  return (
    <DashboardLayout title="Live Token Tracker" role="patient">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Tracker Header */}
        <div className="bg-gradient-to-r from-[#0C1A2E] to-[#1a2b45] rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0D9488]/20 rounded-full blur-[80px] -mr-20 -mt-20" />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
            <div className="flex gap-5 items-center">
              <Avatar size="xl" name="Dr. Arjun Mehta" className="ring-4 ring-white/10" />
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 text-[#99F6E4] text-[10px] font-black uppercase tracking-widest rounded-full mb-2 border border-teal-500/30">
                  <Activity size={12} className="animate-pulse" /> Live Queue
                </div>
                <h1 className="text-3xl lg:text-4xl font-heading font-extrabold mb-1 tracking-tight">Dr. Arjun Mehta</h1>
                <p className="text-white/60 flex items-center gap-2 font-medium">
                  <MapPin size={16} /> Apollo Hospitals, Bangalore
                </p>
                <p className="text-white/60 flex items-center gap-2 font-medium mt-1">
                  <Clock size={16} /> Scheduled: Today, 2:30 PM
                </p>
              </div>
            </div>

            <div className="text-left md:text-right shrink-0">
               <p className="text-white/50 text-[11px] font-black uppercase tracking-[0.2em] mb-2">Your Token</p>
               <div className="text-6xl md:text-7xl font-heading font-black text-[#99F6E4] leading-none shrink-0 border-l-4 border-[#0D9488] pl-6 md:border-l-0 md:border-r-4 md:pr-6 md:pl-0">
                 #{yourToken}
               </div>
            </div>
          </div>
        </div>

        {/* Live Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
               <UserCheck size={24} />
             </div>
             <p className="text-[11px] font-black text-navy/40 uppercase tracking-widest mb-1">Serving Now</p>
             <h3 className="text-4xl font-heading font-black text-navy">#{currentToken}</h3>
          </Card>
          
          <Card className="p-6 bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4">
               <Users size={24} />
             </div>
             <p className="text-[11px] font-black text-navy/40 uppercase tracking-widest mb-1">Tokens Ahead</p>
             <h3 className="text-4xl font-heading font-black text-navy">{Math.max(0, remaining - 1)}</h3>
          </Card>

          <Card className="p-6 bg-teal-50 border border-teal-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
             {isTurn && <div className="absolute inset-0 bg-[#0D9488] animate-pulse opacity-10" />}
             <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 relative z-10 transition-colors ${isTurn ? 'bg-[#0D9488] text-white' : 'bg-teal-100 text-[#0D9488]'}`}>
               {isTurn ? <BellRing size={24} className="animate-wiggle" /> : <Clock size={24} />}
             </div>
             <p className={`text-[11px] font-black uppercase tracking-widest mb-1 relative z-10 ${isTurn ? 'text-[#0D9488]' : 'text-teal-700/50'}`}>Est. Wait Time</p>
             <h3 className={`text-4xl font-heading font-black relative z-10 ${isTurn ? 'text-[#0D9488]' : 'text-teal-900'}`}>
               {isTurn ? "It's Time!" : `${estimatedWait}m`}
             </h3>
          </Card>
        </div>

        {/* Live Progress Bar */}
        <Card className="p-8 border-gray-100 shadow-sm">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-heading font-extrabold text-navy text-xl">Queue Progress</h3>
              <p className="text-navy/50 text-sm mt-1">Real-time tracker powered by MedCare WebSocket</p>
            </div>
            <span className="text-sm font-bold text-[#0D9488]">{Math.round(progressPercent)}% completed</span>
          </div>

          <div className="h-6 w-full bg-gray-100 rounded-full overflow-hidden relative">
             <div 
               className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#0D9488] to-[#2DD4BF] transition-all duration-1000 ease-out flex items-center justify-end pr-2"
               style={{ width: `${progressPercent}%` }}
             >
                {progressPercent > 5 && (
                  <span className="text-[10px] font-black text-white relative flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping block" />
                    Live
                  </span>
                )}
             </div>
          </div>

          {/* Alert if almost turn */}
          {remaining === 1 && !isTurn && (
             <div className="mt-6 flex items-start gap-3 bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800 animate-in fade-in slide-in-from-top-2">
               <AlertCircle size={20} className="shrink-0 mt-0.5 text-blue-500" />
               <p className="text-sm font-semibold leading-relaxed">
                 You are next in line! Please ensure you are present near the consultation room. 
                 <span className="block mt-1 text-xs opacity-70">Keep this screen open to receive your consultation call notification.</span>
               </p>
             </div>
          )}

          {isTurn && (
             <div className="mt-6 flex items-start gap-3 bg-teal-50 border border-teal-200 p-4 rounded-xl text-teal-900 animate-in fade-in zoom-in-95">
               <BellRing size={20} className="shrink-0 mt-0.5 text-[#0D9488] animate-bounce" />
               <div>
                 <p className="text-sm font-bold leading-relaxed text-[#0D9488]">
                   It is your turn right now. Please proceed to Dr. Arjun Mehta's cabin immediately.
                 </p>
                 <Button variant="primary" className="mt-3 bg-[#0D9488] hover:bg-[#115E59] border-none shadow-lg text-xs px-6 py-2 rounded-lg font-bold">
                    Mark as Checked In
                 </Button>
               </div>
             </div>
          )}
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default TokenTracker;
