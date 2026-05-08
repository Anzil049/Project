import React, { useState, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Input, Badge, LocationPicker, Avatar } from '../../components/common';
import { 
  Building2, UploadCloud, MapPin, Phone, 
  Globe, Mail, CheckCircle2,
  Camera, X, Save, Shield, Lock
} from 'lucide-react';

import useAuthStore from '../../store/authStore';
import authService from '../../services/authService';
import { toast } from 'react-hot-toast';
import { compressImage } from '../../utils/imageUtils';

const HospitalProfile = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    establishYear: user?.hospitalProfile?.establishYear || '',
    latitude: user?.location?.coordinates?.[1] || null,
    longitude: user?.location?.coordinates?.[0] || null
  });

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

  const handleSave = async () => {
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
        establishYear: profile.establishYear,
        coverImage: finalCoverImage,
        image: finalLogoImage,
        location: (profile.latitude && profile.longitude) ? {
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
                   <Input label="Hospital Name" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} disabled={!isEditing} />
                </div>
                <Input label="Facility Type" value={profile.type} onChange={(e) => setProfile({...profile, type: e.target.value})} disabled={!isEditing} />
                <Input label="License No." value={profile.registrationNumber} onChange={(e) => setProfile({...profile, registrationNumber: e.target.value})} disabled={!isEditing} />
                <div className="md:col-span-2 space-y-2">
                   <label className="text-[10px] font-black uppercase text-navy/60 pl-2">About</label>
                   <textarea
                      value={profile.about}
                      onChange={(e) => setProfile({...profile, about: e.target.value})}
                      disabled={!isEditing}
                      className="w-full text-sm font-bold text-navy bg-gray-50 border border-gray-100 rounded-[20px] px-5 py-4 focus:bg-white focus:border-[#0D9488] outline-none resize-none min-h-[140px] disabled:opacity-60"
                   />
                </div>
             </div>
           )}

            {activeTab === 'location' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="md:col-span-2">
                        <Input label="Address" value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} disabled={!isEditing} />
                     </div>
                     <Input label="City" value={profile.city} onChange={(e) => setProfile({...profile, city: e.target.value})} disabled={!isEditing} />
                     <Input label="State" value={profile.state} onChange={(e) => setProfile({...profile, state: e.target.value})} disabled={!isEditing} />
                  </div>
                  <LocationPicker 
                    lat={profile.latitude}
                    lng={profile.longitude}
                    onLocationSelect={(lat, lng) => setProfile({...profile, latitude: lat, longitude: lng})}
                    disabled={!isEditing}
                  />
               </div>
            )}

            {activeTab === 'contact' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <Input label="Email" value={profile.email} disabled />
                 <Input label="Phone" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} disabled={!isEditing} />
                 <Input label="Website" value={profile.website} onChange={(e) => setProfile({...profile, website: e.target.value})} disabled={!isEditing} />
                 <Input label="Zip Code" value={profile.zip} onChange={(e) => setProfile({...profile, zip: e.target.value})} disabled={!isEditing} />
              </div>
            )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HospitalProfile;
