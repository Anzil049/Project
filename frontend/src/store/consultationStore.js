import { create } from 'zustand';

const INITIAL_SESSIONS = [
  {
    id: 'sess-001',
    patientName: 'Radhika Thomas',
    patientInitials: 'RT',
    doctorName: 'Dr. Sarah Johnson',
    doctorInitials: 'SJ',
    doctorGradient: 'from-[#0D9488] to-[#115E59]',
    specialization: 'Cardiologist',
    scheduledTime: 'Today, 3:00 PM',
    type: 'video',
    status: 'waiting', // 'waiting' | 'active' | 'completed'
    pinged: false,
    messages: [],
  },
  {
    id: 'sess-002',
    patientName: 'Amit Patel',
    patientInitials: 'AP',
    doctorName: 'Dr. Arjun Mehta',
    doctorInitials: 'AM',
    doctorGradient: 'from-[#7C3AED] to-[#5B21B6]',
    specialization: 'Neurologist',
    scheduledTime: 'Today, 5:30 PM',
    type: 'chat',
    status: 'waiting',
    pinged: false,
    messages: [],
  },
  {
    id: 'sess-003',
    patientName: 'Sneha Reddy',
    patientInitials: 'SR',
    doctorName: 'Dr. Priya Sharma',
    doctorInitials: 'PS',
    doctorGradient: 'from-[#EC4899] to-[#9D174D]',
    specialization: 'Dermatologist',
    scheduledTime: 'Yesterday, 4:00 PM',
    type: 'video',
    status: 'completed',
    pinged: false,
    prescription: {
      diagnosis: 'Mild eczema on forearm',
      medicines: [
        { name: 'Hydrocortisone cream 1%', dosage: '1-0-1', duration: '14 Days', instruction: 'Apply twice daily' },
        { name: 'Cetirizine 10mg', dosage: '0-0-1', duration: '7 Days', instruction: 'Once at night' }
      ],
      notes: 'Avoid direct sun exposure. Follow up in 2 weeks.',
    },
    messages: [
      { role: 'doctor', text: 'Hello Sneha, how are you feeling today?', time: '4:00 PM' },
      { role: 'patient', text: 'Hi Doctor, the rash has spread a bit more.', time: '4:01 PM' },
      { role: 'doctor', text: 'I can see that. I will prescribe a topical cream for you.', time: '4:03 PM' },
    ],
  },
];

const useConsultationStore = create((set, get) => ({
  sessions: INITIAL_SESSIONS,
  bookedDoctors: {}, // { doctorName: { chat: bool, video: bool } }

  // Book a new session from the doctor listing page
  bookSession: (session) => set((state) => {
    const prev = state.bookedDoctors[session.doctorName] || {};
    return {
      sessions: [session, ...state.sessions],
      bookedDoctors: {
        ...state.bookedDoctors,
        [session.doctorName]: { ...prev, [session.type]: true },
      },
    };
  }),

  // Doctor starts the session
  startSession: (sessionId) => set((state) => ({
    sessions: state.sessions.map(s =>
      s.id === sessionId ? { ...s, status: 'active' } : s
    ),
  })),

  // Patient pings the doctor
  pingDoctor: (sessionId) => set((state) => ({
    sessions: state.sessions.map(s =>
      s.id === sessionId ? { ...s, pinged: true } : s
    ),
  })),

  // End session
  endSession: (sessionId) => set((state) => ({
    sessions: state.sessions.map(s =>
      s.id === sessionId ? { ...s, status: 'completed' } : s
    ),
  })),

  // Send a chat message
  sendMessage: (sessionId, message) => set((state) => ({
    sessions: state.sessions.map(s =>
      s.id === sessionId
        ? { ...s, messages: [...s.messages, message] }
        : s
    ),
  })),



  // Issue prescription
  issuePrescription: (sessionId, prescription) => set((state) => ({
    sessions: state.sessions.map(s =>
      s.id === sessionId ? { ...s, prescription } : s
    ),
  })),

  getSession: (sessionId) => get().sessions.find(s => s.id === sessionId),
}));

export default useConsultationStore;
