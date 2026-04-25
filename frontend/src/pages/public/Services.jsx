import React from 'react';
import { motion } from 'framer-motion';
import { 
  Hospital, Video, Clock, Droplets, 
  ClipboardList, CalendarDays, Siren,
  ShieldCheck, BarChart, MessageSquare, Smartphone
} from 'lucide-react';
import Footer from '../../components/layout/Footer';

const Services = () => {
  const mainServices = [
    {
      title: 'Emergency Discovery',
      desc: 'Real-time discovery of nearest hospitals with active emergency departments.',
      icon: <Siren className="text-red-500" size={24} />,
      features: ['Nearby ER Locator', 'Live Bed Status']
    },
    {
      title: 'Token-Based Queueing',
      desc: 'Synchronized token tracking system for physical visits and wait times.',
      icon: <Clock className="text-amber-500" size={24} />,
      features: ['Live Position Tracking', 'Wait-time Estimates']
    },
    {
      title: 'Consultation Suites',
      desc: 'Integrated video and chat consultation rooms for secure, remote sessions.',
      icon: <Video className="text-blue-500" size={24} />,
      features: ['HD Video Rooms', 'Safe Messaging']
    },
    {
      title: 'Blood Bank Network',
      desc: 'Centralized donor and inventory management system for urgent requirements.',
      icon: <Droplets className="text-red-600" size={24} />,
      features: ['Donor Directory', 'Request Broadcasts']
    },
    {
      title: 'Digital Rx System',
      desc: 'Professional prescription generation tool linked to clinic sessions.',
      icon: <ClipboardList className="text-primary" size={24} />,
      features: ['Auto-Generated Rx', 'Patient Record Sync']
    },
    {
      title: 'Smart Scheduling',
      desc: 'Cross-role calendar management for appointments and slot availability.',
      icon: <CalendarDays className="text-purple-500" size={24} />,
      features: ['Slot Management', 'Instant Booking']
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body pt-24">
      
      {/* HERO */}
      <section className="container max-w-7xl mx-auto px-6 py-8 lg:py-12 text-center">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="inline-block bg-teal-50 text-teal-700 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
            Clinical Tools
          </div>
          <h1 className="text-5xl lg:text-6xl font-heading font-black text-navy leading-[1.1] tracking-tighter uppercase">
            Functional <br /> <span className="text-primary">Infrastructure.</span>
          </h1>
          <p className="text-lg text-navy/30 leading-relaxed font-bold uppercase tracking-[0.1em] max-w-2xl mx-auto">
            Practical digital tools built to solve core medical accessibility challenges.
          </p>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="container max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {mainServices.map((service, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm hover:shadow-xl transition-all flex flex-col group h-full"
            >
              <div className="w-12 h-12 bg-gray-50 rounded-[16px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {service.icon}
              </div>
              <h3 className="text-lg font-heading font-black text-navy mb-3 tracking-tight uppercase leading-tight">{service.title}</h3>
              <p className="text-navy/40 text-[10px] font-bold uppercase tracking-wide leading-relaxed mb-8 flex-1">{service.desc}</p>
              
              <ul className="space-y-2 pt-6 border-t border-gray-50">
                {service.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-navy/40">
                    <ShieldCheck size={12} className="text-primary" /> {feat}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* INFRASTRUCTURE: Calibrated Pod */}
      <section className="container max-w-7xl mx-auto px-6 my-10 lg:my-20">
        <div className="bg-white rounded-[48px] p-10 lg:p-16 shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
            <div className="flex-1 space-y-10">
              <h2 className="text-3xl lg:text-4xl font-heading font-black text-navy leading-tight tracking-tighter uppercase">Dashboard Hub</h2>
              <p className="text-navy/30 text-lg leading-relaxed font-bold uppercase tracking-wider">Interfaces for Hospitals, Doctors, and Administrators to maintain data integrity.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                 <div className="space-y-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-primary shadow-sm">
                       <BarChart size={20} />
                    </div>
                    <h4 className="font-heading font-black text-navy uppercase text-xs tracking-widest">Live Rosters</h4>
                    <p className="text-navy/40 text-[9px] font-black uppercase">Update availability in real-time.</p>
                 </div>
                 <div className="space-y-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                       <MessageSquare size={20} />
                    </div>
                    <h4 className="font-heading font-black text-navy uppercase text-xs tracking-widest">Patient CRM</h4>
                    <p className="text-navy/40 text-[9px] font-black uppercase">Centralized history management.</p>
                 </div>
              </div>
            </div>
            <div className="flex-1 relative">
                <div className="rounded-[32px] overflow-hidden shadow-2xl relative z-10">
                   <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2053" alt="Hospital Management" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -inset-10 bg-primary/5 blur-[100px] -z-0" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
