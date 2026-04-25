import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, Lock, User, ArrowRight, ShieldCheck, 
  CheckCircle2, AlertCircle, Heart, Facebook, Twitter, LogIn
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Input } from '../../components/common';
import authService from '../../services/authService';
import useAuthStore from '../../store/authStore';
import { ROUTES } from '../../constants/routes';
import toast from 'react-hot-toast';
import medicalImage from '../../assets/login.png';
import { Eye, EyeOff } from 'lucide-react';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  bloodGroup: z.string().min(1, 'Please select a blood group'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      bloodGroup: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await authService.signup({
        name: data.fullName,
        email: data.email,
        password: data.password,
        bloodGroup: data.bloodGroup,
        role: 'patient'
      });
      
      toast.success('Registration successful. Verify your identity.');
      // After signup, redirect to OTP verification if required
      navigate('/verify-otp', { state: { email: data.email, type: 'registration' } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
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
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E1F2F1] p-4 md:p-10 font-body transition-colors duration-500">
      
      <div className="w-full max-w-6xl h-full min-h-[700px] flex flex-col lg:flex-row bg-[#0D9488] rounded-[40px] shadow-[0_20px_60px_-15px_rgba(13,148,136,0.3)] overflow-hidden relative">
        
        {/* Left Side: Medical Illustration & Wave (Consistent with Login/Signup) */}
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
             <h3 className="text-2xl font-heading font-black text-[#0D9488] opacity-80 tracking-widest">JOIN US</h3>
             <div className="w-8 h-1 bg-[#0D9488] mt-2 rounded-full opacity-60" />
          </motion.div>
        </div>

        {/* Form Panel */}
        <div className="w-full lg:w-[55%] flex flex-col justify-center p-8 lg:p-20 relative text-white">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-lg mx-auto space-y-8"
          >
            <div className="space-y-1">
               <motion.h2 variants={itemVariants} className="text-3xl font-heading font-bold text-teal-50">Hello!</motion.h2>
               <motion.p variants={itemVariants} className="text-lg font-heading text-teal-50/70">Create an account :)</motion.p>
            </div>

            {/* Social Link Header */}
            <motion.div variants={itemVariants} className="flex gap-4">
               <button className="flex-1 flex items-center justify-center gap-3 bg-white/10 border border-white/20 py-3.5 px-4 rounded-full text-xs font-bold hover:bg-white/20 transition-all text-white">
                  <img src="https://www.vectorlogo.zone/logos/google/google-icon.svg" className="w-4 h-4 bg-white rounded-full" alt="Google" />
                  Sign up with Google
               </button>
            </motion.div>

            <motion.div variants={itemVariants} className="relative py-2 flex items-center">
               <div className="flex-1 border-t border-white/10"></div>
               <span className="px-4 text-[12px] font-black uppercase text-white/30 ">or</span>
               <div className="flex-1 border-t border-white/10"></div>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                <Input
                  label="Name"
                  {...register('fullName')}
                  error={errors.fullName?.message}
                  icon={User}
                  placeholder="Johnathan"
                  className="h-14 rounded-3xl"
                />

                <Input
                  label="Email"
                  {...register('email')}
                  error={errors.email?.message}
                  icon={Mail}
                  placeholder="john@example.com"
                  className="h-14 rounded-3xl"
                />

                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  error={errors.password?.message}
                  icon={Lock}
                  placeholder="xxxxxxxx"
                  className="h-14 rounded-3xl"
                />
                
                <Input
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  icon={ShieldCheck}
                  placeholder="xxxxxxxx"
                  className="h-14 rounded-3xl"
                />

                <div className="space-y-1 relative">
                  <label className="text-xs font-black uppercase tracking-widest text-teal-50/40 ml-4 mb-2 block">Blood Group</label>
                  <select
                    {...register('bloodGroup')}
                    className={`w-full h-14 rounded-3xl bg-white/10 border ${errors.bloodGroup ? 'border-red-400' : 'border-white/10'} text-white px-6 outline-none focus:border-white transition-all appearance-none cursor-pointer font-bold text-sm`}
                  >
                    <option value="" className="bg-[#0D9488]">Select Group</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg} className="bg-[#0D9488]">{bg}</option>
                    ))}
                  </select>
                  {errors.bloodGroup && <p className="text-[10px] text-red-200 ml-4 font-bold uppercase tracking-tighter mt-1">{errors.bloodGroup.message}</p>}
                </div>
              </div>

              <motion.div variants={itemVariants} className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      loading={loading}
                      className="py-5 text-sm font-black uppercase tracking-[0.4em] rounded-3xl bg-[#08665E] text-white hover:bg-[#0D9488] transition-all shadow-xl shadow-black/10"
                    >
                      Sign Up
                    </Button>
              </motion.div>
            </form>

            <motion.p variants={itemVariants} className="text-center text-[12px] font-black uppercase text-white/80 pt-5">
              Already have an account?{' '}
              <Link to={ROUTES.LOGIN} className="text-white underline underline-offset-8 decoration-white/10 hover:text-[#E6FFFA] transition-all">
                Login
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
