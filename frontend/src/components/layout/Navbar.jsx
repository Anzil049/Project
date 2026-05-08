import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, User, LogIn, LogOut } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import useAuthStore from '../../store/authStore';
import { Avatar } from '../common';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuthStore();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-50 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="bg-primary p-2 rounded-lg">
          <Activity className="text-white w-6 h-6" />
        </div>
        <span className="text-navy font-heading font-bold text-xl tracking-tight">Medicare</span>
      </div>

      <div className="flex items-center gap-6">
        <Link to={ROUTES.HOME} className="text-navy/70 hover:text-primary font-medium transition-colors">Home</Link>
        <Link to="/hospitals" className="text-navy/70 hover:text-primary font-medium transition-colors">Find Hospitals</Link>
        <Link to="/doctors" className="text-navy/70 hover:text-primary font-medium transition-colors">Doctors</Link>
        
        <div className="h-4 w-[1px] bg-gray-200 mx-2" />
        
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <Link 
              to={user?.role === 'admin' ? '/admin/dashboard' : `/${user?.role}/dashboard`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Avatar src={user?.image} name={user?.name} size="md" />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-navy leading-none">{user?.name}</p>
                <p className="text-[10px] font-bold text-navy/40 uppercase tracking-widest mt-1">{user?.role}</p>
              </div>
            </Link>
            <button 
              onClick={logout}
              className="p-2 text-navy/40 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link 
              to={ROUTES.LOGIN} 
              className="text-navy font-medium px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Login
            </Link>
            <Link 
              to={ROUTES.SIGNUP}
              className="bg-primary text-white px-5 py-2 rounded-xl hover:opacity-90 transition-opacity font-medium shadow-md shadow-primary/20"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
