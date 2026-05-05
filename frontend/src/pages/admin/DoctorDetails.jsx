import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge } from '../../components/common';
import { 
  Stethoscope, Building2, Mail, Phone, Calendar, 
  Award, Shield, ArrowLeft, Star, User, MapPin
} from 'lucide-react';
import adminService from '../../services/adminService';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminDoctorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchDoctorDetails();
  }, [id]);

  const fetchDoctorDetails = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDoctorDetails(id);
      setDoctor(data);
    } catch (error) {
      console.error('Failed to fetch doctor details:', error);
      toast.error('Failed to load doctor profile');
      navigate('/admin/doctors');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    try {
      const response = await adminService.toggleUserStatus(doctor._id);
      setDoctor(prev => ({ ...prev, status: response.status }));
      toast.success(response.message);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const toggleFeatured = async () => {
    try {
      const response = await adminService.toggleFeatured('doctor', doctor._id);
      setDoctor(prev => ({ 
        ...prev, 
        profile: { ...prev.profile, isFeatured: response.isFeatured } 
      }));
      toast.success(response.message);
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };
  
  const handleDownloadCert = async () => {
    if (!doctor.certificate) return;
    
    try {
      setDownloading(true);
      const response = await api.get(`/admin/download-certificate?url=${encodeURIComponent(doctor.certificate)}`, {
        responseType: 'blob'
      });
      
      const contentType = response.headers['content-type'] || 'application/pdf';
      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Open in new tab
      window.open(blobUrl, '_blank');
      
      // Cleanup (optional, but good practice)
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error('Failed to view certificate:', error);
      toast.error('Failed to access certificate. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Doctor Details" role="admin">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0D9488]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!doctor) return null;

  return (
    <DashboardLayout title="Practitioner Profile" role="admin">
      <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Back Button & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/admin/doctors')}
            className="flex items-center gap-2 text-navy/40 hover:text-[#0D9488] font-bold transition-colors group"
          >
            <div className="p-2 rounded-xl bg-white border border-gray-100 group-hover:border-[#0D9488]/30 transition-all shadow-sm">
              <ArrowLeft size={18} />
            </div>
            <span className="text-sm">Back to Registry</span>
          </button>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              onClick={toggleFeatured}
              variant={doctor.profile?.isFeatured ? 'outline' : 'secondary'}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 h-11 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${doctor.profile?.isFeatured ? 'border-yellow-200 bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : ''}`}
            >
              <Star size={16} fill={doctor.profile?.isFeatured ? 'currentColor' : 'none'} />
              {doctor.profile?.isFeatured ? 'Featured' : 'Make Featured'}
            </Button>

            <Button
              onClick={toggleStatus}
              variant={doctor.status === 'active' ? 'danger' : 'outline'}
              className="flex-1 md:flex-none h-11 px-6 rounded-2xl font-black text-xs uppercase tracking-widest"
            >
              <Shield size={16} className="mr-2" />
              {doctor.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Avatar & Basic Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-8 text-center border-gray-100 shadow-xl rounded-[40px] bg-white relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0D9488] to-[#0f766e]"></div>
              
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 rounded-[32px] bg-navy/5 flex items-center justify-center mx-auto overflow-hidden border-4 border-white shadow-lg transition-transform group-hover:scale-105 duration-500">
                  {doctor.image ? (
                    <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-navy/20" />
                  )}
                </div>
                {doctor.status === 'active' && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#0D9488] border-4 border-white rounded-full flex items-center justify-center shadow-md">
                    <CheckCircle size={14} className="text-white" />
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-black text-navy mb-1">{doctor.name}</h2>
              <p className="text-[#0D9488] font-bold text-sm uppercase tracking-wider mb-6">
                {doctor.profile?.specialization || 'General Practitioner'}
              </p>

              <div className="flex flex-wrap justify-center gap-2 mb-8">
                <Badge variant={doctor.status === 'active' ? 'success' : 'danger'} className="px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
                  {doctor.status}
                </Badge>
                {doctor.profile?.isFeatured && (
                  <Badge className="bg-yellow-50 text-yellow-600 border border-yellow-100 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
                    Featured
                  </Badge>
                )}
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-50">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center shrink-0">
                    <Mail size={18} className="text-navy/40" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-navy/30 uppercase tracking-widest">Email Address</p>
                    <p className="text-sm font-bold text-navy truncate max-w-[180px]">{doctor.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center shrink-0">
                    <Phone size={18} className="text-navy/40" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-navy/30 uppercase tracking-widest">Contact Phone</p>
                    <p className="text-sm font-bold text-navy">{doctor.phone || 'Not Provided'}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Affiliated Hospital */}
            <Card className="p-6 border-gray-100 shadow-lg rounded-[32px] bg-white">
              <h4 className="text-[10px] font-black text-navy/30 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Building2 size={14} className="text-[#0D9488]" /> Primary Affiliation
              </h4>
              {doctor.profile?.hospitalId ? (
                <div className="group cursor-pointer">
                  <p className="text-lg font-black text-navy group-hover:text-[#0D9488] transition-colors">
                    {doctor.profile.hospitalId.name}
                  </p>
                  <p className="text-xs font-bold text-navy/40 mt-1">{doctor.profile.hospitalId.email}</p>
                  <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-[#0D9488] uppercase tracking-widest">
                    <span>View Hospital Details</span>
                    <ArrowLeft size={12} className="rotate-180" />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                  <p className="text-xs font-bold text-navy/40 italic">Independent Practitioner</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Professional Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Experience & License */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 border-gray-100 shadow-lg rounded-[32px] bg-white group hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Award size={24} className="text-orange-500" />
                </div>
                <p className="text-[10px] font-black text-navy/30 uppercase tracking-widest mb-1">Clinical Experience</p>
                <h4 className="text-xl font-black text-navy">{doctor.profile?.experience || 'N/A'} Years</h4>
              </Card>

              <Card className="p-6 border-gray-100 shadow-lg rounded-[32px] bg-white group hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield size={24} className="text-blue-500" />
                </div>
                <p className="text-[10px] font-black text-navy/30 uppercase tracking-widest mb-1">Medical License No.</p>
                <h4 className="text-xl font-black text-navy tracking-tight">{doctor.profile?.licenseNumber || 'N/A'}</h4>
              </Card>
            </div>

            {/* Account Metadata */}
            <Card className="p-8 border-gray-100 shadow-xl rounded-[40px] bg-white">
              <h3 className="text-xl font-black text-navy mb-8 border-b border-gray-50 pb-4">Professional Overview</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                      <Stethoscope size={20} className="text-purple-500" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-navy uppercase tracking-wider mb-1">Specialization Area</h5>
                      <p className="text-sm font-bold text-navy/60 leading-relaxed">
                        Expertise in {doctor.profile?.specialization}. Certified to handle complex clinical cases within this domain.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                      <Calendar size={20} className="text-green-500" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-navy uppercase tracking-wider mb-1">Registration Date</h5>
                      <p className="text-sm font-bold text-navy/60">
                        Joined MedCare on {new Date(doctor.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="p-6 bg-navy/[0.02] rounded-[32px] border border-navy/5">
                      <h5 className="text-[10px] font-black text-navy/40 uppercase tracking-[0.2em] mb-4">Availability Overview</h5>
                      <div className="flex flex-wrap gap-2">
                        {doctor.profile?.availableDays?.length > 0 ? (
                          doctor.profile.availableDays.map(day => (
                            <span key={day} className="px-3 py-1 bg-white border border-navy/5 rounded-lg text-[10px] font-black text-navy shadow-sm uppercase tracking-widest">
                              {day.substring(0, 3)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs font-bold text-navy/20 italic">Not configured yet</span>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-navy/5">
                         <p className="text-[10px] font-bold text-navy/60 uppercase tracking-widest flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></div>
                           {doctor.profile?.onlineConsultation ? 'Telemedicine Active' : 'In-person Only'}
                         </p>
                      </div>
                   </div>
                </div>
              </div>

              {/* Identity Verification */}
              <div className="mt-8 p-6 bg-orange-50/30 rounded-[32px] border border-orange-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-orange-200 flex items-center justify-center shrink-0 shadow-sm">
                    <ShieldCheck size={24} className="text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-black text-navy">
                      {doctor.profile?.hospitalId ? 'Verified by Hospital' : 'Identity & License Verified'}
                    </h5>
                    <p className="text-xs font-bold text-navy/40">
                      {doctor.profile?.hospitalId 
                        ? `This practitioner has been verified and added by ${doctor.profile.hospitalId.name}.`
                        : `Credential check completed on ${new Date(doctor.createdAt).toLocaleDateString()}. Certificate on file.`
                      }
                    </p>
                  </div>
                  {doctor.certificate && (
                    <Button 
                      onClick={handleDownloadCert}
                      variant="outline" 
                      loading={downloading}
                      className="text-[10px] font-black uppercase tracking-widest h-9 bg-white"
                    >
                      {downloading ? 'Fetching...' : 'View Cert'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Helper icon component since ShieldCheck wasn't in the initial imports
const ShieldCheck = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);

const CheckCircle = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

export default AdminDoctorDetails;
