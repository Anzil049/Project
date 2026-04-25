import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge } from '../../components/common';
import { 
  Building2, Video, Calendar, Clock, 
  MapPin, Ticket, AlertCircle, CheckCircle2, 
  XCircle, ChevronRight, LogIn, MessageSquare,
  ShieldAlert, Landmark
} from 'lucide-react';
import useBookingStore from '../../store/bookingStore';
import { ROUTES } from '../../constants/routes';

const MyBookings = () => {
  const navigate = useNavigate();
  const bookings = useBookingStore(s => s.bookings);
  const cancelBooking = useBookingStore(s => s.cancelBooking);
  
  const [activeTab, setActiveTab] = useState('clinical');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const filtered = bookings.filter(b => b.type === activeTab);

  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const confirmCancellation = () => {
    cancelBooking(selectedBooking.id);
    setShowCancelModal(false);
  };

  const isRefundable = (scheduledTime) => {
    const now = new Date();
    const apptTime = new Date(scheduledTime);
    const diffInHours = (apptTime - now) / (1000 * 60 * 60);
    return diffInHours > 1;
  };

  return (
    <DashboardLayout title="My Bookings" role="patient">
      <div className="max-w-4xl mx-auto pb-20 font-body animate-in fade-in duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
           <div className="space-y-4">
              <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
                 Medical <span className="text-primary">Schedule</span>
              </h1>
              <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
                 <Calendar size={14} className="text-primary" /> Manage your healthcare journey
              </p>
           </div>
           <button 
              onClick={() => navigate(ROUTES.PATIENT.BOOKING_HUB)}
              className="bg-navy text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-[20px] hover:bg-primary transition-all shadow-xl shadow-navy/20 flex items-center gap-2"
           >
              Book New Slot
           </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white p-2 rounded-[28px] shadow-sm border border-gray-50 mb-10">
           <button 
              onClick={() => setActiveTab('clinical')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all ${
                 activeTab === 'clinical' ? 'bg-[#F8FAFC] text-primary shadow-sm' : 'text-navy/40 hover:text-navy/70'
              }`}
           >
              <Building2 size={16} /> Clinical Visits
           </button>
           <button 
              onClick={() => setActiveTab('online')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all ${
                 activeTab === 'online' ? 'bg-[#F8FAFC] text-primary shadow-sm' : 'text-navy/40 hover:text-navy/70'
              }`}
           >
              <Video size={16} /> Online Sessions
           </button>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
           {filtered.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-[48px] border border-gray-100 shadow-sm animate-in fade-in">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                    {activeTab === 'clinical' ? <Building2 size={32} /> : <Video size={32} />}
                 </div>
                 <h3 className="text-xl font-black text-navy mb-2">No {activeTab} bookings yet</h3>
                 <p className="text-sm font-bold text-navy/30 max-w-xs mx-auto">
                    Your scheduled medical appointments will appear here after confirmation.
                 </p>
              </div>
           ) : (
              filtered.map(booking => (
                 <Card key={booking.id} className={`p-8 rounded-[40px] border-none bg-white shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col md:flex-row md:items-center gap-8 ${booking.status === 'cancelled' ? 'opacity-60 grayscale' : ''}`}>
                    
                    {/* Doctor Info */}
                    <div className="flex items-center gap-5 md:w-1/3 shrink-0">
                       <div className={`w-16 h-16 rounded-[24px] bg-gradient-to-br ${booking.doctorGradient} flex items-center justify-center text-white text-xl font-black shadow-lg`}>
                          {booking.doctorInitials}
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{booking.specialization}</p>
                          <h4 className="text-lg font-heading font-black text-navy leading-none">{booking.doctorName}</h4>
                          <div className="flex items-center gap-2 mt-2">
                             <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                                booking.status === 'confirmed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                             }`}>
                                {booking.status}
                             </span>
                          </div>
                       </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-[#F8FAFC] rounded-[32px]">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-navy/30 mb-2 flex items-center gap-1.5">
                             <Calendar size={12} /> Schedule
                          </p>
                          <p className="text-xs font-black text-navy">{booking.scheduledTime}</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-navy/30 mb-2 flex items-center gap-1.5">
                             <Landmark size={12} /> Payment
                          </p>
                          <p className="text-xs font-black text-primary uppercase">
                             ₹{booking.paidAmount} <span className="text-navy/30 font-bold ml-1">{booking.type === 'online' ? '(100% Settled)' : '(30% Deposit)'}</span>
                          </p>
                       </div>
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col gap-3 shrink-0">
                       {booking.status === 'confirmed' && (
                          <Button 
                             variant="outline" 
                             onClick={() => handleCancelClick(booking)}
                             className="border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 rounded-[20px] font-black text-[10px] uppercase tracking-widest px-6"
                          >
                             Cancel
                          </Button>
                       )}
                        {booking.type === 'online' && booking.status === 'confirmed' && (
                           <Button 
                              onClick={() => navigate(ROUTES.PATIENT.ROOM.replace(':sessionId', booking.id))}
                              className="bg-navy text-white hover:bg-primary py-3 rounded-[20px] font-black text-[10px] uppercase tracking-widest px-6 border-none shadow-xl shadow-navy/20 flex items-center gap-2"
                           >
                              <LogIn size={14} /> Join
                           </Button>
                        )}
                       <button className="text-[10px] font-black uppercase tracking-[0.2em] text-navy/30 hover:text-navy transition-all py-2 text-center">
                          Receipt
                       </button>
                    </div>
                 </Card>
              ))
           )}
        </div>
      </div>

      {/* CANCELLATION MODAL */}
      {showCancelModal && selectedBooking && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-navy/60 backdrop-blur-md" onClick={() => setShowCancelModal(false)} />
            <div className="relative w-full max-w-md bg-white rounded-[48px] overflow-hidden shadow-2xl z-10 animate-in zoom-in-95 duration-300 p-10 text-center">
               <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-red-50/50">
                  <ShieldAlert size={36} className="text-red-500" />
               </div>
               <h2 className="text-2xl font-heading font-black text-navy mb-4 uppercase tracking-tight">Confirm Cancellation?</h2>
               <p className="text-navy/40 font-bold text-sm leading-relaxed mb-8">
                  Are you sure you want to cancel your session with <span className="text-navy">{selectedBooking.doctorName}</span>?
               </p>

               {/* Refund Notification */}
               <div className={`p-6 rounded-[28px] mb-10 flex items-start gap-4 text-left ${
                  isRefundable(selectedBooking.scheduledTime) ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
               }`}>
                  {isRefundable(selectedBooking.scheduledTime) ? (
                     <>
                        <CheckCircle2 size={24} className="shrink-0" />
                        <div>
                           <p className="text-sm font-black uppercase tracking-tight">Full Refund Available</p>
                           <p className="text-[10px] font-bold opacity-70 leading-relaxed mt-1">
                              Cancellation is {">"} 1 hour before the slot. ₹{selectedBooking.paidAmount} will be refunded.
                           </p>
                        </div>
                     </>
                  ) : (
                     <>
                        <XCircle size={24} className="shrink-0" />
                        <div>
                           <p className="text-sm font-black uppercase tracking-tight">Refund Not Available</p>
                           <p className="text-[10px] font-bold opacity-70 leading-relaxed mt-1">
                              Appointment is within 1 hour. Upfront payment is non-refundable.
                           </p>
                        </div>
                     </>
                  )}
               </div>

               <div className="space-y-3">
                  <Button 
                     onClick={confirmCancellation}
                     className="w-full bg-red-500 text-white hover:bg-red-600 py-5 rounded-[24px] font-black text-[12px] uppercase border-none shadow-xl shadow-red-500/20 transition-all"
                  >
                     Confirm Cancellation
                  </Button>
                  <button 
                     onClick={() => setShowCancelModal(false)}
                     className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-navy/30 hover:text-navy transition-all"
                  >
                     Keep Appointment
                  </button>
               </div>
            </div>
         </div>
      )}
    </DashboardLayout>
  );
};

export default MyBookings;
