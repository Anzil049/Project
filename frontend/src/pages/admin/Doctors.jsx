import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button } from '../../components/common';
import { 
  Stethoscope, Search, ExternalLink, ShieldOff, 
  Star, Building2, CheckCircle2, Lock, Unlock, Trash2
} from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const AdminDoctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await adminService.getApprovedDoctors();
      setDoctors(data);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const toggleDoctorStatus = async (id) => {
    try {
      const response = await adminService.toggleUserStatus(id);
      setDoctors(prev => prev.map(doc =>
        doc.id === id ? { ...doc, status: response.status } : doc
      ));
      toast.success(response.message);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const toggleFeatured = async (id) => {
    try {
      const response = await adminService.toggleFeatured('doctor', id);
      setDoctors(prev => prev.map(doc =>
        doc.id === id ? { ...doc, isFeatured: response.isFeatured } : doc
      ));
      toast.success(response.message);
    } catch (err) {
      toast.error('Failed to update featured status');
    }
  };

  const handleDeleteDoctor = (id, name, currentStatus) => {
    toast((t) => (
      <div className="flex flex-col gap-4 p-1">
        <div>
          <p className="font-black text-navy text-sm uppercase tracking-tight">Manage Practitioner</p>
          <p className="text-[10px] font-bold text-navy/40 uppercase tracking-widest mt-1">Choose action for Dr. {name}</p>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <Button 
            className="bg-red-500 hover:bg-red-600 text-white h-10 py-0 text-[10px] font-black uppercase tracking-widest rounded-xl border-none shadow-lg shadow-red-500/20"
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await adminService.deleteUser(id);
                setDoctors(prev => prev.filter(doc => doc.id !== id));
                toast.success('Doctor record deleted completely');
              } catch (err) {
                toast.error('Failed to delete doctor');
              }
            }}
          >
            <Trash2 size={14} className="mr-2" /> Delete Completely
          </Button>
          
          <Button 
            className="bg-amber-500 hover:bg-amber-600 text-white h-10 py-0 text-[10px] font-black uppercase tracking-widest rounded-xl border-none shadow-lg shadow-amber-500/20"
            onClick={() => {
              toast.dismiss(t.id);
              toggleDoctorStatus(id);
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

  const filtered = doctors
    .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(d => filterStatus === 'all' || d.status === filterStatus);

  return (
    <DashboardLayout title="Doctors Management" role="admin">
      <div className="max-w-7xl mx-auto pb-20 font-body animate-in fade-in duration-700">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Doctor <span className="text-[#0D9488]">Registry</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <Stethoscope size={14} className="text-[#0D9488]" /> Platform-wide practitioner directory
            </p>
          </div>

          {/* Search + Filter */}
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/40" />
              <input
                type="text"
                placeholder="Search by name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-gray-100 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-navy outline-none focus:border-[#0D9488] transition-all"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border-2 border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold text-navy outline-none focus:border-[#0D9488] transition-all appearance-none"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <Card className="p-0 border border-gray-100 bg-white shadow-xl overflow-hidden rounded-[32px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Doctor</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Specialty</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Affiliated Hospital</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                   <tr>
                     <td colSpan="4" className="py-20 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#0D9488] mx-auto mb-4"></div>
                        <p className="text-navy/40 font-bold">Synchronizing registry...</p>
                     </td>
                   </tr>
                ) : filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                    {/* Doctor Identity */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D9488] to-[#115E59] flex items-center justify-center text-white text-xs font-black shrink-0`}>
                          {getInitials(doc.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-black text-navy`}>
                            {doc.name}
                          </span>
                          <span className="text-[10px] font-bold text-navy/40 uppercase tracking-widest">{doc.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Specialty */}
                    <td className="py-4 px-6">
                      <span className="text-xs font-black uppercase tracking-widest text-[#0D9488] bg-[#0D9488]/5 px-3 py-1.5 rounded-lg border border-[#0D9488]/10">
                        {doc.specialization}
                      </span>
                    </td>

                    {/* Hospital */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-navy/60">
                        <Building2 size={14} className="text-navy/30 shrink-0" />
                        <span className={`text-xs font-bold text-navy/60`}>
                          {doc.hospitalName}
                        </span>
                      </div>
                    </td>


                    {/* Actions */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => toggleFeatured(doc.id)}
                          className={`h-8 w-8 flex items-center justify-center rounded-lg border transition-all ${doc.isFeatured ? 'bg-yellow-50 border-yellow-200 text-yellow-500 shadow-sm' : 'border-gray-200 text-navy/20 hover:text-yellow-500 hover:bg-yellow-50'}`}
                          title={doc.isFeatured ? 'Remove from Featured' : 'Mark as Featured'}
                        >
                          <Star size={16} fill={doc.isFeatured ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={() => toggleDoctorStatus(doc.id)}
                          className={`h-8 w-8 flex items-center justify-center rounded-lg border transition-all ${doc.status === 'active' ? 'border-gray-200 text-navy/20 hover:text-amber-500 hover:bg-amber-50' : 'bg-amber-50 border-amber-200 text-amber-500 shadow-sm'}`}
                          title={doc.status === 'active' ? 'Block Doctor' : 'Unblock Doctor'}
                        >
                          {doc.status === 'active' ? <Unlock size={16} /> : <Lock size={16} />}
                        </button>
                        <button
                          onClick={() => handleDeleteDoctor(doc.id, doc.name, doc.status)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-navy/20 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Delete Doctor Completely"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/doctor/${doc.id}`)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-navy/40 hover:text-[#0D9488] hover:border-[#0D9488] hover:bg-gray-50 transition-all"
                          title="View Doctor Details"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-16 text-center">
                      <Stethoscope size={40} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-sm font-bold text-navy/40">No doctors found matching your search.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default AdminDoctors;
