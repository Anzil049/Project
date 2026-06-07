import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { Card, Badge, Button } from '../../components/common';
import { 
  Building2, MapPin, Star, Search, 
  Map as MapIcon, Filter, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import hospitalService from '../../services/hospitalService';
import { toast } from 'react-hot-toast';

const FindHospitals = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeFacility, setActiveFacility] = useState('All');
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [coords, setCoords] = useState(null);

  const [facilities, setFacilities] = useState(['All']);

  useEffect(() => {
    const loadFacilities = async () => {
      try {
        const facs = await hospitalService.getFacilities();
        setFacilities(['All', ...facs]);
      } catch (error) {
        console.error('Failed to load facilities:', error);
      }
    };
    loadFacilities();
  }, []);

  useEffect(() => {
    if (nearbyMode && coords) {
      fetchNearby();
    } else {
      fetchAll();
    }
  }, [nearbyMode, coords, activeFacility, search]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await hospitalService.getHospitals({ search, facility: activeFacility });
      setHospitals(data);
    } catch (error) {
      toast.error("Failed to load hospitals");
    } finally {
      setLoading(false);
    }
  };

  const fetchNearby = async () => {
    setLoading(true);
    try {
      const data = await hospitalService.getNearbyHospitals(coords.longitude, coords.latitude, 50, activeFacility, search);
      setHospitals(data);
    } catch (error) {
      toast.error("Failed to find nearby hospitals");
    } finally {
      setLoading(false);
    }
  };

  const toggleNearby = () => {
    if (!nearbyMode) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCoords({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            setNearbyMode(true);
          },
          (error) => {
            toast.error("Please enable location access");
          }
        );
      }
    } else {
      setNearbyMode(false);
      setCoords(null);
    }
  };

  const displayHospitals = hospitals.map(h => ({
    id: h.user?._id || h._id,
    name: h.user?.name || 'Unknown Hospital',
    type: h.facilityType || 'Medical Facility',
    location: `${h.city || ''}${h.city && h.state ? ', ' : ''}${h.state || ''}` || 'Location N/A',
    rating: 4.8, // Mocked as it's not in schema
    image: h.coverImage || h.user?.image || null,
    facilities: h.facilities && h.facilities.length > 0 ? h.facilities.map(f => f.title) : [h.facilityType]
  }));

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body">
      <PublicNavbar />
      
      <main className="pt-24 pb-20">
        {/* HERO SEARCH */}
        <section className="bg-navy py-16 lg:py-24 relative overflow-hidden">
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #0D9488 0%, transparent 70%)' }} />
           <div className="container max-w-7xl mx-auto px-6 relative z-10 text-center">
              <h1 className="text-4xl lg:text-5xl font-heading font-black text-white mb-6 uppercase tracking-tight">
                 Find a <span className="text-[#0D9488]">Medical Facility</span>
              </h1>
              <p className="text-white/40 font-bold uppercase tracking-widest text-xs mb-10 max-w-xl mx-auto leading-relaxed">
                 Browse verified partner hospitals with real-time bed availability and specialist rosters.
              </p>
              
              <div className="max-w-2xl mx-auto relative group">
                 <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-navy/40 group-focus-within:text-[#0D9488] transition-colors" />
                 <input 
                    type="text"
                    placeholder="Search by hospital, clinic, city, or specialization..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white rounded-[24px] py-6 pl-16 pr-8 text-sm font-bold text-navy outline-none shadow-2xl shadow-navy/20 focus:ring-4 focus:ring-[#0D9488]/10 transition-all"
                 />
              </div>

              <div className="mt-8 flex justify-center">
                <button 
                  onClick={toggleNearby}
                  className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                    nearbyMode ? 'bg-[#0D9488]/10 border-[#0D9488] text-[#0D9488]' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                  }`}
                >
                  <MapPin size={16} />
                  {nearbyMode ? 'Clear Location Filter' : 'Hospitals Near Me'}
                </button>
              </div>
           </div>
        </section>

        {/* FILTERS & RESULTS */}
        <section className="container max-w-7xl mx-auto px-6 py-12 relative z-20">
           {/* Facility Chips */}
           <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
              {facilities.map(fac => (
                 <button
                    key={fac}
                    onClick={() => setActiveFacility(fac)}
                    className={`whitespace-nowrap px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                       activeFacility === fac
                          ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-lg shadow-[#0D9488]/20'
                          : 'bg-white text-navy/50 border-white hover:border-[#0D9488]/30'
                    }`}
                 >
                    {fac}
                 </button>
              ))}
           </div>

           {loading ? (
             <div className="py-24 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0D9488] mx-auto mb-4"></div>
                <p className="text-navy/40 font-bold uppercase tracking-widest text-xs">Fetching verified facilities...</p>
             </div>
           ) : (
             <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayHospitals.map((hospital) => (
                   <Card 
                      key={hospital.id} 
                      onClick={() => navigate(ROUTES.PUBLIC_HOSPITAL.replace(':id', hospital.id))}
                      className="p-0 border-none bg-white rounded-3xl shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden group cursor-pointer"
                   >
                      <div className="relative aspect-video bg-gradient-to-br from-[#0D9488]/10 to-[#115E59]/10 flex items-center justify-center">
                          {hospital.image ? (
                             <img src={hospital.image} alt={hospital.name} className="w-full h-full object-cover transition-transform duration-700 absolute inset-0" />
                          ) : (
                             <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-[#0D9488] shadow-sm z-10">
                                <Building2 size={28} />
                             </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent" />
                         <Badge variant="success" className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border-white/30 text-white font-black text-[9px] uppercase tracking-widest px-3">
                            <CheckCircle2 size={12} className="inline mr-1" /> {hospital.type}
                         </Badge>
                         <div className="absolute bottom-6 left-6 text-white">
                            <p className="flex items-center gap-1.5 text-xs font-bold text-white/70">
                               <MapPin size={14} className="text-[#0D9488]" /> {hospital.location}
                            </p>
                         </div>
                      </div>
                      
                      <div className="p-8 space-y-6">
                         <div className="flex justify-between items-start">
                            <h3 className="text-xl font-heading font-black text-navy leading-tight uppercase tracking-tight">{hospital.name}</h3>
                            <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-xl flex items-center gap-1 text-[10px] font-black">
                               <Star size={12} fill="currentColor" /> {hospital.rating}
                            </div>
                         </div>
                         
                         <div className="flex flex-wrap gap-2 pt-2">
                            {hospital.facilities.slice(0, 3).map(f => (
                               <span key={f} className="text-[9px] font-black uppercase text-navy/40 bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg">
                                  {f}
                               </span>
                            ))}
                         </div>

                         <Button 
                            onClick={(e) => {
                               e.stopPropagation();
                               navigate(ROUTES.PUBLIC_HOSPITAL.replace(':id', hospital.id));
                            }}
                            className="w-full bg-[#0D9488] text-white hover:bg-[#0F766E] rounded-[20px] font-black text-[11px] uppercase tracking-[0.15em] py-4 border-none shadow-none group-hover:shadow-xl group-hover:shadow-[#0D9488]/40 transition-all flex items-center justify-center gap-2"
                         >
                            View Details <ChevronRight size={16} />
                         </Button>
                      </div>
                   </Card>
                ))}
             </div>
           )}

           {!loading && displayHospitals.length === 0 && (
              <div className="py-24 text-center">
                 <Building2 size={64} className="mx-auto text-gray-200 mb-6" />
                 <h3 className="text-2xl font-black text-navy mb-2">No facilities found</h3>
                 <p className="text-sm font-bold text-navy/40">Try adjusting your search filters or location settings.</p>
              </div>
           )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FindHospitals;
