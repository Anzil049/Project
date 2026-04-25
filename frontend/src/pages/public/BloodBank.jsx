import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { Card, Button, Input, Avatar, Badge } from '../../components/common';
import useAuthStore from '../../store/authStore';
import { ROUTES } from '../../constants/routes';
import { 
  Heart, MapPin, Phone, AlertCircle, Send, 
  Search, Filter, Droplet, User, Bell, 
  Navigation, Clock, CheckCircle2, ShieldCheck, Activity,
  ArrowRight, HeartPulse, LogIn
} from 'lucide-react';

const BloodBank = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  
  // Get user's blood group from profile (mocking it if not found)
  const myBloodGroup = user?.bloodGroup || 'O+'; 
  
  const [donorSearch, setDonorSearch] = useState('');
  const [donorPage, setDonorPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const DONORS_PER_PAGE = 4;
  const REQUESTS_PER_PAGE = 3;

  const [formData, setFormData] = useState({
    bloodGroup: '',
    location: '',
    contactNumber: '',
    urgency: 'Normal' 
  });
  const [formType, setFormType] = useState('request'); 

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencies = [
    { label: 'Normal', color: 'text-blue-500' },
    { label: 'Urgent', color: 'text-orange-500' },
    { label: 'Critical', color: 'text-red-500' }
  ];

  const [donors] = useState([
    { id: 1, name: 'Aditya Sharma', group: 'O+', distance: '1.2 km away', location: 'Koramangala, Bangalore', lastDonated: '4 months ago', status: 'Available' },
    { id: 2, name: 'Sarah Williams', group: 'A+', distance: '2.5 km away', location: 'HSR Layout, Bangalore', lastDonated: '2 months ago', status: 'Available' },
    { id: 3, name: 'Rajesh Kumar', group: 'B+', distance: '3.8 km away', location: 'Indiranagar, Bangalore', lastDonated: '6 months ago', status: 'Available' },
    { id: 4, name: 'Michael Chen', group: 'O-', distance: '4.1 km away', location: 'Whitefield, Bangalore', lastDonated: '1 month ago', status: 'Busy' }
  ]);

  const [bloodRequests] = useState([
    { id: 1, name: 'Priya Nair', group: 'AB-', location: 'Manipal Hospital, Bangalore', urgency: 'Critical', time: '12 mins ago', units: 3 },
    { id: 2, name: 'Vikram Desai', group: 'O+', location: 'Fortis Hospital, Koramangala', urgency: 'Urgent', time: '45 mins ago', units: 2 },
    { id: 3, name: 'Fatima Sheikh', group: 'B-', location: 'Apollo Clinic, HSR Layout', urgency: 'Normal', time: '1 hour ago', units: 1 },
    { id: 4, name: 'Arjun Reddy', group: 'A+', location: 'Columbia Asia, Whitefield', urgency: 'Critical', time: '2 hours ago', units: 4 },
  ]);

  const handleAction = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
    if (formType === 'request') {
      alert('Blood request broadcasted to all compatible donors!');
    } else {
      alert('Thank you for registering as a donor!');
    }
  };

  const filteredDonors = donors.filter(d => d.group.toLowerCase().includes(donorSearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          
          {/* Hero Section */}
          <div className="mb-16 text-center space-y-6 animate-in fade-in duration-700">
             <div className="inline-flex items-center gap-2 bg-red-100/50 text-red-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Droplet size={14} fill="currentColor" /> Community Blood Network
             </div>
             <h1 className="text-4xl lg:text-6xl font-heading font-black text-navy tracking-tight max-w-4xl mx-auto">
                Connecting Life, One <span className="text-red-500">Drop</span> at a Time.
             </h1>
             <p className="text-lg text-navy/40 font-bold max-w-2xl mx-auto italic">
                A public portal to find donors, request blood, and save lives in your local community.
             </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Form & Personal Stats */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Authenticated User Status */}
              {isAuthenticated && (
                <Card className="p-6 bg-navy text-white rounded-[32px] overflow-hidden relative group">
                  <div className="relative z-10 flex items-center gap-4">
                     <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-red-400">
                        <HeartPulse size={32} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Your Registered Group</p>
                        <h4 className="text-2xl font-black">{myBloodGroup}</h4>
                     </div>
                  </div>
                  <Heart className="absolute -bottom-6 -right-6 text-white/5 w-32 h-32 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                </Card>
              )}

              {/* Action Form */}
              <Card className="p-8 border-gray-100 shadow-2xl shadow-navy/5">
                <div className="flex bg-gray-50 p-1 rounded-2xl mb-8 border border-gray-100">
                   <button
                     onClick={() => setFormType('request')}
                     className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formType === 'request' ? 'bg-white text-navy shadow-sm' : 'text-navy/40 hover:text-navy/60'}`}
                   >
                     Request
                   </button>
                   <button
                     onClick={() => setFormType('donate')}
                     className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formType === 'donate' ? 'bg-white text-red-600 shadow-sm' : 'text-navy/40 hover:text-navy/60'}`}
                   >
                     Donate
                   </button>
                </div>

                <div className="mb-8">
                   <h3 className="text-2xl font-black text-navy mb-2 tracking-tight">
                     {formType === 'request' ? 'Need Blood?' : 'Want to Save Lives?'}
                   </h3>
                   <p className="text-xs font-bold text-navy/30 leading-relaxed uppercase tracking-wider">
                     {formType === 'request' ? 'Broadcast to same-group donors' : 'Join our pool of local donors'}
                   </p>
                </div>

                <form onSubmit={handleAction} className="space-y-6">
                   <div className="grid grid-cols-4 gap-2">
                      {bloodGroups.map(bg => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setFormData({...formData, bloodGroup: bg})}
                          className={`h-10 rounded-xl font-black text-xs transition-all border-2 ${formData.bloodGroup === bg ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-gray-50/50 border-gray-100 text-navy/40 hover:border-red-500/30'}`}
                        >
                          {bg}
                        </button>
                      ))}
                   </div>

                   <Input 
                     label="Location"
                     placeholder="Hospital or Area"
                     icon={MapPin}
                     value={formData.location}
                     onChange={(e) => setFormData({...formData, location: e.target.value})}
                   />

                   <Button type="submit" fullWidth size="lg" className="bg-red-500 hover:bg-red-600 h-14 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 border-none shadow-xl shadow-red-500/10">
                      {isAuthenticated ? (
                        <>{formType === 'request' ? 'Broadcast to Donors' : 'Register as Donor'} <ArrowRight size={18} /></>
                      ) : (
                        <>Login to Continue <LogIn size={18} /></>
                      )}
                   </Button>
                </form>
              </Card>
            </div>

            {/* Right Column: Listings */}
            <div className="lg:col-span-8 space-y-10">
              
              {/* Compatible Requests - COMMUNITY HIGHLIGHT */}
              {isAuthenticated && (
                <div className="space-y-6 p-8 bg-red-50/50 rounded-[40px] border border-red-100/50">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        <h2 className="text-sm font-black text-red-600 uppercase tracking-[0.3em]">Compatible Requests For You</h2>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {bloodRequests.filter(r => r.group === myBloodGroup).map(req => (
                        <Card key={req.id} className="p-5 border-white bg-white/80 backdrop-blur shadow-sm hover:shadow-md transition-all">
                           <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                 <Avatar name={req.name} size="sm" className="bg-red-50 text-red-600 font-bold" />
                                 <div>
                                    <h5 className="font-bold text-navy text-sm">{req.name}</h5>
                                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">{req.urgency}</p>
                                 </div>
                              </div>
                              <span className="text-lg font-black text-navy">{req.group}</span>
                           </div>
                           <p className="text-[10px] font-bold text-navy/40 flex items-center gap-1.5 mb-4 uppercase tracking-wider">
                              <MapPin size={12} /> {req.location}
                           </p>
                           <Button size="sm" fullWidth className="bg-red-500 hover:bg-red-600 text-[10px] font-black uppercase h-10 rounded-xl border-none">
                              Pledge Donation
                           </Button>
                        </Card>
                     ))}
                     {bloodRequests.filter(r => r.group === myBloodGroup).length === 0 && (
                        <div className="col-span-2 py-10 text-center space-y-2 bg-white/30 rounded-3xl border border-dashed border-red-200">
                           <ShieldCheck size={32} className="mx-auto text-red-200" />
                           <p className="text-xs font-bold text-red-800/40 uppercase tracking-widest">No active {myBloodGroup} requests found.</p>
                        </div>
                     )}
                  </div>
                </div>
              )}

              {/* Verified Donor Wall */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                   <h2 className="text-xs font-black text-navy uppercase tracking-[0.3em]">Verified Donor Directory</h2>
                   <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" />
                      <input 
                        type="text" 
                        placeholder="Filter Group..." 
                        value={donorSearch}
                        onChange={(e) => setDonorSearch(e.target.value)}
                        className="h-10 pl-9 pr-4 rounded-xl border border-gray-100 bg-white text-xs font-bold w-40 outline-none focus:border-navy/20"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   {filteredDonors.map(donor => (
                     <Card key={donor.id} className="p-6 border-gray-100 hover:border-red-200 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                           <div className="flex items-center gap-4">
                              <Avatar name={donor.name} size="md" className="bg-navy text-white font-bold" />
                              <div>
                                 <h4 className="font-bold text-navy text-sm">{donor.name}</h4>
                                 <p className="text-[9px] font-black text-navy/30 uppercase tracking-widest">{donor.distance}</p>
                              </div>
                           </div>
                           <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-xl text-xs font-black border border-red-100">
                              {donor.group}
                           </div>
                        </div>
                        <Button variant="outline" fullWidth className="rounded-xl font-bold text-[10px] uppercase h-10 border-gray-100 hover:border-red-500 hover:text-red-500">
                           Request Outreach
                        </Button>
                     </Card>
                   ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BloodBank;
