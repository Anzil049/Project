import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Input, Avatar, Badge, EmptyState } from '../../components/common';
import { 
  Heart, MapPin, Phone, AlertCircle, Send, 
  Search, Filter, Droplet, User, Bell, 
  Navigation, Clock, CheckCircle2, ShieldCheck, Activity
} from 'lucide-react';

const BloodBank = () => {
  const myBloodGroup = 'O+'; // Current user's blood group
  const [donorSearch, setDonorSearch] = useState('');
  const [donorPage, setDonorPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const DONORS_PER_PAGE = 4;
  const REQUESTS_PER_PAGE = 3;

  const [formData, setFormData] = useState({
    bloodGroup: '',
    location: '',
    contactNumber: '',
    urgency: 'Normal' // only used for request
  });
  const [formType, setFormType] = useState('request'); // 'request' | 'donate'


  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencies = [
    { label: 'Normal', color: 'text-blue-500' },
    { label: 'Urgent', color: 'text-orange-500' },
    { label: 'Critical', color: 'text-red-500' }
  ];

  const [donors] = useState([
    {
      id: 1,
      name: 'Aditya Sharma',
      group: 'O+',
      distance: '1.2 km away',
      location: 'Koramangala, Bangalore',
      lastDonated: '4 months ago',
      status: 'Available',
      avatar: null
    },
    {
      id: 2,
      name: 'Sarah Williams',
      group: 'A+',
      distance: '2.5 km away',
      location: 'HSR Layout, Bangalore',
      lastDonated: '2 months ago',
      status: 'Available',
      avatar: null
    },
    {
      id: 3,
      name: 'Rajesh Kumar',
      group: 'B+',
      distance: '3.8 km away',
      location: 'Indiranagar, Bangalore',
      lastDonated: '6 months ago',
      status: 'Available',
      avatar: null
    },
    {
      id: 4,
      name: 'Michael Chen',
      group: 'O-',
      distance: '4.1 km away',
      location: 'Whitefield, Bangalore',
      lastDonated: '1 month ago',
      status: 'Busy',
      avatar: null
    }
  ]);

  const [bloodRequests] = useState([
    { id: 1, name: 'Priya Nair', group: 'AB-', location: 'Manipal Hospital, Bangalore', urgency: 'Critical', time: '12 mins ago', units: 3 },
    { id: 2, name: 'Vikram Desai', group: 'O+', location: 'Fortis Hospital, Koramangala', urgency: 'Urgent', time: '45 mins ago', units: 2 },
    { id: 3, name: 'Fatima Sheikh', group: 'B-', location: 'Apollo Clinic, HSR Layout', urgency: 'Normal', time: '1 hour ago', units: 1 },
    { id: 4, name: 'Arjun Reddy', group: 'A+', location: 'Columbia Asia, Whitefield', urgency: 'Critical', time: '2 hours ago', units: 4 },
  ]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formType === 'request') {
      alert('Blood request submitted successfully!');
    } else {
      alert('You are now registered as a donor. Thank you!');
    }
  };

  const sendNotification = (donorName) => {
    alert(`Notification sent to ${donorName}.`);
  };

  const filteredDonors = donors.filter(d => d.group.toLowerCase().includes(donorSearch.toLowerCase()));

  return (
    <DashboardLayout title="Blood Bank" role="patient">
      <div className="max-w-6xl mx-auto space-y-8 pb-20 font-body">
        
        {/* Standardized Header Section */}
        <div className="space-y-1">
           <h1 className="text-3xl font-heading font-black text-navy tracking-tight">Blood Bank</h1>
           <p className="text-sm text-navy/40 font-bold">Connect with verified donors and manage urgent blood requests</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Column - High Contrast */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-8 bg-white border border-gray-100 shadow-2xl shadow-navy/5 relative overflow-hidden">
              <div className="relative z-10 space-y-8">
                <div className="flex bg-gray-50 p-1 rounded-2xl mb-6 border border-gray-100">
                   <button
                     onClick={() => setFormType('request')}
                     className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${formType === 'request' ? 'bg-white text-navy shadow-sm' : 'text-navy/40 hover:text-navy/60'}`}
                   >
                     Request Blood
                   </button>
                   <button
                     onClick={() => setFormType('donate')}
                     className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${formType === 'donate' ? 'bg-white text-[#0D9488] shadow-sm' : 'text-navy/40 hover:text-navy/60'}`}
                   >
                     Donate Blood
                   </button>
                </div>

                <div>
                   <h2 className="text-2xl font-black text-navy mb-2 tracking-tight">
                     {formType === 'request' ? 'Request Blood' : 'Register as Donor'}
                   </h2>
                   <p className="text-sm font-medium text-navy/40 leading-relaxed">
                     {formType === 'request' ? 'Submit a request to notify all eligible donors in your current location.' : 'Join our network of verified donors. You will be notified when someone needs blood.'}
                   </p>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-6">
                  {/* Blood Group Selector - Tighter Styling */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-navy/40 uppercase tracking-[0.2em] ml-1">
                      {formType === 'request' ? 'Select Blood Group' : 'Your Blood Group'}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                       {bloodGroups.map(bg => (
                         <button
                           key={bg}
                           type="button"
                           onClick={() => setFormData({...formData, bloodGroup: bg})}
                           className={`
                             h-11 rounded-xl font-black text-xs transition-all border-2
                             ${formData.bloodGroup === bg 
                               ? 'bg-[#0D9488] border-[#0D9488] text-white shadow-lg shadow-[#0D9488]/20' 
                               : 'bg-gray-50/50 border-gray-100 text-navy/40 hover:border-[#0D9488]/30 hover:text-[#0D9488]'}
                           `}
                         >
                           {bg}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Input 
                      label={formType === 'request' ? "Emergency Location" : "Your Default Location"}
                      placeholder="Hospital or City area"
                      icon={MapPin}
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      required
                    />
                    <Input 
                      label="Contact Number"
                      placeholder="Your mobile number"
                      icon={Phone}
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                      required
                    />
                  </div>

                  {formType === 'request' && (
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-navy/40 uppercase tracking-[0.2em] ml-1">Priority Level</label>
                      <div className="flex bg-gray-50 border border-gray-100 p-1 rounded-2xl">
                         {urgencies.map(u => (
                           <button
                             key={u.label}
                             type="button"
                             onClick={() => setFormData({...formData, urgency: u.label})}
                             className={`
                               flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                               ${formData.urgency === u.label 
                                 ? 'bg-white text-navy shadow-md ring-1 ring-black/5' 
                                 : 'text-navy/30 hover:text-navy/60'}
                             `}
                           >
                             {u.label}
                           </button>
                         ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit"
                    className="w-full bg-[#0D9488] hover:bg-[#115E59] shadow-xl shadow-[#0D9488]/10 h-14 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 border-none"
                  >
                    {formType === 'request' ? (
                      <>Broadcast Request <Navigation size={18} fill="currentColor" /></>
                    ) : (
                      <>Register as Donor <Heart size={18} fill="currentColor" /></>
                    )}
                  </Button>
                </form>

                {formType === 'request' && (
                  <div className="p-5 bg-orange-50/30 rounded-2xl border border-orange-100 flex gap-3">
                     <AlertCircle size={18} className="text-orange-600 shrink-0 mt-0.5" />
                     <p className="text-[10px] font-bold text-orange-800/70 leading-relaxed italic">
                       Requests are broadcasted immediately. Verified donors will see your contact details only upon acceptance.
                     </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Motivational Box - Matching Navy Theme */}
            <div className="p-8 bg-[#0C1A2E] text-white rounded-[32px] overflow-hidden relative shadow-2xl group flex flex-col justify-center min-h-[220px]">
               <div className="relative z-10 space-y-4">
                  <div className="bg-[#0D9488] w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-[#0D9488]/20">
                     <Heart fill="currentColor" size={24} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight italic">"Share Life, Give Blood."</h3>
                  <p className="text-xs text-white/60 font-bold uppercase tracking-[0.2em] leading-relaxed">Every drop contributes to a heartbeat.</p>
               </div>
               <Heart className="absolute -bottom-10 -right-10 text-white/[0.03] w-48 h-48 rotate-[15deg] group-hover:scale-110 transition-transform duration-700" />
            </div>
          </div>

          {/* Donor Column - Clean Minimalist List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50" />
                  <h2 className="text-xs font-black text-navy uppercase tracking-[0.3em]">Verified Donors Near You</h2>
               </div>
               <div className="flex gap-2 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" />
                  <input
                    type="text"
                    placeholder="Search group (e.g. O+)"
                    value={donorSearch}
                    onChange={(e) => {
                      setDonorSearch(e.target.value);
                      setDonorPage(1); // Reset to first page
                    }}
                    className="h-10 pl-9 pr-4 rounded-xl border border-gray-100 bg-white text-navy text-xs font-bold focus:outline-none focus:border-[#0D9488]/30 transition-all w-36 sm:w-48 placeholder:text-navy/20"
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               {filteredDonors.slice((donorPage - 1) * DONORS_PER_PAGE, donorPage * DONORS_PER_PAGE).map(donor => (
                 <Card key={donor.id} className="p-6 bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#0D9488]/30 transition-all group animate-in fade-in slide-in-from-bottom-3 duration-500">
                    <div className="flex items-start justify-between mb-6">
                       <div className="flex items-center gap-4">
                          <Avatar name={donor.name} size="lg" className="bg-[#0D9488]/5 text-[#0D9488] font-black border border-[#0D9488]/10" />
                          <div>
                             <h4 className="font-bold text-navy text-base leading-tight group-hover:text-[#0D9488] transition-colors">{donor.name}</h4>
                             <p className="text-[10px] font-bold text-navy/40 flex items-center gap-1.5 mt-1.5 uppercase tracking-wider">
                                <Clock size={10} /> {donor.lastDonated}
                             </p>
                          </div>
                       </div>
                       <div className={`
                         px-4 py-2 rounded-2xl font-black text-base shadow-inner border
                         ${donor.group.includes('-') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-teal-50 text-[#0D9488] border-teal-100'}
                       `}>
                          {donor.group}
                       </div>
                    </div>

                    <div className="space-y-4 mb-8">
                       <div className="flex items-start gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                          <MapPin size={16} className="text-navy/20 mt-0.5" />
                          <div>
                             <p className="text-[9px] font-black text-navy/30 uppercase tracking-[0.2em] mb-1">Last Spotted</p>
                             <p className="text-xs font-bold text-navy/70 leading-tight">{donor.location}</p>
                          </div>
                       </div>
                       <div className="flex items-center justify-between px-1">
                          <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-[0.2em]">{donor.distance}</p>
                       </div>
                    </div>

                    <Button 
                      onClick={() => sendNotification(donor.name)}
                      className="w-full h-12 rounded-xl font-black text-[10.5px] uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all border-none bg-[#0D9488] text-white hover:bg-[#115E59] shadow-xl shadow-teal-500/20"
                    >
                      <Send size={16} /> Reach Out
                    </Button>
                 </Card>
               ))}
            </div>

            {/* Donor Pagination */}
            {filteredDonors.length > DONORS_PER_PAGE && (
              <div className="flex items-center justify-center gap-2 pt-2">
                 <button
                   onClick={() => setDonorPage(p => Math.max(1, p - 1))}
                   disabled={donorPage === 1}
                   className="px-3 py-2 rounded-xl border border-gray-100 bg-white text-navy/40 hover:text-navy hover:bg-gray-50 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                 >← Prev</button>
                 {Array.from({ length: Math.ceil(filteredDonors.length / DONORS_PER_PAGE) }, (_, i) => (
                   <button
                     key={i}
                     onClick={() => setDonorPage(i + 1)}
                     className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                       donorPage === i + 1 ? 'bg-[#0D9488] text-white shadow-lg shadow-teal-500/20' : 'bg-white border border-gray-100 text-navy/40 hover:bg-gray-50'
                     }`}
                   >{i + 1}</button>
                 ))}
                 <button
                   onClick={() => setDonorPage(p => Math.min(Math.ceil(filteredDonors.length / DONORS_PER_PAGE), p + 1))}
                   disabled={donorPage === Math.ceil(filteredDonors.length / DONORS_PER_PAGE)}
                   className="px-3 py-2 rounded-xl border border-gray-100 bg-white text-navy/40 hover:text-navy hover:bg-gray-50 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                 >Next →</button>
              </div>
            )}

            {/* Recent Blood Requests */}
            <div className="space-y-4">
               <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                     <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500/50" />
                     <h2 className="text-xs font-black text-navy uppercase tracking-[0.3em]">People Requesting Blood</h2>
                  </div>
                  <span className="text-[10px] font-bold text-navy/30 uppercase tracking-widest">{bloodRequests.length} Active</span>
               </div>

               <div className="space-y-3">
                  {bloodRequests.slice((requestPage - 1) * REQUESTS_PER_PAGE, requestPage * REQUESTS_PER_PAGE).map(req => (
                    <div key={req.id} className={`
                      p-5 bg-white rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md
                      ${req.urgency === 'Critical' ? 'border-red-200 border-l-4 border-l-red-500' : req.urgency === 'Urgent' ? 'border-orange-200 border-l-4 border-l-orange-400' : 'border-gray-100'}
                    `}>
                       <div className="flex items-center gap-4">
                          <Avatar name={req.name} size="md" className="bg-gray-50 text-navy font-bold border border-gray-100" />
                          <div className="space-y-1">
                             <div className="flex items-center gap-3">
                                <h4 className="font-bold text-navy text-sm">{req.name}</h4>
                                <span className={`
                                  text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full
                                  ${req.urgency === 'Critical' ? 'bg-red-100 text-red-600' : req.urgency === 'Urgent' ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-500'}
                                `}>{req.urgency}</span>
                             </div>
                             <p className="text-[10px] font-bold text-navy/40 flex items-center gap-1.5">
                                <MapPin size={10} /> {req.location}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 sm:gap-6 sm:min-w-[170px] justify-end">
                          <div className="text-center">
                             <p className="text-lg font-black text-navy">{req.group}</p>
                             <p className="text-[8px] font-bold text-navy/30 uppercase tracking-widest">{req.units} units</p>
                          </div>
                          <div className="flex flex-col items-end justify-center gap-1.5 w-[90px]">
                             <p className="text-[9px] font-bold text-navy/30">{req.time}</p>
                             {req.group === myBloodGroup ? (
                               <button
                                 onClick={() => alert(`Thank you! Your donation offer for ${req.name} has been registered.`)}
                                 className="w-full py-1.5 bg-[#0D9488] text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-[#115E59] transition-all shadow-md shadow-teal-500/20 text-center"
                               >
                                 Donate
                               </button>
                             ) : (
                               <div className="w-full py-1.5 border border-gray-100 rounded-lg bg-gray-50/50 text-center">
                                 <p className="text-[8px] font-bold text-navy/30 uppercase tracking-widest">No Match</p>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                  ))}
               </div>

               {/* Request Pagination */}
               {bloodRequests.length > REQUESTS_PER_PAGE && (
                 <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setRequestPage(p => Math.max(1, p - 1))}
                      disabled={requestPage === 1}
                      className="px-3 py-2 rounded-xl border border-gray-100 bg-white text-navy/40 hover:text-navy hover:bg-gray-50 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >← Prev</button>
                    {Array.from({ length: Math.ceil(bloodRequests.length / REQUESTS_PER_PAGE) }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setRequestPage(i + 1)}
                        className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                          requestPage === i + 1 ? 'bg-[#0D9488] text-white shadow-lg shadow-teal-500/20' : 'bg-white border border-gray-100 text-navy/40 hover:bg-gray-50'
                        }`}
                      >{i + 1}</button>
                    ))}
                    <button
                      onClick={() => setRequestPage(p => Math.min(Math.ceil(bloodRequests.length / REQUESTS_PER_PAGE), p + 1))}
                      disabled={requestPage === Math.ceil(bloodRequests.length / REQUESTS_PER_PAGE)}
                      className="px-3 py-2 rounded-xl border border-gray-100 bg-white text-navy/40 hover:text-navy hover:bg-gray-50 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >Next →</button>
                 </div>
               )}
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BloodBank;
