import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, ResponsiveTable } from '../../components/common';
import { 
  Building2, Search, ExternalLink, ShieldOff, CheckCircle2, MoreVertical, Plus
} from 'lucide-react';

// Mock Data
const INITIAL_HOSPITALS = [
  {
    id: 1,
    name: 'Apollo Indraprastha Hospital',
    type: 'Multi-Specialty Private',
    doctorsCount: 142,
    appointmentsCount: '12.4k',
    status: 'active'
  },
  {
    id: 2,
    name: 'Fortis Escorts Heart Institute',
    type: 'Specialized Institute',
    doctorsCount: 86,
    appointmentsCount: '8.2k',
    status: 'active'
  },
  {
    id: 3,
    name: 'Max Super Speciality',
    type: 'Multi-Specialty Private',
    doctorsCount: 110,
    appointmentsCount: '9.1k',
    status: 'active'
  },
  {
    id: 4,
    name: 'Sunrise General Clinic',
    type: 'General Public',
    doctorsCount: 14,
    appointmentsCount: '950',
    status: 'blocked'
  },
  {
    id: 5,
    name: 'MediCare Heights',
    type: 'Multi-Specialty Private',
    doctorsCount: 45,
    appointmentsCount: '3.4k',
    status: 'active'
  }
];

const HospitalsDirectory = () => {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState(INITIAL_HOSPITALS);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleHospitalStatus = (id) => {
    setHospitals(prev => prev.map(hospital => 
      hospital.id === id 
        ? { ...hospital, status: hospital.status === 'active' ? 'blocked' : 'active' }
        : hospital
    ));
  };

  const filteredHospitals = hospitals.filter(hospital => 
    hospital.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Hospitals Directory" role="admin">
      <div className="max-w-7xl mx-auto pb-20 font-body animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">Facility <span className="text-[#0D9488]">Network</span></h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2 mt-2">
              <Building2 size={14} className="text-[#0D9488]" /> Verified Hospital Infrastructure
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/20 group-focus-within:text-[#0D9488] transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search by facility name or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-navy placeholder:text-navy/20 focus:border-[#0D9488]/30 focus:ring-4 focus:ring-[#0D9488]/5 transition-all w-full md:w-80 shadow-sm"
              />
            </div>
            <button className="py-4 px-8 bg-[#0D9488] text-white hover:bg-[#115E59] rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#0D9488]/20 flex items-center gap-2">
              <Plus size={18} /> Add Hospital
            </button>
          </div>
        </div>

        {/* Directory Table Card */}
        <Card className="p-0 border border-gray-100 bg-white shadow-xl overflow-hidden rounded-[32px]">
           <ResponsiveTable 
             mobileLabelField="name"
             columns={[
               { 
                 key: 'name', 
                 label: 'Hospital Name & Type',
                 render: (val, item) => (
                   <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.status === 'active' ? 'bg-[#0D9488]/10 text-[#0D9488]' : 'bg-gray-100 text-gray-400'}`}>
                       <Building2 size={20} />
                     </div>
                     <div className="text-left">
                       <h4 className={`text-sm font-black transition-colors ${item.status === 'active' ? 'text-navy' : 'text-navy/40 line-through'}`}>{item.name}</h4>
                       <p className="text-[10px] font-bold text-navy/40 uppercase tracking-widest mt-0.5">{item.type}</p>
                     </div>
                   </div>
                 )
               },
               { 
                 key: 'doctorsCount', 
                 label: 'Registered Doctors',
                 render: (val, item) => (
                   <span className={`text-sm font-bold ${item.status === 'active' ? 'text-navy' : 'text-navy/40'}`}>
                     {val} Practitioners
                   </span>
                 )
               },
               { 
                 key: 'appointmentsCount', 
                 label: 'Total Appointments',
                 render: (val, item) => (
                   <span className={`text-sm font-bold ${item.status === 'active' ? 'text-navy' : 'text-navy/40'}`}>
                     {val} Bookings
                   </span>
                 )
               },
               { 
                 key: 'status', 
                 label: 'Platform Status',
                 render: (val) => (
                   val === 'active' ? (
                     <div className="flex items-center gap-2 text-[#0D9488]">
                       <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse"></span>
                       <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                     </div>
                   ) : (
                     <div className="flex items-center gap-2 text-red-500">
                       <span className="w-2 h-2 rounded-full bg-red-500"></span>
                       <span className="text-[10px] font-black uppercase tracking-widest">Blocked</span>
                     </div>
                   )
                 )
               }
             ]}
             data={filteredHospitals}
             renderActions={(hospital) => (
               <div className="flex items-center justify-end gap-3 transition-opacity">
                 {hospital.status === 'active' ? (
                   <Button 
                     onClick={() => toggleHospitalStatus(hospital.id)}
                     variant="danger" 
                     className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg border-none"
                   >
                      Block
                   </Button>
                 ) : (
                   <Button 
                     onClick={() => toggleHospitalStatus(hospital.id)}
                     variant="outline"
                     className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-green-500 hover:!text-white hover:border-green-500 transition-colors"
                   >
                      Unblock
                   </Button>
                 )}
                 <button 
                   onClick={() => navigate(`/hospitals/${hospital.id}`)}
                   className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-navy/40 hover:text-[#0D9488] hover:border-[#0D9488] hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
                   title="View Public Profile"
                 >
                    <ExternalLink size={16} />
                 </button>
               </div>
             )}
             emptyMessage="No hospitals found matching your search."
           />
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default HospitalsDirectory;
