import React, { useState, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Input, Badge } from '../../components/common';
import { 
  Building2, UploadCloud, MapPin, Phone, 
  Globe, Mail, CheckCircle2,
  Camera, X, Save, Shield, Lock
} from 'lucide-react';

const HospitalProfile = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Mocked state for Hospital Profile
  const [profile, setProfile] = useState({
    name: 'Apollo Indraprastha Hospital',
    type: 'Multi-Specialty Private Hospital',
    registrationNumber: 'HOSP-DEL-1994-0012',
    about: 'Apollo Hospitals is a leading multi-specialty healthcare provider with international standards of technology, infrastructure, and clinical care. We are committed to achieving excellence in patient care.',
    coverImage: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80',
    email: 'contact@apolloindraprastha.com',
    phone: '+91 11 2692 5858',
    website: 'https://www.apollohospitals.com',
    address: 'Sarita Vihar, Delhi-Mathura Road',
    city: 'New Delhi',
    state: 'Delhi',
    zip: '110076',
    establishYear: '1996'
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfile(prev => ({ ...prev, coverImage: url }));
    }
  };

  const removeImage = () => {
    setProfile(prev => ({ ...prev, coverImage: null }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  return (
    <DashboardLayout title="Hospital Profile" role="hospital">
      <div className="max-w-4xl mx-auto pb-20 font-body animate-in fade-in duration-700">
        
        {/* Header Options */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Hospital <span className="text-[#0D9488]">Identity</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <Building2 size={14} className="text-[#0D9488]" /> Configure your public facing profile
            </p>
          </div>
          
          <Button 
            onClick={handleSave}
            loading={isSaving}
            className="bg-[#0D9488] text-white rounded-[20px] font-black text-xs px-8 shadow-xl shadow-[#0D9488]/20 border-none flex items-center gap-2 transition-all hover:scale-105"
          >
            {!isSaving && <Save size={14} />} Save Changes
          </Button>
        </div>

        {/* Cover Photo */}
        <Card className="p-0 border border-gray-100 bg-white rounded-[40px] overflow-hidden shadow-2xl shadow-navy/5 mb-8">
           <div className={`relative w-full h-[250px] bg-gray-50 flex items-center justify-center ${!profile.coverImage && 'border-b border-gray-100 border-dashed'}`}>
             
             {profile.coverImage ? (
                <>
                  <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-navy/20 opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm flex items-center justify-center gap-4">
                     <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="bg-white/10 text-white border-white border hover:bg-white/30 backdrop-blur-md rounded-2xl">
                       <Camera size={16} className="mr-2" /> Change Photo
                     </Button>
                     <Button variant="danger" onClick={removeImage} className="bg-red-500/80 text-white border-red-500 hover:bg-red-500 rounded-2xl">
                       <X size={16} />
                     </Button>
                  </div>
                </>
             ) : (
                <div onClick={() => fileInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer group hover:bg-gray-100 transition-colors">
                  <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center text-[#0D9488] mb-4 group-hover:-translate-y-1 transition-transform">
                     <UploadCloud size={24} />
                  </div>
                  <h4 className="font-heading font-black text-navy text-sm">Upload Cover Photo</h4>
                  <p className="text-[10px] font-bold text-navy/40 uppercase tracking-widest mt-1">Recommended: 1600 x 400px</p>
                </div>
             )}
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
           </div>
           
           <div className="bg-white p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                 <h2 className="text-2xl font-black text-navy">{profile.name || 'Unnamed Hospital'}</h2>
                 <p className="text-sm font-bold text-navy/50">{profile.type}</p>
              </div>
              <Badge variant="success" className="bg-[#0D9488]/10 text-[#0D9488] border-none font-black text-[10px] px-4 py-2 uppercase tracking-widest">
                 <CheckCircle2 size={12} className="inline mr-1" /> Publicly Visible
              </Badge>
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

        {/* Tab Content */}
        <div className="space-y-6">
           {activeTab === 'general' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="md:col-span-2">
                   <Input label="Hospital Name" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} />
                </div>
                <Input label="Facility Type" value={profile.type} onChange={(e) => setProfile({...profile, type: e.target.value})} />
                <Input label="Registration / License No." value={profile.registrationNumber} onChange={(e) => setProfile({...profile, registrationNumber: e.target.value})} />
                <div className="md:col-span-2 space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-navy/60 pl-2">About Hospital</label>
                   <textarea
                      value={profile.about}
                      onChange={(e) => setProfile({...profile, about: e.target.value})}
                      className="w-full text-sm font-bold text-navy placeholder:text-navy/30 bg-gray-50 border border-gray-100 rounded-[20px] px-5 py-4 focus:bg-white focus:border-[#0D9488] outline-none resize-none min-h-[140px]"
                      maxLength={500}
                   />
                </div>
             </div>
           )}

           {activeTab === 'location' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="md:col-span-2">
                   <Input label="Street Address / Building" value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} />
                </div>
                <Input label="City" value={profile.city} onChange={(e) => setProfile({...profile, city: e.target.value})} />
                <Input label="State" value={profile.state} onChange={(e) => setProfile({...profile, state: e.target.value})} />
                <Input label="ZIP" value={profile.zip} onChange={(e) => setProfile({...profile, zip: e.target.value})} />
             </div>
           )}

           {activeTab === 'contact' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Input label="Public Phone Number" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} />
                <Input label="Support Email" type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} />
                <div className="md:col-span-2">
                   <Input label="Official Website" value={profile.website} onChange={(e) => setProfile({...profile, website: e.target.value})} />
                </div>
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
                    <Input label="Confirm Password" type="password" icon={CheckCircle2} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
                    <Button className="w-full bg-navy text-white font-black text-xs rounded-2xl py-4 mt-4">Update Password</Button>
                 </div>
              </div>
           )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HospitalProfile;
