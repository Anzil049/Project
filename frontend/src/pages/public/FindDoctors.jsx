import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { Card, Badge, Button } from '../../components/common';
import { 
  Search, Star, Video, MapPin, 
  ChevronRight, Filter, Stethoscope, BadgeCheck,
  Building2, Globe, Clock
} from 'lucide-react';
import { DOCTORS, HOSPITALS, SPECIALIZATIONS } from '../../data/mockData';
import { ROUTES } from '../../constants/routes';

const FindDoctors = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [activeSpec, setActiveSpec] = useState(location.state?.specialization || 'All');
  const [hospitalId, setHospitalId] = useState('All');
  const [mode, setMode] = useState(location.state?.mode || 'All'); // 'All' | 'Online' | 'Offline'

  // Effect to handle incoming state updates if navigating to the same component
  useEffect(() => {
    if (location.state?.specialization) {
      setActiveSpec(location.state.specialization);
    }
    if (location.state?.mode) {
      setMode(location.state.mode);
    }
  }, [location.state]);

  const filtered = DOCTORS.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          d.specialization.toLowerCase().includes(search.toLowerCase());
    const matchesSpec = activeSpec === 'All' || d.specialization === activeSpec;
    const matchesHospital = hospitalId === 'All' || 
                            (hospitalId === 'null' ? d.hospitalId === null : d.hospitalId === hospitalId);
    const matchesMode = mode === 'All' || 
                        (mode === 'Online' && d.isOnline) || 
                        (mode === 'Offline' && d.isOffline);
    return matchesSearch && matchesSpec && matchesHospital && matchesMode;
  });

  const handleBook = (doctor) => {
    // Pass doctor ID and current filtering context (e.g., if user was looking for Online)
    navigate(ROUTES.PATIENT.BOOKING_HUB, { 
      state: { 
        doctorId: doctor.id,
        initialMode: mode === 'All' ? (doctor.isOffline ? 'clinical' : 'online') : (mode === 'Online' ? 'online' : 'clinical')
      } 
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body">
      <PublicNavbar />
      
      <main className="pt-24 pb-20">
        {/* HERO SECTION */}
        <section className="bg-navy py-16 lg:py-20 relative overflow-hidden">
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #0D9488 0%, transparent 60%)' }} />
           <div className="container max-w-7xl mx-auto px-6 relative z-10">
              <div className="max-w-3xl mx-auto text-center space-y-6">
                 <h1 className="text-4xl lg:text-5xl font-heading font-black text-white leading-tight uppercase tracking-tight">
                    Search <span className="text-primary text-glow">Verified</span> Specialists
                 </h1>
                 <p className="text-white/40 font-bold uppercase tracking-widest text-xs max-w-xl mx-auto leading-relaxed">
                    Connect with top-tier medical experts across our nationwide partner network of hospitals.
                 </p>
                 
                 <div className="pt-4 relative group max-w-2xl mx-auto">
                    <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-navy/40 group-focus-within:text-primary transition-colors" />
                    <input 
                       type="text"
                       placeholder="Search by specialty, doctor name, or condition..."
                       value={search}
                       onChange={(e) => setSearch(e.target.value)}
                       className="w-full bg-white rounded-[24px] py-6 pl-16 pr-8 text-sm font-bold text-navy outline-none shadow-2xl shadow-navy/20 focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                 </div>
              </div>
           </div>
        </section>

        {/* FILTERS & RESULTS */}
        <section className="container max-w-7xl mx-auto px-6 py-12 relative z-20">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* SIDEBAR FILTERS */}
              <aside className="lg:col-span-3 space-y-6">
                 <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100/50 sticky top-32">
                    <div className="flex items-center gap-2 mb-8">
                       <Filter size={18} className="text-primary" />
                       <h3 className="text-xs font-black uppercase tracking-widest text-navy">Filters</h3>
                    </div>

                    {/* Hospital Selection */}
                    <div className="space-y-4 mb-10">
                       <p className="text-[10px] font-black uppercase tracking-widest text-navy/30">Hospital Network</p>
                       <select 
                          value={hospitalId} 
                          onChange={(e) => setHospitalId(e.target.value)}
                          className="w-full bg-gray-50 border-none rounded-xl py-3.5 px-4 text-xs font-bold text-navy outline-none focus:ring-2 focus:ring-primary/10"
                       >
                          <option value="All">All Partner Hospitals</option>
                          <option value="null">Private Clinics / Independent</option>
                          {HOSPITALS.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                       </select>
                    </div>

                    {/* Mode Selection */}
                    <div className="space-y-4 mb-10">
                       <p className="text-[10px] font-black uppercase tracking-widest text-navy/30">Consultation Mode</p>
                       <div className="flex flex-col gap-2">
                          {['All', 'Online', 'Offline'].map(m => (
                             <button 
                                key={m} 
                                onClick={() => setMode(m)}
                                className={`text-left px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                   mode === m ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-50 text-navy/40 hover:bg-gray-100'
                                }`}
                             >
                                {m} Mode
                             </button>
                          ))}
                       </div>
                    </div>

                    {/* Quick Specs */}
                    <div className="space-y-4">
                       <p className="text-[10px] font-black uppercase tracking-widest text-navy/30">Specialization</p>
                       <div className="flex flex-wrap gap-2">
                          {SPECIALIZATIONS.slice(0, 8).map(spec => (
                             <button 
                                key={spec} 
                                onClick={() => setActiveSpec(spec)}
                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                                   activeSpec === spec ? 'bg-[#0C1A2E] text-white border-[#0C1A2E]' : 'bg-white text-navy/40 border-gray-100 hover:border-primary/30'
                                }`}
                             >
                                {spec}
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>
              </aside>

              {/* MAIN CONTENT - DOCTOR GRID */}
              <div className="lg:col-span-9">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filtered.map((doctor) => (
                       <Card key={doctor.id} className="p-8 border-none bg-white rounded-3xl shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden group">
                          <div className="flex items-start justify-between gap-4 mb-8">
                             <div className="flex items-center gap-5">
                                <div className={`w-20 h-20 rounded-[28px] bg-gradient-to-br ${doctor.gradient} flex items-center justify-center text-white text-2xl font-black shadow-xl group-hover:scale-105 transition-transform`}>
                                   {doctor.initials}
                                </div>
                                <div>
                                   <div className="flex items-center gap-1.5 mb-1 text-navy">
                                      <h3 className="text-xl font-heading font-black tracking-tight leading-none uppercase">{doctor.name}</h3>
                                      <BadgeCheck size={20} className="text-primary" />
                                   </div>
                                   <p className="text-xs font-bold text-primary uppercase tracking-widest leading-none">{doctor.specialization}</p>
                                </div>
                             </div>
                             <div className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[11px] font-black">
                                <Star size={14} fill="currentColor" /> {doctor.rating}
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-8">
                             <div className="bg-[#F8FAFC] p-4 rounded-[24px]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-navy/30 mb-2 flex items-center gap-1.5"><Building2 size={12} /> Hospital</p>
                                <p className="text-[11px] font-black text-navy uppercase truncate">{doctor.hospitalName}</p>
                             </div>
                             <div className="bg-[#F8FAFC] p-4 rounded-[24px]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-navy/30 mb-2 flex items-center gap-1.5"><Globe size={12} /> Mode</p>
                                <div className="flex flex-wrap gap-1">
                                   {doctor.isOnline && <span className="text-[9px] font-black uppercase text-green-600">Online</span>}
                                   {doctor.isOffline && <span className="text-[9px] font-black uppercase text-blue-600">{doctor.isOnline ? '· Offline' : 'Offline'}</span>}
                                </div>
                             </div>
                          </div>

                          <div className="flex items-end justify-between border-t border-gray-50 pt-8 mt-auto">
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-navy/30 mb-1">Consultation Fee</p>
                                <p className="text-2xl font-black text-navy tracking-tight">₹{doctor.fee}<span className="text-xs text-navy/40 font-bold tracking-normal ml-1">/visit</span></p>
                             </div>
                             <Button 
                                onClick={() => handleBook(doctor)}
                                className="bg-[#0C1A2E] text-white hover:bg-primary rounded-[20px] font-black text-[11px] uppercase tracking-widest px-8 py-4 border-none shadow-xl shadow-navy/20 transition-all flex items-center gap-2"
                             >
                                <Clock size={16} /> Book Now
                             </Button>
                          </div>
                       </Card>
                    ))}

                    {filtered.length === 0 && (
                       <div className="col-span-full py-24 text-center">
                          <Stethoscope size={64} className="mx-auto text-gray-200 mb-6" />
                          <h3 className="text-2xl font-black text-navy mb-2">No specialists matched</h3>
                          <p className="text-sm font-bold text-navy/40">Try loosening your search or filter criteria.</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FindDoctors;
