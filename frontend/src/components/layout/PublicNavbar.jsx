import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, Menu, X, PhoneCall, LayoutDashboard } from 'lucide-react';
import { Button } from '../common';
import { ROUTES } from '../../constants/routes';
import useAuthStore from '../../store/authStore';

const PublicNavbar = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const navLinks = [
    { name: 'Home', path: ROUTES.HOME },
    { name: 'About Us', path: ROUTES.ABOUT },
    { name: 'Doctors', path: ROUTES.FIND_DOCTORS },
    { name: 'Hospitals', path: ROUTES.FIND_HOSPITALS },
    { name: 'Services', path: ROUTES.SERVICES },
    { name: 'Contact Us', path: '/contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white py-6 border-b border-gray-50">
      <div className="container mx-auto px-6 flex items-center justify-between">
        
        {/* Logo */}
        <Link to={ROUTES.HOME} className="flex items-center gap-2 group">
          <div className="text-[#115E59] group-hover:rotate-12 transition-transform duration-300">
            <Stethoscope size={28} strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-heading font-black text-navy tracking-tighter">
            MedCare
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path}
              className={`font-body font-bold text-sm transition-colors duration-200 ${
                location.pathname === link.path ? 'text-primary' : 'text-navy/60 hover:text-primary'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          {isAuthenticated ? (
            <Link to={ROUTES.DASHBOARD}>
              <Button variant="primary" size="sm" className="px-10 rounded-xl bg-[#115E59] border-none shadow-xl shadow-[#115E59]/20 hover:bg-navy flex items-center gap-2">
                <LayoutDashboard size={18} />
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to={ROUTES.LOGIN}>
                <Button variant="outline" size="sm" className="px-8 rounded-xl border-gray-100 hover:border-primary">Login</Button>
              </Link>
              <Link to={ROUTES.SIGNUP}>
                <Button variant="primary" size="sm" className="px-8 rounded-xl bg-[#115E59] border-none shadow-xl shadow-[#115E59]/20 hover:bg-navy">Sign up</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle Placeholder */}
        <div className="lg:hidden flex items-center gap-4">
          {isAuthenticated && (
            <Link to={ROUTES.DASHBOARD} className="text-[#115E59]">
              <LayoutDashboard size={24} />
            </Link>
          )}
          <button className="text-navy">
              <Menu size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;
