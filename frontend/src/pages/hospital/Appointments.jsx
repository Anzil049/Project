import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Avatar, Badge } from '../../components/common';
import { Activity, CalendarDays, ChevronDown, Clock, Search, Users } from 'lucide-react';
import hospitalService from '../../services/hospitalService';
import toast from 'react-hot-toast';

const statusClass = (status) => {
  switch (status) {
    case 'consulting': return 'bg-blue-100 text-blue-700';
    case 'completed': return 'bg-teal-100 text-teal-700';
    case 'cancelled': return 'bg-red-100 text-red-700';
    case 'booked': return 'bg-slate-100 text-slate-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const HospitalAppointments = () => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctorId, setDoctorId] = useState('all');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await hospitalService.getAppointments();
        setDoctors(data.doctors || []);
        setAppointments(data.appointments || []);
      } catch (error) {
        toast.error('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => appointments.filter(item => {
    const itemDoctorId = item.doctor_id?._id || item.doctor_id;
    const itemDate = item.slot_id?.start_datetime ? new Date(item.slot_id.start_datetime).toISOString().slice(0, 10) : '';
    const patient = item.patient_id?.name || item.patient_snapshot?.name || '';
    return (doctorId === 'all' || itemDoctorId?.toString() === doctorId)
      && itemDate === date
      && patient.toLowerCase().includes(search.toLowerCase());
  }).sort((a, b) => (a.token_number || 0) - (b.token_number || 0)), [appointments, doctorId, date, search]);

  const grouped = filtered.reduce((acc, item) => {
    const id = item.doctor_id?._id || item.doctor_id;
    if (!acc[id]) acc[id] = [];
    acc[id].push(item);
    return acc;
  }, {});

  return (
    <DashboardLayout title="Operational Flow" role="hospital">
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <div className="bg-white p-6 md:p-8 rounded-[36px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-heading font-black text-navy tracking-tight">Consultation Monitoring</h1>
              <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
                <Activity size={14} /> Live token queues by doctor
              </p>
            </div>
            <Badge className="bg-[#0D9488] text-white border-none">{filtered.length} appointments</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_260px] gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-navy/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient name"
                className="w-full pl-12 pr-5 py-4 bg-gray-50 rounded-2xl text-sm font-bold text-navy outline-none"
              />
            </div>
            <div className="relative">
              <CalendarDays size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0D9488]" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl text-sm font-bold text-navy outline-none"
              />
            </div>
            <div className="relative">
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-sm font-bold text-navy outline-none appearance-none"
              >
                <option value="all">All doctors</option>
                {doctors.map(doc => (
                  <option key={doc._id} value={doc._id}>{doc.user?.name || 'Doctor'}</option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-navy/40 pointer-events-none" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-56 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0D9488]" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <Card className="p-16 text-center border-gray-100">
            <Users size={44} className="mx-auto text-navy/15 mb-4" />
            <p className="text-sm font-black uppercase tracking-widest text-navy/35">No appointments for this filter</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([id, list]) => {
              const doctor = list[0].doctor_id;
              const doctorName = doctor?.user?.name || doctors.find(doc => doc._id === id)?.user?.name || 'Doctor';
              return (
                <Card key={id} className="p-0 border-gray-100 overflow-hidden rounded-[36px]">
                  <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar src={doctor?.user?.image} name={doctorName} size="lg" />
                      <div>
                        <h3 className="font-black text-navy">{doctorName}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#0D9488]">{doctor?.specialization || 'Consultation'} • {list.length} patients</p>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {list.map(item => {
                      const patient = item.patient_id?.name || item.patient_snapshot?.name || 'Walk-in Patient';
                      const time = item.slot_id?.start_datetime
                        ? new Date(item.slot_id.start_datetime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
                        : 'N/A';
                      return (
                        <div key={item._id} className="p-5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black ${item.status === 'consulting' ? 'bg-[#0D9488] text-white' : 'bg-navy text-white'}`}>
                              T-{item.token_number || '-'}
                            </div>
                            <div>
                              <p className="font-black text-navy text-sm">{patient}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-navy/35 flex items-center gap-2 mt-1">
                                <Clock size={12} /> {time} • {item.booked_by_role}
                              </p>
                            </div>
                          </div>
                          <Badge className={`border-none text-[9px] uppercase ${statusClass(item.status)}`}>{item.status}</Badge>
                        </div>
                      );
                    })}
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

export default HospitalAppointments;
