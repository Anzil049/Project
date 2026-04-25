import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, Send, CheckCircle, ShieldAlert } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { ROUTES } from '../../constants/routes';
import medicalImage from '../../assets/login.png';
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmitted(true);
    setLoading(false);
    
    // Redirect after 2s or allow manual click
    setTimeout(() => {
       navigate('/verify-otp', { state: { email, type: 'recovery' } });
    }, 2000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } }
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
             <h3 className="text-2xl font-heading font-black text-[#0D9488] opacity-80">RESET</h3>
             <div className="w-8 h-1 bg-[#0D9488] mt-2 rounded-full opacity-60" />
          </motion.div>
        </div>

        {/* Right Side: Recovery Form */}
        <div className="w-full lg:w-[55%] flex flex-col justify-center p-8 lg:p-20 relative text-white">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div 
                key="form"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-md mx-auto space-y-10"
              >
                <div className="space-y-1">
                   <motion.h2 variants={itemVariants} className="text-3xl font-heading font-bold text-teal-50">Forgot Password?</motion.h2>
                   <motion.p variants={itemVariants} className="text-lg font-heading text-teal-50/70">Enter your email :)</motion.p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <motion.div variants={itemVariants}>
                    <Input
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      icon={Mail}
                      placeholder="name@example.com"
                      required
                      className="bg-transparent border-white/20 text-white placeholder:text-white/30 h-16 rounded-3xl focus:border-white"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      loading={loading}
                      className="py-5 text-sm font-black uppercase rounded-3xl bg-[#08665E] text-white hover:bg-[#0D9488] transition-all shadow-xl shadow-black/10"
                    >
                      Request OTP <Send size={16} className="ml-3" />
                    </Button>
                  </motion.div>
                </form>

                <motion.div variants={itemVariants} className="pt-6">
                  <Link to={ROUTES.LOGIN} className="flex items-center gap-2 text-[12px] font-black uppercase text-white/80 hover:text-white transition-all underline decoration-white/20">
                     <ArrowLeft size={16} /> Back to Login
                  </Link>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-10"
              >
                <div className="w-24 h-24 bg-teal-300 rounded-full flex items-center justify-center mx-auto text-[#0D9488] shadow-[0_0_50px_rgba(20,184,166,0.3)]">
                   <CheckCircle size={48} />
                </div>
                <div className="space-y-3">
                   <h3 className="text-3xl font-heading font-black tracking-tight">Email Sent!</h3>
                   <p className="text-sm font-bold opacity-60 max-w-xs mx-auto">
                     An OTP has been sent to <span className="text-teal-200">{email}</span>. 
                     Syncing you to the login page...
                   </p>
                </div>
                
                <div className="w-12 h-1 bg-teal-300/30 mx-auto rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ x: "-100%" }}
                     animate={{ x: "0%" }}
                     transition={{ duration: 2 }}
                     className="w-full h-full bg-teal-300" 
                   />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
