import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, Save } from 'lucide-react';
import { Button, Input } from '../../components/common';
import authService from '../../services/authService';
import { ROUTES } from '../../constants/routes';
import toast from 'react-hot-toast';
import medicalImage from '../../assets/login.png';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const otp = location.state?.otp;

  // Redirect if accessed directly without email/otp
  if (!email || !otp) {
    return <Link to={ROUTES.LOGIN}>Session expired. Back to Login.</Link>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email, otp, password);
      toast.success('Password updated successfully!');
      setTimeout(() => navigate(ROUTES.LOGIN), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E1F2F1] p-4 md:p-10 font-body transition-colors duration-500">
      <div className="w-full max-w-6xl h-full min-h-[700px] flex flex-col lg:flex-row bg-[#0D9488] rounded-[40px] shadow-[0_20px_60px_-15px_rgba(13,148,136,0.3)] overflow-hidden relative">
        
        {/* Visual Side Panel */}
        <div className="w-full lg:w-[45%] h-64 lg:h-auto bg-[#E6FFFA]/80 relative overflow-hidden flex items-center justify-center p-12">
          <img src={medicalImage} alt="Healthcare" className="w-full h-full object-contain scale-110 drop-shadow-2xl z-10" />
          <div className="hidden lg:block absolute top-0 -right-1 h-full w-24 z-20">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full fill-[#0D9488]">
              <path d="M100 0 C 40 20, 40 80, 100 100 L 100 100 L 100 0 Z" />
            </svg>
          </div>
        </div>

        {/* Form Panel */}
        <div className="w-full lg:w-[55%] flex flex-col justify-center p-8 lg:p-20 relative text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto space-y-10">
            <div className="space-y-1">
              <h2 className="text-3xl font-heading font-bold text-teal-50">New Password</h2>
              <p className="text-lg font-heading text-teal-50/70">Secure your account :)</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                placeholder="••••••••"
                required
                className="bg-transparent border-white/20 text-white placeholder:text-white/30 h-16 rounded-3xl"
              />
              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={ShieldCheck}
                placeholder="••••••••"
                required
                className="bg-transparent border-white/20 text-white placeholder:text-white/30 h-16 rounded-3xl"
              />

              <div className="flex items-center justify-between px-2">
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white flex items-center gap-2">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />} {showPassword ? 'Hide' : 'Show'} Password
                 </button>
              </div>

              <Button type="submit" loading={loading} className="py-5 text-sm font-black uppercase rounded-3xl bg-[#08665E] text-white hover:bg-[#0D9488] shadow-xl">
                Reset Password <Save size={16} className="ml-3" />
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
