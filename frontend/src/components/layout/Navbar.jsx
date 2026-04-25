import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, User, LogIn } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import useAuthStore from '../../store/authStore';

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
          <button 
            onClick={logout}
            className="flex items-center gap-2 bg-navy text-white px-5 py-2 rounded-xl hover:bg-navy/90 transition-all font-medium"
          >
            <LogIn size={18} />
            Logout
          </button>
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
