import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Phone, Siren, Activity, 
  Hospital, Clock, Navigation, AlertCircle,
  Siren as SirenIcon, ShieldCheck, ChevronRight
} from 'lucide-react';
import { Button, Card, Badge } from '../../components/common';
import Footer from '../../components/layout/Footer';

const Emergency = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState({ lat: null, lng: null, loading: true, error: null });
  
  const emergencyHospitals = [
    { 
      id: 1, 
      name: 'City General Hospital', 
      distance: '1.2 km', 
      status: 'ER Available', 
      phone: '+91 98XXX XXX01',
      coords: { x: 45, y: 30 } 
    },
    { 
      id: 2, 
      name: 'Lifeline Trauma Center', 
      distance: '2.8 km', 
      status: 'High Priority', 
      phone: '+91 98XXX XXX02',
      coords: { x: 65, y: 55 } 
    },
    { 
      id: 3, 
      name: 'St. Mary\'s Specialty', 
      distance: '4.5 km', 
      status: 'ER Available', 
      phone: '+91 98XXX XXX03',
      coords: { x: 25, y: 70 } 
    }
  ];

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, loading: false, error: null }),
      (err) => setLocation(prev => ({ ...prev, loading: false, error: 'Permission denied' }))
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0C1A2E] font-body selection:bg-red-500/10">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
             <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <SirenIcon className="text-white" size={24} />
             </div>
             <span className="text-xl font-heading font-black tracking-tighter uppercase text-navy">Emergency<span className="text-red-500">Hub</span></span>
          </div>
          <Button variant="outline" className="border-gray-200 !text-navy hover:bg-gray-50 rounded-xl px-6 text-sm font-black uppercase tracking-widest leading-none">
             911 / 102
          </Button>
        </div>
      </header>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left: Map Visualization */}
            <div className="lg:col-span-8 space-y-6">
              <div className="relative aspect-[16/10] md:aspect-[16/8] bg-slate-100 rounded-[40px] overflow-hidden border border-gray-200 shadow-xl">
                {/* Simulated Grid */}
                <div className="absolute inset-0 opacity-20" 
                  style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
                />
                
                {/* User Location Pulse */}
                {!location.loading && !location.error && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="relative">
                      <div className="w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-40" />
                      <div className="absolute inset-0 w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                         <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Hospital Markers */}
                {emergencyHospitals.map(hosp => (
                  <div 
                    key={hosp.id}
                    className="absolute cursor-pointer group z-30"
                    style={{ left: `${hosp.coords.x}%`, top: `${hosp.coords.y}%` }}
                  >
                    <div className="relative">
                      <div className="w-6 h-6 bg-red-500 rounded-full animate-pulse opacity-20 group-hover:opacity-40" />
                      <div className="absolute inset-0 w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center group-hover:scale-125 transition-transform">
                         <Hospital className="text-white" size={12} />
                      </div>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-navy text-white rounded-lg text-[10px] font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl pointer-events-none uppercase tracking-widest">
                         {hosp.name} • {hosp.distance}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Status Overlays */}
                 <div className="absolute top-6 left-6 flex flex-col gap-3">
                   <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${location.loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-navy/60">
                        {location.loading ? 'Locating...' : location.error ? 'Location blocked' : 'Location active'}
                      </span>
                   </div>
                </div>

                 <div className="absolute bottom-6 right-6 flex items-center gap-3">
                   <div className="bg-white/90 backdrop-blur px-5 py-3 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                      <p className="text-[8px] font-black text-navy/30 uppercase tracking-widest">Nearby Emergency Centers</p>
                      <p className="text-sm font-black text-navy">3 Found in your area</p>
                   </div>
                </div>
              </div>

              {/* Action Banner */}
              <div className="bg-gradient-to-r from-red-600 to-red-900 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-red-900/20 text-left">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                       <Siren size={32} className="text-white" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black tracking-tight text-white mb-1 uppercase">High-Alert Response</h3>
                       <p className="text-white/80 text-sm font-bold uppercase tracking-widest leading-none">All hospitals listed have active Emergency response teams.</p>
                    </div>
                 </div>
                 <Button className="!bg-white !text-red-600 hover:!bg-white/90 rounded-2xl px-10 h-14 font-black text-xs uppercase tracking-[0.2em] border-none">
                    <Phone size={18} className="mr-2" /> Request Ambulance
                 </Button>
              </div>
            </div>

            {/* Right: Hospital List */}
             <div className="lg:col-span-4 space-y-6">
                <div className="space-y-1 text-left">
                   <h2 className="text-2xl font-black tracking-tight uppercase text-navy">Nearest <span className="text-red-500">Centers</span></h2>
                   <p className="text-navy/20 text-[10px] font-black uppercase tracking-widest">Ranked by estimated response time</p>
                </div>

                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                   {emergencyHospitals.map(hosp => (
                      <Card key={hosp.id} className="bg-white border-gray-100 p-5 rounded-[32px] hover:border-red-500/30 hover:shadow-xl transition-all group cursor-pointer shadow-sm text-left">
                        <div className="flex items-start gap-4">
                           <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-red-500 group-hover:text-white transition-all">
                              <Hospital size={24} />
                           </div>
                           <div className="flex-1 space-y-3">
                               <div className="flex items-center justify-between">
                                 <h4 className="font-black text-navy group-hover:text-red-500 transition-colors uppercase tracking-tight">{hosp.name}</h4>
                                 <Badge className="bg-red-500 text-white text-[8px] px-3 font-black uppercase tracking-tighter">
                                    {hosp.distance}
                                 </Badge>
                              </div>
                              
                              <div className="flex items-center gap-2 py-2">
                                 <Badge className="bg-gray-50 text-navy/40 border-none text-[8px] px-3 font-black uppercase tracking-tighter">
                                    Trauma Center
                                 </Badge>
                                 <Badge className="bg-gray-50 text-navy/40 border-none text-[8px] px-3 font-black uppercase tracking-tighter">
                                    24/7 Support
                                 </Badge>
                              </div>

                               <div className="flex items-center gap-3 pt-2">
                                 <a href={`tel:${hosp.phone}`} className="flex-1 bg-gray-50 hover:bg-gray-100 text-navy text-[10px] font-black uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                                    <Phone size={14} /> Call Now
                                 </a>
                                 <button className="flex-1 bg-navy text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 transition-all shadow-lg shadow-navy/10">
                                    <Navigation size={14} /> Navigate
                                 </button>
                              </div>
                           </div>
                        </div>
                     </Card>
                  ))}
               </div>

                <div className="p-6 bg-white border border-gray-100 rounded-[32px] space-y-4 shadow-sm text-left">
                   <div className="flex items-center gap-3">
                      <AlertCircle size={20} className="text-yellow-500" />
                      <p className="text-[10px] font-black text-navy/40 uppercase tracking-widest">Emergency Guidelines</p>
                   </div>
                   <ul className="space-y-2">
                      {['Keep calm and provide clear location data', 'Keep essential ID & medical records ready', 'Inform hospital about arrival via Call Now'].map((tip, i) => (
                         <li key={i} className="text-[10px] text-navy/40 font-medium flex gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1 shrink-0" />
                            {tip}
                         </li>
                      ))}
                   </ul>
                </div>
            </div>
          </div>
        </div>
      </main>

      {/* Simplified Footer Integration */}
       <footer className="py-10 border-t border-gray-100 bg-gray-50 mt-10 text-center">
          <div className="container mx-auto px-6">
             <p className="text-navy/20 text-[10px] font-black uppercase tracking-[0.4em]">MedCare Emergency Network • Priority Healthcare Solutions</p>
          </div>
       </footer>
    </div>
  );
};

export default Emergency;
