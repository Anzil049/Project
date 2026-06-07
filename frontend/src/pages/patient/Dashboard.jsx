import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Avatar, Badge } from '../../components/common';
import useAuthStore from '../../store/authStore';
import { Activity, Building2, Calendar, CalendarCheck, ChevronRight, Clock, FileText, Search, Video } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import appointmentService from '../../services/appointmentService';
import toast from 'react-hot-toast';

const formatDateTime = (slot) => {
  if (!slot?.start_datetime) return 'Not scheduled';
  return new Date(slot.start_datetime).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const PatientDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setAppointments(await appointmentService.getMyAppointments());
      } catch (error) {
        toast.error('Failed to load appointment dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const now = new Date();
  const upcoming = useMemo(() => appointments
    .filter(item => ['booked', 'consulting'].includes(item.status) && item.slot_id?.start_datetime && new Date(item.slot_id.start_datetime) >= now)
    .sort((a, b) => new Date(a.slot_id.start_datetime) - new Date(b.slot_id.start_datetime)), [appointments]);
  const completed = appointments.filter(item => item.status === 'completed');
  const nextAppointment = upcoming[0];

  const stats = [
    { label: 'Upcoming', value: upcoming.length, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'Completed', value: completed.length, icon: Activity, color: 'text-[#0D9488] bg-teal-50' },
    { label: 'Online', value: appointments.filter(item => item.consultation_type === 'online').length, icon: Video, color: 'text-purple-600 bg-purple-50' },
    { label: 'Prescriptions', value: completed.filter(item => item.prescription?.diagnosis).length, icon: FileText, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <DashboardLayout title="Patient Dashboard" role="patient">
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <div>
          <h1 className="text-3xl font-heading font-black text-navy tracking-tight">Health Overview</h1>
          <p className="text-sm text-navy/40 font-bold mt-1">Welcome back, {user?.name || 'Patient'}</p>
        </div>

        <div className="bg-gradient-to-r from-[#0D9488] to-[#115E59] rounded-[36px] p-8 text-white shadow-lg shadow-[#0D9488]/20">
          {nextAppointment ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <Avatar src={nextAppointment.doctor_id?.user?.image} name={nextAppointment.doctor_id?.user?.name || 'Doctor'} size="xl" />
                <div>
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-2">Next Appointment</p>
                  <h2 className="text-3xl font-heading font-black">{nextAppointment.doctor_id?.user?.name || 'Doctor'}</h2>
                  <p className="text-white/70 text-sm font-bold mt-2">
                    Token T-{nextAppointment.token_number || '-'} • {formatDateTime(nextAppointment.slot_id)} • {nextAppointment.consultation_type}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate(ROUTES.PATIENT.MY_BOOKINGS)} className="bg-white text-[#115E59] border-none rounded-2xl font-black">
                  View Details
                </Button>
                <Button onClick={() => navigate(ROUTES.PATIENT.TOKEN_TRACKER, { state: { appointmentId: nextAppointment._id } })} variant="outline" className="border-white/30 text-white rounded-2xl font-black">
                  <Activity size={16} /> Track Token
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-white/60 text-sm font-bold">No upcoming appointment yet.</p>
                <h2 className="text-3xl font-heading font-black mt-2">Book care when you need it</h2>
              </div>
              <Button onClick={() => navigate(ROUTES.PATIENT.BOOKING_HUB)} className="bg-white text-[#115E59] border-none rounded-2xl font-black">
                <CalendarCheck size={16} /> Book Appointment
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-6 border-gray-100 shadow-sm">
              <div className={`w-11 h-11 rounded-2xl ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon size={20} />
              </div>
              <p className="text-3xl font-black text-navy">{stat.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-navy/35 mt-1">{stat.label}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-0 border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-heading font-black text-navy">Recent Appointments</h3>
              <button onClick={() => navigate(ROUTES.PATIENT.MY_BOOKINGS)} className="text-xs font-black text-[#0D9488] flex items-center gap-1">
                View All <ChevronRight size={14} />
              </button>
            </div>
            {loading ? (
              <div className="p-10 text-center text-navy/35 text-sm font-bold">Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="p-10 text-center text-navy/35 text-sm font-bold">No appointments yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {appointments.slice(0, 5).map(item => (
                  <button key={item._id} onClick={() => navigate(ROUTES.PATIENT.MY_BOOKINGS)} className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <Avatar src={item.doctor_id?.user?.image} name={item.doctor_id?.user?.name || 'Doctor'} size="md" />
                      <div>
                        <p className="font-black text-navy text-sm">{item.doctor_id?.user?.name || 'Doctor'}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-navy/35">{formatDateTime(item.slot_id)}</p>
                      </div>
                    </div>
                    <Badge className="bg-gray-100 text-navy/60 border-none text-[9px] uppercase">{item.status}</Badge>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6 border-gray-100">
            <h3 className="font-heading font-black text-navy mb-5">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate(ROUTES.FIND_DOCTORS)} className="p-5 rounded-2xl bg-teal-50 text-[#0D9488] font-black text-xs flex flex-col items-center gap-2">
                <Search size={22} /> Doctors
              </button>
              <button onClick={() => navigate(ROUTES.PATIENT.TOKEN_TRACKER)} className="p-5 rounded-2xl bg-orange-50 text-orange-600 font-black text-xs flex flex-col items-center gap-2">
                <Activity size={22} /> Tokens
              </button>
              <button onClick={() => navigate(ROUTES.PATIENT.BOOKING_HUB)} className="p-5 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-xs flex flex-col items-center gap-2">
                <CalendarCheck size={22} /> Book
              </button>
              <button onClick={() => navigate(ROUTES.PATIENT.MY_BOOKINGS)} className="p-5 rounded-2xl bg-blue-50 text-blue-600 font-black text-xs flex flex-col items-center gap-2">
                <Building2 size={22} /> Visits
              </button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
