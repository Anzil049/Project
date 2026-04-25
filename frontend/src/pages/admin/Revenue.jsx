import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common';
import { 
  IndianRupee, CreditCard, Activity, 
  TrendingUp, ArrowUpRight, MonitorPlay
} from 'lucide-react';
import { 
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';

const AdminRevenue = () => {
  // Mock Data
  const monthlyRevenueData = [
    { name: 'Jan', onboardingFees: 4000, consultationCuts: 1200 },
    { name: 'Feb', onboardingFees: 3000, consultationCuts: 2100 },
    { name: 'Mar', onboardingFees: 2500, consultationCuts: 2300 },
    { name: 'Apr', onboardingFees: 5000, consultationCuts: 3200 },
    { name: 'May', onboardingFees: 4500, consultationCuts: 4500 },
    { name: 'Jun', onboardingFees: 6000, consultationCuts: 5800 },
    { name: 'Jul', onboardingFees: 5200, consultationCuts: 7100 },
  ];

  const consultationTrendsData = [
    { name: 'Week 1', netRevenue: 15400 },
    { name: 'Week 2', netRevenue: 14200 },
    { name: 'Week 3', netRevenue: 18900 },
    { name: 'Week 4', netRevenue: 24000 },
  ];

  const subscriptionData = [
    { name: 'Premium Providers', value: 45000 },
    { name: 'Enterprise Hospitals', value: 85000 },
    { name: 'Basic Tier', value: 12000 },
  ];
  
  const PIE_COLORS = ['#8B5CF6', '#0D9488', '#F59E0B'];

  return (
    <DashboardLayout title="Revenue Analytics" role="admin">
      <div className="max-w-7xl mx-auto pb-20 font-body animate-in fade-in duration-700">
        
        {/* Header Options */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Financial <span className="text-[#0D9488]">Analytics</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <IndianRupee size={14} className="text-[#0D9488]" /> Platform Monetization Matrix
            </p>
          </div>
        </div>

        {/* Top Financial KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <Card className="p-6 border border-gray-100 bg-white hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                 <div className="w-12 h-12 bg-teal-50 text-teal-600 flex items-center justify-center rounded-2xl">
                    <IndianRupee size={24} />
                 </div>
                 <span className="flex items-center gap-1 text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-1 rounded-md">
                    <ArrowUpRight size={12} /> +12.4%
                 </span>
              </div>
              <p className="text-xs font-bold text-navy/40 uppercase tracking-widest mb-1">Total Monthly Income</p>
              <h3 className="text-3xl font-black text-navy">₹ 14.2M</h3>
           </Card>

           <Card className="p-6 border border-gray-100 bg-white hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                 <div className="w-12 h-12 bg-purple-50 text-purple-600 flex items-center justify-center rounded-2xl">
                    <CreditCard size={24} />
                 </div>
                 <span className="flex items-center gap-1 text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-1 rounded-md">
                    <ArrowUpRight size={12} /> +4.2%
                 </span>
              </div>
              <p className="text-xs font-bold text-navy/40 uppercase tracking-widest mb-1">Active Subscriptions</p>
              <h3 className="text-3xl font-black text-navy">4,812</h3>
           </Card>

           <Card className="p-6 border border-gray-100 bg-white hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                 <div className="w-12 h-12 bg-blue-50 text-blue-600 flex items-center justify-center rounded-2xl">
                    <MonitorPlay size={24} />
                 </div>
                 <span className="flex items-center gap-1 text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-1 rounded-md">
                    <ArrowUpRight size={12} /> +22.8%
                 </span>
              </div>
              <p className="text-xs font-bold text-navy/40 uppercase tracking-widest mb-1">Net Telecom Consultations</p>
              <h3 className="text-3xl font-black text-navy">45.2k</h3>
           </Card>
        </div>

        {/* Charts Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
           
           {/* Multi-Stack Area Chart: Monthly Progression */}
           <Card className="col-span-1 lg:col-span-2 p-8 border border-gray-100 bg-white hover:shadow-xl transition-all duration-300">
              <div className="mb-8">
                 <h2 className="text-xl font-black text-navy mb-1">Fiscal Revenue Splits</h2>
                 <p className="text-[10px] font-bold text-navy/40 uppercase tracking-widest">Platform Cuts vs Onboarding Subscriptions</p>
              </div>
              <div className="h-[350px] w-full">
                 <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                       <defs>
                          <linearGradient id="colorOnboard" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#0D9488" stopOpacity={0.8}/>
                             <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorCuts" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                             <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dx={-10} tickFormatter={(val) => `₹${val/1000}k`} />
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <RechartsTooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }} 
                       />
                       <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', filling: '#64748b', paddingTop: '20px' }} />
                       <Area type="monotone" name="Consultation Commissions" dataKey="consultationCuts" stackId="1" stroke="#8B5CF6" strokeWidth={2} fill="url(#colorCuts)" />
                       <Area type="monotone" name="Facility Onboarding Fees" dataKey="onboardingFees" stackId="1" stroke="#0D9488" strokeWidth={2} fill="url(#colorOnboard)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </Card>

           {/* Generic Subscription Share Pie Chart */}
           <Card className="col-span-1 p-8 border border-gray-100 bg-white hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="mb-4">
                 <h2 className="text-xl font-black text-navy mb-1">Subscription Share</h2>
                 <p className="text-[10px] font-bold text-navy/40 uppercase tracking-widest">Active Plan Distribution</p>
              </div>
              <div className="flex-1 min-h-[300px] w-full flex items-center justify-center relative">
                 <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                       <Pie
                          data={subscriptionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                       >
                          {subscriptionData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                       </Pie>
                       <RechartsTooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                          formatter={(value) => [`₹${value.toLocaleString()}`, "Gross Total"]}
                       />
                    </PieChart>
                 </ResponsiveContainer>
                 {/* Internal Value Text Overlay */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-sm font-bold text-navy/40 uppercase tracking-widest">Gross</span>
                     <span className="text-xl font-black text-navy">₹142k</span>
                 </div>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                 {subscriptionData.map((data, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                       <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }}></div>
                          <span className="text-[10px] font-bold text-navy/60 uppercase tracking-wider">{data.name}</span>
                       </div>
                       <span className="text-sm font-black text-navy">₹{(data.value / 1000).toFixed(1)}k</span>
                    </div>
                 ))}
              </div>
           </Card>

           {/* Tele-Medicine Focus Line Chart */}
           <Card className="col-span-1 lg:col-span-3 p-8 border border-gray-100 bg-white hover:shadow-xl transition-all duration-300">
              <div className="mb-8">
                 <h2 className="text-xl font-black text-navy mb-1">Direct Consultation Growth</h2>
                 <p className="text-[10px] font-bold text-navy/40 uppercase tracking-widest">Tracking digital tele-health session cuts this month</p>
              </div>
              <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={consultationTrendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} dx={-10} tickFormatter={(val) => `₹${val/1000}k`} />
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <RechartsTooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }} 
                          formatter={(value) => [`₹${value.toLocaleString()}`, "Platform Cut"]}
                       />
                       <Line 
                         type="monotone" 
                         dataKey="netRevenue" 
                         name="Tele-health Output" 
                         stroke="#F59E0B" 
                         strokeWidth={4} 
                         dot={{ stroke: '#F59E0B', strokeWidth: 4, r: 4, fill: '#fff' }} 
                         activeDot={{ r: 8, stroke: '#F59E0B', strokeWidth: 2, fill: '#fff' }} 
                       />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
           </Card>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminRevenue;
