import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../components/common';
import authService from '../../services/authService';
import { ROUTES } from '../../constants/routes';
import toast from 'react-hot-toast';
import medicalImage from '../../assets/login.png';

const VerifyOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'user@example.com';
  const type = location.state?.type || '2fa';

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      setError('Please enter the full 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.verifyOtp(email, otpValue, type);
      setSuccess(true);
      toast.success('Identity verified successfully!');
      setTimeout(() => {
        navigate(type === 'recovery' ? '/reset-password' : ROUTES.PATIENT.DASHBOARD);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification OTP. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.resendOtp(email, type);
      setTimer(60);
      toast.success('New verification OTP dispatched.');
    } catch (err) {
      toast.error('Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E1F2F1] p-4 md:p-10 font-body transition-colors duration-500">
      
      <div className="w-full max-w-6xl h-full min-h-[700px] flex flex-col lg:flex-row bg-[#0D9488] rounded-[40px] shadow-[0_20px_60px_-15px_rgba(13,148,136,0.3)] overflow-hidden relative">
        
        {/* Visual Side Panel */}
        <div className="w-full lg:w-[45%] h-64 lg:h-auto bg-[#E6FFFA]/80 relative overflow-hidden flex items-center justify-center p-12">
          <img 
            src={medicalImage} 
            alt="Healthcare Illustration" 
            className="w-full h-full object-contain scale-110 drop-shadow-2xl z-10"
          />
          
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
             <h3 className="text-2xl font-heading font-black text-[#0D9488] opacity-80">OTP</h3>
             <div className="w-8 h-1 bg-[#0D9488] mt-2 rounded-full opacity-60" />
          </motion.div>
        </div>

        {/* OTP Panel */}
        <div className="w-full lg:w-[55%] flex flex-col justify-center p-8 lg:p-20 relative text-white">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-lg mx-auto space-y-12"
          >
            <AnimatePresence mode="wait">
              {!success ? (
                <motion.div key="verify" className="space-y-12">
                   <div className="space-y-1">
                      <motion.h2 variants={itemVariants} className="text-3xl font-heading font-bold text-teal-50">Verify OTP</motion.h2>
                      <motion.p variants={itemVariants} className="text-lg font-heading text-teal-50/70">Enter your code :)</motion.p>
                   </div>

                   <form onSubmit={handleVerify} className="space-y-10">
                      <motion.div variants={itemVariants} className="flex justify-between gap-2 md:gap-4">
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={el => inputRefs.current[idx] = el}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(e, idx)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            className="w-full aspect-square text-center text-2xl font-black bg-white/10 border-2 border-white/20 rounded-2xl focus:border-white focus:bg-white/20 transition-all outline-none"
                          />
                        ))}
                      </motion.div>

                      {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-100 bg-red-500/20 px-4 py-3 rounded-2xl border border-red-500/30 text-xs font-bold">
                           <AlertCircle size={16} /> {error}
                        </motion.div>
                      )}

                      <motion.div variants={itemVariants}>
                        <Button
                          type="submit"
                          loading={loading}
                          className="py-5 text-sm font-black uppercase rounded-3xl bg-[#08665E] text-white hover:bg-[#0D9488] transition-all shadow-xl shadow-black/10"
                        >
                          Verify <ArrowRight size={18} className="ml-3" />
                        </Button>
                      </motion.div>
                   </form>

                   <motion.div variants={itemVariants} className="flex items-center justify-between text-[12px] font-black uppercase text-white/80 px-2 mt-4">
                      <button 
                        onClick={handleResend}
                        disabled={timer > 0 || resending}
                        className={`flex items-center gap-2 transition-all duration-300 ${timer > 0 ? 'text-white/50 cursor-not-allowed' : 'text-teal-50 hover:text-white'}`}
                      >
                        <RefreshCw size={14} className={resending ? 'animate-spin' : ''} /> Resend OTP
                      </button>
                      <span className={timer > 0 ? 'text-white/50' : 'text-teal-200'}>
                        {timer > 0 ? `Retry in ${timer}s` : 'Ready to resend'}
                      </span>
                   </motion.div>
                </motion.div>
              ) : (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8">
                   <div className="w-24 h-24 bg-teal-300 rounded-full flex items-center justify-center mx-auto text-[#0D9488]">
                      <CheckCircle size={48} />
                   </div>
                   <h3 className="text-3xl font-heading font-black">Verified</h3>
                   <p className="text-sm font-bold opacity-60 text-teal-50">Verification successful. Redirecting...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
