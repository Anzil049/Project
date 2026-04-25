import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import { ROUTES } from '../../constants/routes';
import { Bell, Search, Settings, HelpCircle, User, Menu, X, Moon, Sun } from 'lucide-react';
import DashboardSidebar from './DashboardSidebar';
import { Avatar } from '../common';

const TopBar = ({ title = "Dashboard", setMobileMenuOpen }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
    <header className="h-[70px] md:h-[90px] bg-white border-b border-gray-100 px-4 md:px-10 flex items-center justify-between sticky top-0 z-40 transition-all duration-300">
      <div className="flex items-center gap-4">
        <button 
          className="lg:hidden p-2 -ml-2 text-navy hover:bg-gray-50 rounded-xl"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-black text-navy tracking-tight">{title}</h1>
          <p className="hidden md:block text-navy/40 text-xs font-bold uppercase tracking-[0.15em] mt-0.5">MedCare Health Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Search Bar - Desktop */}
        <div className="hidden lg:flex items-center bg-gray-50 border border-transparent focus-within:border-primary/20 focus-within:bg-white px-4 py-2.5 rounded-2xl transition-all w-80 group">
          <Search size={18} className="text-navy/30 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search records, doctors..." 
            className="bg-transparent border-none outline-none px-3 text-sm font-medium w-full placeholder:text-navy/20"
          />
        </div>

        {/* Notifications Icon */}
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2.5 md:p-3 bg-gray-50 text-navy/40 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all group"
        >
          <Bell size={22} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
        </button>
        
        {/* Settings */}
        <button className="p-2.5 md:p-3 bg-gray-50 text-navy/40 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all">
          <Settings size={22} />
        </button>

        <div className="h-8 w-[1px] bg-gray-200" />

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-navy">{user?.name || "User Account"}</p>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none mt-1">Personal ID: #MC9421</p>
          </div>
          <Avatar src={user?.avatar} name={user?.name} size="lg" className="ring-4 ring-primary/5 ring-offset-2 border-primary/20" />
        </div>
      </div>

      {/* Notifications Dropdown Container */}
      {showNotifications && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setShowNotifications(false)} 
          />
          <div className="absolute right-4 md:right-10 top-[60px] md:top-[80px] w-[calc(100vw-2rem)] sm:w-[360px] bg-white rounded-3xl shadow-2xl shadow-navy/10 border border-gray-100 overflow-hidden z-50">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-heading font-extrabold text-navy text-sm uppercase tracking-wider">Notifications</h3>
              <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">2 NEW</span>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              <div className="p-5 hover:bg-gray-50 cursor-pointer transition-colors">
                 <p className="text-sm font-bold text-navy mb-1">Appointment Confirmed</p>
                 <p className="text-xs text-navy/60 leading-relaxed font-medium">Your appointment with Dr. Mehta is confirmed for 2:30 PM today.</p>
                 <p className="text-[10px] font-bold text-navy/40 mt-3 tracking-wider uppercase">10 mins ago</p>
              </div>
              <div className="p-5 hover:bg-gray-50 cursor-pointer transition-colors">
                 <p className="text-sm font-bold text-navy mb-1">Prescription Ready</p>
                 <p className="text-xs text-navy/60 leading-relaxed font-medium">Your digital prescription from Fortis has been uploaded.</p>
                 <p className="text-[10px] font-bold text-navy/40 mt-3 tracking-wider uppercase">2 hours ago</p>
              </div>
            </div>
            <div 
              onClick={() => { navigate(ROUTES.NOTIFICATIONS); setShowNotifications(false); }}
              className="p-4 border-t border-gray-100 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs font-bold text-[#0D9488]">View all notifications</span>
            </div>
          </div>
        </>
      )}
    </header>

    {/* Mobile Search Row */}
    <div className="lg:hidden w-full px-4 py-3 bg-white border-b border-gray-100 sticky top-[70px] z-30 shadow-sm">
      <div className="flex items-center bg-[#F0F9FF] border border-transparent focus-within:border-[#0D9488]/30 focus-within:bg-white px-4 py-2.5 rounded-2xl transition-all w-full group">
        <Search size={18} className="text-[#0D9488]/50 group-focus-within:text-[#0D9488] transition-colors shrink-0" />
        <input 
          type="text" 
          placeholder="Search for doctors, medicines..." 
          className="bg-transparent border-none outline-none px-3 text-sm font-medium w-full text-navy placeholder:text-navy/30"
        />
      </div>
    </div>
    </>
  );
};

const DashboardLayout = ({ children, title, role }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-white transition-all duration-300">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-[260px] shrink-0 border-r border-gray-100">
        <DashboardSidebar role={role} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-0 left-0 h-full bg-white shadow-2xl flex flex-col transform transition-transform w-[260px]">
             <div className="absolute top-4 right-4 z-50">
               <button className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors" onClick={() => setMobileMenuOpen(false)}>
                 <X size={20} className="text-navy" />
               </button>
             </div>
             <DashboardSidebar role={role} />
          </div>
        </div>
      )}
      
      <main className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        <TopBar title={title} setMobileMenuOpen={setMobileMenuOpen} />
        
        <div className="flex-1 p-4 md:p-10 overflow-x-hidden overflow-y-auto">
          {/* Main content wrapper */}
          <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </div>

        <footer className="px-4 md:px-10 py-6 border-t border-gray-100/50 bg-white/30 text-[10px] md:text-[11px] font-bold text-navy/30 flex flex-col md:flex-row justify-between gap-4 md:gap-0 uppercase tracking-widest items-center text-center transition-colors">
            <span>© 2026 MedCare Distributed Ledger Solutions</span>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-primary transition-colors">Help Support</a>
            </div>
        </footer>
      </main>
    </div>
  );
};

export default DashboardLayout;
