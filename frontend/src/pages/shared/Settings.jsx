import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge } from '../../components/common';
import { 
  Settings as SettingsIcon, Globe, Bell, Palette, 
  Smartphone, Mail, Shield, Download, Trash2, CheckCircle2,
  Moon, Sun, Clock
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Settings = () => {
  const { role } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');

  // Mock Settings States
  const [generalSettings, setGeneralSettings] = useState({
    language: 'English (US)',
    timezone: 'UTC-05:00 Eastern Time',
    dataSharing: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    marketingEmails: false
  });

  const [appearance, setAppearance] = useState('light'); // 'light', 'dark', 'system'

  const Toggle = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 hover:border-gray-200 transition-colors">
      <div className="flex flex-col pr-8">
        <span className="text-sm font-black text-navy">{label}</span>
        <span className="text-[10px] font-bold text-navy/40 uppercase tracking-widest mt-1">{description}</span>
      </div>
      <button 
        type="button"
        onClick={onChange}
        className={`shrink-0 w-12 h-6 rounded-full transition-all relative ${checked ? 'bg-[#0D9488]' : 'bg-gray-300'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${checked ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );

  return (
    <DashboardLayout title="System Settings" role={role}>
      <div className="max-w-5xl mx-auto space-y-8 pb-20 font-body animate-in fade-in duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Platform <span className="text-[#0D9488]">Settings</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <SettingsIcon size={14} className="text-[#0D9488]" /> Configure your application preferences
            </p>
          </div>
          <Button 
            className="bg-navy text-white rounded-[20px] font-black text-xs px-8 shadow-lg shadow-navy/20 border-none h-10 self-start md:self-auto"
          >
            Save All Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
           
           {/* Sidebar Tabs */}
           <div className="lg:col-span-1 space-y-2 sticky top-[100px]">
             <button 
               onClick={() => setActiveTab('general')}
               className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all text-left ${
                  activeTab === 'general' ? 'bg-navy text-white shadow-lg shadow-navy/20' : 'text-navy/50 hover:bg-gray-50'
               }`}
             >
                <Globe size={16} /> General
             </button>
             <button 
               onClick={() => setActiveTab('notifications')}
               className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all text-left ${
                  activeTab === 'notifications' ? 'bg-navy text-white shadow-lg shadow-navy/20' : 'text-navy/50 hover:bg-gray-50'
               }`}
             >
                <Bell size={16} /> Notifications
             </button>
             <button 
               onClick={() => setActiveTab('appearance')}
               className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all text-left ${
                  activeTab === 'appearance' ? 'bg-navy text-white shadow-lg shadow-navy/20' : 'text-navy/50 hover:bg-gray-50'
               }`}
             >
                <Palette size={16} /> Appearance
             </button>
           </div>

           {/* Content Area */}
           <div className="lg:col-span-3">
              <Card className="p-8 bg-white border border-gray-100 rounded-[40px] shadow-xl shadow-navy/5 min-h-[500px]">
                 
                 {/* GENERAL SETTINGS */}
                 {activeTab === 'general' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                       <div className="border-b border-gray-100 pb-4">
                          <h2 className="text-xl font-black text-navy">General Options</h2>
                          <p className="text-xs font-bold text-navy/40">Manage standard configurations for your experience.</p>
                       </div>

                       <div className="space-y-6">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-widest text-navy/60 pl-2">Display Language</label>
                             <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/40" size={18} />
                                <select 
                                   value={generalSettings.language}
                                   onChange={(e) => setGeneralSettings({...generalSettings, language: e.target.value})}
                                   className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-navy outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] appearance-none"
                                >
                                   <option>English (US)</option>
                                   <option>Spanish (ES)</option>
                                   <option>French (FR)</option>
                                   <option>Hindi (IN)</option>
                                </select>
                             </div>
                          </div>

                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-widest text-navy/60 pl-2">Timezone</label>
                             <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/40" size={18} />
                                <select 
                                   value={generalSettings.timezone}
                                   onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                                   className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-navy outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] appearance-none"
                                >
                                   <option>UTC-08:00 Pacific Time</option>
                                   <option>UTC-05:00 Eastern Time</option>
                                   <option>UTC+00:00 Greenwich Mean Time</option>
                                   <option>UTC+05:30 Indian Standard Time</option>
                                </select>
                             </div>
                          </div>
                       </div>

                       <div className="pt-6 mt-6 border-t border-gray-100 space-y-6">
                          <h3 className="text-sm font-black text-navy uppercase tracking-widest">Data & Privacy</h3>
                          
                          <Toggle 
                            label="Diagnostic Data Sharing"
                            description="Help improve MedCare by sending anonymous usage stats."
                            checked={generalSettings.dataSharing}
                            onChange={() => setGeneralSettings(p => ({...p, dataSharing: !p.dataSharing}))}
                          />

                          <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                             <div>
                                <h4 className="text-sm font-black text-navy flex items-center gap-2">
                                   <Download size={16} className="text-blue-500" /> Export Account Data
                                </h4>
                                <p className="text-[10px] font-bold text-navy/50 mt-1 uppercase tracking-widest">Download all your records in JSON format.</p>
                             </div>
                             <Button size="sm" variant="outline" className="shrink-0 bg-white border-blue-200 text-blue-700 hover:bg-blue-50 font-black text-[10px] rounded-xl px-4 py-2">
                                Request Export
                             </Button>
                          </div>

                          <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                             <div>
                                <h4 className="text-sm font-black text-red-600 flex items-center gap-2">
                                   <Trash2 size={16} /> Danger Zone
                                </h4>
                                <p className="text-[10px] font-bold text-red-900/50 mt-1 uppercase tracking-widest">Permanently delete your account and all data.</p>
                             </div>
                             <Button size="sm" className="shrink-0 bg-red-600 text-white hover:bg-red-700 font-black text-[10px] rounded-xl px-4 py-2 border-none">
                                Delete Account
                             </Button>
                          </div>
                       </div>
                    </div>
                 )}

                 {/* NOTIFICATIONS */}
                 {activeTab === 'notifications' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                       <div className="border-b border-gray-100 pb-4">
                          <h2 className="text-xl font-black text-navy">Notification Preferences</h2>
                          <p className="text-xs font-bold text-navy/40">Control how and when we communicate with you.</p>
                       </div>

                       <div className="space-y-4 shadow-sm border border-gray-100 p-2 rounded-[32px]">
                          <Toggle 
                            label="Email Notifications"
                            description="Receive updates, appointment reminders, and receipts via email."
                            checked={notificationSettings.emailAlerts}
                            onChange={() => setNotificationSettings(p => ({...p, emailAlerts: !p.emailAlerts}))}
                          />
                          <Toggle 
                            label="SMS/Text Alerts"
                            description="Important immediate updates sent directly to your phone."
                            checked={notificationSettings.smsAlerts}
                            onChange={() => setNotificationSettings(p => ({...p, smsAlerts: !p.smsAlerts}))}
                          />
                          <Toggle 
                            label="Browser Push Notifications"
                            description="Get alerted inside the dashboard instantly."
                            checked={notificationSettings.pushNotifications}
                            onChange={() => setNotificationSettings(p => ({...p, pushNotifications: !p.pushNotifications}))}
                          />
                       </div>

                       <div className="pt-2">
                          <Toggle 
                            label="Marketing & Promotions"
                            description="Hear about new healthcare features from MedCare."
                            checked={notificationSettings.marketingEmails}
                            onChange={() => setNotificationSettings(p => ({...p, marketingEmails: !p.marketingEmails}))}
                          />
                       </div>
                    </div>
                 )}

                 {/* APPEARANCE */}
                 {activeTab === 'appearance' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                       <div className="border-b border-gray-100 pb-4">
                          <h2 className="text-xl font-black text-navy">Appearance Preferences</h2>
                          <p className="text-xs font-bold text-navy/40">Customize the look and feel of your dashboard.</p>
                       </div>

                       <div className="space-y-4">
                          <h3 className="text-sm font-black text-navy uppercase tracking-widest pl-2">Color Theme</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             {/* Light Theme */}
                             <button 
                               onClick={() => setAppearance('light')}
                               className={`p-1 rounded-[24px] border-2 transition-all text-left ${appearance === 'light' ? 'border-[#0D9488]' : 'border-transparent hover:border-gray-200'}`}
                             >
                                <div className="bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm h-full flex flex-col gap-3">
                                   <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                      <Sun size={14} className="text-amber-500" />
                                   </div>
                                   <div>
                                      <h4 className="text-xs font-bold text-slate-800">Light</h4>
                                      <p className="text-[10px] text-slate-500">Bright and clean default interface.</p>
                                   </div>
                                   {appearance === 'light' && <Badge variant="success" className="w-fit text-[8px] bg-[#0D9488] text-white border-none absolute mt-[-5px] ml-[110px]">Active</Badge>}
                                </div>
                             </button>

                             {/* Dark Theme */}
                             <button 
                               onClick={() => setAppearance('dark')}
                               className={`p-1 rounded-[24px] border-2 transition-all text-left ${appearance === 'dark' ? 'border-[#0D9488]' : 'border-transparent hover:border-gray-200'}`}
                             >
                                <div className="bg-slate-900 rounded-[20px] p-4 border border-slate-800 shadow-sm h-full flex flex-col gap-3">
                                   <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                      <Moon size={14} className="text-blue-400" />
                                   </div>
                                   <div>
                                      <h4 className="text-xs font-bold text-white">Dark</h4>
                                      <p className="text-[10px] text-slate-400">Easy on the eyes for night usage.</p>
                                   </div>
                                </div>
                             </button>

                             {/* System Theme */}
                             <button 
                               onClick={() => setAppearance('system')}
                               className={`p-1 rounded-[24px] border-2 transition-all text-left ${appearance === 'system' ? 'border-[#0D9488]' : 'border-transparent hover:border-gray-200'}`}
                             >
                                <div className="bg-gradient-to-br from-white to-slate-900 rounded-[20px] p-4 border border-gray-200 shadow-sm h-full flex flex-col gap-3">
                                   <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center">
                                      <Smartphone size={14} className="text-slate-800" />
                                   </div>
                                   <div>
                                      <h4 className="text-xs font-bold text-slate-800 mix-blend-overlay">System Default</h4>
                                      <p className="text-[10px] text-slate-200 mix-blend-overlay">Matches your device.</p>
                                   </div>
                                </div>
                             </button>
                          </div>
                          <div className="mt-4 p-4 bg-gray-50 rounded-2xl flex items-start gap-3">
                              <Shield size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                              <p className="text-[10px] font-bold text-navy/50 leading-relaxed uppercase tracking-widest">
                                 Note: Theme selection currently provides a visual representation. Full architectural dark mode processing requires backend persistence setup.
                              </p>
                          </div>
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

export default Settings;
