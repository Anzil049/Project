import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useBookingStore = create(
  persist(
    (set, get) => ({
      bookings: [], // { id, doctorId, hospitalId, type: 'online'|'physical', totalFee, paidAmount, balance, status, scheduledTime }
      
      bookAppointment: (bookingData) => set((state) => {
        const { type, totalFee } = bookingData;
        
        // Financial Logic: 
        // Online: 100% upfront
        // Physical: 30% upfront, 70% later
        const paidAmount = type === 'online' ? totalFee : Math.round(totalFee * 0.3);
        const balance = totalFee - paidAmount;
        
        const newBooking = {
          ...bookingData,
          id: `book-${Date.now()}`,
          paidAmount,
          balance,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        };
        
        return {
          bookings: [newBooking, ...state.bookings]
        };
      }),

      cancelBooking: (bookingId) => set((state) => {
        return {
          bookings: state.bookings.map(b => {
             if (b.id !== bookingId) return b;
             
             // Refund Logic:
             // Check if appointment is more than 1 hour away
             const now = new Date();
             const apptTime = new Date(b.scheduledTime);
             const diffInMs = apptTime - now;
             const diffInHours = diffInMs / (1000 * 60 * 60);
             
             const isRefundable = diffInHours > 1;
             
             return {
               ...b,
               status: 'cancelled',
               refundIssued: isRefundable,
               refundAmount: isRefundable ? b.paidAmount : 0
             };
          })
        };
      }),

      // Helper to clear for testing
      clearBookings: () => set({ bookings: [] })
    }),
    {
      name: 'booking-storage',
    }
  )
);

export default useBookingStore;
