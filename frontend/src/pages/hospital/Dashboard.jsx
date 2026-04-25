import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, ResponsiveTable, Badge } from '../../components/common';
import { 
  Users, Calendar, UserCheck, IndianRupee, 
  TrendingUp, TrendingDown, Clock, Search, MoreVertical,
  ChevronDown, ExternalLink
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar 
} from 'recharts';
import useWebSocket from '../../hooks/useWebSocket';
import useUiStore from '../../store/uiStore';

const HospitalDashboard = () => {
    const [liveStats, setLiveStats] = useState({
        doctors: '48',
        appointments: 156,
        patients: '12.4k',
        revenue: 420000
    });

    // Real-time synchronization simulation
    useWebSocket('hospital_metrics', (data) => {
        if (data.type === 'METRIC_UPDATE') {
            setLiveStats(prev => ({
                ...prev,
                appointments: prev.appointments + (Math.random() > 0.7 ? 1 : 0),
                revenue: prev.revenue + (Math.random() > 0.8 ? 800 : 0)
            }));
        }
    });

    const stats = [
        { label: 'Total Doctors', value: liveStats.doctors, icon: UserCheck, trend: '+2', trendUp: true, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: "Today's Appointments", value: liveStats.appointments.toString(), icon: Calendar, trend: '+12%', trendUp: true, color: 'text-[#0D9488]', bg: 'bg-teal-50' },
        { label: 'Total Patients', value: liveStats.patients, icon: Users, trend: '+5.4%', trendUp: true, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { label: 'Revenue (Today)', value: `₹${(liveStats.revenue / 100000).toFixed(1)}L`, icon: IndianRupee, trend: '-2.1%', trendUp: false, color: 'text-orange-500', bg: 'bg-orange-50' },
    ];

    const appointmentsData = [
        { day: 'Mon', count: 120 }, { day: 'Tue', count: 145 }, { day: 'Wed', count: 180 },
        { day: 'Thu', count: 165 }, { day: 'Fri', count: 190 }, { day: 'Sat', count: 210 }, { day: 'Sun', count: 140 }
    ];

    const revenueData = [
        { time: '9 AM', amount: 45000 }, { time: '11 AM', amount: 85000 }, { time: '1 PM', amount: 150000 },
        { time: '3 PM', amount: 220000 }, { time: '5 PM', amount: 310000 }, { time: '7 PM', amount: 420000 }
    ];

    const [appointments, setAppointments] = useState([
        { id: 'APT-001', patient: 'Rohit Sharma', doctor: 'Dr. Sarah Wilson', dept: 'Cardiology', time: '10:30 AM', status: 'Completed', amount: '₹1200' },
        { id: 'APT-002', patient: 'Priya Patel', doctor: 'Dr. Anil Kumar', dept: 'Neurology', time: '11:15 AM', status: 'In Progress', amount: '₹1800' },
        { id: 'APT-003', patient: 'Amit Singh', doctor: 'Dr. Sarah Wilson', dept: 'Cardiology', time: '12:00 PM', status: 'Waiting', amount: '₹1200' },
        { id: 'APT-004', patient: 'Sneha Reddy', doctor: 'Dr. James Chen', dept: 'Orthopedics', time: '02:30 PM', status: 'Upcoming', amount: '₹1500' },
        { id: 'APT-005', patient: 'Vikram Malhotra', doctor: 'Dr. Anil Kumar', dept: 'Neurology', time: '03:45 PM', status: 'Upcoming', amount: '₹1800' },
    ]);

    return (
        <DashboardLayout title="Hospital Overview" role="hospital">
            <div className="max-w-7xl mx-auto space-y-8 pb-20 font-body transition-colors duration-300">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
                    <div className="space-y-1 text-left">
                        <h1 className="text-3xl font-heading font-black text-navy tracking-tight">System Monitor</h1>
                        <p className="text-sm text-navy/40 font-bold">Real-time synchronization with clinical operations</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="h-10 px-4 rounded-xl border border-gray-100 bg-white text-navy/60 hover:text-navy hover:bg-gray-50 flex items-center gap-2 text-xs font-bold transition-all shadow-sm">
                            <Calendar size={14} /> Today <ChevronDown size={14} />
                        </button>
                        <Button className="h-10 px-5 rounded-xl border-none bg-[#0D9488] text-white hover:bg-[#115E59] shadow-lg shadow-[#0D9488]/20 flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all">
                            Generate Report
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                    {stats.map((stat, idx) => (
                        <Card key={idx} className="p-4 md:p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="relative z-10 flex flex-col gap-3 md:gap-4 text-left">
                                <div className="flex items-start justify-between">
                                    <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                                        <stat.icon size={18} className="md:w-[22px] md:h-[22px]" />
                                    </div>
                                    <div className={`flex items-center gap-1 text-[9px] md:text-[11px] font-black tracking-wider px-2 md:px-2.5 py-0.5 md:py-1 rounded-full ${stat.trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {stat.trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                        {stat.trend}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-lg md:text-2xl font-black text-navy leading-none mb-1">{stat.value}</p>
                                    <p className="text-[8px] md:text-[10px] font-black text-navy/40 uppercase tracking-[0.1em]">{stat.label}</p>
                                </div>
                            </div>
                            <div className={`absolute -bottom-8 -right-8 w-24 md:w-32 h-24 md:h-32 rounded-full opacity-[0.03] ${stat.bg.split(' ')[0].replace('bg-', '')}-500 group-hover:scale-110 transition-transform`} />
                        </Card>
                    ))}
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Appointments Bar Chart */}
                    <Card className="p-6 bg-white border border-gray-100 shadow-sm flex flex-col space-y-6">
                        <div className="flex items-center justify-between text-left">
                            <div>
                                <h3 className="text-sm font-black text-navy uppercase tracking-widest">Appointments Flow</h3>
                                <p className="text-xs text-navy/40 font-bold mt-1">Patient visits over the last 7 days</p>
                            </div>
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={appointmentsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                    <Tooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="#0D9488" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Revenue Area Chart */}
                    <Card className="p-6 bg-white border border-gray-100 shadow-sm flex flex-col space-y-6 transition-colors">
                        <div className="flex items-center justify-between text-left">
                            <div>
                                <h3 className="text-sm font-black text-navy uppercase tracking-widest">Revenue Tracking</h3>
                                <p className="text-xs text-navy/40 font-bold mt-1">Live billing analysis for today</p>
                            </div>
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickFormatter={(val) => `₹${val/1000}k`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* Recent Appointments */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1 text-left">
                        <div>
                            <h3 className="text-sm font-black text-navy uppercase tracking-widest">Incoming Requests</h3>
                            <p className="text-[10px] text-navy/40 font-bold mt-0.5">Most recent tokenized appointments</p>
                        </div>
                        <button className="text-xs font-black text-[#0D9488] hover:text-[#115E59] uppercase tracking-wider transition-colors">
                            View Monitor
                        </button>
                    </div>

                    <Card className="p-0 bg-white border border-gray-100 shadow-sm overflow-hidden transition-colors rounded-[32px]">
                        <ResponsiveTable 
                            data={appointments}
                            mobileLabelField="patient"
                            columns={[
                                {
                                    key: 'patient',
                                    label: 'Patient Details',
                                    render: (val, item) => (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center font-black text-xs">
                                                {val.charAt(0)}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-bold text-navy">{val}</p>
                                                <p className="text-[10px] font-bold text-navy/40 mt-0.5">{item.id}</p>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    key: 'doctor',
                                    label: 'Clinical Team',
                                    render: (val, item) => (
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-navy">{val}</p>
                                            <p className="text-[10px] font-bold text-navy/40 mt-0.5">{item.dept}</p>
                                        </div>
                                    )
                                },
                                {
                                    key: 'time',
                                    label: 'Time Slot',
                                    render: (val) => (
                                        <div className="flex items-center justify-center lg:justify-start gap-1.5 text-xs font-bold text-navy/60">
                                            <Clock size={12} className="text-navy/30" /> {val}
                                        </div>
                                    )
                                },
                                {
                                    key: 'amount',
                                    label: 'Billing',
                                    render: (val) => <span className="text-xs font-black text-navy">{val}</span>
                                },
                                {
                                    key: 'status',
                                    label: 'State',
                                    render: (val) => (
                                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                            val === 'Completed' ? 'bg-green-50 text-green-600' :
                                            val === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                                            val === 'Waiting' ? 'bg-orange-50 text-orange-600' :
                                            'bg-gray-100 text-navy/50'
                                        }`}>
                                            {val}
                                        </span>
                                    )
                                }
                            ]}
                            renderActions={(item) => (
                                <div className="flex items-center justify-end gap-2">
                                    <button className="px-3 py-1.5 bg-gray-50 text-navy font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-gray-100 transition-all border border-gray-100">
                                        Details
                                    </button>
                                    <button className="px-3 py-1.5 bg-[#0D9488] text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-[#115E59] transition-all shadow-md shadow-teal-500/10">
                                        Manage
                                    </button>
                                </div>
                            )}
                        />
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default HospitalDashboard;
