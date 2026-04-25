import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  BarChart3, Calendar, ClipboardList, User, Users, 
  Settings, LogOut, PackageSearch, Activity, Heart, 
  Stethoscope, Building2, LayoutGrid, Building,
  Bell, HelpCircle, Plus, IndianRupee, Video, CalendarCheck
} from 'lucide-react';
import { Avatar } from '../common';
import useAuthStore from '../../store/authStore';
import { ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';

const DashboardSidebar = ({ role = ROLES.PATIENT }) => {
  const { user, logout } = useAuthStore();
  
  const menuItems = {
    [ROLES.PATIENT]: [
      { name: 'Dashboard', icon: <LayoutGrid size={22} />, path: ROUTES.PATIENT.DASHBOARD },
      { name: 'Book Appointment', icon: <CalendarCheck size={22} />, path: ROUTES.PATIENT.BOOKING_HUB },
      { name: 'My Bookings', icon: <Calendar size={22} />, path: ROUTES.PATIENT.MY_BOOKINGS },
      { name: 'Token Tracker', icon: <Activity size={22} />, path: ROUTES.PATIENT.TOKEN_TRACKER },
      { name: 'Prescriptions', icon: <ClipboardList size={22} />, path: ROUTES.PATIENT.PRESCRIPTIONS },
      { name: 'Profile', icon: <User size={22} />, path: ROUTES.PATIENT.PROFILE },
    ],
    [ROLES.HOSPITAL]: [
      { name: 'Dashboard', icon: <LayoutGrid size={22} />, path: '/hospital/dashboard' },
      { name: 'Doctors', icon: <Stethoscope size={22} />, path: '/hospital/doctors' },
      { name: 'Offline Booking', icon: <Plus size={22} />, path: '/hospital/offline-booking' },
      { name: 'Appointments', icon: <Calendar size={22} />, path: '/hospital/appointments' },
      { name: 'Facilities', icon: <Building size={22} />, path: '/hospital/facilities' },
      { name: 'Profile', icon: <User size={22} />, path: '/hospital/profile' },
    ],
    [ROLES.DOCTOR]: [
      { name: 'Dashboard', icon: <LayoutGrid size={22} />, path: '/doctor/dashboard' },
      { name: 'Appointments', icon: <Calendar size={22} />, path: '/doctor/appointments' },
      { name: 'Consultation', icon: <Video size={22} />, path: '/doctor/consultation/sessions' },
      { name: 'Availability', icon: <Activity size={22} />, path: '/doctor/availability' },
      { name: 'Prescriptions', icon: <ClipboardList size={22} />, path: '/doctor/prescriptions' },
      { name: 'Profile', icon: <User size={22} />, path: '/doctor/profile' },
    ],
    [ROLES.ADMIN]: [
      { name: 'Dashboard', icon: <BarChart3 size={22} />, path: '/admin/dashboard' },
      { name: 'Registrations', icon: <PackageSearch size={22} />, path: '/admin/registrations' },
      { name: 'Hospitals', icon: <Building2 size={22} />, path: '/admin/hospitals' },
      { name: 'Doctors', icon: <Stethoscope size={22} />, path: '/admin/doctors' },
      { name: 'Patients', icon: <Users size={22} />, path: '/admin/patients' },
      { name: 'Revenue', icon: <IndianRupee size={22} />, path: '/admin/revenue' },
      { name: 'Profile', icon: <User size={22} />, path: '/admin/profile' },
    ],
  };

  const navItems = menuItems[role] || [];

  return (
    <aside className="w-[260px] h-screen bg-white sticky top-0 left-0 flex flex-col border-r border-gray-100 shadow-sm z-40 overflow-y-auto">
      {/* Sidebar Header */}
      <div className="px-8 py-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="bg-[#0D9488] p-2 rounded-xl">
            <Stethoscope className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-heading font-black text-[#0C1A2E] tracking-tight">
            Med<span className="text-[#0D9488]">Care</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 py-4">
        <div className="px-4 pb-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-navy/30">Main menu</span>
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-200 group
              ${isActive 
                ? 'bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/20' 
                : 'text-navy/50 hover:bg-[#F0F9FF] hover:text-[#0D9488]'}
            `}
          >
            <span className="transition-transform duration-200 group-hover:scale-110">
              {item.icon}
            </span>
            <span className="text-sm tracking-tight">{item.name}</span>
          </NavLink>
        ))}
        
      </nav>

      {/* User Area Footer */}
      <div className="p-4 mt-auto border-t border-gray-100 bg-gray-50/50">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <Avatar 
            src={user?.avatar} 
            name={user?.name || "Guest User"} 
            size="md" 
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-navy truncate">{user?.name || "Guest User"}</p>
            <p className="text-[10px] font-bold text-navy/40 truncate uppercase tracking-wider">
                {role}
            </p>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-navy/30 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
