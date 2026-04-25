import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, Phone, MapPin, Send, 
  Clock
} from 'lucide-react';
import Footer from '../../components/layout/Footer';

const Contact = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body pt-24">
      
      {/* HERO */}
      <section className="container max-w-7xl mx-auto px-6 py-8 lg:py-12 text-center">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="inline-block bg-teal-50 text-teal-700 px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
            24/7 Clinical Support
          </div>
          <h1 className="text-5xl lg:text-6xl font-heading font-black text-navy leading-[1.1] tracking-tighter uppercase">
            Get in <span className="text-primary">Touch</span> with <br /> Our Team.
          </h1>
          <p className="text-lg text-navy/30 leading-relaxed font-bold uppercase tracking-[0.1em] max-w-2xl mx-auto">
            Our specialized support desk is available to assist with patient queries and institutional onboarding.
          </p>
        </div>
      </section>

      {/* CONTACT HUB */}
      <section className="container max-w-7xl mx-auto px-6 mb-12 lg:mb-20">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          
          {/* Left Pod: The Form */}
          <div className="flex-[1.5] bg-white rounded-[40px] p-8 lg:p-14 shadow-sm border border-gray-100">
             <div className="space-y-10">
                <div className="space-y-3">
                   <h2 className="text-2xl font-heading font-black text-navy uppercase tracking-tight">Send a Message</h2>
                   <div className="w-10 h-1 bg-primary rounded-full" />
                </div>

                <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-navy/40 ml-2">Full Name</label>
                      <input 
                        type="text" 
                        placeholder="John Doe"
                        className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-3.5 text-sm font-bold text-navy outline-none focus:bg-white focus:border-primary/20 transition-all"
                      />
                   </div>
                   <div className="space-y-2.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-navy/40 ml-2">Email Address</label>
                      <input 
                        type="email" 
                        placeholder="john@example.com"
                        className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-3.5 text-sm font-bold text-navy outline-none focus:bg-white focus:border-primary/20 transition-all"
                      />
                   </div>
                   <div className="md:col-span-2 space-y-2.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-navy/40 ml-2">Subject</label>
                      <input 
                        type="text" 
                        placeholder="How can we help you?"
                        className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-3.5 text-sm font-bold text-navy outline-none focus:bg-white focus:border-primary/20 transition-all"
                      />
                   </div>
                   <div className="md:col-span-2 space-y-2.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-navy/40 ml-2">Message</label>
                      <textarea 
                        rows="4"
                        placeholder="Describe your query..."
                        className="w-full bg-gray-50 border border-transparent rounded-3xl px-5 py-5 text-sm font-bold text-navy outline-none focus:bg-white focus:border-primary/20 transition-all resize-none font-bold"
                      ></textarea>
                   </div>
                   <div className="md:col-span-2 pt-4">
                      <button 
                        type="button"
                        className="bg-navy text-primary px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition-all active:scale-95"
                      >
                         <Send size={14} /> Send Request
                      </button>
                   </div>
                </form>
             </div>
          </div>

          {/* Right Pod: The Info */}
          <div className="flex-1 space-y-6 lg:space-y-8">
             <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-primary">
                   <MapPin size={20} />
                </div>
                <div className="space-y-2">
                   <h3 className="text-lg font-heading font-black text-navy uppercase tracking-tight leading-none">Main Campus</h3>
                   <p className="text-navy/40 text-[10px] font-black uppercase tracking-wider leading-relaxed">
                      124 Medical Plaza, Innovation City, 40001
                   </p>
                </div>
             </div>

             <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-blue-500">
                   <Phone size={20} />
                </div>
                <div className="space-y-2">
                   <h3 className="text-lg font-heading font-black text-navy uppercase tracking-tight leading-none">Helplines</h3>
                   <p className="text-navy font-black text-sm tracking-tight">+1-800-MED-CARE</p>
                </div>
             </div>

             <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-amber-500">
                   <Clock size={20} />
                </div>
                <div className="space-y-2">
                   <h3 className="text-lg font-heading font-black text-navy uppercase tracking-tight leading-none">Availability</h3>
                   <p className="text-navy/40 text-[9px] font-black uppercase tracking-widest">General: 9AM - 6PM</p>
                </div>
             </div>
          </div>

        </div>
      </section>

      {/* MAP SECTION */}
      <section className="container max-w-7xl mx-auto px-6 my-10 lg:my-20">
        <div className="bg-white rounded-[48px] p-4 shadow-sm border border-gray-100 relative overflow-hidden h-[300px]">
           <img 
             src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=2066" 
             alt="Location Map" 
             className="w-full h-full object-cover rounded-[40px] opacity-20 grayscale"
           />
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-white flex flex-col items-center gap-3">
                 <MapPin size={24} className="text-primary animate-bounce" />
                 <p className="text-navy font-black uppercase tracking-widest text-[9px]">MedCare HQ Center</p>
              </div>
           </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
