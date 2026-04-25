import React, { useState, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Input, Badge } from '../../components/common';
import { 
  User, Mail, Phone, MapPin, 
  Shield, Camera, UploadCloud, X, Save,
  Activity, Heart, Droplets, PhoneCall, CheckCircle2, Lock
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const PatientProfile = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Core structured data
  const [profile, setProfile] = useState({
    name: user?.name || 'Sarah Johnson',
    email: user?.email || 'sarah.j@example.com',
    phone: '+91 98765 43210',
    dob: '1992-05-14',
    gender: 'Female',
    address: '42 Lotus Apartments, Indiranagar',
    city: 'Bangalore',
    state: 'Karnataka',
    zip: '560038',
    avatarImage: user?.avatar || null,
    
    bloodGroup: 'O+',
    height: '165',
    weight: '62',
    allergies: 'Penicillin, Dust mites',
    chronicConditions: 'Mild Asthma',
    
    emgName: 'Michael Johnson',
    emgRelation: 'Spouse',
    emgPhone: '+91 98765 00000',
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
      setProfile(prev => ({ ...prev, avatarImage: url }));
    }
  };

  const removeImage = () => {
    setProfile(prev => ({ ...prev, avatarImage: null }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
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
          
          <Button 
            onClick={handleSave}
            loading={isSaving}
            className="bg-[#0D9488] text-white rounded-[20px] font-black text-xs px-8 shadow-xl shadow-[#0D9488]/20 border-none flex items-center gap-2 transition-all hover:scale-105"
          >
            {!isSaving && <Save size={14} />} Save Changes
          </Button>
        </div>

        {/* Avatar Box */}
        <Card className="p-8 mb-8 bg-white border border-gray-100 rounded-[40px] shadow-2xl shadow-navy/5 flex flex-col sm:flex-row items-center gap-8">
           <div className="relative group shrink-0">
             <div className="w-32 h-32 rounded-[32px] overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center relative">
               {profile.avatarImage ? (
                 <img src={profile.avatarImage} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <User size={40} className="text-gray-300" />
               )}
               <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                  <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 rounded-full bg-white text-[#0D9488] flex items-center justify-center hover:scale-110 transition-transform">
                     <Camera size={14} />
                  </button>
                  {profile.avatarImage && (
                     <button onClick={removeImage} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform">
                        <X size={14} />
                     </button>
                  )}
               </div>
             </div>
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
              {['personal', 'medical', 'emergency', 'security'].map((tab) => (
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

        {/* Content */}
        <div className="space-y-6">
           {activeTab === 'personal' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Input label="Full Name" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} />
                <Input label="Email Address" value={profile.email} disabled />
                <Input label="Phone Number" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                   <Input label="DOB" type="date" value={profile.dob} onChange={(e) => setProfile({...profile, dob: e.target.value})} />
                   <Input label="Gender" value={profile.gender} onChange={(e) => setProfile({...profile, gender: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                   <Input label="Address" value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} />
                </div>
                <Input label="City" value={profile.city} onChange={(e) => setProfile({...profile, city: e.target.value})} />
                <Input label="State" value={profile.state} onChange={(e) => setProfile({...profile, state: e.target.value})} />
             </div>
           )}

           {activeTab === 'medical' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Input label="Blood Group" value={profile.bloodGroup} onChange={(e) => setProfile({...profile, bloodGroup: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                   <Input label="Height (cm)" type="number" value={profile.height} onChange={(e) => setProfile({...profile, height: e.target.value})} />
                   <Input label="Weight (kg)" type="number" value={profile.weight} onChange={(e) => setProfile({...profile, weight: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                   <textarea placeholder="Allergies" value={profile.allergies} onChange={(e) => setProfile({...profile, allergies: e.target.value})} className="w-full h-24 bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none resize-none" />
                </div>
             </div>
           )}

           {activeTab === 'emergency' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Input label="Contact Name" value={profile.emgName} onChange={(e) => setProfile({...profile, emgName: e.target.value})} />
                <Input label="Relationship" value={profile.emgRelation} onChange={(e) => setProfile({...profile, emgRelation: e.target.value})} />
                <Input label="Phone" value={profile.emgPhone} onChange={(e) => setProfile({...profile, emgPhone: e.target.value})} />
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
