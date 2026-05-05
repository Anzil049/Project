import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, ResponsiveTable } from '../../components/common';
import { 
  Building2, Search, ExternalLink, ShieldOff, CheckCircle2, MoreVertical, Plus, Star, Lock, Unlock, Trash2
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

  const toggleFeatured = async (id) => {
    try {
      const response = await adminService.toggleFeatured('hospital', id);
      setHospitals(prev => prev.map(hosp => 
        hosp.id === id ? { ...hosp, isFeatured: response.isFeatured } : hosp
      ));
      toast.success(response.message);
    } catch (err) {
      toast.error('Failed to update featured status');
    }
  };

  const handleDeleteHospital = (id, name, currentStatus) => {
    toast((t) => (
      <div className="flex flex-col gap-4 p-1">
        <div>
          <p className="font-black text-navy text-sm uppercase tracking-tight">Manage Facility</p>
          <p className="text-[10px] font-bold text-navy/40 uppercase tracking-widest mt-1">Choose action for {name}</p>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <Button 
            className="bg-red-500 hover:bg-red-600 text-white h-10 py-0 text-[10px] font-black uppercase tracking-widest rounded-xl border-none shadow-lg shadow-red-500/20"
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await adminService.deleteUser(id);
                setHospitals(prev => prev.filter(hosp => hosp.id !== id));
                toast.success('Hospital record deleted completely');
              } catch (err) {
                toast.error('Failed to delete hospital');
              }
            }}
          >
            <Trash2 size={14} className="mr-2" /> Delete Completely
          </Button>
          
          <Button 
            className="bg-amber-500 hover:bg-amber-600 text-white h-10 py-0 text-[10px] font-black uppercase tracking-widest rounded-xl border-none shadow-lg shadow-amber-500/20"
            onClick={() => {
              toast.dismiss(t.id);
              toggleHospitalStatus(id);
            }}
          >
            <Lock size={14} className="mr-2" /> {currentStatus === 'active' ? 'Block Access' : 'Unblock Access'}
          </Button>
          
          <button 
            className="text-[10px] font-bold text-navy/20 uppercase tracking-widest hover:text-navy/40 transition-colors py-2"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-center',
      style: {
        borderRadius: '24px',
        background: '#fff',
        color: '#0f172a',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '16px',
        border: '1px solid #f1f5f9'
      },
    });
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
                   <button
                     onClick={() => toggleFeatured(hospital.id)}
                     className={`h-8 w-8 flex items-center justify-center rounded-lg border transition-all ${hospital.isFeatured ? 'bg-yellow-50 border-yellow-200 text-yellow-500 shadow-sm' : 'border-gray-200 text-navy/20 hover:text-yellow-500 hover:bg-yellow-50'}`}
                     title={hospital.isFeatured ? 'Remove from Featured' : 'Mark as Featured'}
                   >
                     <Star size={16} fill={hospital.isFeatured ? 'currentColor' : 'none'} />
                   </button>
                    <button
                      onClick={() => toggleHospitalStatus(hospital.id)}
                      className={`h-8 w-8 flex items-center justify-center rounded-lg border transition-all ${hospital.status === 'active' ? 'border-gray-200 text-navy/20 hover:text-amber-500 hover:bg-amber-50' : 'bg-amber-50 border-amber-200 text-amber-500 shadow-sm'}`}
                      title={hospital.status === 'active' ? 'Block Hospital' : 'Unblock Hospital'}
                    >
                      {hospital.status === 'active' ? <Unlock size={16} /> : <Lock size={16} />}
                    </button>
                    <button
                      onClick={() => handleDeleteHospital(hospital.id, hospital.name, hospital.status)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-navy/20 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Delete Hospital Completely"
                    >
                      <Trash2 size={16} />
                    </button>
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
