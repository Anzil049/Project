import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Avatar } from '../../components/common';
import useAuthStore from '../../store/authStore';
import { 
  Calendar, 
  FileText, 
  Heart, 
  Activity, 
  Search, 
  CalendarPlus, 
  Siren, 
  Droplets,
  Bell,
  Clock,
  MapPin,
  ChevronRight,
  Building2,
  Video,
  CalendarCheck,
  Stethoscope,
  BadgeCheck
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const BOOK_DOCTORS = [
  { id: 1, name: 'Dr. Arjun Mehta',   specialization: 'Neurologist',  hospital: 'Apollo Hospitals',   initials: 'AM', fee: 700,
    slots: [
      { date: '2026-04-20', times: ['10:00 AM', '11:00 AM', '2:00 PM'] },
      { date: '2026-04-22', times: ['9:30 AM', '10:30 AM', '3:00 PM'] },
    ]
  },
  { id: 2, name: 'Dr. Sarah Johnson', specialization: 'Cardiologist', hospital: 'Medanta Medicity',   initials: 'SJ', fee: 800,
    slots: [
      { date: '2026-04-20', times: ['9:00 AM', '11:30 AM'] },
      { date: '2026-04-22', times: ['10:00 AM', '2:30 PM', '4:00 PM'] },
    ]
  },
  { id: 3, name: 'Dr. Priya Sharma',  specialization: 'Dermatologist',hospital: 'Fortis Escorts',     initials: 'PS', fee: 600,
    slots: [
      { date: '2026-04-21', times: ['12:00 PM', '1:00 PM'] },
      { date: '2026-04-22', times: ['10:00 AM', '11:00 AM'] },
    ]
  },
  { id: 4, name: 'Dr. James Wilson',  specialization: 'Orthopedic',   hospital: 'Max Healthcare',     initials: 'JW', fee: 900,
    slots: [
      { date: '2026-04-21', times: ['9:00 AM', '9:30 AM', '10:00 AM'] },
    ]
  },
  { id: 5, name: 'Dr. Meera Nair',   specialization: 'Gynecologist', hospital: 'Kokilaben Hospital', initials: 'MN', fee: 750,
    slots: [
      { date: '2026-04-19', times: ['11:00 AM', '2:00 PM', '3:00 PM'] },
      { date: '2026-04-22', times: ['9:30 AM', '10:30 AM'] },
    ]
  },
];

const fmtDate = (ds) => new Date(ds).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  const PatientDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const userName = user?.name || 'Sarah';

  // Mock Data
  const stats = [
    { label: 'Upcoming Appointments', value: '2', icon: <Calendar size={20} />, color: 'bg-teal-50 text-[#0D9488]', link: '/patient/appointments' },
    { label: 'Past Consultations', value: '14', icon: <Activity size={20} />, color: 'bg-blue-50 text-blue-500' },
    { label: 'Prescriptions', value: '3', icon: <FileText size={20} />, color: 'bg-purple-50 text-purple-500', link: '/patient/prescriptions' },
    { label: 'Saved Doctors', value: '5', icon: <Heart size={20} />, color: 'bg-pink-50 text-pink-500' },
  ];

  const recentAppointments = [
    { id: 1, doctor: 'Dr. Arjun Mehta', hospital: 'Apollo Hospitals', date: 'Today, 2:30 PM', status: 'Confirmed', statusColor: 'bg-green-100 text-green-700' },
    { id: 2, doctor: 'Dr. Sarah Johnson', hospital: 'Medanta Medicity', date: 'Oct 24, 10:00 AM', status: 'Pending', statusColor: 'bg-yellow-100 text-yellow-700' },
    { id: 3, doctor: 'Dr. James Wilson', hospital: 'Fortis Escorts', date: 'Oct 15, 4:15 PM', status: 'Completed', statusColor: 'bg-gray-100 text-gray-700' },
  ];

  const notifications = [
    { id: 1, title: 'Appointment Confirmed', time: '10 mins ago', desc: 'Your appointment with Dr. Mehta is confirmed for 2:30 PM today.' },
    { id: 2, title: 'Prescription Ready', time: '2 hours ago', desc: 'Your digital prescription from Fortis has been uploaded.' },
    { id: 3, title: 'Health Reminder', time: '1 day ago', desc: 'Time for your annual general checkup.' },
  ];

  return (
    <>
    <DashboardLayout title="Patient Dashboard" role="patient">
      <div className="max-w-[1400px] mx-auto space-y-8 pb-10">
        
        {/* Standardized Header Section */}
        <div className="space-y-1">
           <h1 className="text-3xl font-heading font-black text-navy tracking-tight">Health Overview</h1>
           <p className="text-sm text-navy/40 font-bold">Monitor your health metrics, appointments, and medical activities</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-[#0D9488] to-[#115E59] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-[#0D9488]/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[60px] -mr-32 -mt-32" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-white/70 font-semibold mb-1">Good Morning,</p>
                <h2 className="text-3xl font-heading font-extrabold tracking-tight mb-4">{userName}!</h2>
                <p className="text-white/80 max-w-md text-sm leading-relaxed">
                  You have an upcoming appointment with Dr. Arjun Mehta today at 2:30 PM. Please ensure you reach the clinic 15 minutes early.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <Button variant="primary" size="sm" className="!bg-white !text-[#115E59] hover:!bg-teal-50 border-none font-bold text-sm py-2 px-6" onClick={() => navigate('/patient/appointments')}>
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="!border-white/30 !text-white hover:!bg-white/10 font-bold text-sm py-2 px-6 flex items-center gap-2" onClick={() => navigate('/patient/tracker')}>
                    <Activity size={16} /> Track Live Token
                  </Button>
                </div>
              </div>
              <div className="hidden md:flex w-32 h-32 bg-white/10 rounded-full items-center justify-center backdrop-blur-sm shrink-0">
                <CalendarPlus size={56} className="text-white/90" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-[#0D9488]/30 transition-all shadow-sm hover:shadow-md cursor-pointer group" onClick={() => stat.link && navigate(stat.link)}>
                <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
                <h4 className="text-2xl font-heading font-black text-navy">{stat.value}</h4>
                <p className="text-xs text-navy/50 font-semibold mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Recent Appointments */}
          <Card className="p-0 border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="font-heading font-extrabold text-navy text-lg">Recent Appointments</h3>
              <button className="text-xs font-bold text-[#0D9488] hover:text-[#115E59] flex items-center" onClick={() => navigate('/patient/appointments')}>
                View All <ChevronRight size={14} className="ml-1" />
              </button>
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-5 text-xs font-bold text-navy/50 uppercase tracking-wider border-b border-gray-100 text-left">Doctor</th>
                    <th className="px-6 py-5 text-xs font-bold text-navy/50 uppercase tracking-wider border-b border-gray-100 text-center">Hospital</th>
                    <th className="px-6 py-5 text-xs font-bold text-navy/50 uppercase tracking-wider border-b border-gray-100 text-center">Date & Time</th>
                    <th className="px-6 py-5 text-xs font-bold text-navy/50 uppercase tracking-wider border-b border-gray-100 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {recentAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate('/patient/appointments')}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <Avatar size="sm" name={apt.doctor} className="bg-gradient-to-br from-[#0D9488] to-[#115E59] text-white font-bold text-xs" />
                          <span className="font-bold text-sm text-navy">{apt.doctor}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-navy/70">
                        <div className="flex items-center justify-center gap-1.5">
                          <MapPin size={14} className="text-navy/40" /> {apt.hospital}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-start justify-center gap-1.5 text-center">
                           <Clock size={14} className="text-navy/40 mt-0.5" />
                           <div className="text-sm font-medium text-navy/70 leading-tight">
                             <p>{apt.date.split(',')[0]}</p>
                             <p className="text-[11px] font-bold text-navy/40">{apt.date.split(',')[1]}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${apt.statusColor}`}>
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {recentAppointments.map((apt) => (
                <div key={apt.id} className="p-6 hover:bg-gray-50/50 transition-colors space-y-4 cursor-pointer" onClick={() => navigate('/patient/appointments')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar size="md" name={apt.doctor} className="bg-gradient-to-br from-[#0D9488] to-[#115E59] text-white font-bold text-sm" />
                      <div>
                        <p className="font-bold text-sm text-navy">{apt.doctor}</p>
                        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase ${apt.statusColor}`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5 bg-gray-50 p-4 rounded-xl border border-gray-100/50">
                    <div className="flex items-center gap-2.5 text-[13px] font-bold text-navy/80">
                      <MapPin size={16} className="text-[#0D9488]" /> {apt.hospital}
                    </div>
                    <div className="flex items-center gap-2.5 text-[13px] font-bold text-navy/80">
                      <Clock size={16} className="text-[#0D9488]" /> {apt.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar Space */}
        <div className="space-y-8">
          
          {/* Quick Actions */}
          <Card className="p-6 border-gray-100 bg-white shadow-sm">
            <h3 className="font-heading font-extrabold text-navy text-lg mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate(ROUTES.FIND_DOCTORS)}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-teal-50 text-[#0D9488] hover:bg-[#0D9488] hover:text-white transition-all group shadow-sm border border-transparent hover:shadow-md"
              >
                <Search size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-center">Find<br/>Doctors</span>
              </button>
              
              <button 
                onClick={() => navigate(ROUTES.PATIENT.TOKEN_TRACKER)}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white transition-all group shadow-sm border border-transparent hover:shadow-md"
              >
                <Activity size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-center">Live<br/>Token Tracker</span>
              </button>
              
              <button 
                onClick={() => navigate(ROUTES.FIND_HOSPITALS)}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all group shadow-sm border border-transparent hover:shadow-md"
              >
                <Building2 size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-center">View<br/>Hospitals</span>
              </button>

              <button
                onClick={() => navigate(ROUTES.PATIENT.BOOKING_HUB)}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all group shadow-sm border border-transparent hover:shadow-md"
              >
                <CalendarCheck size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-center">Book<br/>Appointment</span>
              </button>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-0 border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-navy text-lg">Notifications</h3>
                <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">3 NEW</span>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-6 hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0D9488] scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-teal-50 text-[#0D9488] flex items-center justify-center shrink-0 border border-teal-100">
                      <Bell size={18} />
                    </div>
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-sm text-navy">{notif.title}</h4>
                        <span className="text-[10px] font-bold text-navy/40 whitespace-nowrap">{notif.time}</span>
                      </div>
                      <p className="text-xs text-navy/60 leading-relaxed font-medium">{notif.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 text-center">
               <button className="text-xs font-bold text-[#0D9488] hover:text-[#115E59]">Mark all as read</button>
            </div>
          </Card>

        </div>
       </div>
      </div>
     </DashboardLayout>
    </>
  );
};

export default PatientDashboard;
