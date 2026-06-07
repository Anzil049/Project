import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { Card, Button, Badge } from '../../components/common';
import { 
  Building2, MapPin, Star, Clock, Phone, 
  CheckCircle2, ChevronRight, Stethoscope, Briefcase, GraduationCap
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import doctorService from '../../services/doctorService';
import { toast } from 'react-hot-toast';

const DoctorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      setLoading(true);
      try {
        const data = await doctorService.getDoctorById(id);
        
        // Transform data for UI
        const transformedData = {
          ...data,
          name: data.user?.name || 'Unknown Doctor',
          image: data.user?.image || null,
          initials: (data.user?.name || 'D').split(' ').map(n => n[0]).join('').substring(0, 2),
          specialization: data.specialization || 'General Physician',
          experience: data.experience || '5+ Years',
          qualifications: data.qualifications || 'MBBS, MD',
          location: data.address || `${data.hospitalId?.city || ''}${data.hospitalId?.city && data.hospitalId?.state ? ', ' : ''}${data.hospitalId?.state || ''}` || 'Location N/A',
          rating: data.rating || 4.8, 
          reviewCount: '150+', 
          about: data.about || `Dr. ${data.user?.name?.split(' ').pop() || 'Specialist'} is a highly experienced ${data.specialization} dedicated to providing the best clinical care.`,
          hospitalName: data.hospitalId?.name || 'Independent Clinic',
          hospitalImage: data.hospitalId?.coverImage || null,
          fee: data.fee || 500,
          color: data.color || 'from-[#0D9488] to-[#115E59]',
          reviews: [
            { id: 1, name: 'Anjali Sharma', date: 'Oct 12, 2023', rating: 5, text: `Fantastic experience. Very professionally managed.`, initials: 'AS' },
            { id: 2, name: 'Rahul Verma', date: 'Sep 28, 2023', rating: 4, text: 'Great consultation, doctor was very patient.', initials: 'RV' },
          ]
        };
        
        setDoctor(transformedData);
      } catch (error) {
        console.error("Failed to fetch doctor details", error);
        toast.error("Doctor not found");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-body gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#0D9488]"></div>
        <p className="text-navy/40 font-bold uppercase tracking-widest text-xs">Loading Doctor Profile...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-body gap-4">
        <Stethoscope size={64} className="text-gray-300" />
        <h2 className="text-2xl font-black text-navy uppercase tracking-tight">Doctor Not Found</h2>
        <Button onClick={() => navigate('/')} className="bg-[#0D9488] text-white rounded-xl">Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-body">
      <PublicNavbar />

      <main className="flex-1 pb-20 pt-20">
         {/* Hero Banner Section */}
         <div className="relative h-[250px] md:h-[350px] w-full bg-navy">
            <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy to-navy/80" />
            
            <div className="absolute bottom-0 w-full px-6 pb-12">
               <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="flex items-end gap-6">
                     <div className={`w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br ${doctor.color} border-4 border-white flex items-center justify-center text-white text-3xl md:text-5xl font-black shadow-2xl shrink-0 overflow-hidden`}>
                        {doctor.image ? (
                           <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                        ) : (
                           doctor.initials
                        )}
                     </div>
                     <div className="space-y-3 mb-2">
                        <div className="flex flex-wrap items-center gap-3">
                           <Badge variant="success" className="bg-[#0D9488] text-white border-none uppercase tracking-widest text-[10px] px-3 font-black">
                              <CheckCircle2 size={12} className="mr-1 inline" /> Verified Specialist
                           </Badge>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-heading font-black text-white tracking-tight leading-none uppercase">
                           {doctor.name}
                        </h1>
                        <p className="text-primary font-black uppercase tracking-widest text-sm md:text-base">
                           {doctor.specialization}
                        </p>
                     </div>
                  </div>

                  <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
                     <Button 
                        onClick={() => navigate(ROUTES.PATIENT.BOOKING_HUB, { state: { doctorId: doctor._id } })}
                        className="w-full md:w-auto bg-[#0D9488] text-white rounded-[20px] font-black text-sm px-8 py-4 shadow-xl shadow-[#0D9488]/30 border-none flex items-center justify-center gap-2 hover:bg-[#0F766E] transition-all"
                      >
                        <Clock size={18} /> Book Appointment
                     </Button>
                  </div>
               </div>
            </div>
         </div>

         {/* Navigation Tabs */}
         <div className="bg-white border-b border-gray-200 sticky top-[72px] z-30">
            <div className="max-w-6xl mx-auto px-6 flex overflow-x-auto hide-scrollbar">
               {[
                 { id: 'overview', label: 'Overview' },
                 { id: 'hospital', label: 'Clinic/Hospital' },
                 { id: 'reviews', label: 'Reviews' }
               ].map((tab) => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`px-8 py-5 text-xs font-black uppercase tracking-widest transition-all border-b-[3px] whitespace-nowrap ${
                        activeTab === tab.id 
                           ? 'border-[#0D9488] text-[#0D9488]' 
                           : 'border-transparent text-navy/40 hover:text-navy hover:bg-gray-50'
                     }`}
                  >
                     {tab.label}
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
                           <h2 className="text-2xl font-black text-navy mb-4 uppercase tracking-tight">About The Doctor</h2>
                           <p className="text-sm font-bold text-navy/60 leading-relaxed">
                              {doctor.about}
                           </p>
                        </section>

                        <div className="grid grid-cols-2 gap-4">
                           <Card className="p-6 bg-white border border-gray-100 rounded-3xl">
                              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                                 <Briefcase size={20} />
                              </div>
                              <h3 className="text-xs font-black uppercase tracking-widest text-navy/40 mb-1">Experience</h3>
                              <p className="text-lg font-black text-navy">{doctor.experience}</p>
                           </Card>
                           <Card className="p-6 bg-white border border-gray-100 rounded-3xl">
                              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                                 <GraduationCap size={20} />
                              </div>
                              <h3 className="text-xs font-black uppercase tracking-widest text-navy/40 mb-1">Qualifications</h3>
                              <p className="text-lg font-black text-navy">{doctor.qualifications}</p>
                           </Card>
                        </div>
                     </div>
                  )}

                  {activeTab === 'hospital' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-8">
                           <div>
                              <h2 className="text-2xl font-black text-navy leading-none mb-1 uppercase tracking-tight">Primary Practice</h2>
                              <p className="text-xs font-bold text-navy/40 uppercase tracking-widest">Where you can visit the doctor</p>
                           </div>
                        </div>

                        <Card className="p-0 border border-gray-100 bg-white rounded-[32px] overflow-hidden hover:shadow-xl hover:shadow-navy/5 transition-all flex flex-col md:flex-row group">
                           <div className="md:w-1/3 min-h-[200px] bg-gradient-to-br from-[#0D9488]/10 to-[#115E59]/10 shrink-0 relative flex items-center justify-center">
                              {doctor.hospitalImage ? (
                                 <img src={doctor.hospitalImage} alt={doctor.hospitalName} className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                 <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-[#0D9488] shadow-md z-10">
                                    <Building2 size={28} />
                                 </div>
                              )}
                           </div>
                           
                           <div className="p-8 md:w-2/3 flex flex-col justify-center">
                              <Badge className="w-max bg-gray-100 text-navy font-black text-[10px] uppercase tracking-widest mb-3 border-none">
                                 Affiliated Hospital
                              </Badge>
                              <h3 className="text-xl font-black text-navy mb-2 uppercase tracking-tight">{doctor.hospitalName}</h3>
                              <div className="flex items-center gap-2 mb-4 text-sm font-bold text-navy/60">
                                 <MapPin size={16} className="text-[#0D9488]" />
                                 {doctor.location}
                              </div>
                              <Button 
                                 onClick={() => {
                                    if(doctor.hospitalId?._id) {
                                       navigate(ROUTES.PUBLIC_HOSPITAL.replace(':id', doctor.hospitalId._id));
                                    }
                                 }}
                                 className="w-max !bg-[#EEF2F6] !text-navy hover:!bg-navy hover:!text-white rounded-[20px] font-black !text-[10px] uppercase tracking-widest px-6"
                              >
                                 View Hospital Profile
                              </Button>
                           </div>
                        </Card>
                     </div>
                  )}

                  {activeTab === 'reviews' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-8">
                           <div>
                              <h2 className="text-2xl font-black text-navy leading-none mb-1 uppercase tracking-tight">Patient Reviews</h2>
                              <p className="text-xs font-bold text-navy/40 uppercase tracking-widest">Verified feedback</p>
                           </div>
                        </div>
                        
                        <div className="space-y-4">
                           {doctor.reviews.map((review) => (
                              <Card key={review.id} className="p-6 border border-gray-100 bg-white rounded-3xl">
                                 <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 bg-gradient-to-br from-[#0C1A2E] to-[#1e3a8a] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                                          {review.initials}
                                       </div>
                                       <div>
                                          <h4 className="font-heading font-black text-navy text-sm uppercase">{review.name}</h4>
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
                        <h3 className="text-xs font-black text-navy uppercase tracking-widest mb-6">Quick Information</h3>
                        <div className="space-y-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                                 <Star size={20} fill="currentColor" />
                              </div>
                              <div>
                                 <h4 className="text-xs font-black text-navy uppercase tracking-widest mb-1">Patient Rating</h4>
                                 <p className="text-lg font-black text-navy leading-none">{doctor.rating} <span className="text-xs text-navy/40">/ 5.0</span></p>
                              </div>
                           </div>
                           
                           <div className="flex gap-4 border-t border-gray-50 pt-6">
                              <div className="w-10 h-10 bg-[#0D9488]/10 text-[#0D9488] rounded-2xl flex items-center justify-center shrink-0">
                                 <Stethoscope size={18} />
                              </div>
                              <div>
                                 <h4 className="text-xs font-black text-navy uppercase tracking-widest mb-1">Consultation Fee</h4>
                                 <p className="text-xl font-black text-navy">₹{doctor.fee}</p>
                              </div>
                           </div>
                        </div>
                     </Card>
                  </div>
               </div>

            </div>
         </div>
      </main>
      <Footer />
    </div>
  );
};

export default DoctorDetails;
