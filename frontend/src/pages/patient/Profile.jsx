import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Input, Select, Badge, LocationPicker, Avatar } from '../../components/common';
import { 
  User, Mail, Phone, MapPin, 
  Shield, Camera, UploadCloud, X, Save,
  Activity, Heart, Droplets, PhoneCall, CheckCircle2, Lock
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

import authService from '../../services/authService';
import { toast } from 'react-hot-toast';
import { compressImage } from '../../utils/imageUtils';
import { isProfileComplete } from '../../utils/profileUtils';
import { AlertCircle } from 'lucide-react';
import { patientProfileSchema, zodErrorsToObject } from '../../utils/validationSchemas';

const PatientProfile = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);
  const locationPickerRef = useRef(null);
  const [errors, setErrors] = useState({});

  // Core structured data initialized from real user data
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatarImage: user?.image || null,
    bloodGroup: user?.bloodGroup || '',
    dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
    gender: user?.gender || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zip: user?.zip || '',
    
    chronicConditions: user?.chronicConditions || '',
    
    emgName: user?.emgName || '',
    emgRelation: user?.emgRelation || '',
    emgPhone: user?.emgPhone || '',
    
    latitude: user?.location?.coordinates?.[1] || null,
    longitude: user?.location?.coordinates?.[0] || null,
  });

  // Sync profile state if user data updates (e.g. from App.jsx session check)
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatarImage: user.image || null,
        bloodGroup: user.bloodGroup || '',
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
        gender: user.gender || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zip: user.zip || '',
        chronicConditions: user.chronicConditions || '',
        emgName: user.emgName || '',
        emgRelation: user.emgRelation || '',
        emgPhone: user.emgPhone || '',
        latitude: user.location?.coordinates?.[1] || null,
        longitude: user.location?.coordinates?.[0] || null,
      }));
    }
  }, [user]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfile(prev => ({ ...prev, avatarImage: url }));
      setAvatarFile(file);
    }
  };

  const removeImage = () => {
    setProfile(prev => ({ ...prev, avatarImage: null }));
    setAvatarFile(null);
  };

  const validateForm = () => {
    const result = patientProfileSchema.safeParse(profile);
    const newErrors = zodErrorsToObject(result);
    if (newErrors.latitude || newErrors.longitude) {
      newErrors.location = newErrors.latitude || newErrors.longitude || 'Please select your location on the map';
      delete newErrors.latitude;
      delete newErrors.longitude;
    }
    setErrors(newErrors);
    return newErrors;
  };

  const handleSave = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      const errorList = Object.values(validationErrors).join(', ');
      toast.error(`Please fix: ${errorList}`);
      return;
    }
    setIsSaving(true);
    try {
      let finalImageUrl = profile.avatarImage;

      if (avatarFile) {
        toast.loading('Compressing & Uploading profile picture...', { id: 'upload-avatar' });
        const compressed = await compressImage(avatarFile);
        finalImageUrl = await authService.uploadImage(compressed);
        toast.success('Profile picture uploaded', { id: 'upload-avatar' });
      }

      const updateData = {
        name: profile.name,
        phone: profile.phone,
        bloodGroup: profile.bloodGroup,
        dob: profile.dob,
        gender: profile.gender,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zip: profile.zip,
        emgName: profile.emgName,
        emgRelation: profile.emgRelation,
        emgPhone: profile.emgPhone,
        image: finalImageUrl,
        location: (profile.latitude && profile.longitude && !isNaN(parseFloat(profile.latitude)) && !isNaN(parseFloat(profile.longitude))) ? {
          type: 'Point',
          coordinates: [parseFloat(profile.longitude), parseFloat(profile.latitude)]
        } : undefined
      };

      const result = await authService.updateProfile(updateData);
      updateUser(result);
      setIsEditing(false);
      setAvatarFile(null);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="My Profile" role="patient">
      <div className="max-w-4xl mx-auto pb-20 font-body animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Personal <span className="text-[#0D9488]">Details</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <User size={14} className="text-[#0D9488]" /> Manage your health identity
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
                      className="bg-[#0D9488] text-white rounded-[20px] font-black text-xs px-8 shadow-xl shadow-[#0D9488]/20 border-none flex items-center gap-2 transition-all hover:scale-105"
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

        {!isProfileComplete(user) && (
          <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-[30px] flex items-start gap-4 animate-bounce-subtle">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-red-900">Incomplete Profile</h3>
              <p className="text-sm font-bold text-red-800/60 leading-relaxed">
                Some required fields are missing. Please complete all personal and residential details (including your location on the map) to unlock all dashboard features.
              </p>
            </div>
          </div>
        )}

        {/* Avatar Box */}
        <Card className="p-8 mb-8 bg-white border border-gray-100 rounded-[40px] shadow-2xl shadow-navy/5 flex flex-col sm:flex-row items-center gap-8">
           <div className="relative group shrink-0">
              <Avatar src={profile.avatarImage} name={profile.name} size="xl" className="border-4 border-white shadow-xl" />
              {isEditing && (
                <div className="absolute inset-0 bg-navy/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm z-10">
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-8 h-8 rounded-full bg-white text-[#0D9488] flex items-center justify-center hover:scale-110 transition-transform"
                    type="button"
                  >
                    <Camera size={14} />
                  </button>
                  {profile.avatarImage && (
                    <button 
                        onClick={removeImage} 
                        className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform"
                        type="button"
                    >
                        <X size={14} />
                    </button>
                  )}
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              <div className="absolute -bottom-3 -right-3 bg-white p-1 rounded-full shadow-lg border border-gray-50">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                   <Shield size={14} className="fill-green-100" />
                </div>
              </div>
           </div>
           
           <div className="text-center sm:text-left">
             <h2 className="text-3xl font-black text-navy tracking-tight mb-2">{profile.name}</h2>
             <p className="text-sm font-bold text-navy/40 flex items-center justify-center sm:justify-start gap-2 mb-4">
                <Mail size={14} /> {profile.email}
             </p>
             <Badge variant="success" className="bg-[#0D9488]/10 text-[#0D9488] border-none font-black text-[10px] px-3 uppercase tracking-widest">
                Patient Account
             </Badge>
           </div>
        </Card>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 mb-8 sticky top-[72px] z-20">
           <div className="flex overflow-x-auto hide-scrollbar">
              {['personal', 'emergency', 'security'].map((tab) => (
                 <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px] whitespace-nowrap ${
                       activeTab === tab 
                          ? 'border-[#0D9488] text-[#0D9488]' 
                          : 'border-transparent text-navy/40 hover:text-navy hover:bg-gray-50'
                    }`}
                 >
                    {tab}
                 </button>
              ))}
           </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
           {activeTab === 'personal' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Input label="Full Name" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} disabled={!isEditing} error={errors.name} />
                <Input label="Email Address" value={profile.email} disabled />
                <Input label="Phone Number" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} disabled={!isEditing} error={errors.phone} />
                <div className="grid grid-cols-2 gap-4">
                   <Input label="DOB" type="date" value={profile.dob} onChange={(e) => setProfile({...profile, dob: e.target.value})} disabled={!isEditing} error={errors.dob} />
                   <Select 
                      label="Gender" 
                      value={profile.gender} 
                      options={['Male', 'Female', 'Other']}
                      onChange={(e) => setProfile({...profile, gender: e.target.value})} 
                      disabled={!isEditing} 
                      error={errors.gender}
                   />
                </div>
                <Select 
                   label="Blood Group" 
                   value={profile.bloodGroup} 
                   options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
                   onChange={(e) => setProfile({...profile, bloodGroup: e.target.value})} 
                   disabled={!isEditing} 
                   error={errors.bloodGroup}
                />
                <div className="md:col-span-2">
                   <Input 
                      label="Address" 
                      value={profile.address} 
                      onChange={(e) => setProfile({...profile, address: e.target.value})}
                      disabled={!isEditing}
                      placeholder="Enter your street address"
                      error={errors.address}
                   />
                </div>
                <Input 
                   label="City" 
                   value={profile.city} 
                   onChange={(e) => setProfile({...profile, city: e.target.value})}
                   disabled={!isEditing}
                   placeholder="City"
                   error={errors.city}
                />
                <Input 
                   label="State" 
                   value={profile.state} 
                   onChange={(e) => setProfile({...profile, state: e.target.value})}
                   disabled={!isEditing}
                   placeholder="State"
                   error={errors.state}
                />

                {/* Location Picker Integrated */}
                <div className="md:col-span-2 pt-6 border-t border-gray-50 space-y-4">
                   <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-navy/30">Residential Location (Map)</p>
                      <Badge variant={errors.location ? "destructive" : "outline"} className="text-[9px] font-black px-2 py-0.5">
                         {profile.latitude ? `${Number(profile.latitude).toFixed(4)}, ${Number(profile.longitude).toFixed(4)}` : (errors.location ? 'REQUIRED' : 'NOT SET')}
                      </Badge>
                   </div>
                   {errors.location && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.location}</p>}
                   
                   <LocationPicker 
                        ref={locationPickerRef}
                        lat={profile.latitude}
                        lng={profile.longitude}
                        onLocationSelect={(lat, lng, addressData) => {
                           const updates = { 
                               latitude: lat.toFixed(6), 
                               longitude: lng.toFixed(6) 
                           };
                           if (addressData) {
                              if (addressData.city) updates.city = addressData.city;
                              if (addressData.state) updates.state = addressData.state;
                              if (addressData.zip) updates.zip = addressData.zip;
                              if (addressData.fullAddress) updates.address = addressData.fullAddress;
                           }
                           setProfile(prev => ({ ...prev, ...updates }));
                        }}
                        isEditing={isEditing}
                        hideLocateButton={true}
                     />

                    {isEditing && (
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => locationPickerRef.current?.handleLocateMe()}
                        className="w-full py-4 rounded-2xl border-dashed border-2 text-[10px] font-black uppercase tracking-widest"
                      >
                        <MapPin size={14} className="mr-2" /> Detect My Current Location
                      </Button>
                    )}
                </div>
             </div>
           )}

           {activeTab === 'emergency' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Input label="Contact Name" value={profile.emgName} onChange={(e) => setProfile({...profile, emgName: e.target.value})} disabled={!isEditing} error={errors.emgName} />
                <Input label="Relationship" value={profile.emgRelation} onChange={(e) => setProfile({...profile, emgRelation: e.target.value})} disabled={!isEditing} error={errors.emgRelation} />
                <Input label="Phone" value={profile.emgPhone} onChange={(e) => setProfile({...profile, emgPhone: e.target.value})} disabled={!isEditing} error={errors.emgPhone} />
             </div>
           )}

           {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 bg-navy text-white rounded-2xl flex items-center justify-center">
                       <Lock size={20} />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-navy">Account Security</h2>
                       <p className="text-xs font-bold text-navy/40">Manage your password and platform access</p>
                    </div>
                 </div>
                 <div className="max-w-md space-y-6">
                    <Input label="Current Password" type="password" icon={Lock} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} />
                    <Input label="New Password" type="password" icon={Lock} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
                    <Input label="Confirm New Password" type="password" icon={CheckCircle2} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
                    <Button className="w-full bg-navy text-white font-black text-xs rounded-2xl py-4 mt-4">Update Password</Button>
                 </div>
              </div>
           )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientProfile;
