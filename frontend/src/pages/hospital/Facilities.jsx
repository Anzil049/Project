import React, { useState, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Input, Badge } from '../../components/common';
import { 
  Building, Plus, Image as ImageIcon, X, MapPin, 
  CheckCircle2, UploadCloud, Info
} from 'lucide-react';

const HospitalFacilities = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [facilities, setFacilities] = useState([
    {
      id: 1,
      title: 'Advanced ICU',
      description: 'Fully equipped Intensive Care Unit with 24/7 monitoring, life support systems, and a dedicated team of critical care specialists.',
      images: ['https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80']
    },
    {
      id: 2,
      title: 'Radiology & Imaging',
      description: 'State-of-the-art MRI, CT Scan, and digital X-Ray facilities providing high-resolution diagnostics.',
      images: ['https://images.unsplash.com/photo-1538108149393-cebb47acddb2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80']
    }
  ]);

  const [newFacility, setNewFacility] = useState({
    title: '',
    description: '',
    images: [] // Array of object URLs
  });

  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Simulate generation of object URLs for the uploaded images
    const newImageUrls = files.map(file => URL.createObjectURL(file));

    setNewFacility(prev => ({
      ...prev,
      images: [...prev.images, ...newImageUrls]
    }));
  };

  const removeImage = (indexToRemove) => {
    setNewFacility(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSaveFacility = () => {
    if (!newFacility.title) return; // simple validation

    const newEntry = {
      id: Date.now(),
      title: newFacility.title,
      description: newFacility.description,
      images: newFacility.images.length > 0 ? newFacility.images : ['https://images.unsplash.com/photo-1586773860418-d37222d8fce3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80']
    };

    setFacilities([newEntry, ...facilities]);
    
    // Reset form
    setNewFacility({ title: '', description: '', images: [] });
    setIsAdding(false);
  };

  return (
    <DashboardLayout title="Hospital Facilities" role="hospital">
      <div className="max-w-6xl mx-auto space-y-8 pb-20 font-body animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Manage <span className="text-[#0D9488]">Facilities</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <Building size={14} className="text-[#0D9488]" /> Add and manage hospital amenities
            </p>
          </div>
          
          {!isAdding && (
             <Button 
               onClick={() => setIsAdding(true)}
               className="bg-[#0D9488] text-white rounded-[20px] font-black text-xs px-8 shadow-xl shadow-[#0D9488]/20 border-none flex items-center gap-2"
             >
               <Plus size={14} /> Add New Facility
             </Button>
          )}
        </div>

        {/* Add Facility Form */}
        {isAdding && (
          <Card className="p-8 bg-white border border-[#0D9488]/20 rounded-[40px] shadow-2xl shadow-[#0D9488]/10 animate-in slide-in-from-top-4 duration-300">
             <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                <div>
                   <h2 className="text-xl font-black text-navy">Add Facility Details</h2>
                   <p className="text-xs font-bold text-navy/40">Upload photos and describe the amenity</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-navy/50 hover:bg-gray-100 transition-colors">
                   <X size={18} />
                </button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* Form Fields */}
                <div className="space-y-6">
                   <Input 
                      label="Facility Name" 
                      placeholder="e.g. Advanced NICU"
                      required
                      value={newFacility.title}
                      onChange={(e) => setNewFacility({...newFacility, title: e.target.value})}
                   />
                   
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-navy/60 pl-2">
                        Description
                      </label>
                      <textarea
                         placeholder="Describe the facility's equipment and features..."
                         value={newFacility.description}
                         onChange={(e) => setNewFacility({...newFacility, description: e.target.value})}
                         className="w-full text-sm font-bold text-navy placeholder:text-navy/30 bg-gray-50 border border-gray-100 rounded-[20px] px-5 py-4 focus:bg-white focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10 transition-all outline-none resize-none h-32"
                      />
                   </div>
                </div>

                {/* Photo Upload Area */}
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-navy/60 pl-2 flex justify-between">
                      Facility Photos <span className="text-[#0D9488]">{newFacility.images.length}/5 uploaded</span>
                   </label>
                   
                   <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#0D9488]/30 bg-[#0D9488]/5 hover:bg-[#0D9488]/10 transition-colors rounded-[24px] p-8 flex flex-col items-center justify-center cursor-pointer text-center group min-h-[220px]"
                   >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#0D9488] shadow-sm mb-4 group-hover:-translate-y-1 transition-transform">
                         <UploadCloud size={24} />
                      </div>
                      <h4 className="text-sm font-black text-navy mb-1">Click to Upload Images</h4>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-navy/40">PNG, JPG, WEBP up to 5MB</p>
                      <input 
                         type="file" 
                         ref={fileInputRef} 
                         className="hidden" 
                         multiple
                         accept="image/*"
                         onChange={handleImageUpload}
                      />
                   </div>

                   {/* Uploaded Images Preview */}
                   {newFacility.images.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto py-2 snap-x hide-scrollbar">
                         {newFacility.images.map((imgUrl, idx) => (
                            <div key={idx} className="relative w-20 h-20 shrink-0 snap-start">
                               <img src={imgUrl} alt={`Upload ${idx}`} className="w-full h-full object-cover rounded-2xl shadow-sm border border-gray-100" />
                               <button 
                                 onClick={() => removeImage(idx)}
                                 className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                               >
                                 <X size={12} strokeWidth={3} />
                               </button>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>

             <div className="pt-8 mt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                <Button variant="outline" onClick={() => setIsAdding(false)} className="rounded-2xl px-8 border-gray-200">
                   Cancel
                </Button>
                <Button onClick={handleSaveFacility} disabled={!newFacility.title} className="bg-[#0D9488] text-white rounded-2xl px-10 shadow-xl shadow-[#0D9488]/20 border-none disabled:opacity-50">
                   Publish Facility
                </Button>
             </div>
          </Card>
        )}

        {/* Existing Facilities Display Grid */}
        <div className="space-y-4">
           {facilities.map((facility) => (
             <Card key={facility.id} className="p-0 bg-white border border-gray-100 rounded-[32px] overflow-hidden hover:shadow-xl hover:shadow-navy/5 transition-all group group/card flex flex-col md:flex-row">
                {/* Carousel / Image Area */}
                <div className="md:w-1/3 min-h-[200px] md:min-h-full relative overflow-hidden bg-gray-50 flex items-center justify-center shrink-0 border-r border-gray-100 border-b md:border-b-0">
                   {facility.images && facility.images.length > 0 ? (
                      <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar">
                         {facility.images.map((img, i) => (
                            <div key={i} className="w-full h-full shrink-0 snap-start relative">
                               <img src={img} alt={`${facility.title} ${i}`} className="w-full h-full object-cover absolute inset-0" />
                               {/* Badge indicating multiple images */}
                               {facility.images.length > 1 && (
                                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                     <ImageIcon size={12} /> {i + 1} / {facility.images.length}
                                  </div>
                               )}
                            </div>
                         ))}
                      </div>
                   ) : (
                      <div className="text-gray-300 flex items-center justify-center">
                         <ImageIcon size={48} />
                      </div>
                   )}
                </div>

                {/* Details Area */}
                <div className="p-8 md:w-2/3 flex flex-col justify-center">
                   <div className="flex items-center gap-3 mb-2">
                       <h3 className="text-xl font-black text-navy">{facility.title}</h3>
                       <Badge variant="success" className="text-[8px] bg-green-50 text-green-600 border-none uppercase tracking-widest px-2">Published</Badge>
                   </div>
                   <p className="text-sm font-bold text-navy/60 leading-relaxed mb-6">
                      {facility.description || "No description provided."}
                   </p>
                   
                   <div className="flex items-center gap-3 mt-auto">
                      <Button size="sm" variant="outline" className="rounded-xl border-gray-200 text-[10px] px-6 font-black hover:bg-gray-50">
                         Edit Details
                      </Button>
                   </div>
                </div>
             </Card>
           ))}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default HospitalFacilities;
