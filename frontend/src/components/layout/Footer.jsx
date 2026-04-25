import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const Footer = () => {
  return (
    <footer className="bg-[#115E59] text-white pt-20 pb-8 overflow-hidden relative">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#0D9488]/20 rounded-full blur-[100px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#99F6E4]/5 rounded-full blur-[80px] -ml-32 -mb-32" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-14 mb-16">
          {/* Column 1: Brand */}
          <div className="space-y-6">
            <Link to={ROUTES.HOME} className="flex items-center gap-3">
              <div className="text-[#99F6E4]">
                <Stethoscope size={28} strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-heading font-black text-white tracking-tighter">
                MedCare
              </span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed font-body">
              Empowering healthcare excellence through cutting-edge digital technology and compassionate care coordination.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="p-2.5 bg-white/5 hover:bg-[#0D9488] rounded-xl transition-all duration-300 text-white/60 hover:text-white">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-6">
            <h4 className="text-sm font-heading font-black tracking-widest uppercase text-[#99F6E4]">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { name: 'About MedCare', path: ROUTES.ABOUT },
                { name: 'Our Doctors', path: ROUTES.FIND_DOCTORS },
                { name: 'Legal Terms', path: ROUTES.TERMS },
                { name: 'Privacy Policy', path: ROUTES.PRIVACY }
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-white/50 hover:text-white text-sm transition-all inline-block font-medium">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Services */}
          <div className="space-y-6">
            <h4 className="text-sm font-heading font-black tracking-widest uppercase text-[#99F6E4]">Services</h4>
            <ul className="space-y-3">
              {[
                { name: 'Telemedicine', path: ROUTES.PATIENT.BOOKING_HUB, state: { initialMode: 'online' } },
                { name: 'Token Tracking', path: ROUTES.PATIENT.TOKEN_TRACKER },
                { name: 'Blood Network', path: ROUTES.BLOOD_BANK },
                { name: 'Emergency Help', path: ROUTES.EMERGENCY }
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path} 
                    state={link.state}
                    className="text-white/50 hover:text-white text-sm transition-all inline-block font-medium"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-6">
            <h4 className="text-sm font-heading font-black tracking-widest uppercase text-[#99F6E4]">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="text-[#99F6E4] shrink-0 mt-0.5" size={16} />
                <span className="text-white/50 text-sm font-medium">82 Hospital Square, Silicon Valley, CA 94025</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-[#99F6E4] shrink-0" size={16} />
                <span className="text-white/50 text-sm font-bold tracking-tight cursor-pointer hover:text-white transition-colors" onClick={() => window.location.href='tel:1800MEDCARE'}>+1-800-MEDCARE</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-[#99F6E4] shrink-0" size={16} />
                <span className="text-white/50 text-sm font-medium cursor-pointer hover:text-white transition-colors" onClick={() => window.location.href='mailto:support@medcare.org'}>support@medcare.org</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/25 text-xs font-bold uppercase tracking-widest">
            © 2026 MedCare Healthcare. All Rights Reserved.
          </p>
          <div className="flex gap-6 text-xs font-bold uppercase tracking-wider text-white/20">
            <Link to={ROUTES.PRIVACY} className="hover:text-white/60 transition-colors">Privacy</Link>
            <Link to={ROUTES.TERMS} className="hover:text-white/60 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
