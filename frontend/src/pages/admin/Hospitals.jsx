import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, ResponsiveTable } from '../../components/common';
import { 
  Building2, Search, ExternalLink, ShieldOff, CheckCircle2, MoreVertical, Plus
} from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

// Mock Data
const HospitalsDirectory = () => {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const data = await adminService.getApprovedHospitals();
      setHospitals(data);
    } catch (error) {
      console.error('Failed to fetch hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHospitalStatus = async (id) => {
    try {
      const response = await adminService.toggleUserStatus(id);
      setHospitals(prev => prev.map(hospital => 
        hospital.id === id ? { ...hospital, status: response.status } : hospital
      ));
      toast.success(response.message);
    } catch (err) {
      toast.error('Failed to update status');
    }
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
          </div>
        </div>

        {/* Directory Table Card */}
        <Card className="p-0 border border-gray-100 bg-white shadow-xl overflow-hidden rounded-[32px]">
           {loading ? (
             <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#0D9488] mx-auto mb-4"></div>
                <p className="text-navy/40 font-bold">Synchronizing network...</p>
             </div>
           ) : (
             <ResponsiveTable 
               mobileLabelField="name"
               columns={[
                 { 
                   key: 'name', 
                   label: 'Hospital Name & Contact',
                   render: (val, item) => (
                     <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.status === 'active' ? 'bg-[#0D9488]/10 text-[#0D9488]' : 'bg-gray-100 text-gray-400'}`}>
                         <Building2 size={20} />
                       </div>
                       <div className="text-left">
                         <h4 className={`text-sm font-black transition-colors ${item.status === 'active' ? 'text-navy' : 'text-navy/40 line-through'}`}>{item.name}</h4>
                         <p className="text-[10px] font-bold text-navy/40 uppercase tracking-widest mt-0.5">{item.email}</p>
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
                   key: 'phone', 
                   label: 'Contact Number',
                   render: (val, item) => (
                     <span className={`text-sm font-bold ${item.status === 'active' ? 'text-navy' : 'text-navy/40'}`}>
                       {val}
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
                   <Button 
                     onClick={() => toggleHospitalStatus(hospital.id)}
                     variant={hospital.status === 'active' ? 'danger' : 'outline'}
                     className={`h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg ${hospital.status === 'active' ? 'border-none' : 'hover:bg-green-500 hover:!text-white hover:border-green-500'}`}
                   >
                      {hospital.status === 'active' ? 'Block' : 'Unblock'}
                   </Button>
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
           )}
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default HospitalsDirectory;
