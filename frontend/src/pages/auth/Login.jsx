import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, AlertCircle, Facebook, Twitter } from 'lucide-react';
import { Button, Input } from '../../components/common';
import authService from '../../services/authService';
import useAuthStore from '../../store/authStore';
import { ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import medicalImage from '../../assets/login.png';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('blocked') === 'true') {
      const role = params.get('role');
      let message = 'Your account has been suspended. Please contact the platform administrator.';
      
      if (role === 'doctor') {
        message = 'Your account has been suspended. Please contact your hospital administrator.';
      } else if (role === 'hospital') {
        message = 'Your hospital account has been suspended. Please contact MedCare support.';
      }

      toast.error(message, {
        duration: 8000,
        id: 'blocked-toast'
      });
      // Clear the param from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authService.login(email, password);
      login(data); // Store the whole user object
      
      // Check for 2FA requirement (simulated logic)
      if (data.requires2FA) {
        navigate('/verify-otp', { state: { email, type: '2fa' } });
        return;
      }

      if (data.isFirstLogin) {
        navigate(ROUTES.CHANGE_PASSWORD);
        return;
      }

      switch (data.role) {
        case 'admin': navigate(ROUTES.ADMIN.DASHBOARD); break;
        case 'hospital': navigate(ROUTES.HOSPITAL.DASHBOARD); break;
        case 'doctor': navigate(ROUTES.DOCTOR.DASHBOARD); break;
        case 'patient': navigate(ROUTES.PATIENT.DASHBOARD); break;
        default: navigate(ROUTES.PATIENT.DASHBOARD); break;
      }
    } catch (err) {
      const serverError = err.response?.data?.errors?.[0];
      const message = serverError ? Object.values(serverError)[0] : (err.response?.data?.message || 'Invalid credentials. Access denied.');
      setError(message);

      // If user is not verified, redirect to OTP page after a short delay
      if (message.toLowerCase().includes('verify your email')) {
        setTimeout(() => {
          navigate('/verify-otp', { state: { email, type: 'registration' } });
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E1F2F1] p-4 md:p-10 font-body transition-colors duration-500">
      
      {/* Main Unified Card */}
      <div className="w-full max-w-6xl h-full min-h-[700px] flex flex-col lg:flex-row bg-[#0D9488] rounded-[40px] shadow-[0_20px_60px_-15px_rgba(13,148,136,0.3)] overflow-hidden relative">
        
        {/* Visual Side Panel (Shared with Login) */}
        <div className="w-full lg:w-[45%] h-64 lg:h-auto bg-[#E6FFFA]/80 relative overflow-hidden flex items-center justify-center p-12">
          <img 
            src={medicalImage} 
            alt="Healthcare Illustration" 
            className="w-full h-full object-contain scale-110 drop-shadow-2xl z-10"
          />
          
          {/* Vertical Wave Divider (Desktop Only) */}
          <div className="hidden lg:block absolute top-0 -right-1 h-full w-24 z-20">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full fill-[#0D9488]">
              <path d="M100 0 C 40 20, 40 80, 100 100 L 100 100 L 100 0 Z" />
            </svg>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-12 left-12 z-20 hidden lg:block"
          >
             <h3 className="text-2xl font-heading font-black text-[#0D9488] opacity-80 tracking-widest">WELCOME</h3>
             <div className="w-8 h-1 bg-[#0D9488] mt-2 rounded-full opacity-60" />
          </motion.div>
        </div>

        {/* Right Side: Form & Content */}
        <div className="w-full lg:w-[55%] flex flex-col justify-center p-8 lg:p-20 relative text-white">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-lg mx-auto space-y-8"
          >
            <div className="space-y-1">
              <motion.h2 variants={itemVariants} className="text-3xl font-heading font-bold text-teal-50">Hello!</motion.h2>
              <motion.p variants={itemVariants} className="text-lg font-heading text-teal-50/70">We are glad to see you :)</motion.p>
            </div>

            {/* Social Logins */}
            <motion.div variants={itemVariants} className="flex gap-4">
               <button className="flex-1 flex items-center justify-center gap-3 bg-white/10 border border-white/20 py-3.5 px-4 rounded-full text-xs font-bold hover:bg-white/20 transition-all text-white">
                  <img src="https://www.vectorlogo.zone/logos/google/google-icon.svg" className="w-4 h-4 bg-white rounded-full" alt="Google" />
                  Sign up with Google
               </button>
               
            </motion.div>

            <motion.div variants={itemVariants} className="relative py-2 flex items-center">
               <div className="flex-1 border-t border-white/10"></div>
               <span className="px-4 text-[12px] font-black uppercase  text-white/30 ">or</span>
               <div className="flex-1 border-t border-white/10"></div>
            </motion.div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <motion.div variants={itemVariants}>
                    <Input
                       label="Email"
                       name="email"
                       type="email"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       icon={Mail}
                       placeholder="user@medcare.com"
                       required
                       className="h-14 rounded-3xl"
                    />
                 </motion.div>
                 <motion.div variants={itemVariants}>
                    <Input
                       label="Password"
                       name="password"
                       type="password"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       icon={Lock}
                       placeholder="••••••••"
                       required
                       className="h-14 rounded-3xl"
                    />
                  </motion.div>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-red-100 bg-red-500/20 px-4 py-3 rounded-2xl border border-red-500/30 text-xs font-bold"
                  >
                    <AlertCircle size={16} /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={itemVariants} className="flex justify-between items-center px-1">
                 <div className="flex items-center gap-2 group cursor-pointer">   
                 </div>
                 <Link to="/forgot-password" size="sm" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E6FFFA] hover:text-white transition-all  underline decoration-white/20">
                    forgot password?
                 </Link>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2">
                 <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={loading}
                    className="py-5 text-sm font-black uppercase tracking-[0.4em] rounded-3xl bg-[#08665E] text-white hover:bg-[#0D9488] transition-all shadow-xl shadow-black/10"
                 >
                    Login
                 </Button>
              </motion.div>
            </form>

            <motion.p variants={itemVariants} className="text-center text-[12px] font-black text-white/80 uppercase  pt-5">
              Don't have an account?{' '}
              <Link to={ROUTES.SIGNUP} className="text-white hover:text-[#E6FFFA] transition-all underline underline-offset-8 decoration-white/10">
                Sign up  
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
