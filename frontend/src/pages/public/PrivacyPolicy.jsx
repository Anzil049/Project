import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, FileText, CheckCircle2 } from 'lucide-react';
import Footer from '../../components/layout/Footer';

const PrivacyPolicy = () => {
  const sections = [
    {
      title: 'Data Collection',
      content: 'We collect personal information such as name, email, and medical history solely to provide and improve our healthcare services. All data is provided voluntarily by users during registration or consultation.',
      icon: <Eye className="text-primary" size={24} />
    },
    {
      title: 'Information Security',
      content: 'Your data is encrypted using industry-standard SSL protocols. Digital prescriptions and consultation records are stored in secure, HIPAA-compliant servers with restricted access.',
      icon: <Lock className="text-blue-500" size={24} />
    },
    {
      title: 'Sharing Protection',
      content: 'MedCare does not sell or lease patient data to third parties. Information is only shared with authorized medical practitioners and hospitals involved in your direct care.',
      icon: <Shield className="text-red-500" size={24} />
    },
    {
      title: 'Your Rights',
      content: 'Users have the right to access, rectify, or delete their personal information at any time through their profile settings or by contacting our support team.',
      icon: <CheckCircle2 className="text-amber-500" size={24} />
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
            className="inline-block bg-teal-50 text-teal-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100"
          >
            Legal Documentation
          </motion.div>
          <h1 className="text-5xl lg:text-6xl font-heading font-black text-navy leading-[1.1] tracking-tighter uppercase">
            Privacy <br /> <span className="text-primary">Policy.</span>
          </h1>
          <p className="text-lg text-navy/30 leading-relaxed font-bold uppercase tracking-wide">
            Committed to protecting your sensitive medical information through high-integrity digital standards.
          </p>
        </div>
      </section>

      {/* POLICY CONTENT */}
      <section className="container max-w-5xl mx-auto px-6 pt-0 pb-12">
        <div className="bg-white rounded-[48px] p-8 lg:p-12 shadow-sm border border-gray-100 space-y-10">
          {sections.map((section, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-8 lg:gap-16 items-start">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-gray-50">
                {section.icon}
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-heading font-black text-navy uppercase tracking-tight">{section.title}</h3>
                <p className="text-navy/50 leading-relaxed font-medium text-sm">
                  {section.content}
                </p>
              </div>
            </div>
          ))}
          
          <div className="pt-12 border-t border-gray-50">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-navy/20 text-center">
              Last Updated: April 2026 • MedCare Governance Team
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
