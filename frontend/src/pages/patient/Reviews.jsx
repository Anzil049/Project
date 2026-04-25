import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Avatar, Badge } from '../../components/common';
import { 
  Star, MessageSquare, ArrowLeft, 
  CheckCircle2, ThumbsUp, ThumbsDown,
  Clock, MapPin, Sparkles
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const PatientReviews = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  // Mock appointment data based on ID
  const appointment = {
    id: id,
    doctor: 'Dr. James Wilson',
    specialization: 'Orthopedic Surgeon',
    hospital: 'Fortis Escorts',
    date: 'Oct 15, 2026',
    time: '4:15 PM'
  };

  const quickTags = [
    "Punctual", "Professional", "Expert Advice", 
    "Friendly Staff", "Clean Facility", "Informative"
  ];

  const handleToggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;
    
    // Simulate API call
    setIsSubmitted(true);
    setTimeout(() => {
      navigate(ROUTES.PATIENT.APPOINTMENTS);
    }, 3000);
  };

  if (isSubmitted) {
    return (
      <DashboardLayout title="Submit Review" role="patient">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center ring-8 ring-teal-50/50">
              <CheckCircle2 size={48} className="text-[#0D9488]" />
           </div>
           <div className="space-y-2">
              <h2 className="text-3xl font-black text-navy tracking-tight">Review Submitted!</h2>
              <p className="text-navy/40 font-bold max-w-xs mx-auto">Thank you for sharing your experience. Your feedback helps us improve healthcare quality.</p>
           </div>
           <Button variant="ghost" onClick={() => navigate(ROUTES.PATIENT.APPOINTMENTS)}>
              Returning to appointments...
           </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Write a Review" role="patient">
      <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 font-body">
        
        {/* Back Link */}
        <button 
          onClick={() => navigate(ROUTES.PATIENT.APPOINTMENTS)}
          className="flex items-center gap-2 text-navy/40 hover:text-[#0D9488] transition-colors font-black text-[10px] uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Back to appointments
        </button>

        {/* Doctor Context Card */}
        <Card className="p-6 md:p-8 border-none bg-gradient-to-br from-white to-gray-50/50 shadow-xl shadow-navy/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#0D9488]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#0D9488]/10 transition-colors" />
           
           <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
              <Avatar size="xl" name={appointment.doctor} className="bg-[#0D9488] text-white shadow-2xl shadow-teal-500/20" />
              <div className="text-center md:text-left space-y-3">
                 <div>
                    <h1 className="text-3xl font-black text-navy tracking-tight">{appointment.doctor}</h1>
                    <p className="text-[#0D9488] font-black uppercase text-[10px] tracking-widest flex items-center justify-center md:justify-start gap-2 mt-1">
                      <Sparkles size={14} /> {appointment.specialization}
                    </p>
                 </div>
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <div className="flex items-center gap-2 text-navy/40 text-xs font-bold bg-gray-100/50 px-3 py-1.5 rounded-full">
                       <MapPin size={14} /> {appointment.hospital}
                    </div>
                    <div className="flex items-center gap-2 text-navy/40 text-xs font-bold bg-gray-100/50 px-3 py-1.5 rounded-full">
                       <Clock size={14} /> {appointment.date}
                    </div>
                 </div>
              </div>
           </div>
        </Card>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
           <Card className="p-8 md:p-10 border-none bg-white shadow-xl shadow-navy/5 space-y-10">
              
              {/* Star Rating Section */}
              <div className="text-center space-y-6">
                 <div className="space-y-1">
                    <h3 className="text-xl font-black text-navy tracking-tight uppercase">How was your visit?</h3>
                    <p className="text-xs font-bold text-navy/30 uppercase tracking-[0.2em]">Tap to rate your experience</p>
                 </div>
                 
                 <div className="flex items-center justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((index) => (
                       <button
                         key={index}
                         type="button"
                         onClick={() => setRating(index)}
                         onMouseEnter={() => setHover(index)}
                         onMouseLeave={() => setHover(0)}
                         className="p-1.5 transition-all duration-300 transform hover:scale-125 focus:outline-none"
                       >
                          <Star 
                            size={44} 
                            weight="fill"
                            className={`${(hover || rating) >= index ? 'text-yellow-400 fill-yellow-400 drop-shadow-lg' : 'text-gray-100 fill-gray-100'} transition-all duration-300`}
                          />
                       </button>
                    ))}
                 </div>
                 
                 {rating > 0 && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                       <Badge className="bg-yellow-50 text-yellow-700 text-[10px] px-4 py-1.5 font-black uppercase tracking-widest rounded-full border border-yellow-100">
                          {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                       </Badge>
                    </div>
                 )}
              </div>

              {/* Text Review Section */}
              <div className="space-y-6">
                 <div className="space-y-4">
                    <label className="text-xs font-black text-navy uppercase tracking-widest flex items-center gap-2">
                       <MessageSquare size={16} className="text-[#0D9488]" /> Detailed Feedback
                    </label>
                    <textarea 
                      placeholder="Please share what you liked or how we can improve. Your experience helps others make better healthcare choices."
                      rows={6}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-[#0D9488]/20 focus:bg-white p-6 rounded-[28px] outline-none transition-all text-navy font-medium placeholder:text-navy/20 resize-none"
                    />
                 </div>

                 {/* Quick Tags */}
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-navy/30 uppercase tracking-widest">Select relevant tags</p>
                    <div className="flex flex-wrap gap-2">
                       {quickTags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleTag(tag)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${selectedTags.includes(tag) ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-lg shadow-[#0D9488]/20' : 'bg-white text-navy/40 border-gray-100 hover:border-[#0D9488]/30 hover:text-navy'}`}
                          >
                             {tag}
                          </button>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Submit Section */}
              <div className="pt-6">
                 <Button 
                   type="submit" 
                   fullWidth 
                   disabled={rating === 0}
                   size="lg"
                   className={`h-16 rounded-[24px] font-black text-sm uppercase tracking-[0.25em] transition-all border-none ${rating > 0 ? 'bg-[#0D9488] text-white shadow-2xl shadow-[#0D9488]/30' : 'bg-gray-100 text-navy/20'}`}
                 >
                    Submit Performance Review
                 </Button>
                 {rating === 0 && (
                    <p className="text-center text-[10px] font-bold text-red-400 uppercase tracking-widest mt-4 animate-pulse">Please select a star rating to proceed</p>
                 )}
              </div>
           </Card>
        </form>

        <p className="text-center text-[10px] font-bold text-navy/20 uppercase tracking-[0.3em] pb-10">
          MedCare Quality Assurance Network • Feedback securely encrypted
        </p>
      </div>
    </DashboardLayout>
  );
};

export default PatientReviews;
