import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, ShieldCheck, Users, Globe, 
  Award, Target, CheckCircle2
} from 'lucide-react';
import Footer from '../../components/layout/Footer';

const About = () => {
  const stats = [
    { label: 'Registered Patients', value: '50,000+', icon: <Users className="text-[#0D9488]" size={20} /> },
    { label: 'Certified Doctors', value: '1,200+', icon: <Heart className="text-red-500" size={20} /> },
    { label: 'Partner Hospitals', value: '300+', icon: <Globe className="text-blue-500" size={20} /> },
    { label: 'Success Rate', value: '99.9%', icon: <Award className="text-amber-500" size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body pt-24">
      
      {/* HERO SECTION */}
      <section className="container max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 space-y-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="inline-block bg-teal-50 text-teal-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
            >
              Our Mission
            </motion.div>
            <h1 className="text-5xl lg:text-6xl font-heading font-black text-navy leading-[1.1] tracking-tight uppercase">
              A Unified <br /> <span className="text-primary tracking-tighter">Medical</span> Ecosystem.
            </h1>
            <p className="text-lg text-navy/40 leading-relaxed max-w-md font-bold uppercase tracking-wide">
              Connecting patients, doctors, and hospitals through a synchronized digital platform for accessible healthcare.
            </p>
          </div>
          <div className="flex-1 relative">
            <div className="rounded-[32px] overflow-hidden shadow-2xl relative z-10">
               <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2070" alt="Medical Team" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -inset-10 bg-primary/5 blur-[100px] -z-0" />
          </div>
        </div>
      </section>

      {/* STATS: Calibrated Pod */}
      <section className="container max-w-7xl mx-auto px-6 my-6 lg:my-10">
        <div className="bg-white rounded-[48px] p-8 lg:p-16 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center space-y-3">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {stat.icon}
                </div>
                <p className="text-3xl font-heading font-black text-navy">{stat.value}</p>
                <p className="text-[9px] font-black uppercase text-navy/30 tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PHILOSOPHY: Calibrated Gaps */}
      <section className="container max-w-7xl mx-auto px-6 py-12 lg:py-24">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-heading font-black text-navy tracking-tight uppercase">Foundations</h2>
            <div className="w-12 h-1 bg-primary mx-auto rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            {[
              {
                title: 'Seamless Access',
                desc: 'Discover hospitals and track queues through a unified interface.',
                icon: <Globe className="text-primary" size={24} />
              },
              {
                title: 'Privacy First',
                desc: 'Encryption standards applied to all digital prescriptions.',
                icon: <ShieldCheck className="text-blue-500" size={24} />
              },
              {
                title: 'Synchronized',
                desc: 'Real-time data flow between laboratories and clinics.',
                icon: <Heart className="text-red-500" size={24} />
              },
              {
                title: 'Verified',
                desc: 'Manual verification protocols for every medical practitioner.',
                icon: <CheckCircle2 className="text-amber-500" size={24} />
              }
            ].map((item, idx) => (
              <div key={idx} className="space-y-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-navy shadow-sm border border-gray-50">
                  {item.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-heading font-black text-navy uppercase tracking-tight">{item.title}</h3>
                  <p className="text-navy/40 leading-relaxed font-bold uppercase text-[9px] tracking-wider">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
