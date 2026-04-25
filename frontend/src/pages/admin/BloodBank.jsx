import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button } from '../../components/common';
import { 
  Droplets, Search, Bell, CheckCircle2, AlertTriangle,
  Users, Phone, MapPin, X, Send, HeartPulse, Clock
} from 'lucide-react';

// Blood requirement configs
const BLOOD_REQUIREMENTS = [
  { group: 'O-', label: 'O Negative', urgency: 'critical', units: 5, compatible: ['O-'] },
  { group: 'AB+', label: 'AB Positive', urgency: 'high', units: 8, compatible: ['AB+', 'A+', 'B+', 'O+'] },
  { group: 'B-', label: 'B Negative', urgency: 'moderate', units: 12, compatible: ['B-', 'O-'] },
  { group: 'A+', label: 'A Positive', urgency: 'low', units: 20, compatible: ['A+', 'A-', 'O+', 'O-'] },
];

const URGENCY_STYLES = {
  critical: { badge: 'bg-red-100 text-red-700 border-red-200', card: 'border-red-200 bg-red-50/30', dot: 'bg-red-500', label: 'Critical' },
  high:     { badge: 'bg-orange-100 text-orange-700 border-orange-200', card: 'border-orange-200 bg-orange-50/30', dot: 'bg-orange-500', label: 'High' },
  moderate: { badge: 'bg-amber-100 text-amber-700 border-amber-200', card: 'border-amber-200 bg-amber-50/30', dot: 'bg-amber-500', label: 'Moderate' },
  low:      { badge: 'bg-blue-100 text-blue-700 border-blue-200', card: 'border-blue-200 bg-blue-50/30', dot: 'bg-blue-400', label: 'Low' },
};

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

// Mock Donor Registry
const ALL_PATIENTS = [
  { id: 1, name: 'Radhika Thomas', phone: '+91 98765 43210', city: 'Mumbai',    bloodGroup: 'O-',  initials: 'RT', notified: false },
  { id: 2, name: 'Amit Patel',     phone: '+91 98001 11223', city: 'Ahmedabad', bloodGroup: 'B+',  initials: 'AP', notified: false },
  { id: 3, name: 'Sneha Reddy',    phone: '+91 91234 56789', city: 'Hyderabad', bloodGroup: 'A-',  initials: 'SR', notified: false },
  { id: 4, name: 'Karan Sinha',    phone: '+91 87654 32100', city: 'Patna',     bloodGroup: 'AB+', initials: 'KS', notified: false },
  { id: 5, name: 'Divya Menon',    phone: '+91 99887 76655', city: 'Kochi',     bloodGroup: 'O-',  initials: 'DM', notified: false },
  { id: 6, name: 'Rohan Gupta',    phone: '+91 97700 12345', city: 'Delhi',     bloodGroup: 'A+',  initials: 'RG', notified: false },
  { id: 7, name: 'Priya Nair',     phone: '+91 94455 66778', city: 'Bangalore', bloodGroup: 'B-',  initials: 'PN', notified: false },
  { id: 8, name: 'Arjun Verma',    phone: '+91 93322 11009', city: 'Lucknow',   bloodGroup: 'O+',  initials: 'AV', notified: false },
];

// Mock Blood Recipients (people who NEED blood)
const BLOOD_RECIPIENTS = [
  { id: 1, name: 'Vikram Bose',    phone: '+91 98112 34567', hospital: 'Apollo Indraprastha',    bloodGroup: 'O-',  units: 2, urgency: 'critical', reason: 'Emergency surgery',       initials: 'VB' },
  { id: 2, name: "Leena D'Souza", phone: '+91 97223 45678', hospital: 'Fortis Escorts',         bloodGroup: 'AB+', units: 1, urgency: 'high',     reason: 'Chemotherapy support',   initials: 'LD' },
  { id: 3, name: 'Raj Malhotra',   phone: '+91 96334 56789', hospital: 'Max Super Speciality',   bloodGroup: 'B-',  units: 3, urgency: 'moderate', reason: 'Planned surgery',         initials: 'RM' },
  { id: 4, name: 'Fatima Khan',    phone: '+91 95445 67890', hospital: 'MediCare Heights',       bloodGroup: 'A+',  units: 1, urgency: 'low',     reason: 'Post-operative recovery', initials: 'FK' },
];

