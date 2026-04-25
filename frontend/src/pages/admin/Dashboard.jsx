import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common';
import { 
  Building2, Users, Stethoscope, IndianRupee,
  TrendingUp, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

const AdminDashboard = () => {
  // Mock Data for Charts
  const revenueData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 5500 },
    { name: 'Mar', revenue: 4800 },
    { name: 'Apr', revenue: 7200 },
    { name: 'May', revenue: 8500 },
    { name: 'Jun', revenue: 11000 },
    { name: 'Jul', revenue: 14500 },
  ];

  const registrationData = [
    { name: 'Mon', Patients: 120, Doctors: 25, Hospitals: 2 },
    { name: 'Tue', Patients: 180, Doctors: 40, Hospitals: 1 },
    { name: 'Wed', Patients: 150, Doctors: 35, Hospitals: 3 },
    { name: 'Thu', Patients: 210, Doctors: 50, Hospitals: 5 },
    { name: 'Fri', Patients: 250, Doctors: 65, Hospitals: 4 },
    { name: 'Sat', Patients: 320, Doctors: 80, Hospitals: 6 },
    { name: 'Sun', Patients: 280, Doctors: 45, Hospitals: 2 },
  ];

  return (
    <DashboardLayout title="System Overview" role="admin">
      <div className="max-w-7xl mx-auto pb-20 font-body animate-in fade-in duration-700">
        
        {/* Header Options */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Global <span className="text-[#0D9488]">Metrics</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <Activity size={14} className="text-[#0D9488]" /> Real-time Platform Performance
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
           {/* Hospitals Card */}
           <Card className="p-6 border border-gray-100 bg-white hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                 <div className="w-12 h-12 bg-blue-50 text-blue-500 flex items-center justify-center rounded-2xl group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <Building2 size={24} />
                 </div>
                 <Badge bg="bg-blue-50" text="text-blue-600" className="text-[10px] font-black uppercase shadow-none">+12%</Badge>
              </div>
              <h3 className="text-3xl font-black text-navy mb-1">1,248</h3>
              <p className="text-xs font-bold text-navy/40 uppercase tracking-widest">Active Hospitals</p>
           </Card>

           {/* Doctors Card */}
           <Card className="p-6 border border-gray-100 bg-white hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                 <div className="w-12 h-12 bg-purple-50 text-purple-500 flex items-center justify-center rounded-2xl group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all">
                    <Stethoscope size={24} />
                 </div>
                 <Badge bg="bg-purple-50" text="text-purple-600" className="text-[10px] font-black uppercase shadow-none">+5.4%</Badge>
              </div>
              <h3 className="text-3xl font-black text-navy mb-1">14,502</h3>
              <p className="text-xs font-bold text-navy/40 uppercase tracking-widest">Verified Doctors</p>
           </Card>

           {/* Patients Card */}
           <Card className="p-6 border border-gray-100 bg-white hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                 <div className="w-12 h-12 bg-orange-50 text-orange-500 flex items-center justify-center rounded-2xl group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all">
                    <Users size={24} />
                 </div>
                 <Badge bg="bg-orange-50" text="text-orange-600" className="text-[10px] font-black uppercase shadow-none">+22%</Badge>
              </div>
              <h3 className="text-3xl font-black text-navy mb-1">845.2k</h3>
              <p className="text-xs font-bold text-navy/40 uppercase tracking-widest">Registered Patients</p>
           </Card>

           {/* Revenue Card */}
           <Card className="p-6 border border-gray-100 bg-gradient-to-br from-[#0D9488] to-[#115E59] text-white hover:shadow-xl hover:shadow-[#0D9488]/20 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                 <div className="w-12 h-12 bg-white/10 text-white flex items-center justify-center rounded-2xl group-hover:scale-110 transition-all">
                    <IndianRupee size={24} />
                 </div>
                 <span className="flex items-center gap-1 text-[10px] font-black uppercase bg-white/20 px-2 py-1 rounded-md text-white backdrop-blur-sm">
                    <TrendingUp size={12} /> +18%
                 </span>
              </div>
              <h3 className="text-3xl font-black text-white mb-1"><span className="text-lg opacity-80">₹</span> 1.4Cr</h3>
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Total Platform Revenue</p>
           </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           
           {/* Revenue Area Chart */}
           <Card className="p-8 border border-gray-100 bg-white hover:shadow-xl transition-all duration-300">
              <div className="mb-8">
                 <h2 className="text-xl font-black text-navy mb-1">Monthly Revenue</h2>
                 <p className="text-[10px] font-bold text-navy/40 uppercase tracking-widest">Year to date performance</p>
              </div>
              <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                       <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dx={-10} tickFormatter={(val) => `₹${val/1000}k`} />
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <RechartsTooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }} 
                          formatter={(value) => [`₹${value}`, "Revenue"]}
                       />
                       <Area type="monotone" dataKey="revenue" stroke="#0D9488" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </Card>

           {/* Registrations Bar Chart */}
           <Card className="p-8 border border-gray-100 bg-white hover:shadow-xl transition-all duration-300">
              <div className="mb-8">
                 <h2 className="text-xl font-black text-navy mb-1">New Registrations</h2>
                 <p className="text-[10px] font-bold text-navy/40 uppercase tracking-widest">Platform adoption mapping (This week)</p>
              </div>
              <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={registrationData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dx={-10} />
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <RechartsTooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                       />
                       <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', filling: '#64748b', paddingTop: '20px' }} />
                       <Bar dataKey="Patients" fill="#F97316" radius={[4, 4, 0, 0]} />
                       <Bar dataKey="Doctors" fill="#A855F7" radius={[4, 4, 0, 0]} />
                       <Bar dataKey="Hospitals" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </Card>

        </div>
      </div>
    </DashboardLayout>
  );
};

// Simple Badge component specifically for the stats cards since we didn't export a generic one in standard components
const Badge = ({ children, bg, text, className }) => (
  <span className={`px-2 py-1 rounded-md ${bg} ${text} ${className}`}>
    {children}
  </span>
);

export default AdminDashboard;
