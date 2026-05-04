import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertCircle } from 'lucide-react';
import { Button, Input } from '../../components/common';
import authService from '../../services/authService';
import useAuthStore from '../../store/authStore';
import { ROUTES } from '../../constants/routes';
import medicalImage from '../../assets/login.png';
import toast from 'react-hot-toast';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { user, login } = useAuthStore();

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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      // Create a specific endpoint for changing first login password
      await authService.changeFirstPassword(user.email, currentPassword, newPassword);
      
      toast.success('Password updated successfully!');
      
      // Update local state to remove isFirstLogin requirement
      login({ ...user, isFirstLogin: false });

      // Navigate to their dashboard
      switch (user.role) {
        case 'admin': navigate(ROUTES.ADMIN.DASHBOARD); break;
        case 'hospital': navigate(ROUTES.HOSPITAL.DASHBOARD); break;
        case 'doctor': navigate(ROUTES.DOCTOR.DASHBOARD); break;
        case 'patient': navigate(ROUTES.PATIENT.DASHBOARD); break;
        default: navigate(ROUTES.PATIENT.DASHBOARD); break;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to change password. Please check your current password.';
      setError(message);
    } finally {
      setLoading(false);
    }
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
             <h3 className="text-2xl font-heading font-black text-[#0D9488] opacity-80 tracking-widest">SECURITY</h3>
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
              <motion.h2 variants={itemVariants} className="text-3xl font-heading font-bold text-teal-50">Secure Account</motion.h2>
              <motion.p variants={itemVariants} className="text-lg font-heading text-teal-50/70">Please change your temporary password to continue.</motion.p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="space-y-5">
                 <motion.div variants={itemVariants}>
                    <Input
                       label="Current Password"
                       type="password"
                       value={currentPassword}
                       onChange={(e) => setCurrentPassword(e.target.value)}
                       icon={Lock}
                       placeholder="••••••••"
                       required
                       className="h-14 rounded-3xl"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Input
                       label="New Password"
                       type="password"
                       value={newPassword}
                       onChange={(e) => setNewPassword(e.target.value)}
                       icon={Lock}
                       placeholder="••••••••"
                       required
                       className="h-14 rounded-3xl"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Input
                       label="Confirm New Password"
                       type="password"
                       value={confirmPassword}
                       onChange={(e) => setConfirmPassword(e.target.value)}
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

              <motion.div variants={itemVariants} className="pt-2">
                 <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={loading}
                    className="py-5 text-sm font-black uppercase tracking-[0.4em] rounded-3xl bg-[#08665E] text-white hover:bg-[#0D9488] transition-all shadow-xl shadow-black/10"
                 >
                    Update Password
                 </Button>
              </motion.div>
            </form>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
