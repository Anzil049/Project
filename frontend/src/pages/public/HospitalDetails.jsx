import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { Card, Button, Badge } from '../../components/common';
import { 
  Building2, MapPin, Star, Clock, Phone, 
  Globe, Shield, CheckCircle2, ChevronRight,
  Image as ImageIcon, HelpCircle, Calendar, Plus
} from 'lucide-react';
import { HOSPITALS, DOCTORS } from '../../data/mockData';

const HospitalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Find current hospital from mock data
  const hospitalData = HOSPITALS.find(h => h.id === id);

  // If not found, we could redirect or show error, but let's assume valid ID for now
  const hospital = hospitalData ? {
    ...hospitalData,
    coverImage: hospitalData.image, // mapping field names
    reviewCount: '1,200+', // default for now
    about: `${hospitalData.name} is a leading ${hospitalData.type} healthcare provider with international standards of technology, infrastructure, and clinical care. Located in ${hospitalData.location}, we are committed to achieving excellence in patient care through our dedicated team of medical experts.`,
    // Filter doctors belonging to this hospital
    doctors: DOCTORS.filter(d => d.hospitalId === id).map(d => ({
      id: d.id,
      name: d.name,
      spec: d.specialization,
      rating: d.rating,
      exp: d.experience,
      initials: d.initials,
      color: d.gradient
    })),
    // Standard facilities template if not specifically defined in mockData object
    facilityDetails: hospitalData.facilities.map((fac, idx) => ({
      id: idx,
      title: fac,
      description: `State-of-the-art ${fac} facilities providing high-resolution diagnostics and specialized care to all our patients.`,
      images: [hospitalData.image]
    })),
    reviews: [
      { id: 1, name: 'Anjali Sharma', date: 'Oct 12, 2023', rating: 5, text: `Fantastic experience at ${hospitalData.name}. Very professionally managed.`, initials: 'AS' },
      { id: 2, name: 'Rahul Verma', date: 'Sep 28, 2023', rating: 4, text: 'The infrastructure is great, though waiting times can be improved.', initials: 'RV' },
    ]
  } : null;

  if (!hospital) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-body gap-4">
        <Building2 size={64} className="text-gray-300" />
        <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Hospital Not Found</h2>
        <Button onClick={() => navigate('/')} className="bg-[#0D9488] text-white rounded-xl">Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-body">
      {/* Reusing PublicNavbar for logged-in or logged-out state representation. */}
      {/* Assuming PublicNavbar checks authStore internally, we can just render it. */}
      <PublicNavbar />

      <main className="flex-1 pb-20 pt-20">
         {/* Hero Banner Section */}
         <div className="relative h-[300px] md:h-[400px] w-full bg-navy">
            {/* Background Image */}
            <img src={hospital.coverImage} alt={hospital.name} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity" />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-transparent" />
            
            {/* Content Container */}
            <div className="absolute bottom-0 w-full px-6 pb-12">
               <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-4">
                     <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="success" className="bg-[#0D9488] text-white border-none uppercase tracking-widest text-[10px] px-3 font-black">
                           <CheckCircle2 size={12} className="mr-1 inline" /> MedCare Verified
                        </Badge>
                        <Badge className="bg-white/10 text-white border-white/20 uppercase tracking-widest text-[10px] px-3 font-black backdrop-blur-md">
                           {hospital.type}
                        </Badge>
                     </div>
                     <h1 className="text-4xl md:text-5xl font-heading font-black text-white tracking-tight leading-none">
                        {hospital.name}
                     </h1>
                     <div className="flex flex-wrap items-center gap-6 text-white/80 font-bold text-sm">
                        <div className="flex items-center gap-2 text-amber-400">
                           <Star size={16} fill="currentColor" />
                           <span className="text-white">{hospital.rating} <span className="text-white/60 font-normal">({hospital.reviewCount} Reviews)</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                           <MapPin size={16} className="text-[#0D9488]" />
                           {hospital.location}
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
                     <Button className="w-full md:w-auto bg-[#0D9488] text-white rounded-[20px] font-black text-sm px-8 py-4 shadow-xl shadow-[#0D9488]/30 border-none flex items-center justify-center gap-2">
                        <Calendar size={18} /> Book Appointment
                     </Button>
                     <Button variant="outline" className="w-full md:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20 rounded-[20px] font-black text-sm px-8 py-3 backdrop-blur-md flex items-center justify-center gap-2">
                        <Phone size={18} /> Call Hospital
                     </Button>
                  </div>
               </div>
            </div>
         </div>

         {/* Navigation Tabs */}
         <div className="bg-white border-b border-gray-200 sticky top-[72px] z-30">
            <div className="max-w-6xl mx-auto px-6 flex overflow-x-auto hide-scrollbar">
               {['overview', 'facilities', 'doctors', 'reviews'].map((tab) => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`px-8 py-5 text-xs font-black uppercase tracking-widest transition-all border-b-[3px] whitespace-nowrap ${
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

         {/* Content Area */}
         <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               
               {/* Left Column - Main Details */}
               <div className="lg:col-span-8 space-y-12">
                  
                  {activeTab === 'overview' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <section>
                           <h2 className="text-2xl font-black text-navy mb-4">About the Hospital</h2>
                           <p className="text-sm font-bold text-navy/60 leading-relaxed">
                              {hospital.about}
                           </p>
                        </section>
                     </div>
                  )}

                  {activeTab === 'facilities' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-8">
                           <div>
                              <h2 className="text-2xl font-black text-navy leading-none mb-1">Available Facilities</h2>
                              <p className="text-xs font-bold text-navy/40 uppercase tracking-widest">State of the art medical infrastructure</p>
                           </div>
                           <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[10px] uppercase px-4 py-2">
                              {hospital.facilityDetails.length} Amenities
                           </Badge>
                        </div>

                        {/* Facilities Grid */}
                        <div className="space-y-6">
                           {hospital.facilityDetails.map((fac) => (
                              <Card key={fac.id} className="p-0 border border-gray-100 bg-white rounded-[32px] overflow-hidden hover:shadow-xl hover:shadow-navy/5 transition-all flex flex-col md:flex-row group">
                                 {/* Image Carousel (Read Only) */}
                                 <div className="md:w-1/3 min-h-[220px] bg-gray-100 flex overflow-x-auto snap-x hide-scrollbar shrink-0 relative">
                                    {fac.images.map((img, idx) => (
                                       <div key={idx} className="w-full h-full shrink-0 snap-start relative border-r border-white/20">
                                          <img src={img} alt={`${fac.title} ${idx}`} className="absolute inset-0 w-full h-full object-cover" />
                                       </div>
                                    ))}
                                    {fac.images.length > 1 && (
                                       <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5">
                                          <ImageIcon size={12} /> {fac.images.length} Photos
                                       </div>
                                    )}
                                 </div>
                                 
                                 {/* Info Box */}
                                 <div className="p-8 md:w-2/3 flex flex-col justify-center">
                                    <h3 className="text-xl font-black text-navy mb-3">{fac.title}</h3>
                                    <p className="text-sm font-bold text-navy/60 leading-relaxed">
                                       {fac.description}
                                    </p>
                                    <div className="mt-6 flex items-center gap-2">
                                       <Badge variant="success" className="bg-green-50 text-green-700 border-none text-[9px] px-3 font-black uppercase tracking-widest">
                                          <CheckCircle2 size={12} className="inline mr-1" /> Available 24/7
                                       </Badge>
                                    </div>
                                 </div>
                              </Card>
                           ))}
                        </div>
                     </div>
                  )}

                  {activeTab === 'doctors' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-8">
                           <div>
                              <h2 className="text-2xl font-black text-navy leading-none mb-1">Our Specialists</h2>
                              <p className="text-xs font-bold text-navy/40 uppercase tracking-widest">Book an appointment with top doctors</p>
                           </div>
                           <Badge className="bg-purple-50 text-purple-600 border-none font-black text-[10px] uppercase px-4 py-2">
                              {hospital.doctors.length} Doctors
                           </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           {hospital.doctors.map((doc) => (
                              <Card key={doc.id} className="p-6 border border-gray-100 bg-white hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col">
                                 <div className="flex items-center gap-4 mb-5">
                                   <div className={`w-14 h-14 bg-gradient-to-br ${doc.color} rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0`}>
                                     {doc.initials}
                                   </div>
                                   <div>
                                     <h4 className="font-heading font-black text-navy">{doc.name}</h4>
                                     <p className="text-navy/40 font-bold text-xs">{doc.spec}</p>
                                   </div>
                                 </div>
                                 <div className="flex items-center justify-between mb-6">
                                   <div className="flex items-center gap-1.5">
                                     <Star size={14} className="text-[#FBBF24] fill-[#FBBF24]" />
                                     <span className="text-sm font-bold text-navy">{doc.rating}</span>
                                   </div>
                                   <span className="text-[10px] text-navy/40 uppercase tracking-widest font-black bg-gray-50 px-2 py-1 rounded-md">{doc.exp} EXP</span>
                                 </div>
                                 <Button variant="outline" className="w-full rounded-xl font-black text-xs mt-auto border-gray-200 group-hover:bg-[#0D9488] hover:!bg-[#115E59] group-hover:!text-white group-hover:border-[#0D9488] transition-all">
                                   Check Availability
                                 </Button>
                              </Card>
                           ))}
                        </div>
                     </div>
                  )}

                  {activeTab === 'reviews' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-8">
                           <div>
                              <h2 className="text-2xl font-black text-navy leading-none mb-1">Patient Reviews</h2>
                              <p className="text-xs font-bold text-navy/40 uppercase tracking-widest">Verified feedback from MedCare users</p>
                           </div>
                           <Button size="sm" className="bg-[#0D9488] text-white rounded-xl font-black text-[10px] uppercase tracking-widest px-4 border-none flex items-center gap-2">
                              <Plus size={14} /> Write Review
                           </Button>
                        </div>
                        
                        <div className="space-y-4">
                           {hospital.reviews.map((review) => (
                              <Card key={review.id} className="p-6 border border-gray-100 bg-white">
                                 <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 bg-gradient-to-br from-[#0C1A2E] to-[#1e3a8a] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                                          {review.initials}
                                       </div>
                                       <div>
                                          <h4 className="font-heading font-black text-navy text-sm">{review.name}</h4>
                                          <p className="text-[10px] text-navy/40 uppercase tracking-widest font-bold">{review.date}</p>
                                       </div>
                                    </div>
                                    <div className="flex">
                                       {[...Array(5)].map((_, i) => (
                                          <Star key={i} size={12} className={i < review.rating ? "text-[#FBBF24] fill-[#FBBF24]" : "text-gray-200 fill-gray-200"} />
                                       ))}
                                    </div>
                                 </div>
                                 <p className="text-sm font-bold text-navy/60 leading-relaxed ml-13">
                                    "{review.text}"
                                 </p>
                              </Card>
                           ))}
                        </div>
                     </div>
                  )}

               </div>

               {/* Right Column - Sticky Sidebar */}
               <div className="lg:col-span-4 relative">
                  <div className="sticky top-[160px] space-y-6">
                     <Card className="p-8 bg-white border border-gray-100 rounded-[40px] shadow-xl shadow-navy/5">
                        <h3 className="text-sm font-black text-navy uppercase tracking-widest mb-6">Quick Information</h3>
                        <div className="space-y-6">
                           <div className="flex gap-4">
                              <div className="w-10 h-10 bg-[#0D9488]/10 text-[#0D9488] rounded-2xl flex items-center justify-center shrink-0">
                                 <Clock size={18} />
                              </div>
                              <div>
                                 <h4 className="text-xs font-black text-navy uppercase tracking-widest mb-1">Timing</h4>
                                 <p className="text-sm font-bold text-navy/70">Open 24 Hours</p>
                                 <p className="text-[10px] font-bold text-green-600 mt-1 uppercase tracking-widest flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/> Open Now</p>
                              </div>
                           </div>
                           
                           <div className="flex gap-4 border-t border-gray-50 pt-6">
                              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
                                 <Building2 size={18} />
                              </div>
                              <div>
                                 <h4 className="text-xs font-black text-navy uppercase tracking-widest mb-1">Infrastructure</h4>
                                 <p className="text-sm font-bold text-navy/70">{hospital.beds} Beds</p>
                                 <p className="text-sm font-bold text-navy/70 mt-0.5">12 Operation Theaters</p>
                              </div>
                           </div>
                           
                           <div className="flex gap-4 border-t border-gray-50 pt-6">
                              <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center shrink-0">
                                 <Globe size={18} />
                              </div>
                              <div>
                                 <h4 className="text-xs font-black text-navy uppercase tracking-widest mb-1">Web Presence</h4>
                                 <a href="#" className="text-sm font-bold text-[#0D9488] hover:underline">apollohospitals.com</a>
                              </div>
                           </div>
                        </div>
                     </Card>

                     <Card className="p-6 bg-navy text-white rounded-[40px] shadow-2xl shadow-navy/20 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <h3 className="text-xs font-black uppercase tracking-widest mb-2 relative z-10">Need Assistance?</h3>
                        <p className="text-[10px] text-white/50 font-bold mb-4 relative z-10">Contact our support desk for bookings</p>
                        <Button className="w-full bg-[#0D9488] text-white rounded-2xl border-none font-black text-xs relative z-10">
                           Chat with Support
                        </Button>
                     </Card>
                  </div>
               </div>

            </div>
         </div>
      </main>
    </div>
  );
};

export default HospitalDetails;