const AdminBloodBank = () => {
  const [patients, setPatients] = useState(ALL_PATIENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [notifyModal, setNotifyModal] = useState(null); // { group, compatible, label }
  const [toastMsg, setToastMsg] = useState(null);

  // Filtered donor list
  const filtered = patients.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = filterGroup === 'all' || p.bloodGroup === filterGroup;
    return matchesSearch && matchesGroup;
  });

  // Count compatible donors for a requirement
  const countCompatible = (compatible) =>
    patients.filter(p => compatible.includes(p.bloodGroup)).length;

  // Open notification confirmation modal
  const openNotifyModal = (req) => setNotifyModal(req);

  // Send notification to all compatible patients
  const sendNotifications = () => {
    setPatients(prev =>
      prev.map(p =>
        notifyModal.compatible.includes(p.bloodGroup)
          ? { ...p, notified: true }
          : p
      )
    );
    const count = countCompatible(notifyModal.compatible);
    setNotifyModal(null);
    setToastMsg(`Notification sent to ${count} compatible donor(s) for ${notifyModal.group}.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <DashboardLayout title="Blood Bank" role="admin">
      <div className="max-w-7xl mx-auto pb-20 font-body animate-in fade-in duration-700">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Blood <span className="text-red-500">Bank</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <Droplets size={14} className="text-red-500" /> Donor management & requirement alerts
            </p>
          </div>
        </div>

        {/* Blood Requirements Section */}
        <div className="mb-10">
          <h2 className="text-sm font-black text-navy uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" /> Active Blood Requirements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BLOOD_REQUIREMENTS.map((req) => {
              const style = URGENCY_STYLES[req.urgency];
              const compatibleCount = countCompatible(req.compatible);
              return (
                <Card
                  key={req.group}
                  className={`p-6 border ${style.card} hover:shadow-lg transition-all duration-300`}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                      <Droplets size={28} className="text-red-500 fill-red-100" />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest border px-2 py-1 rounded-md ${style.badge}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${style.dot} mr-1.5`}></span>
                      {style.label}
                    </span>
                  </div>

                  <h3 className="text-3xl font-black text-navy mb-0.5">{req.group}</h3>
                  <p className="text-[10px] text-navy/40 font-bold uppercase tracking-widest mb-4">{req.label}</p>

                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-navy/50 mb-5">
                    <span>Units Needed: <span className="text-navy font-black">{req.units}</span></span>
                    <span>Donors: <span className="text-[#0D9488] font-black">{compatibleCount}</span></span>
                  </div>

                  <button
                    onClick={() => openNotifyModal(req)}
                    className="w-full bg-white border border-gray-200 text-navy rounded-xl text-[10px] font-black uppercase tracking-widest py-3 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Bell size={13} /> Notify Donors
                  </button>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Blood Recipients Table */}
        <div className="mb-10">
          <h2 className="text-sm font-black text-navy uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
            <HeartPulse size={16} className="text-red-500" /> Patients Requiring Blood
          </h2>
          <Card className="p-0 border border-gray-100 bg-white shadow-xl overflow-hidden rounded-[32px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Patient</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Contact</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Hospital</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Blood Needed</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Units</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Reason</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Urgency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {BLOOD_RECIPIENTS.map((r) => {
                    const style = URGENCY_STYLES[r.urgency];
                    return (
                      <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                              {r.initials}
                            </div>
                            <span className="text-sm font-black text-navy">{r.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            <Phone size={12} className="text-navy/30" />
                            <span className="text-xs font-bold text-navy/60">{r.phone}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={12} className="text-navy/30" />
                            <span className="text-xs font-bold text-navy/60">{r.hospital}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg ${BLOOD_COLORS[r.bloodGroup] || 'bg-gray-50 text-gray-600'}`}>
                            <Droplets size={11} />
                            {r.bloodGroup}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-black text-navy">{r.units} <span className="text-[10px] font-bold text-navy/40">unit{r.units > 1 ? 's' : ''}</span></span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-navy/30" />
                            <span className="text-xs font-bold text-navy/60">{r.reason}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase border px-3 py-1.5 rounded-lg ${style.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                            {style.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Donor Registry Section */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <h2 className="text-sm font-black text-navy uppercase tracking-[0.2em] flex items-center gap-2">
              <Users size={16} className="text-[#0D9488]" /> Registered Donors
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/40" />
                <input
                  type="text"
                  placeholder="Search by name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border-2 border-gray-100 rounded-2xl py-2.5 pl-9 pr-4 text-sm font-bold text-navy outline-none focus:border-[#0D9488] transition-all w-64"
                />
              </div>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="bg-white border-2 border-gray-100 rounded-2xl py-2.5 px-4 text-sm font-bold text-navy outline-none focus:border-[#0D9488] transition-all appearance-none"
              >
                <option value="all">All Groups</option>
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <Card className="p-0 border border-gray-100 bg-white shadow-xl overflow-hidden rounded-[32px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Patient</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Phone</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">City</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Blood Group</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">Notification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0C1A2E] to-[#1e3a8a] flex items-center justify-center text-white text-xs font-black shrink-0">
                            {p.initials}
                          </div>
                          <span className="text-sm font-black text-navy">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-navy/30" />
                          <span className="text-xs font-bold text-navy/60">{p.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-navy/30" />
                          <span className="text-xs font-bold text-navy/60">{p.city}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg ${BLOOD_COLORS[p.bloodGroup] || 'bg-gray-50 text-gray-600'}`}>
                          <Droplets size={11} />
                          {p.bloodGroup}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {p.notified ? (
                          <div className="flex items-center gap-2 text-[#0D9488]">
                            <CheckCircle2 size={15} className="fill-[#0D9488]/10" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Notified</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-gray-100 text-navy/40 px-3 py-1.5 rounded-lg">
                            <Bell size={11} /> Not Sent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-16 text-center">
                        <Droplets size={40} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-sm font-bold text-navy/40">No donors found matching your filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      </div>

      {/* NOTIFY CONFIRMATION MODAL */}
      {notifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-navy/80 backdrop-blur-sm" onClick={() => setNotifyModal(null)} />
          <Card className="relative w-full max-w-md bg-white p-8 rounded-[32px] shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            <button onClick={() => setNotifyModal(null)} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-navy/40 hover:bg-gray-200 transition-all">
              <X size={16} />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <Droplets size={28} className="text-red-500 fill-red-100" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-black text-navy">Notify {notifyModal.group} Donors</h2>
                <p className="text-xs font-bold text-navy/40">{notifyModal.label}</p>
              </div>
            </div>

            <p className="text-sm font-bold text-navy/60 leading-relaxed mb-4">
              This will send a donation request notification to all <span className="text-navy font-black">{countCompatible(notifyModal.compatible)} compatible patients</span> registered on the platform with the following blood groups:
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {notifyModal.compatible.map(g => (
                <span key={g} className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg ${BLOOD_COLORS[g] || 'bg-gray-50 text-gray-600'}`}>
                  {g}
                </span>
              ))}
            </div>

            <p className="text-xs font-bold text-navy/40 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6 leading-relaxed">
              The notification will ask: <em>"There is an urgent need for your blood group at our facility. Would you be willing to donate?"</em>
            </p>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setNotifyModal(null)} className="text-navy/60 hover:bg-gray-100 rounded-xl px-6 font-black text-xs">
                Cancel
              </Button>
              <Button
                onClick={sendNotifications}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-6 font-black text-xs flex items-center gap-2 shadow-lg shadow-red-500/20 border-none"
              >
                <Send size={14} /> Send Notification
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* SUCCESS TOAST */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-[#0C1A2E] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm">
            <CheckCircle2 size={20} className="text-[#0D9488] shrink-0" />
            <p className="text-sm font-bold">{toastMsg}</p>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default AdminBloodBank;
