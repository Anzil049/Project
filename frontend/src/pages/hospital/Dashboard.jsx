import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Avatar, Badge } from '../../components/common';
import { Activity, Calendar, IndianRupee, Plus, Stethoscope, Users } from 'lucide-react';
import hospitalService from '../../services/hospitalService';
import { ROUTES } from '../../constants/routes';
import toast from 'react-hot-toast';

const isToday = (dateValue) => {
  if (!dateValue) return false;
  return new Date(dateValue).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
};

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [doctorData, appointmentData] = await Promise.all([
          hospitalService.getDoctors(),
          hospitalService.getAppointments(),
        ]);
        setDoctors(doctorData);
        setAppointments(appointmentData.appointments || []);
      } catch (error) {
        toast.error('Failed to load hospital dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const todayAppointments = useMemo(() => appointments.filter(item => isToday(item.slot_id?.start_datetime)), [appointments]);
  const revenueToday = todayAppointments.reduce((sum, item) => sum + Number(item.payment?.paid_amount || 0), 0);
  const activePatients = todayAppointments.filter(item => ['booked', 'consulting'].includes(item.status)).length;

  const stats = [
    { label: 'Doctors', value: doctors.length, icon: Stethoscope, color: 'text-blue-600 bg-blue-50' },
    { label: "Today's Appointments", value: todayAppointments.length, icon: Calendar, color: 'text-[#0D9488] bg-teal-50' },
    { label: 'Active Queue', value: activePatients, icon: Users, color: 'text-orange-600 bg-orange-50' },
    { label: 'Booking Fees Today', value: `Rs ${revenueToday}`, icon: IndianRupee, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <DashboardLayout title="Hospital Overview" role="hospital">
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-black text-navy tracking-tight">Hospital Operations</h1>
            <p className="text-sm text-navy/40 font-bold mt-1">Real appointments, walk-in tokens and consultation flow</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate(ROUTES.HOSPITAL.OFFLINE_BOOKING)} className="bg-[#0D9488] text-white border-none rounded-2xl">
              <Plus size={16} /> Offline Booking
            </Button>
            <Button onClick={() => navigate(ROUTES.HOSPITAL.APPOINTMENTS)} variant="outline" className="rounded-2xl">
              Monitor Queue
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-6 border-gray-100 shadow-sm">
              <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon size={22} />
              </div>
              <p className="text-2xl font-black text-navy">{stat.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-navy/35 mt-1">{stat.label}</p>
            </Card>
          ))}
        </div>

        <Card className="p-0 border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-black text-navy">Today's Token Queue</h3>
              <p className="text-xs font-bold text-navy/35 mt-1">Patients booked through public and reception flows</p>
            </div>
            <Badge className="bg-[#0D9488] text-white border-none">{todayAppointments.length} today</Badge>
          </div>

          {loading ? (
            <div className="p-10 text-center text-navy/35 text-sm font-bold">Loading...</div>
          ) : todayAppointments.length === 0 ? (
            <div className="p-10 text-center text-navy/35 text-sm font-bold">No appointments booked today.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {todayAppointments
                .sort((a, b) => (a.token_number || 0) - (b.token_number || 0))
                .slice(0, 8)
                .map(item => {
                  const doctorName = item.doctor_id?.user?.name || 'Doctor';
                  const patientName = item.patient_id?.name || item.patient_snapshot?.name || 'Walk-in Patient';
                  const time = item.slot_id?.start_datetime
                    ? new Date(item.slot_id.start_datetime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
                    : 'N/A';
                  return (
                    <div key={item._id} className="p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-10 rounded-2xl bg-navy text-white flex items-center justify-center text-[10px] font-black">
                          T-{item.token_number || '-'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-navy">{patientName}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-navy/35">{time} • {item.consultation_type}</p>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-3">
                        <Avatar src={item.doctor_id?.user?.image} name={doctorName} size="sm" />
                        <p className="text-xs font-black text-navy">{doctorName}</p>
                      </div>
                      <Badge className="bg-gray-100 text-navy/65 border-none text-[9px] uppercase">{item.status}</Badge>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HospitalDashboard;
