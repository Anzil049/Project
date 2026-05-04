import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, Lock, User, ArrowRight, ShieldCheck, 
  CheckCircle2, Stethoscope, FileText, Briefcase, LogIn
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

const doctorSignupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  licenseNumber: z.string().min(5, 'Valid license number is required'),
  specialization: z.string().min(2, 'Specialization is required'),
  experience: z.string().regex(/^\d+$/, 'Experience must be a valid positive number').min(1, 'Years of experience is required'),
  password: z.string().min(8, 'Minimum 8 characters required'),
  confirmPassword: z.string(),
  certificate: z.any().refine((files) => files?.length > 0, "Professional certificate is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const DoctorSignup = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(doctorSignupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      licenseNumber: '',
      specialization: '',
      experience: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', data.fullName);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('role', 'doctor');
      formData.append('licenseNumber', data.licenseNumber);
      formData.append('specialization', data.specialization);
      formData.append('experience', data.experience);
      if (data.certificate[0]) {
        formData.append('certificate', data.certificate[0]);
      }

      await authService.signup('doctor', formData);
      
      toast.success('Registration successful. Professional identity under review.');
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
             <p className="text-[#0D9488]/40 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Professional Network</p>
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
               <motion.h2 variants={itemVariants} className="text-3xl font-heading font-bold text-teal-50">Hello Doctor!</motion.h2>
               <motion.p variants={itemVariants} className="text-lg font-heading text-teal-50/70">Join our specialist network :)</motion.p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7 relative">
                <Input
                  label="Full Name"
                  {...register('fullName')}
                  error={errors.fullName?.message}
                  icon={User}
                  placeholder="Dr. Johnathan Smith"
                  className="h-14 rounded-3xl"
                />

                <Input
                  label="Medical Email"
                  {...register('email')}
                  error={errors.email?.message}
                  icon={Mail}
                  placeholder="dr.smith@medcare.com"
                  className="h-14 rounded-3xl"
                />

                <Input
                  label="License Number"
                  {...register('licenseNumber')}
                  error={errors.licenseNumber?.message}
                  icon={ShieldCheck}
                  placeholder="MD-9421-432"
                  className="h-14 rounded-3xl"
                />

                <Input
                  label="Specialization"
                  {...register('specialization')}
                  error={errors.specialization?.message}
                  icon={Stethoscope}
                  placeholder="Cardiologist"
                  className="h-14 rounded-3xl"
                />

                <Input
                  label="Experience (Years)"
                  {...register('experience')}
                  error={errors.experience?.message}
                  icon={Briefcase}
                  placeholder="12"
                  className="h-14 rounded-3xl"
                />

                <div className="hidden md:block"></div>

                <Input
                  label="Password"
                  type="password"
                  {...register('password')}
                  error={errors.password?.message}
                  icon={Lock}
                  placeholder="xxxxxxxx"
                  className="h-14 rounded-3xl"
                />
                
                <Input
                  label="Confirm"
                  type="password"
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  icon={ShieldCheck}
                  placeholder="xxxxxxxx"
                  className="h-14 rounded-3xl"
                />

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-teal-50/40 ml-4 mb-2 block">Doctor Certificate (PDF/Image)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                      <FileText className="h-5 w-5 text-teal-50/40 group-focus-within:text-white transition-colors" />
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      {...register('certificate')}
                      className={`w-full h-14 rounded-3xl bg-white/10 border ${errors.certificate ? 'border-red-400' : 'border-white/10'} text-white pl-14 pr-6 py-4 outline-none focus:border-white transition-all cursor-pointer file:hidden`}
                    />
                  </div>
                  {errors.certificate && <p className="text-[10px] text-red-200 ml-4 font-bold uppercase tracking-tighter mt-1">{errors.certificate.message}</p>}
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
                      Complete Registration
                    </Button>
              </motion.div>
            </form>

            <motion.p variants={itemVariants} className="text-center text-[12px] font-black uppercase text-white/80 pt-5">
              Already a provider?{' '}
              <Link to={ROUTES.LOGIN} className="text-white underline underline-offset-8 decoration-white/10 hover:text-[#E6FFFA] transition-all">
                Sign In
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSignup;
