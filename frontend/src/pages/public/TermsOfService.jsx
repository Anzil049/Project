import React from 'react';
import { motion } from 'framer-motion';
import { Gavel, Scale, AlertTriangle, FileCheck, HelpCircle } from 'lucide-react';
import Footer from '../../components/layout/Footer';

const TermsOfService = () => {
  const terms = [
    {
      title: 'Platform Usage',
      content: 'MedCare provides a digital interface connecting patients with healthcare providers. By using this platform, you agree to provide accurate information and respect the professional relationship with practitioners.',
      icon: <Scale className="text-primary" size={24} />
    },
    {
      title: 'Medical Disclaimer',
      content: 'While we facilitate telemedicine, MedCare is not a direct healthcare provider. In case of life-threatening emergencies, users must contact local emergency services (102/911) immediately rather than relying on digital consultation.',
      icon: <AlertTriangle className="text-red-500" size={24} />
    },
    {
      title: 'Booking & Cancellations',
      content: 'Appointments booked through the Unified Booking Hub are subject to the specific availability and policies of the respective hospital or doctor. Cancellations must be made at least 2 hours in advance.',
      icon: <FileCheck className="text-blue-500" size={24} />
    },
    {
      title: 'Account Responsibilities',
      content: 'Users are responsible for maintaining the confidentiality of their login credentials. Any unauthorized use of your account must be reported to our governance team immediately.',
      icon: <Gavel className="text-amber-600" size={24} />
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body pt-16 lg:pt-20">
      {/* HERO SECTION */}
      <section className="container max-w-7xl mx-auto px-6 pt-4 pb-2 lg:pt-6 lg:pb-4 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-block bg-navy/5 text-navy/60 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-navy/10"
          >
            User Agreement
          </motion.div>
          <h1 className="text-5xl lg:text-6xl font-heading font-black text-navy leading-[1.1] tracking-tighter uppercase">
            Terms of <br /> <span className="text-primary">Service.</span>
          </h1>
          <p className="text-lg text-navy/30 leading-relaxed font-bold uppercase tracking-wide">
            Understanding the professional boundaries and operational rules of our medical ecosystem.
          </p>
        </div>
      </section>

      {/* TERMS CONTENT */}
      <section className="container max-w-5xl mx-auto px-6 pt-0 pb-12">
        <div className="bg-white rounded-[48px] p-8 lg:p-12 shadow-sm border border-gray-100 space-y-10">
          {terms.map((term, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-8 lg:gap-16 items-start">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-gray-50">
                {term.icon}
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-heading font-black text-navy uppercase tracking-tight">{term.title}</h3>
                <p className="text-navy/50 leading-relaxed font-medium text-sm">
                  {term.content}
                </p>
              </div>
            </div>
          ))}

          <div className="bg-gray-50 rounded-3xl p-8 flex items-start gap-4">
            <HelpCircle className="text-primary mt-1 shrink-0" size={20} />
            <p className="text-navy/60 text-xs font-bold leading-relaxed uppercase tracking-wider">
              If you have any questions regarding these terms, please reach out to our legal department via the correspondence portal in the contact section.
            </p>
          </div>
          
          <div className="pt-12 border-t border-gray-50">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-navy/20 text-center">
              Effective Date: January 1, 2026 • MedCare Legal Operations
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsOfService;
