import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Avatar, Badge } from '../../components/common';
import { Activity, Building2, Calendar, Clock, IndianRupee, MessageSquare, Video, XCircle } from 'lucide-react';
import appointmentService from '../../services/appointmentService';
import { ROUTES } from '../../constants/routes';
import toast from 'react-hot-toast';

const formatSlot = (slot) => {
  if (!slot?.start_datetime) return { date: 'Not scheduled', time: '' };
  const start = new Date(slot.start_datetime);
  return {
    date: start.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    time: start.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
  };
};

const canCancel = (appointment) => {
  const start = appointment.slot_id?.start_datetime ? new Date(appointment.slot_id.start_datetime) : null;
  return appointment.status === 'booked' && start && start > new Date();
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setAppointments(await appointmentService.getMyAppointments());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return appointments;
    return appointments.filter(item => item.consultation_type === activeTab);
  }, [activeTab, appointments]);

  const handleCancel = async (id) => {
    try {
      await appointmentService.cancelAppointment(id, 'cancelled_by_patient');
      toast.success('Appointment cancelled');
      loadAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cancellation failed');
    }
  };

  return (
    <DashboardLayout title="My Bookings" role="patient">
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">My Appointments</h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] mt-2">
              Online visits, clinic tokens, refunds and prescriptions
            </p>
          </div>
          <Button onClick={() => navigate(ROUTES.PATIENT.BOOKING_HUB)} className="bg-[#0D9488] text-white border-none rounded-2xl px-6">
            Book New Appointment
          </Button>
        </div>

        <div className="flex bg-white border border-gray-100 rounded-3xl p-2 shadow-sm">
          {['all', 'offline', 'online'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${activeTab === tab ? 'bg-[#0D9488] text-white' : 'text-navy/45 hover:text-navy'}`}
            >
              {tab === 'all' ? 'All' : tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-56 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0D9488]" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center border-gray-100">
            <Calendar size={40} className="mx-auto text-navy/20 mb-4" />
            <h3 className="text-xl font-black text-navy">No appointments found</h3>
            <p className="text-sm font-bold text-navy/35 mt-2">Your booked slots will appear here.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((appointment) => {
              const { date, time } = formatSlot(appointment.slot_id);
              const doctorName = appointment.doctor_id?.user?.name || 'Doctor';
              const hospitalName = appointment.doctor_id?.hospitalId?.name || 'Independent clinic';
              const refund = appointment.payment?.refund;
              return (
                <Card key={appointment._id} className="p-6 bg-white border border-gray-100 rounded-[32px] shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <Avatar src={appointment.doctor_id?.user?.image} name={doctorName} size="lg" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-navy truncate">{doctorName}</h3>
                          <Badge className="bg-gray-100 text-navy/65 border-none text-[9px] uppercase">{appointment.status}</Badge>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#0D9488] mt-1">
                          Token T-{appointment.token_number || '-'} • {appointment.doctor_id?.specialization || 'Consultation'}
                        </p>
                        <p className="text-xs font-bold text-navy/45 mt-2 flex items-center gap-2">
                          {appointment.consultation_type === 'online' ? <Video size={14} /> : <Building2 size={14} />}
                          {appointment.consultation_type} • {hospitalName}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-[9px] font-black uppercase text-navy/35">Date</p>
                        <p className="text-xs font-black text-navy mt-1">{date}</p>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-[9px] font-black uppercase text-navy/35">Time</p>
                        <p className="text-xs font-black text-navy mt-1 flex items-center gap-1"><Clock size={12} /> {time}</p>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-[9px] font-black uppercase text-navy/35">Paid</p>
                        <p className="text-xs font-black text-navy mt-1 flex items-center gap-1"><IndianRupee size={12} /> {appointment.payment?.paid_amount || 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-[9px] font-black uppercase text-navy/35">Refund</p>
                        <p className="text-xs font-black text-navy mt-1">{refund?.status || 'none'} {refund?.amount ? `- Rs ${refund.amount}` : ''}</p>
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2 shrink-0">
                      {appointment.status === 'completed' && !appointment.feedback?.submitted_at && (
                        <Button onClick={() => navigate(ROUTES.PATIENT.REVIEWS.replace(':id', appointment._id))} className="bg-[#0D9488] text-white rounded-xl border-none text-[10px]">
                          <MessageSquare size={14} /> Review
                        </Button>
                      )}
                      {appointment.status === 'booked' && (
                        <Button variant="outline" onClick={() => navigate(ROUTES.PATIENT.TOKEN_TRACKER, { state: { appointmentId: appointment._id } })} className="rounded-xl text-[10px]">
                          <Activity size={14} /> Track
                        </Button>
                      )}
                      {canCancel(appointment) && (
                        <Button variant="outline" onClick={() => handleCancel(appointment._id)} className="rounded-xl text-red-500 border-red-100 text-[10px]">
                          <XCircle size={14} /> Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyBookings;
