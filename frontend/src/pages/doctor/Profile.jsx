import React, { useState, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { Card, Button, Input, Avatar, Badge, LocationPicker } from '../../components/common';
import { 
  User, Mail, Phone, MapPin, CheckCircle2,
  Lock, Camera, Activity, FileText, UploadCloud,
  Stethoscope, CreditCard, Shield, Save, Video
} from 'lucide-react';

import authService from '../../services/authService';
import { toast } from 'react-hot-toast';
import { compressImage } from '../../utils/imageUtils';

const DoctorProfile = () => {
  const { user, updateUser } = useAuthStore();
  const isIndependent = !user?.doctorProfile?.hospitalId;
  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'professional', 'security'
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);
  const locationPickerRef = useRef(null);

  // Profile Form State initialized from real data
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.doctorProfile?.phone || user?.phone || '',
    about: user?.doctorProfile?.about || '',
    
    specialization: user?.doctorProfile?.specialization || '',
    experience: user?.doctorProfile?.experience || '',
    licenseNumber: user?.doctorProfile?.licenseNumber || '',
    fee: user?.doctorProfile?.fee || 500,
    
    onlineConsultation: user?.doctorProfile?.onlineConsultation,
    image: user?.image || null,
    latitude: user?.location?.coordinates?.[1] || null,
    longitude: user?.location?.coordinates?.[0] || null,
    clinicAddress: user?.doctorProfile?.address || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      handleInputChange('image', imageUrl);
      setAvatarFile(file);
    }
  };

  const toggleOnlineStatus = () => {
    if (!isEditing) return;
    handleInputChange('isOnlineActive', !profileData.isOnlineActive);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalImageUrl = profileData.image;

      if (avatarFile) {
        toast.loading('Compressing & Uploading profile picture...', { id: 'upload-avatar' });
        const compressed = await compressImage(avatarFile);
        finalImageUrl = await authService.uploadImage(compressed);
        toast.success('Profile picture uploaded', { id: 'upload-avatar' });
      }

      const updateData = {
        name: profileData.name,
        phone: profileData.phone,
        specialization: profileData.specialization,
        experience: profileData.experience,
        about: profileData.about,
        fee: profileData.fee,
        onlineConsultation: profileData.onlineConsultation,
        address: profileData.clinicAddress,
        image: finalImageUrl,
        location: (profileData.latitude && profileData.longitude && !isNaN(parseFloat(profileData.latitude)) && !isNaN(parseFloat(profileData.longitude))) ? {
          type: 'Point',
          coordinates: [parseFloat(profileData.longitude), parseFloat(profileData.latitude)]
        } : undefined
      };

      const result = await authService.updateProfile(updateData);
      updateUser(result);
      toast.success('Profile updated successfully');
      setAvatarFile(null);
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Doctor Profile" role="doctor">
      <div className="max-w-6xl mx-auto space-y-8 pb-20 font-body animate-in fade-in duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Profile <span className="text-[#0D9488]">Settings</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <User size={14} className="text-[#0D9488]" /> Manage your personal details and clinic configurations
            </p>
          </div>
          <div className="flex items-center gap-4">
             {isEditing ? (
               <>
                 <Button 
                   variant="outline"
                   onClick={() => setIsEditing(false)}
                   className="rounded-[20px] font-bold text-xs px-6 border-gray-200"
                 >
                   Discard
                 </Button>
                 <Button 
                   onClick={handleSave}
                   loading={isSaving}
                   className="bg-[#0D9488] text-white rounded-[20px] font-black text-xs px-8 shadow-xl shadow-[#0D9488]/20 border-none flex items-center gap-2"
                 >
                   <Save size={14} /> Save Changes
                 </Button>
               </>
             ) : (
               <Button 
                 onClick={() => setIsEditing(true)}
                 className="bg-navy text-white rounded-[20px] font-black text-xs px-8 shadow-lg shadow-navy/20 border-none"
               >
                 Edit Profile
               </Button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           
           {/* Sidebar Navigation */}
           <div className="lg:col-span-3 space-y-6">
              {/* Profile Overview Card */}
              <Card className="p-8 bg-white border border-gray-100 rounded-[40px] shadow-sm text-center">
                 <div className="relative inline-block mx-auto mb-6 group">
                   <div 
                      onClick={handleAvatarClick}
                      className={`relative w-28 h-28 rounded-full border-4 border-white shadow-xl shadow-navy/5 overflow-hidden flex items-center justify-center bg-gray-50 mx-auto ${isEditing ? 'cursor-pointer' : ''}`}
                    >
                      {profileData.image ? (
                         <img src={profileData.image} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                         <Avatar name={profileData.name} size="xl" className="w-full h-full text-3xl" />
                      )}
                      
                      {/* Edit Overlay */}
                      {isEditing && (
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={24} className="text-white" />
                         </div>
                      )}
                      <input 
                         type="file" 
                         ref={fileInputRef} 
                         className="hidden" 
                         accept="image/*"
                         onChange={handleFileChange}
                      />
                   </div>

                   {/* Online Status Dot */}
                   <div className={`absolute bottom-2 right-2 w-5 h-5 border-4 border-white rounded-full ${profileData.onlineConsultation ? 'bg-green-500' : 'bg-gray-400'}`} />
                 </div>

                 <h3 className="text-xl font-black text-navy leading-tight">Dr. {profileData.name}</h3>
                 <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-[0.2em] mt-1 mb-4">{profileData.specialization}</p>
                 
                 <Badge variant="success" className="mx-auto bg-green-50 text-green-600 border-none text-[9px] uppercase font-black px-3">
                    <CheckCircle2 size={12} className="mr-1 inline" /> Verified Medical Professional
                 </Badge>
              </Card>

              {/* Tabs */}
              <div className="flex flex-col gap-2">
                 <button 
                   onClick={() => setActiveTab('personal')}
                   className={`flex items-center gap-3 px-6 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${
                      activeTab === 'personal' ? 'bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/20' : 'text-navy/50 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100'
                   }`}
                 >
                    <User size={16} /> Personal Info
                 </button>
                 <button 
                   onClick={() => setActiveTab('professional')}
                   className={`flex items-center gap-3 px-6 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${
                      activeTab === 'professional' ? 'bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/20' : 'text-navy/50 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100'
                   }`}
                 >
                    <Stethoscope size={16} /> Professional
                 </button>
                 <button 
                   onClick={() => setActiveTab('security')}
                   className={`flex items-center gap-3 px-6 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${
                      activeTab === 'security' ? 'bg-navy text-white shadow-lg shadow-navy/20' : 'text-navy/50 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100'
                   }`}
                 >
                    <Shield size={16} /> Security
                 </button>
              </div>
           </div>

           {/* Main Form Content */}
           <div className="lg:col-span-9">
              <Card className="p-8 md:p-12 bg-white border border-gray-100 rounded-[48px] shadow-xl shadow-navy/5 min-h-[500px]">
                 
                 {/* Personal Info Tab */}
                 {activeTab === 'personal' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                       <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                          <div className="w-10 h-10 bg-[#0D9488]/10 rounded-2xl flex items-center justify-center text-[#0D9488]">
                             <User size={20} />
                          </div>
                          <div>
                             <h2 className="text-xl font-black text-navy">Personal Information</h2>
                             <p className="text-xs font-bold text-navy/40">Basic details and contact information</p>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <Input 
                                label="Full Name" 
                                value={profileData.name} 
                                disabled={!isEditing}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                            />
                          </div>
                          <Input 
                            label="Email Address" 
                            type="email"
                            icon={Mail}
                            value={profileData.email} 
                            disabled={!isEditing}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                          />
                          <Input 
                            label="Mobile Number" 
                            type="tel"
                            icon={Phone}
                            value={profileData.phone} 
                            disabled={!isEditing}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                          />
                           <div className="md:col-span-2">
                              <Input 
                                label="Clinic/Hospital Address" 
                                icon={MapPin}
                                value={profileData.clinicAddress} 
                                disabled={!isEditing || !isIndependent}
                                onChange={(e) => handleInputChange('clinicAddress', e.target.value)}
                              />
                           </div>
                        </div>

                        {/* Clinic Location Configuration */}
                        <div className="space-y-4 pt-6 border-t border-gray-50">
                           <div className="flex items-center justify-between">
                              <p className="text-[10px] font-black uppercase tracking-widest text-navy/30">Clinic Location (Map)</p>
                              <Badge variant="outline" className="text-[9px] font-black px-2 py-0.5">
                                 {profileData.latitude ? `${Number(profileData.latitude).toFixed(4)}, ${Number(profileData.longitude).toFixed(4)}` : 'NOT SET'}
                              </Badge>
                           </div>
                           
                           {!isIndependent && (
                              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
                                 <Shield size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                 <p className="text-[10px] font-bold text-amber-900/60 leading-relaxed">
                                    Location management is locked because you are affiliated with a hospital. Contact your hospital administrator to update facility coordinates.
                                 </p>
                              </div>
                           )}

                           <LocationPicker 
                              ref={locationPickerRef}
                              lat={profileData.latitude}
                              lng={profileData.longitude}
                              isEditing={isEditing && isIndependent}
                              onLocationSelect={(lat, lng, addressData) => {
                                 const updates = { 
                                    latitude: lat.toFixed(6), 
                                    longitude: lng.toFixed(6) 
                                 };
                                 if (addressData?.fullAddress) {
                                    updates.clinicAddress = addressData.fullAddress;
                                 }
                                 setProfileData(prev => ({ ...prev, ...updates }));
                              }}
                              hideLocateButton={true}
                           />

                           {isEditing && isIndependent && (
                              <Button 
                                 type="button"
                                 variant="outline"
                                 onClick={() => locationPickerRef.current?.handleLocateMe()}
                                 className="w-full py-3 rounded-xl border-dashed border-2 text-[9px] font-black uppercase"
                              >
                                 <MapPin size={12} className="mr-2" /> Detect Current Location
                              </Button>
                           )}
                        </div>
                     </div>
                 )}

                 {/* Professional Settings Tab */}
                 {activeTab === 'professional' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                       <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                                <Stethoscope size={20} />
                             </div>
                             <div>
                                <h2 className="text-xl font-black text-navy">Professional Settings</h2>
                                <p className="text-xs font-bold text-navy/40">Specializations, fees, and consultation preferences</p>
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          
                          {/* Column 1: Medical Details */}
                          <div className="space-y-6">
                             <Input 
                               label="Specialization" 
                               icon={Activity}
                               value={profileData.specialization} 
                               disabled={!isEditing}
                               onChange={(e) => handleInputChange('specialization', e.target.value)}
                             />
                             <Input 
                               label="Qualifications" 
                               icon={FileText}
                               value={profileData.qualifications} 
                               disabled={!isEditing}
                               onChange={(e) => handleInputChange('qualifications', e.target.value)}
                             />
                             <Input 
                               label="Years of Experience" 
                               value={profileData.experience} 
                               disabled={!isEditing}
                               onChange={(e) => handleInputChange('experience', e.target.value)}
                             />
                             <Input 
                               label="Medical License Number" 
                               icon={Shield}
                               value={profileData.licenseNumber} 
                               disabled={!isEditing}
                               onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                             />
                          </div>
                          
                          {/* Column 2: Configurations */}
                          <div className="space-y-6">
                             {/* Session Toggle Component - Only for Independent Doctors */}
                             {isIndependent ? (
                                <div className={`p-6 rounded-3xl border transition-all ${isEditing ? 'border-[#0D9488]/30 bg-[#0D9488]/5' : 'border-gray-100 bg-gray-50/50'}`}>
                                   <div className="flex items-center justify-between mb-4">
                                      <div className="flex flex-col gap-1">
                                         <h4 className="text-sm font-black text-navy flex items-center gap-2">
                                            <Video size={16} className={`${profileData.onlineConsultation ? 'text-[#0D9488]' : 'text-gray-400'}`} /> Online Sessions
                                         </h4>
                                         <p className="text-[10px] font-bold text-navy/40">Allow patients to book digital video consults.</p>
                                      </div>
                                      <button 
                                         type="button"
                                         onClick={() => handleInputChange('onlineConsultation', !profileData.onlineConsultation)}
                                         disabled={!isEditing}
                                         className={`w-12 h-6 rounded-full transition-all relative ${profileData.onlineConsultation ? 'bg-[#0D9488]' : 'bg-gray-300'}`}
                                      >
                                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${profileData.onlineConsultation ? 'left-7' : 'left-1'}`} />
                                      </button>
                                   </div>
                                   <Badge variant={profileData.onlineConsultation ? 'success' : 'default'} className="text-[9px] uppercase font-black px-2 py-1">
                                      {profileData.onlineConsultation ? 'ACTIVE FOR BOOKING' : 'CURRENTLY DISABLED'}
                                   </Badge>
                                </div>
                             ) : (
                                <div className="p-6 rounded-3xl border border-gray-100 bg-gray-50/50 opacity-60">
                                   <div className="flex flex-col gap-1">
                                      <h4 className="text-sm font-black text-navy flex items-center gap-2">
                                         <Video size={16} className="text-gray-400" /> Online Sessions
                                      </h4>
                                      <p className="text-[10px] font-bold text-navy/40 italic">Disabled for hospital-affiliated doctors.</p>
                                   </div>
                                </div>
                             )}
                            {/* Consultation Fees */}
                             <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-navy/60 pl-2">Base Consultation Fee (USD)</label>
                                <div className={`flex items-center border rounded-2xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[#0D9488]/20 focus-within:border-[#0D9488] ${!isEditing ? 'bg-gray-50 border-gray-100 opacity-70' : 'bg-white border-gray-200'}`}>
                                   <div className="pl-4 pr-3 text-navy/40">
                                      <CreditCard size={18} />
                                   </div>
                                   <span className="font-black text-navy text-lg">$</span>
                                   <input 
                                     type="number"
                                     value={profileData.fee}
                                     onChange={(e) => handleInputChange('fee', e.target.value)}
                                     disabled={!isEditing}
                                     className="flex-1 bg-transparent py-4 px-2 outline-none font-bold text-navy"
                                   />
                                </div>
                             </div>


                             
                             <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3 mt-4">
                                <Activity size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold text-blue-800 leading-relaxed">
                                   Your profile visibility on the patient network is determined by your verification status and activity. Ensure details are fully updated to maintain a top ranking.
                                </p>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {/* Security Tab */}
                 {activeTab === 'security' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                       <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                          <div className="w-10 h-10 bg-navy text-white rounded-2xl flex items-center justify-center">
                             <Lock size={20} />
                          </div>
                          <div>
                             <h2 className="text-xl font-black text-navy">Account Security</h2>
                             <p className="text-xs font-bold text-navy/40">Manage your password and platform access</p>
                          </div>
                       </div>

                       <div className="max-w-md space-y-6">
                          <Input 
                            label="Current Password" 
                            type="password"
                            icon={Lock}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                          />
                          <div className="pt-2" />
                          <Input 
                            label="New Password" 
                            type="password"
                            icon={Lock}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                          />
                          <Input 
                            label="Confirm New Password" 
                            type="password"
                            icon={CheckCircle2}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                          />
                          <Button className="w-full bg-navy text-white font-black text-xs rounded-2xl py-4 mt-4">
                             Update Password
                          </Button>
                       </div>
                    </div>
                 )}

              </Card>
           </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default DoctorProfile;
