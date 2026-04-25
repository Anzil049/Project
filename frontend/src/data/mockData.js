export const SPECIALIZATIONS = [
  'All', 'Cardiologist', 'Neurologist', 'Dermatologist', 
  'Gynecologist', 'Orthopedic', 'Psychiatrist', 'Pediatrician', 'General Physician'
];

export const HOSPITALS = [
  { 
    id: 'h-1', 
    name: 'Apollo Indraprastha', 
    type: 'Multi-Specialty Private', 
    rating: 4.8, 
    beds: '500+', 
    location: 'Sarita Vihar, New Delhi', 
    city: 'Delhi',
    image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
    facilities: ['Emergency', 'ICU', 'Radiology', 'Pharmacy'],
    verified: true
  },
  { 
    id: 'h-2', 
    name: 'Fortis Escorts', 
    type: 'Cardiac Institute', 
    rating: 4.7, 
    beds: '300+', 
    location: 'Okhla Road, New Delhi', 
    city: 'Delhi',
    image: 'https://images.unsplash.com/photo-1538108149393-cebb47acddb2?auto=format&fit=crop&w=800&q=80',
    facilities: ['Cardiac Surgery', 'Blood Bank', '24/7 ER'],
    verified: true
  },
  { 
    id: 'h-3', 
    name: 'Medanta Medicity', 
    type: 'Multi-Specialty', 
    rating: 4.9, 
    beds: '1000+', 
    location: 'Sector 38, Gurugram', 
    city: 'Gurugram',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
    facilities: ['Organ Transplant', 'Oncology', 'Robotic Surgery'],
    verified: true
  },
  { 
    id: 'h-4', 
    name: 'Max Healthcare', 
    type: 'Super Specialty', 
    rating: 4.6, 
    beds: '450+', 
    location: 'Saket, New Delhi', 
    city: 'Delhi',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
    facilities: ['Advanced ICU', 'Physiotherapy'],
    verified: true
  }
];

export const DOCTORS = [
  {
    id: 'd-1',
    name: 'Dr. Sarah Johnson',
    specialization: 'Cardiologist',
    experience: '14 yrs',
    rating: 4.9,
    reviews: 312,
    fee: 1000,
    hospitalId: 'h-1',
    hospitalName: 'Apollo Indraprastha',
    initials: 'SJ',
    gradient: 'from-[#0D9488] to-[#115E59]',
    isOnline: true,
    isOffline: true,
    languages: ['English', 'Hindi'],
    slots: [
      { date: '2026-04-20', times: ['9:00 AM', '11:30 AM', '3:00 PM'] },
      { date: '2026-04-21', times: ['10:00 AM', '2:30 PM'] }
    ]
  },
  {
    id: 'd-2',
    name: 'Dr. Arjun Mehta',
    specialization: 'Neurologist',
    experience: '11 yrs',
    rating: 4.8,
    reviews: 218,
    fee: 1200,
    hospitalId: 'h-3',
    hospitalName: 'Medanta Medicity',
    initials: 'AM',
    gradient: 'from-[#7C3AED] to-[#5B21B6]',
    isOnline: true,
    isOffline: true,
    languages: ['English', 'Hindi', 'Gujarati'],
    slots: [
      { date: '2026-04-20', times: ['10:00 AM', '2:00 PM', '5:30 PM'] }
    ]
  },
  {
    id: 'd-3',
    name: 'Dr. Priya Sharma',
    specialization: 'Dermatologist',
    experience: '9 yrs',
    rating: 4.9,
    reviews: 401,
    fee: 800,
    hospitalId: 'h-2',
    hospitalName: 'Fortis Escorts',
    initials: 'PS',
    gradient: 'from-[#EC4899] to-[#9D174D]',
    isOnline: true,
    isOffline: false,
    languages: ['English', 'Hindi'],
    slots: [
      { date: '2026-04-20', times: ['10:00 AM', '3:30 PM'] }
    ]
  },
  {
    id: 'd-4',
    name: 'Dr. James Wilson',
    specialization: 'Orthopedic',
    experience: '17 yrs',
    rating: 4.7,
    reviews: 189,
    fee: 1500,
    hospitalId: 'h-4',
    hospitalName: 'Max Healthcare',
    initials: 'JW',
    gradient: 'from-[#F59E0B] to-[#B45309]',
    isOnline: false,
    isOffline: true,
    languages: ['English'],
    slots: [
      { date: '2026-04-21', times: ['9:00 AM', '11:00 AM'] }
    ]
  },
  {
    id: 'd-5',
    name: 'Dr. Michael Chen',
    specialization: 'Psychiatrist',
    experience: '12 yrs',
    rating: 4.8,
    reviews: 156,
    fee: 2000,
    hospitalId: null, // Private Clinic
    hospitalName: 'Independent Practice',
    initials: 'MC',
    gradient: 'from-[#10B981] to-[#047857]',
    isOnline: true,
    isOffline: true,
    languages: ['English', 'Mandarin'],
    slots: [
      { date: '2026-04-20', times: ['4:00 PM', '5:00 PM', '6:00 PM'] }
    ]
  },
  {
    id: 'd-6',
    name: 'Dr. Ananya Roy',
    specialization: 'Pediatrician',
    experience: '8 yrs',
    rating: 4.9,
    reviews: 289,
    fee: 600,
    hospitalId: null,
    hospitalName: 'Little Hearts Clinic',
    initials: 'AR',
    gradient: 'from-[#F43F5E] to-[#BE123D]',
    isOnline: false,
    isOffline: true,
    languages: ['English', 'Bengali', 'Hindi'],
    slots: [
      { date: '2026-04-19', times: ['10:00 AM', '11:00 AM'] }
    ]
  }
];
