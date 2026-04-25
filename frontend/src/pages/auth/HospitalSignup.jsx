import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, Lock, User, ArrowRight, ShieldCheck, 
  Building2, Hospital, Users, LogIn, FileText
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

const hospitalSignupSchema = z.object({
  hospitalName: z.string().min(3, 'Hospital name must be at least 3 characters'),
  adminEmail: z.string().email('Invalid email address'),
  regNumber: z.string().min(5, 'Registration number is required'),
  facilityType: z.string().min(2, 'Facility type is required (e.g. Multi-Specialty)'),
  bedCapacity: z.string().min(1, 'Approximate bed capacity is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const HospitalSignup = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(hospitalSignupSchema),
    defaultValues: {
      hospitalName: '',
      adminEmail: '',
      regNumber: '',
      facilityType: '',
      bedCapacity: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.signup({
        name: data.hospitalName,
        email: data.adminEmail,
        password: data.password,
        role: 'hospital',
        hospitalDetails: {
          registrationNumber: data.regNumber,
          facilityType: data.facilityType,
          beds: data.bedCapacity
        }
      });
      
      toast.success('Registration successful. Hospital verification initiated.');
      navigate('/verify-otp', { state: { email: data.adminEmail, type: 'registration' } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Hospital registration failed.');
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
        
        {/* Visual Side Panel (Shared with Login) */}
        <div className="w-full lg:w-[45%] h-64 lg:h-auto bg-[#E6FFFA]/80 relative overflow-hidden flex items-center justify-center p-12">
          <img 
            src={medicalImage} 
            alt="Healthcare Illustration" 
            className="w-full h-full object-contain scale-110 drop-shadow-2xl z-10"
          />
          
          {/* Vertical Wave Divider */}
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
             <p className="text-[#0D9488]/40 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Hospital Network</p>
             <div className="w-8 h-1 bg-[#0D9488] mt-2 rounded-full opacity-60" />
          </motion.div>
        </div>

        {/* Right Side: Form & Content */}
        <div className="w-full lg:w-[55%] flex flex-col justify-center p-8 lg:p-20 relative text-white">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-2xl mx-auto space-y-8"
          >
            <div className="space-y-1">
               <motion.h2 variants={itemVariants} className="text-3xl font-heading font-bold text-teal-50">Registration</motion.h2>
               <motion.p variants={itemVariants} className="text-lg font-heading text-teal-50/70">Register your healthcare facility :)</motion.p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7 relative">
                <Input
                  label="Hospital Name"
                  {...register('hospitalName')}
                  error={errors.hospitalName?.message}
                  icon={Building2}
                  placeholder="Apollo Indraprastha"
                  className="h-14 rounded-3xl"
                />

                <Input
                  label="Administrator Email"
                  {...register('adminEmail')}
                  error={errors.adminEmail?.message}
                  icon={Mail}
                  placeholder="admin@apollo.com"
                  className="h-14 rounded-3xl"
                />

                <Input
                  label="Registration Number"
                  {...register('regNumber')}
                  error={errors.regNumber?.message}
                  icon={FileText}
                  placeholder="CERT-DEL-2024"
                  className="h-14 rounded-3xl"
                />

                <Input
                  label="Facility Type"
                  {...register('facilityType')}
                  error={errors.facilityType?.message}
                  icon={Hospital}
                  placeholder="Multi-Specialty"
                  className="h-14 rounded-3xl"
                />

                <Input
                  label="Total Bed Capacity"
                  {...register('bedCapacity')}
                  error={errors.bedCapacity?.message}
                  icon={Users}
                  placeholder="500+"
                  className="h-14 rounded-3xl"
                />

                <div className="hidden md:block"></div>

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
                  label="Confirm"
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  icon={ShieldCheck}
                  placeholder="xxxxxxxx"
                  className="h-14 rounded-3xl"
                />
              </div>

              <motion.div variants={itemVariants} className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      loading={loading}
                      className="py-5 text-sm font-black uppercase tracking-[0.4em] rounded-3xl bg-[#08665E] text-white hover:bg-[#0D9488] transition-all shadow-xl shadow-black/10"
                    >
                      Complete Registration
                    </Button>
              </motion.div>
            </form>

            <motion.p variants={itemVariants} className="text-center text-[12px] font-black uppercase text-white/80 pt-5">
              Already registered?{' '}
              <Link to={ROUTES.LOGIN} className="text-white underline underline-offset-8 decoration-white/10 hover:text-[#E6FFFA] transition-all">
                Login System
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HospitalSignup;
