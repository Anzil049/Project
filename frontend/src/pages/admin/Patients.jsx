import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button } from '../../components/common';
import { 
  Users, Search, ShieldOff, ShieldCheck,
  MapPin, Droplets, Phone, CalendarDays
} from 'lucide-react';

const INITIAL_PATIENTS = [
  {
    id: 1,
    name: 'Radhika Thomas',
    email: 'radhika.thomas@example.com',
    phone: '+91 98765 43210',
    city: 'Mumbai',
    bloodGroup: 'O+',
    joined: 'Jan 12, 2024',
    appointments: 8,
    status: 'active',
    initials: 'RT',
  },
  {
    id: 2,
    name: 'Amit Patel',
    email: 'amit.patel@example.com',
    phone: '+91 98001 11223',
    city: 'Ahmedabad',
    bloodGroup: 'B+',
    joined: 'Mar 5, 2024',
    appointments: 3,
    status: 'active',
    initials: 'AP',
  },
  {
    id: 3,
    name: 'Sneha Reddy',
    email: 'sneha.r@example.com',
    phone: '+91 91234 56789',
    city: 'Hyderabad',
    bloodGroup: 'A-',
    joined: 'Feb 18, 2024',
    appointments: 15,
    status: 'active',
    initials: 'SR',
  },
  {
    id: 4,
    name: 'Karan Sinha',
    email: 'karan.s@example.com',
    phone: '+91 87654 32100',
    city: 'Patna',
    bloodGroup: 'AB+',
    joined: 'Nov 30, 2023',
    appointments: 1,
    status: 'blocked',
    initials: 'KS',
  },
  {
    id: 5,
    name: 'Divya Menon',
    email: 'divya.menon@example.com',
    phone: '+91 99887 76655',
    city: 'Kochi',
    bloodGroup: 'O-',
    joined: 'Apr 2, 2024',
    appointments: 6,
    status: 'active',
    initials: 'DM',
  },
];

const BLOOD_COLORS = {
  'O+': 'bg-red-50 text-red-600',
  'O-': 'bg-red-100 text-red-700',
  'A+': 'bg-orange-50 text-orange-600',
  'A-': 'bg-orange-100 text-orange-700',
  'B+': 'bg-blue-50 text-blue-600',
  'B-': 'bg-blue-100 text-blue-700',
  'AB+': 'bg-purple-50 text-purple-600',
  'AB-': 'bg-purple-100 text-purple-700',
};

const AdminPatients = () => {
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const toggleStatus = (id) => {
    setPatients(prev => prev.map(p =>
      p.id === id ? { ...p, status: p.status === 'active' ? 'blocked' : 'active' } : p
    ));
  };

  const filtered = patients
    .filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(p => filterStatus === 'all' || p.status === filterStatus);

  const totalActive = patients.filter(p => p.status === 'active').length;
  const totalBlocked = patients.filter(p => p.status === 'blocked').length;

  return (
    <DashboardLayout title="Patients Management" role="admin">
      <div className="max-w-7xl mx-auto pb-20 font-body animate-in fade-in duration-700">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Patient <span className="text-[#0D9488]">Directory</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <Users size={14} className="text-[#0D9488]" /> Platform-wide patient registry
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/40" />
              <input
                type="text"
                placeholder="Search by name, email or city..."
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-5 border border-gray-100 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-navy/40 mb-1">Total Patients</p>
            <h3 className="text-2xl font-black text-navy">{patients.length}</h3>
          </Card>
          <Card className="p-5 border border-gray-100 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#0D9488] mb-1">Active</p>
            <h3 className="text-2xl font-black text-navy">{totalActive}</h3>
          </Card>
          <Card className="p-5 border border-gray-100 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Blocked</p>
            <h3 className="text-2xl font-black text-navy">{totalBlocked}</h3>
          </Card>
          <Card className="p-5 border border-gray-100 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-navy/40 mb-1">Total Appointments</p>
            <h3 className="text-2xl font-black text-navy">
              {patients.reduce((sum, p) => sum + p.appointments, 0)}
            </h3>
          </Card>
        </div>

        {/* Table */}
        <Card className="p-0 border border-gray-100 bg-white shadow-xl overflow-hidden rounded-[32px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Patient</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Contact</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Location</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Blood</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Joined</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Appts</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Status</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Identity */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ${patient.status === 'active' ? 'bg-gradient-to-br from-[#0C1A2E] to-[#1e3a8a]' : 'bg-gray-200'}`}>
                          {patient.initials}
                        </div>
                        <div>
                          <p className={`text-sm font-black ${patient.status === 'active' ? 'text-navy' : 'text-navy/40 line-through'}`}>
                            {patient.name}
                          </p>
                          <p className="text-[10px] font-bold text-navy/40">{patient.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-navy/60">
                        <Phone size={12} className="text-navy/30" />
                        <span className="text-xs font-bold">{patient.phone}</span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-navy/60">
                        <MapPin size={12} className="text-navy/30" />
                        <span className="text-xs font-bold">{patient.city}</span>
                      </div>
                    </td>

                    {/* Blood Group */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg ${BLOOD_COLORS[patient.bloodGroup] || 'bg-gray-50 text-gray-600'}`}>
                        <Droplets size={11} />
                        {patient.bloodGroup}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-navy/60">
                        <CalendarDays size={12} className="text-navy/30" />
                        <span className="text-xs font-bold">{patient.joined}</span>
                      </div>
                    </td>

                    {/* Appointments */}
                    <td className="py-4 px-6">
                      <span className={`text-sm font-bold ${patient.status === 'active' ? 'text-navy' : 'text-navy/40'}`}>
                        {patient.appointments}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      {patient.status === 'active' ? (
                        <div className="flex items-center gap-2 text-[#0D9488]">
                          <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse"></span>
                          <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-500">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          <span className="text-[10px] font-black uppercase tracking-widest">Blocked</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-3">
                        {patient.status === 'active' ? (
                          <Button
                            onClick={() => toggleStatus(patient.id)}
                            variant="danger"
                            className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg border-none"
                          >
                            Block
                          </Button>
                        ) : (
                          <Button
                            onClick={() => toggleStatus(patient.id)}
                            variant="outline"
                            className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-green-500 hover:!text-white hover:border-green-500 transition-colors"
                          >
                            Unblock
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-16 text-center">
                      <Users size={40} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-sm font-bold text-navy/40">No patients found matching your search.</p>
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

export default AdminPatients;
