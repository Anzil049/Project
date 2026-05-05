import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope, HeartPulse, Brain, Shield, Clock, Users, Star,
  Search, CalendarCheck, Video, ChevronRight, ChevronLeft, Play,
  MapPin, Quote, Hospital, Droplets, Siren, Phone, MessageCircle,
  FileText, ArrowRight, CheckCircle, Activity, Building2, UserCheck
} from 'lucide-react';
import { Button } from '../../components/common';
import Footer from '../../components/layout/Footer';
import useScrollReveal from '../../hooks/useScrollReveal';
import hero3d from '../../assets/hero_3d.png';
import telemedicineImg from '../../assets/telemedicine.png';
import { ROUTES } from '../../constants/routes';
import authService from '../../services/authService';

const Landing = () => {
  const navigate = useNavigate();
  const pageRef = useScrollReveal();
  const [currentDoctor, setCurrentDoctor] = useState(0);
  const [currentReview, setCurrentReview] = useState(0);
  const [currentHospital, setCurrentHospital] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await authService.getFeaturedData();
        // Add some default styling colors for doctors if not present
        const coloredDoctors = data.doctors.map((doc, i) => ({
          ...doc,
          color: ['from-[#0D9488] to-[#115E59]', 'from-[#FF7043] to-[#E64A19]', 'from-[#8B5CF6] to-[#6D28D9]', 'from-[#FBBF24] to-[#D97706]', 'from-[#EC4899] to-[#BE185D]'][i % 5],
          initials: doc.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
          rating: (4.5 + Math.random() * 0.5).toFixed(1),
          exp: doc.experience || '10 yrs'
        }));
        
        const styledHospitals = data.hospitals.map(hosp => ({
          ...hosp,
          rating: (4.5 + Math.random() * 0.5).toFixed(1),
          loc: 'Near You',
          type: hosp.facilityType,
          image: hosp.image || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        }));

        setDoctors(coloredDoctors);
        setHospitals(styledHospitals);
      } catch (error) {
        console.error('Failed to fetch featured data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const reviews = [
    { text: "MedCare made it incredibly easy to find a specialist. I booked an appointment within minutes and the doctor was fantastic!", name: 'Radhika Thomas', loc: 'Bangalore', initials: 'RT' },
    { text: "The telemedicine feature saved me a 3-hour trip to the hospital. Got my prescription digitally and picked up medicine nearby.", name: 'Amit Patel', loc: 'Mumbai', initials: 'AP' },
    { text: "During an emergency, I found the nearest hospital with available beds in under 2 minutes. This app is a lifesaver.", name: 'Sneha Reddy', loc: 'Hyderabad', initials: 'SR' },
  ];

  return (
    <div ref={pageRef} className="min-h-screen bg-white font-body overflow-x-hidden">

      {/* ═══════════════════════════════════════════
          1. HERO
      ═══════════════════════════════════════════ */}
      <section className="relative pt-28 pb-20 overflow-hidden bg-gradient-to-br from-[#F0FDFA] via-white to-[#F0F9FF]">
        <div className="absolute top-20 right-[10%] w-72 h-72 bg-[#99F6E4]/20 rounded-full blur-[80px] animate-blob" />
        <div className="absolute bottom-0 left-[5%] w-56 h-56 bg-[#0D9488]/5 rounded-full blur-[60px] animate-blob-delay" />

        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            <div className="w-full lg:w-1/2 space-y-8 relative z-10 reveal-left">
              <div className="inline-flex items-center gap-2 bg-[#0D9488]/10 text-[#0D9488] px-4 py-2 rounded-full text-sm font-semibold">
                <Activity size={16} /> #1 Healthcare Platform
              </div>
              <h1 className="text-[#0C1A2E] text-5xl lg:text-[4rem] font-hero font-bold leading-[1.1] tracking-tight">
                Healthcare Made <span className="text-[#0D9488]">Simple</span>
              </h1>

              <p className="text-[#0C1A2E]/50 text-lg max-w-md leading-relaxed">
                Find hospitals, book appointments, consult doctors online — all from one platform built for your well-being.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button variant="primary" size="lg" className="bg-[#0D9488] hover:bg-[#115E59] px-8 rounded-xl shadow-xl shadow-[#0D9488]/20 font-medium" onClick={() => navigate(ROUTES.FIND_DOCTORS)}>
                  Find Doctors
                </Button>
                <Button variant="outline" size="lg" className="rounded-xl px-8 font-medium" onClick={() => navigate(ROUTES.PATIENT.BOOKING_HUB)}>
                  Book Appointment
                </Button>
              </div>
            </div>

            <div className="w-full lg:w-1/2 relative flex justify-center reveal-right">
              <img src={hero3d} alt="Healthcare Platform" className="w-full max-w-lg relative z-10 rounded-3xl" />

              {/* Floating cards */}
              <div className="absolute top-4 -left-4 bg-white p-4 rounded-2xl shadow-xl border border-gray-200 flex items-center gap-3 animate-float z-20">
                <div className="w-10 h-10 bg-[#0D9488] rounded-xl flex items-center justify-center"><UserCheck className="text-white" size={18} /></div>
                <div><p className="text-lg font-bold text-[#0C1A2E] leading-none">500+</p><p className="text-xs text-[#0C1A2E]/40 mt-0.5">Doctors</p></div>
              </div>
              <div className="absolute bottom-8 -left-2 bg-white p-4 rounded-2xl shadow-xl border border-gray-200 flex items-center gap-3 animate-float-delay z-20">
                <div className="w-10 h-10 bg-[#FF7043] rounded-xl flex items-center justify-center"><Building2 className="text-white" size={18} /></div>
                <div><p className="text-lg font-bold text-[#0C1A2E] leading-none">200+</p><p className="text-xs text-[#0C1A2E]/40 mt-0.5">Hospitals</p></div>
              </div>
              <div className="absolute top-1/2 -right-4 bg-white p-4 rounded-2xl shadow-xl border border-gray-200 flex items-center gap-3 animate-float-slow z-20">
                <div className="w-10 h-10 bg-[#8B5CF6] rounded-xl flex items-center justify-center"><Users className="text-white" size={18} /></div>
                <div><p className="text-lg font-bold text-[#0C1A2E] leading-none">50K+</p><p className="text-xs text-[#0C1A2E]/40 mt-0.5">Patients</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          2. TRUST BAR
      ═══════════════════════════════════════════ */}
      <section className="py-14 bg-white border-y border-gray-50 overflow-hidden">
        <div className="container mx-auto px-6 reveal mb-8">
          <p className="text-center text-xs font-bold text-[#0C1A2E]/30 uppercase tracking-[0.3em]">Our Trusted Partners</p>
        </div>
        
        <div className="relative flex overflow-hidden w-full group">
          {/* First track */}
          <div className="animate-marquee whitespace-nowrap flex items-center shrink-0 gap-24 px-12 opacity-20 grayscale hover:grayscale-0 hover:opacity-50 transition-all duration-500">
            {['Apollo', 'Fortis', 'Max Health', 'AIIMS', 'Medanta', 'Narayana', 'Care Hospitals', 'Manipal Hospitals'].map(name => (
              <span key={name} className="text-2xl font-heading font-extrabold tracking-tight">{name}</span>
            ))}
          </div>
          {/* Second track (duplicate for seamless loop) */}
          <div className="animate-marquee whitespace-nowrap flex items-center shrink-0 gap-24 px-12 opacity-20 grayscale hover:grayscale-0 hover:opacity-50 transition-all duration-500" aria-hidden="true">
            {['Apollo', 'Fortis', 'Max Health', 'AIIMS', 'Medanta', 'Narayana', 'Care Hospitals', 'Manipal Hospitals'].map(name => (
              <span key={`dup-${name}`} className="text-2xl font-heading font-extrabold tracking-tight">{name}</span>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          3. QUICK SERVICES
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-3 reveal">
            <p className="text-[#0D9488] font-semibold text-sm uppercase tracking-[0.25em]">What We Offer</p>
            <h2 className="text-4xl lg:text-5xl font-heading font-extrabold text-[#0C1A2E] tracking-tight">Quick Services</h2>
          </div>

          <div className="grid grid-flow-col auto-cols-[85%] sm:auto-cols-[45%] lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-3 gap-6 overflow-x-auto snap-x snap-mandatory py-8 px-4 -mx-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] stagger-children">
            {[
              { icon: <CalendarCheck size={28} />, title: 'Book Appointment', desc: 'Schedule visits with top specialists in just a few clicks.', color: 'bg-[#0D9488]', path: ROUTES.PATIENT.BOOKING_HUB },
              { icon: <Hospital size={28} />, title: 'Find Hospital', desc: 'Discover hospitals near you with real-time bed availability.', color: 'bg-[#FF7043]', path: ROUTES.FIND_HOSPITALS },
              { icon: <Search size={28} />, title: 'Find Doctor', desc: 'Search verified doctors by specialty, location, and rating.', color: 'bg-[#8B5CF6]', path: ROUTES.FIND_DOCTORS },
              { icon: <Video size={28} />, title: 'Online Consultation', desc: 'Video call with certified doctors from the comfort of home.', color: 'bg-[#0D9488]', path: ROUTES.PATIENT.BOOKING_HUB, state: { initialMode: 'online' } },
              { icon: <Droplets size={28} />, title: 'Blood Donation', desc: 'Find blood banks and donors for urgent requirements.', color: 'bg-red-500', path: ROUTES.BLOOD_BANK },
              { icon: <Siren size={28} />, title: 'Emergency Search', desc: 'Locate the nearest emergency services and hospitals instantly.', color: 'bg-[#FBBF24]', path: ROUTES.EMERGENCY },
            ].map((s, i) => (
              <div key={i} onClick={() => navigate(s.path, { state: s.state })} className="snap-center bg-white p-8 rounded-2xl border border-gray-200 group hover:shadow-xl hover:-translate-y-3 !transition-all !duration-1000 hover:!delay-[150ms] ease-out cursor-pointer">
                <div className={`w-14 h-14 ${s.color} rounded-2xl flex items-center justify-center text-white mb-5 group-hover:scale-110 group-hover:rotate-3 !transition-transform !duration-1000 group-hover:!delay-[150ms] ease-out`}>
                  {s.icon}
                </div>
                <h3 className="text-lg font-heading font-bold text-[#0C1A2E] mb-2">{s.title}</h3>
                <p className="text-[#0C1A2E]/40 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          4. HOW IT WORKS
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-[#F0FDFA]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-3 reveal">
            <p className="text-[#0D9488] font-semibold text-sm uppercase tracking-[0.25em]">Simple Process</p>
            <h2 className="text-4xl lg:text-5xl font-heading font-extrabold text-[#0C1A2E] tracking-tight">How It Works</h2>
          </div>

          <div className="grid grid-flow-col auto-cols-[85%] sm:auto-cols-[45%] md:auto-cols-auto md:grid-flow-row md:grid-cols-3 gap-8 overflow-x-auto snap-x snap-mandatory py-8 px-4 -mx-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] stagger-children">
            {[
              { num: '01', icon: <Search size={32} />, title: 'Search Doctor', desc: 'Browse from 500+ verified specialists filtered by specialty and location.', color: 'bg-[#0D9488]' },
              { num: '02', icon: <CalendarCheck size={32} />, title: 'Book Appointment', desc: 'Pick a time slot from real-time availability calendars.', color: 'bg-[#FF7043]' },
              { num: '03', icon: <Hospital size={32} />, title: 'Visit Hospital', desc: 'Get directions, queue tokens, and seamless check-in at the hospital.', color: 'bg-[#8B5CF6]' },
            ].map((step, i) => (
              <div key={i} className="snap-center bg-white p-10 rounded-3xl text-center space-y-6 group hover:shadow-xl hover:-translate-y-3 !transition-all !duration-1000 hover:!delay-[150ms] ease-out relative overflow-hidden">
                <div className="absolute top-4 right-6 text-7xl font-heading font-black text-[#0C1A2E]/3">{step.num}</div>
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center text-white mx-auto relative z-10 group-hover:scale-110 !transition-transform !duration-1000 group-hover:!delay-[150ms] ease-out`}>
                  {step.icon}
                </div>
                <h3 className="text-xl font-heading font-bold text-[#0C1A2E] relative z-10">{step.title}</h3>
                <p className="text-[#0C1A2E]/40 text-sm leading-relaxed relative z-10">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          5. FEATURED DOCTORS
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex items-end justify-between mb-12 reveal">
            <div className="space-y-3">
              <p className="text-[#0D9488] font-semibold text-sm uppercase tracking-[0.25em]">Our Specialists</p>
              <h2 className="text-4xl lg:text-5xl font-heading font-extrabold text-[#0C1A2E] tracking-tight">Featured Doctors</h2>
            </div>
            <div className="hidden lg:flex gap-2">
              <button onClick={() => setCurrentDoctor(Math.max(0, currentDoctor - 1))} className="p-3 rounded-xl border border-gray-100 hover:bg-[#0D9488] hover:text-white hover:border-[#0D9488] transition-all text-[#0C1A2E]/40">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setCurrentDoctor(Math.min(doctors.length - 3, currentDoctor + 1))} className="p-3 rounded-xl border border-gray-100 hover:bg-[#0D9488] hover:text-white hover:border-[#0D9488] transition-all text-[#0C1A2E]/40">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-flow-col auto-cols-[85%] sm:auto-cols-[45%] lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-3 gap-6 overflow-x-auto snap-x snap-mandatory py-8 px-4 -mx-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] stagger-children">
            {doctors.length > 0 ? doctors.map((doc, i) => (
              <div key={i} className={`snap-center bg-white p-6 rounded-2xl border border-gray-200 group hover:shadow-2xl hover:-translate-y-3 !transition-all !duration-1000 hover:!delay-[150ms] ease-out ${i >= currentDoctor && i < currentDoctor + 3 ? '' : 'lg:hidden'}`}>
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-16 h-16 bg-gradient-to-br ${doc.color} rounded-2xl flex items-center justify-center text-white text-xl font-bold overflow-hidden shadow-inner`}>
                    {doc.image ? <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" /> : doc.initials}
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-[#0C1A2E]">{doc.name}</h4>
                    <p className="text-[#0C1A2E]/40 text-sm">{doc.specialization}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-1.5">
                    <Star size={14} className="text-[#FBBF24] fill-[#FBBF24]" />
                    <span className="text-sm font-bold text-[#0C1A2E]">{doc.rating}</span>
                  </div>
                  <span className="text-xs text-[#0C1A2E]/30 font-semibold">{doc.exp} experience</span>
                </div>
                <Button 
                  variant="outline" 
                  fullWidth 
                  className="rounded-xl font-medium transition-all duration-300" 
                  onClick={() => navigate(ROUTES.PATIENT.BOOKING_HUB, { state: { doctorId: doc.id } })}
                >
                  Book Appointment
                </Button>
              </div>
            )) : (
              <div className="col-span-full py-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-navy/40 font-bold">Discover our featured specialists soon!</p>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          5B. FEATURED HOSPITALS
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-6">
          <div className="flex items-end justify-between mb-12 reveal">
            <div className="space-y-3">
              <p className="text-[#0D9488] font-semibold text-sm uppercase tracking-[0.25em]">Top Facilities</p>
              <h2 className="text-4xl lg:text-5xl font-heading font-extrabold text-[#0C1A2E] tracking-tight">Featured Hospitals</h2>
            </div>
            <div className="hidden lg:flex gap-2">
              <button onClick={() => setCurrentHospital(Math.max(0, currentHospital - 1))} className="p-3 rounded-xl border border-gray-200 bg-white hover:bg-[#0D9488] hover:text-white hover:border-[#0D9488] transition-all text-[#0C1A2E]/40">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setCurrentHospital(Math.min(hospitals.length - 3, currentHospital + 1))} className="p-3 rounded-xl border border-gray-200 bg-white hover:bg-[#0D9488] hover:text-white hover:border-[#0D9488] transition-all text-[#0C1A2E]/40">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-flow-col auto-cols-[85%] sm:auto-cols-[45%] lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-3 gap-6 overflow-x-auto snap-x snap-mandatory py-8 px-4 -mx-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] stagger-children">
            {hospitals.length > 0 ? hospitals.map((hosp, i) => (
              <div 
                key={i} 
                onClick={() => navigate(ROUTES.PUBLIC_HOSPITAL.replace(':id', hosp.id))}
                className={`snap-center bg-white rounded-[24px] border border-gray-200 overflow-hidden cursor-pointer group hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 ease-out flex flex-col ${i >= currentHospital && i < currentHospital + 3 ? '' : 'lg:hidden'}`}
              >
                <div className="h-48 overflow-hidden relative">
                   <img src={hosp.image} alt={hosp.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-navy text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      {hosp.type}
                   </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                     <h4 className="font-heading font-black text-lg text-[#0C1A2E]">{hosp.name}</h4>
                  </div>
                  <div className="flex items-center gap-1.5 mb-4">
                     <MapPin size={14} className="text-[#0D9488]" />
                     <span className="text-[#0C1A2E]/50 text-xs font-bold">{hosp.loc}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 mt-auto border-t border-gray-50">
                     <div className="flex items-center gap-1.5">
                       <Star size={14} className="text-[#FBBF24] fill-[#FBBF24]" />
                       <span className="text-sm font-bold text-[#0C1A2E]">{hosp.rating}</span>
                     </div>
                     <div className="flex items-center gap-1.5 text-right justify-end">
                       <Building2 size={14} className="text-navy/40" />
                       <span className="text-xs text-[#0C1A2E]/50 font-bold">{hosp.beds} Beds</span>
                     </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-10 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200 w-full">
                <p className="text-navy/40 font-bold">New featured facilities coming soon!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          6. TELEMEDICINE
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-[#F0FDFA]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2 reveal-left">
              <img src={telemedicineImg} alt="Telemedicine" className="w-full rounded-3xl shadow-2xl" />
            </div>
            <div className="w-full lg:w-1/2 space-y-8 reveal-right">
              <p className="text-[#0D9488] font-semibold text-sm uppercase tracking-[0.25em]">Telemedicine</p>
              <h2 className="text-4xl lg:text-5xl font-heading font-extrabold text-[#0C1A2E] tracking-tight leading-tight">
                Consult Doctors From Home
              </h2>
              <p className="text-[#0C1A2E]/50 text-lg leading-relaxed">
                Get medical advice without leaving your home. Our platform supports multiple consultation modes.
              </p>

              <div className="space-y-5">
                {[
                  { icon: <Video size={20} />, title: 'Video Consultation', desc: 'Face-to-face with your doctor via secure HD video.' },
                  { icon: <MessageCircle size={20} />, title: 'Chat Consultation', desc: 'Quick text-based consultations for minor issues.' },
                  { icon: <FileText size={20} />, title: 'Digital Prescription', desc: 'Receive prescriptions digitally, valid at any pharmacy.' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#0D9488]/10 rounded-xl flex items-center justify-center text-[#0D9488] shrink-0">{f.icon}</div>
                    <div>
                      <h4 className="font-heading font-bold text-[#0C1A2E] text-sm">{f.title}</h4>
                      <p className="text-[#0C1A2E]/40 text-sm">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                variant="primary" 
                size="lg" 
                className="bg-[#0D9488] hover:bg-[#115E59] rounded-xl px-8 shadow-xl shadow-[#0D9488]/20 font-medium" 
                onClick={() => navigate(ROUTES.PATIENT.BOOKING_HUB, { state: { initialMode: 'online' } })}
              >
                Start Online Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          7. BLOOD DONATION
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-red-50 to-[#FFF0E5] rounded-3xl p-12 lg:p-16 flex flex-col lg:flex-row items-center gap-12 reveal-scale">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-semibold">
                <Droplets size={16} /> Blood Donation Network
              </div>
              <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-[#0C1A2E] tracking-tight leading-tight">
                Save Lives With a Single Donation
              </h2>
              <p className="text-[#0C1A2E]/50 text-lg leading-relaxed max-w-lg">
                Connect with blood banks and donors near you. Our network ensures that urgent blood requirements are fulfilled within hours.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="bg-red-500 hover:bg-red-600 rounded-xl px-10 shadow-xl shadow-red-500/20 font-black uppercase tracking-widest text-xs border-none flex items-center gap-2" 
                  onClick={() => navigate(ROUTES.BLOOD_BANK)}
                >
                  Enter Blood Bank <ArrowRight size={18} />
                </Button>
              </div>
            </div>
            <div className="w-40 h-40 bg-red-100 rounded-full flex items-center justify-center animate-pulse-soft">
              <Droplets className="text-red-500" size={64} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          8. EMERGENCY SEARCH
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-[#0C1A2E] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full animate-ping" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-500/10 rounded-full animate-pulse" />

        <div className="container mx-auto px-6 text-center relative z-10 reveal">
          <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-semibold mb-8">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            Emergency Services
          </div>
          <h2 className="text-4xl lg:text-5xl font-heading font-extrabold text-white tracking-tight mb-6">
            Medical Emergency?
          </h2>
          <p className="text-white/40 text-lg max-w-lg mx-auto mb-10 leading-relaxed">
            Find the nearest hospital with emergency services, available beds, and ambulance support — in seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="primary" size="lg" className="bg-red-500 hover:bg-red-600 rounded-xl px-10 shadow-2xl shadow-red-500/30 font-medium border-none" onClick={() => navigate(ROUTES.EMERGENCY)}>
              <MapPin size={18} className="mr-2" /> Find Nearby Hospitals
            </Button>
            <Button 
                variant="outline" 
                size="lg" 
                className="rounded-xl px-10 border-white/20 text-white hover:bg-white/10 font-medium"
                onClick={() => window.location.href = 'tel:102'}
            >
              <Phone size={18} className="mr-2" /> Call Ambulance
            </Button>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          9. PATIENT REVIEWS
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-3 reveal">
            <p className="text-[#0D9488] font-semibold text-sm uppercase tracking-[0.25em]">Testimonials</p>
            <h2 className="text-4xl lg:text-5xl font-heading font-extrabold text-[#0C1A2E] tracking-tight">What Patients Say</h2>
          </div>

          <div className="max-w-2xl mx-auto reveal-scale">
            <div className="bg-[#F0FDFA] p-10 rounded-3xl relative text-center">
              <Quote className="absolute top-6 left-8 text-[#0D9488]/10" size={48} />
              <p className="text-[#0C1A2E]/60 text-lg leading-relaxed mb-8 relative z-10">
                "{reviews[currentReview].text}"
              </p>
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0D9488] to-[#115E59] rounded-full flex items-center justify-center text-white font-bold">
                  {reviews[currentReview].initials}
                </div>
                <div className="text-left">
                  <p className="font-heading font-bold text-[#0C1A2E]">{reviews[currentReview].name}</p>
                  <p className="text-[#0C1A2E]/40 text-sm">{reviews[currentReview].loc}</p>
                </div>
              </div>
              <div className="flex justify-center gap-2">
                {reviews.map((_, i) => (
                  <button key={i} onClick={() => setCurrentReview(i)} className={`h-2.5 rounded-full transition-all ${i === currentReview ? 'bg-[#0D9488] w-8' : 'bg-gray-200 w-2.5'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          10. JOIN OUR NETWORK
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-br from-[#0D9488] to-[#115E59] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-[60px]" />

        <div className="container mx-auto px-6 relative z-10 reveal">
          <div className="text-center mb-16 space-y-3">
            <p className="text-[#99F6E4] font-semibold text-sm uppercase tracking-[0.25em]">For Providers</p>
            <h2 className="text-4xl font-heading font-extrabold text-white tracking-tight">Join Our Professional Network</h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              Partner with MedCare to reach more patients and manage your practice with digital efficiency.
            </p>
          </div>

          <div className="grid grid-flow-col auto-cols-[85%] sm:auto-cols-[45%] md:auto-cols-auto md:grid-flow-row md:grid-cols-2 gap-8 overflow-x-auto snap-x snap-mandatory py-8 px-4 -mx-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] max-w-4xl mx-auto">
            {/* Doctor Registration */}
            <div 
              onClick={() => navigate(ROUTES.SIGNUP_DOCTOR)}
              className="snap-center bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl text-center group hover:-translate-y-3 !transition-all !duration-1000 hover:!delay-[150ms] ease-out cursor-pointer hover:bg-white/20"
            >
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 group-hover:scale-110 !transition-transform !duration-1000 group-hover:!delay-[150ms] ease-out">
                <Stethoscope size={32} />
              </div>
              <h3 className="text-2xl font-heading font-bold text-white mb-3">Independent Doctor</h3>
              <p className="text-white/60 mb-8 leading-relaxed">
                Connect with thousands of patients, manage your appointments, and provide online consultations seamlessly.
              </p>
              <Button variant="primary" className="!bg-white !text-[#115E59] hover:!bg-[#F0FDFA] rounded-xl px-8 shadow-xl font-bold border-none">
                Register as Doctor
              </Button>
            </div>

            {/* Hospital Registration */}
            <div 
              onClick={() => navigate(ROUTES.SIGNUP_HOSPITAL)}
              className="snap-center bg-[#0C1A2E]/40 backdrop-blur-md border border-white/10 p-8 rounded-3xl text-center group hover:-translate-y-3 !transition-all !duration-1000 hover:!delay-[150ms] ease-out cursor-pointer hover:bg-[#0C1A2E]/60"
            >
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 group-hover:scale-110 !transition-transform !duration-1000 group-hover:!delay-[150ms] ease-out">
                <Hospital size={32} />
              </div>
              <h3 className="text-2xl font-heading font-bold text-white mb-3">Healthcare Facility</h3>
              <p className="text-white/60 mb-8 leading-relaxed">
                List your hospital, manage bed availability in real-time, and streamline patient admissions digitally.
              </p>
              <Button variant="outline" className="rounded-xl px-8 border-white/30 !text-white hover:!bg-white/10 font-bold">
                Register as Hospital
              </Button>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          11. FOOTER
      ═══════════════════════════════════════════ */}
      <Footer />

    </div>
  );
};

export default Landing;
