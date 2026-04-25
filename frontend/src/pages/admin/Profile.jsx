import React, { useState, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Input, Avatar, Badge } from '../../components/common';
import { 
  User, Mail, Shield, Lock, Camera, Save, CheckCircle2
} from 'lucide-react';

const AdminProfile = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState({
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@medcare.com',
    phone: '+1 (555) 000-0000',
    role: 'Super Admin',
    avatarUrl: null
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
      handleInputChange('avatarUrl', imageUrl);
    }
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    console.log("Saving Admin Profile:", profileData);
  };

  return (
    <DashboardLayout title="Admin Profile" role="admin">
      <div className="max-w-6xl mx-auto space-y-8 pb-20 font-body animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Admin <span className="text-[#0D9488]">Settings</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <Shield size={14} className="text-[#0D9488]" /> Management controls & Security
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
                   onClick={handleSaveProfile}
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
           {/* Sidebar */}
           <div className="lg:col-span-3 space-y-6">
              <Card className="p-8 bg-white border border-gray-100 rounded-[40px] shadow-sm text-center">
                 <div className="relative inline-block mx-auto mb-6 group">
                   <div 
                      onClick={handleAvatarClick}
                      className={`relative w-28 h-28 rounded-full border-4 border-white shadow-xl shadow-navy/5 overflow-hidden flex items-center justify-center bg-gray-50 mx-auto ${isEditing ? 'cursor-pointer' : ''}`}
                    >
                      {profileData.avatarUrl ? (
                         <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                         <Avatar name={`${profileData.firstName} ${profileData.lastName}`} size="xl" className="w-full h-full text-3xl" />
                      )}
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
                 </div>

                 <h3 className="text-xl font-black text-navy leading-tight">{profileData.firstName} {profileData.lastName}</h3>
                 <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-[0.2em] mt-1 mb-4">{profileData.role}</p>
                 
                 <Badge variant="success" className="mx-auto bg-green-50 text-green-600 border-none text-[9px] uppercase font-black px-3">
                    <CheckCircle2 size={12} className="mr-1 inline" /> System Control Access
                 </Badge>
              </Card>

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
                   onClick={() => setActiveTab('security')}
                   className={`flex items-center gap-3 px-6 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${
                      activeTab === 'security' ? 'bg-navy text-white shadow-lg shadow-navy/20' : 'text-navy/50 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100'
                   }`}
                 >
                    <Lock size={16} /> Security
                 </button>
              </div>
           </div>

           {/* Content */}
           <div className="lg:col-span-9">
              <Card className="p-8 md:p-12 bg-white border border-gray-100 rounded-[48px] shadow-xl shadow-navy/5 min-h-[500px]">
                 
                 {activeTab === 'personal' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                       <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                          <div className="w-10 h-10 bg-[#0D9488]/10 rounded-2xl flex items-center justify-center text-[#0D9488]">
                             <User size={20} />
                          </div>
                          <div>
                             <h2 className="text-xl font-black text-navy">Administrative Details</h2>
                             <p className="text-xs font-bold text-navy/40">Basic system identity</p>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input 
                            label="First Name" 
                            value={profileData.firstName} 
                            disabled={!isEditing}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                          />
                          <Input 
                            label="Last Name" 
                            value={profileData.lastName} 
                            disabled={!isEditing}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                          />
                          <Input 
                            label="Email Address" 
                            type="email"
                            icon={Mail}
                            value={profileData.email} 
                            disabled={!isEditing}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                          />
                          <Input 
                            label="Administrative Role" 
                            value={profileData.role} 
                            disabled
                          />
                       </div>
                    </div>
                 )}

                 {activeTab === 'security' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                       <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                          <div className="w-10 h-10 bg-navy text-white rounded-2xl flex items-center justify-center">
                             <Lock size={20} />
                          </div>
                          <div>
                             <h2 className="text-xl font-black text-navy">Account Security</h2>
                             <p className="text-xs font-bold text-navy/40">Manage your system access password</p>
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
                          <Button className="w-full bg-navy text-white font-black text-xs rounded-2xl py-4 mt-4 text-center">
                             Update Secure Password
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

export default AdminProfile;
