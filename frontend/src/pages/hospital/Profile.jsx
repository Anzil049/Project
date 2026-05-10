import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Input, Select, Badge, LocationPicker, Avatar } from '../../components/common';
import { 
  Building2, UploadCloud, MapPin, Phone, 
  Globe, Mail, CheckCircle2,
  Camera, X, Save, Shield, Lock
} from 'lucide-react';

import useAuthStore from '../../store/authStore';
import authService from '../../services/authService';
import { toast } from 'react-hot-toast';
import { compressImage } from '../../utils/imageUtils';
import { isProfileComplete } from '../../utils/profileUtils';
import { AlertCircle } from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 
  'Ladakh', 'Lakshadweep', 'Puducherry'
];

const HospitalProfile = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState({ cover: null, logo: null });
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    type: user?.hospitalProfile?.facilityType || '',
    registrationNumber: user?.hospitalProfile?.registrationNumber || '',
    about: user?.hospitalProfile?.about || '',
    coverImage: user?.hospitalProfile?.coverImage || null,
    image: user?.image || null,
    email: user?.email || '',
    phone: user?.hospitalProfile?.phone || user?.phone || '',
    website: user?.hospitalProfile?.website || '',
    address: user?.hospitalProfile?.address || '',
    city: user?.hospitalProfile?.city || '',
    state: user?.hospitalProfile?.state || '',
    zip: user?.hospitalProfile?.zip || '',
    latitude: user?.location?.coordinates?.[1] || null,
    longitude: user?.location?.coordinates?.[0] || null
  });

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.name || '',
        type: user.hospitalProfile?.facilityType || '',
        registrationNumber: user.hospitalProfile?.registrationNumber || '',
        about: user.hospitalProfile?.about || '',
        coverImage: user.hospitalProfile?.coverImage || null,
        image: user.image || null,
        email: user.email || '',
        phone: user.hospitalProfile?.phone || user.phone || '',
        website: user.hospitalProfile?.website || '',
        address: user.hospitalProfile?.address || '',
        city: user.hospitalProfile?.city || '',
        state: user.hospitalProfile?.state || '',
        zip: user.hospitalProfile?.zip || '',
        latitude: user.location?.coordinates?.[1] || null,
        longitude: user.location?.coordinates?.[0] || null
      }));
    }
  }, [user]);

  const [showMap, setShowMap] = useState(false);
  const locationPickerRef = useRef(null);

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfile(prev => ({ ...prev, coverImage: url }));
      setFiles(prev => ({ ...prev, cover: file }));
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfile(prev => ({ ...prev, image: url }));
      setFiles(prev => ({ ...prev, logo: file }));
    }
  };

  const removeImage = () => {
    setProfile(prev => ({ ...prev, coverImage: null }));
    setFiles(prev => ({ ...prev, cover: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!profile.name.trim()) newErrors.name = 'Hospital name is required';
    if (!profile.type) newErrors.type = 'Facility type is required';
    if (!profile.registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required';
    if (!profile.phone.trim()) newErrors.phone = 'Contact number is required';
    if (!profile.address.trim()) newErrors.address = 'Street address is required';
    if (!profile.city.trim()) newErrors.city = 'City is required';
    if (!profile.state.trim()) newErrors.state = 'State is required';
    if (!profile.about.trim()) newErrors.about = 'Hospital description is required';
    
    if (!profile.latitude || !profile.longitude) {
       newErrors.location = 'Please select the hospital location on the map';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
       toast.error('Please fix the errors before saving');
       return;
    }
    setIsSaving(true);
    try {
      let finalCoverImage = profile.coverImage;
      let finalLogoImage = profile.image;

      if (files.cover) {
        toast.loading('Compressing & Uploading cover...', { id: 'u-c' });
        const compressed = await compressImage(files.cover);
        finalCoverImage = await authService.uploadImage(compressed);
        toast.success('Cover uploaded', { id: 'u-c' });
      }

      if (files.logo) {
        toast.loading('Compressing & Uploading logo...', { id: 'u-l' });
        const compressed = await compressImage(files.logo);
        finalLogoImage = await authService.uploadImage(compressed);
        toast.success('Logo uploaded', { id: 'u-l' });
      }

      const updateData = {
        name: profile.name,
        phone: profile.phone,
        facilityType: profile.type,
        about: profile.about,
        website: profile.website,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zip: profile.zip,
        coverImage: finalCoverImage,
        image: finalLogoImage,
        location: (profile.latitude && profile.longitude && !isNaN(parseFloat(profile.latitude)) && !isNaN(parseFloat(profile.longitude))) ? {
          type: 'Point',
          coordinates: [parseFloat(profile.longitude), parseFloat(profile.latitude)]
        } : undefined
      };

      const result = await authService.updateProfile(updateData);
      updateUser(result);
      setIsEditing(false);
      setFiles({ cover: null, logo: null });
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (securityData.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setIsChangingPassword(true);
    try {
      await authService.changeFirstPassword(
        profile.email,
        securityData.currentPassword,
        securityData.newPassword
      );
      toast.success('Password updated successfully');
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password change failed');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <DashboardLayout title="Hospital Profile" role="hospital">
      <div className="max-w-4xl mx-auto pb-20 font-body animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Hospital <span className="text-[#0D9488]">Identity</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <Building2 size={14} className="text-[#0D9488]" /> Verified Medical Facility
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             {isEditing ? (
                <>
                   <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-2xl">Discard</Button>
                   <Button onClick={handleSave} loading={isSaving} className="bg-[#0D9488] text-white rounded-2xl shadow-xl shadow-[#0D9488]/20 border-none">
                      <Save size={14} className="mr-2" /> Save Changes
                   </Button>
                </>
             ) : (
                <Button onClick={() => setIsEditing(true)} className="bg-navy text-white rounded-2xl shadow-lg">Edit Profile</Button>
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
                Your facility profile is incomplete. Please provide all required details, including facility type, beds, and location coordinates, to enable public listings and appointment booking.
              </p>
            </div>
          </div>
        )}

        {/* Cover Photo & Logo Section */}
        <Card className="p-0 border border-gray-100 bg-white rounded-[40px] overflow-hidden shadow-2xl shadow-navy/5 mb-8">
           <div className="relative w-full h-[250px] bg-gray-50 flex items-center justify-center">
             <div className="relative w-full h-full group">
               {profile.coverImage ? (
                  <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                     <Building2 size={48} className="text-gray-200" />
                  </div>
               )}
               {isEditing && (
                  <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                     <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white text-[#0D9488] rounded-full hover:scale-110 transition-transform">
                        <UploadCloud size={20} />
                     </button>
                     {profile.coverImage && (
                        <button onClick={removeImage} className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform">
                           <X size={20} />
                        </button>
                     )}
                  </div>
               )}
             </div>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
           </div>
           
           <div className="bg-white p-8 flex flex-col sm:flex-row items-center justify-between gap-6 -mt-12 sm:-mt-16">
              <div className="flex items-center gap-6 flex-col sm:flex-row">
                 <div className="relative group">
                    <div className="relative">
                       <Avatar src={profile.image} name={profile.name} size="xl" className="border-8 border-white shadow-2xl w-32 h-32 sm:w-40 sm:h-40 bg-white" />
                       {isEditing && (
                          <button 
                             onClick={() => logoInputRef.current?.click()}
                             className="absolute bottom-2 right-2 p-3 bg-[#0D9488] text-white rounded-2xl shadow-lg hover:scale-110 transition-transform flex items-center justify-center border-4 border-white z-10"
                             title="Upload Logo"
                          >
                             <Camera size={20} />
                          </button>
                       )}
                    </div>
                    <input 
                       type="file" 
                       ref={logoInputRef} 
                       className="hidden" 
                       accept="image/*" 
                       onChange={handleLogoUpload} 
                    />
                 </div>
                 <div className="text-center sm:text-left pt-4 sm:pt-12">
                    <h2 className="text-2xl font-black text-navy leading-tight">{profile.name || 'Unnamed Hospital'}</h2>
                    <p className="text-sm font-bold text-navy/50">{profile.type || 'Medical Facility'}</p>
                 </div>
              </div>
              <div className="pt-0 sm:pt-12">
                <Badge variant="success" className="bg-[#0D9488]/10 text-[#0D9488] border-none font-black text-[10px] px-4 py-2 uppercase tracking-widest">
                   <CheckCircle2 size={12} className="inline mr-1" /> Publicly Visible
                </Badge>
              </div>
           </div>
        </Card>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 mb-8 sticky top-[72px] z-20">
           <div className="flex overflow-x-auto hide-scrollbar">
              {['general', 'location', 'contact', 'security'].map((tab) => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px] whitespace-nowrap ${
                       activeTab === tab ? 'border-[#0D9488] text-[#0D9488]' : 'border-transparent text-navy/40 hover:text-navy'
                    }`}
                 >
                    {tab}
                 </button>
              ))}
           </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
           {activeTab === 'general' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="md:col-span-2">
                   <Input label="Hospital Name" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} disabled={!isEditing} error={errors.name} />
                </div>
                <Select 
                    label="Facility Type" 
                    value={profile.type} 
                    options={['Hospital', 'Clinic']}
                    onChange={(e) => setProfile({...profile, type: e.target.value})} 
                    disabled={!isEditing} 
                    error={errors.type}
                 />
                <Input label="License No." value={profile.registrationNumber} onChange={(e) => setProfile({...profile, registrationNumber: e.target.value})} disabled={!isEditing} error={errors.registrationNumber} />
                <div className="md:col-span-2 space-y-2">
                   <label className="text-[10px] font-black uppercase text-navy/60 pl-2">About</label>
                   <textarea
                      value={profile.about ?? ''}
                      onChange={(e) => setProfile({...profile, about: e.target.value})}
                      disabled={!isEditing}
                      className={`w-full text-sm font-bold text-navy bg-gray-50 border border-gray-100 rounded-[20px] px-5 py-4 focus:bg-white focus:border-[#0D9488] outline-none resize-none min-h-[140px] disabled:opacity-60 ${errors.about ? 'border-red-500' : ''}`}
                   ></textarea>
                   {errors.about && <p className="text-[11px] text-red-500 font-bold px-2">{errors.about}</p>}
                </div>
             </div>
           )}

            {activeTab === 'location' && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-navy/30">Facility Coordinates</p>
                       <Badge variant={errors.location ? "destructive" : "outline"} className="mt-1 text-[10px] font-black">
                          {profile.latitude ? `${Number(profile.latitude).toFixed(6)}, ${Number(profile.longitude).toFixed(6)}` : (errors.location ? 'REQUIRED' : 'NOT SET')}
                       </Badge>
                    </div>
                    {errors.location && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.location}</p>}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                     <button
                        onClick={() => {
                          if (!isEditing) {
                            toast.error('Please click "Edit Profile" first');
                            return;
                          }
                          if (!showMap) setShowMap(true);
                          setTimeout(() => {
                            locationPickerRef.current?.handleLocateMe();
                          }, 500);
                        }}
                        className="flex items-center gap-2 bg-[#2874F0] text-white px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all disabled:opacity-50"
                        disabled={!isEditing}
                     >
                        <MapPin size={16} /> Use my current location
                     </button>

                     <button
                        onClick={() => {
                          if (!isEditing) {
                            toast.error('Please click "Edit Profile" first');
                            return;
                          }
                          setShowMap(!showMap);
                        }}
                        className={`flex items-center gap-2 text-[#0D9488] font-black text-xs uppercase tracking-widest transition-all ${
                           isEditing ? 'hover:underline opacity-100' : 'opacity-40 cursor-not-allowed'
                        }`}
                        disabled={!isEditing}
                     >
                        <Globe size={16} /> {showMap ? 'Hide Map' : 'Choose from Map'}
                     </button>
                  </div>

                    <div className="animate-in zoom-in-95 duration-300 min-h-[400px]">
                      <LocationPicker 
                        ref={locationPickerRef}
                        lat={profile.latitude}
                        lng={profile.longitude}
                        isEditing={isEditing}
                        onLocationSelect={(lat, lng, addressData) => {
                           const updates = { latitude: lat, longitude: lng };
                           if (addressData) {
                              if (addressData.city) updates.city = addressData.city;
                              if (addressData.state) updates.state = addressData.state;
                              if (addressData.zip) updates.zip = addressData.zip;
                              
                              let cleanAddress = addressData.fullAddress || '';
                              if (addressData.city && cleanAddress.includes(addressData.city)) {
                                 cleanAddress = cleanAddress.split(addressData.city)[0].trim().replace(/,$/, '');
                              }
                              updates.address = cleanAddress || addressData.address;
                           }
                           setProfile(prev => ({ ...prev, ...updates }));
                        }}
                        hideLocateButton={true}
                      />
                    </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <Input 
                        label="Pincode" 
                        value={profile.zip} 
                        onChange={(e) => setProfile({...profile, zip: e.target.value})}
                        disabled={!isEditing}
                        placeholder="6-digit Pincode"
                     />
                     <Input 
                        label="City/District/Town" 
                        value={profile.city} 
                        onChange={(e) => setProfile({...profile, city: e.target.value})}
                        disabled={!isEditing}
                        placeholder="City/District/Town"
                        error={errors.city}
                     />
                     <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-navy/60 pl-2 mb-2 block">Address (Area and Street)</label>
                        <textarea
                           value={profile.address ?? ''}
                           onChange={(e) => setProfile({...profile, address: e.target.value})}
                           disabled={!isEditing}
                           placeholder="Area and Street"
                           className={`w-full text-sm font-bold text-navy bg-gray-50 border border-gray-100 rounded-[20px] px-5 py-4 focus:bg-white focus:border-[#0D9488] outline-none resize-none min-h-[100px] disabled:opacity-60 ${errors.address ? 'border-red-500' : ''}`}
                        ></textarea>
                        {errors.address && <p className="text-[11px] text-red-500 font-bold px-2">{errors.address}</p>}
                     </div>
                     <Select
                        label="State"
                        value={profile.state}
                        options={INDIAN_STATES}
                        onChange={(e) => setProfile({...profile, state: e.target.value})}
                        disabled={!isEditing}
                        error={errors.state}
                     />
                  </div>
               </div>
            )}

            {activeTab === 'contact' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <Input label="Email" value={profile.email} disabled />
                 <Input label="Phone" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} disabled={!isEditing} error={errors.phone} />
                 <Input label="Website" value={profile.website} onChange={(e) => setProfile({...profile, website: e.target.value})} disabled={!isEditing} />
                 <Input 
                    label="Zip Code" 
                    value={profile.zip} 
                    readOnly 
                    className="bg-gray-100/50 cursor-not-allowed" 
                    placeholder="Auto-filled from map"
                 />
              </div>
            )}

            {activeTab === 'security' && (
                <div className="max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-navy/5 rounded-3xl flex items-center justify-center mx-auto text-navy">
                         <Shield size={32} />
                      </div>
                      <h3 className="text-xl font-black text-navy">Security Settings</h3>
                      <p className="text-xs font-bold text-navy/40">Keep your account safe by updating your password regularly.</p>
                   </div>

                   <form onSubmit={handlePasswordChange} className="space-y-6">
                      <Input 
                         label="Current Password" 
                         type="password"
                         value={securityData.currentPassword}
                         onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
                         placeholder="Enter current password"
                         required
                      />
                      <Input 
                         label="New Password" 
                         type="password"
                         value={securityData.newPassword}
                         onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                         placeholder="Enter new password"
                         required
                      />
                      <Input 
                         label="Confirm New Password" 
                         type="password"
                         value={securityData.confirmPassword}
                         onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                         placeholder="Confirm new password"
                         required
                      />

                      <Button 
                         type="submit" 
                         loading={isChangingPassword}
                         className="w-full bg-navy text-white rounded-2xl py-4 shadow-xl shadow-navy/10 border-none"
                      >
                         Update Password
                      </Button>
                   </form>

                   <div className="p-6 bg-red-50 rounded-[32px] border border-red-100 flex items-start gap-4">
                      <div className="p-3 bg-white rounded-2xl text-red-500 shadow-sm">
                         <Lock size={20} />
                      </div>
                      <div className="space-y-1">
                         <p className="text-xs font-black text-red-600 uppercase tracking-widest">Privacy Note</p>
                         <p className="text-[11px] font-bold text-red-900/60 leading-relaxed">
                            Changing your password will not log you out from other devices. Ensure your new password is unique and strong.
                         </p>
                      </div>
                   </div>
                </div>
             )}
         </div>
      </div>
    </DashboardLayout>
  );
};

export default HospitalProfile;
