import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Input, Badge } from '../../components/common';
import { 
  Building, Plus, Image as ImageIcon, X, MapPin, 
  CheckCircle2, UploadCloud, Info, Loader2, Trash2
} from 'lucide-react';
import hospitalService from '../../services/hospitalService';
import toast from 'react-hot-toast';

const HospitalFacilities = () => {
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [facilities, setFacilities] = useState([]);

  const [newFacility, setNewFacility] = useState({
    title: '',
    description: '',
    images: [] // Array of URLs
  });

  const [beds, setBeds] = useState('');
  const [isEditingBeds, setIsEditingBeds] = useState(false);
  const [tempBeds, setTempBeds] = useState('');
  const [isSavingBeds, setIsSavingBeds] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const data = await hospitalService.getProfile();
      setFacilities(data.hospitalProfile?.facilities || []);
      setBeds(data.hospitalProfile?.beds || '');
      setTempBeds(data.hospitalProfile?.beds || '');
    } catch (error) {
      toast.error('Failed to load facilities');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      toast.loading('Uploading images...', { id: 'upload' });
      const uploadPromises = files.map(file => hospitalService.uploadImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      setNewFacility(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
      toast.success('Images uploaded successfully', { id: 'upload' });
    } catch (error) {
      toast.error('Failed to upload images', { id: 'upload' });
    }
  };

  const removeImage = (indexToRemove) => {
    setNewFacility(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleEditFacility = (index) => {
    setNewFacility(facilities[index]);
    setEditingIndex(index);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveBeds = async () => {
    if (!tempBeds?.trim()) {
      toast.error('Please enter a valid bed count');
      return;
    }
    try {
      setIsSavingBeds(true);
      await hospitalService.updateProfile({
        beds: tempBeds
      });
      setBeds(tempBeds);
      setIsEditingBeds(false);
      toast.success('Bed capacity updated successfully');
    } catch (error) {
      toast.error('Failed to update bed capacity');
    } finally {
      setIsSavingBeds(false);
    }
  };

  const handleSaveFacility = async () => {
    if (!newFacility.title?.trim() || !newFacility.description?.trim() || !newFacility.images || newFacility.images.length === 0) {
      toast.error('Please fill in all fields and upload at least one image');
      return;
    }

    try {
      setIsSaving(true);
      let updatedFacilities;
      
      if (editingIndex !== null) {
        updatedFacilities = [...facilities];
        updatedFacilities[editingIndex] = newFacility;
      } else {
        updatedFacilities = [newFacility, ...facilities];
      }
      
      await hospitalService.updateProfile({
        facilities: updatedFacilities
      });
      
      setFacilities(updatedFacilities);
      toast.success(editingIndex !== null ? 'Facility updated successfully' : 'Facility published successfully');
      
      // Reset form
      setNewFacility({ title: '', description: '', images: [] });
      setIsAdding(false);
      setEditingIndex(null);
    } catch (error) {
      toast.error('Failed to save facility');
    } finally {
      setIsSaving(false);
    }
  };

  const performDelete = async (indexToDelete) => {
    try {
      const updatedFacilities = facilities.filter((_, idx) => idx !== indexToDelete);
      await hospitalService.updateProfile({
        facilities: updatedFacilities
      });
      setFacilities(updatedFacilities);
      toast.success('Facility removed');
    } catch (error) {
      toast.error('Failed to delete facility');
    }
  };

  const handleDeleteFacility = (indexToDelete) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="text-sm font-bold text-navy">Remove this facility?</p>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              performDelete(indexToDelete);
            }}
            className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
          >
            Confirm
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-100 text-navy px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-center',
      style: {
        borderRadius: '20px',
        background: '#fff',
        color: '#0C1A2E',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        border: '1px solid #f1f5f9'
      }
    });
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

        {/* Total Bed Capacity Control Card */}
        <Card className="p-6 bg-white border border-[#0D9488]/10 rounded-[30px] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-12 h-12 bg-[#0D9488]/10 rounded-2xl flex items-center justify-center text-[#0D9488] shrink-0">
              <Building size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-[10px] font-black text-navy/40 uppercase tracking-widest">Total Bed Capacity</h3>
              {isEditingBeds ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={tempBeds}
                    onChange={(e) => setTempBeds(e.target.value)}
                    className="w-24 text-sm font-bold text-navy bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 focus:outline-none focus:border-[#0D9488]"
                    placeholder="e.g. 100"
                    disabled={isSavingBeds}
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSaveBeds} 
                    disabled={isSavingBeds || !tempBeds?.trim()}
                    className="bg-[#0D9488] text-white px-3 py-1.5 text-[10px] font-black rounded-lg border-none"
                  >
                    {isSavingBeds ? <Loader2 className="animate-spin" size={12} /> : 'Save'}
                  </Button>
                  <button 
                    onClick={() => {
                      setIsEditingBeds(false);
                      setTempBeds(beds);
                    }}
                    disabled={isSavingBeds}
                    className="text-xs font-black text-navy/40 hover:text-navy px-2 py-1 uppercase tracking-wider disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <p className="text-lg font-black text-navy mt-0.5">
                  {beds || 'Not Configured'}
                </p>
              )}
            </div>
          </div>
          {!isEditingBeds && (
            <Button 
              onClick={() => {
                setTempBeds(beds);
                setIsEditingBeds(true);
              }} 
              variant="outline" 
              size="sm"
              className="rounded-xl border-gray-200 text-navy font-black text-[10px] px-4 py-2 hover:bg-gray-50 uppercase tracking-wider shrink-0"
            >
              Update Bed Capacity
            </Button>
          )}
        </Card>

        {/* Add Facility Form */}
        {isAdding && (
          <Card className="p-8 bg-white border border-[#0D9488]/20 rounded-[40px] shadow-2xl shadow-[#0D9488]/10 animate-in slide-in-from-top-4 duration-300">
             <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                <div>
                   <h2 className="text-xl font-black text-navy">{editingIndex !== null ? 'Edit Facility Details' : 'Add Facility Details'}</h2>
                   <p className="text-xs font-bold text-navy/40">{editingIndex !== null ? 'Update photos and description' : 'Upload photos and describe the amenity'}</p>
                </div>
                <button onClick={() => {
                   setIsAdding(false);
                   setEditingIndex(null);
                   setNewFacility({ title: '', description: '', images: [] });
                 }} className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-navy/50 hover:bg-gray-100 transition-colors">
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
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                         placeholder="Describe the facility's equipment and features..."
                         value={newFacility.description}
                         onChange={(e) => setNewFacility({...newFacility, description: e.target.value})}
                         className="w-full text-sm font-bold text-navy placeholder:text-navy/30 bg-gray-50 border border-gray-100 rounded-[20px] px-5 py-4 focus:bg-white focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10 transition-all outline-none resize-none h-32"
                      ></textarea>
                   </div>
                </div>

                {/* Photo Upload Area */}
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-navy/60 pl-2 flex justify-between">
                      <span>Facility Photos <span className="text-red-500">*</span></span>
                      <span className="text-[#0D9488]">{newFacility.images.length}/5 uploaded</span>
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
                <button 
                  onClick={() => {
                    setIsAdding(false);
                    setEditingIndex(null);
                    setNewFacility({ title: '', description: '', images: [] });
                  }} 
                  disabled={isSaving}
                  className="px-8 py-3 text-xs font-black uppercase tracking-widest text-navy/40 hover:text-navy transition-colors disabled:opacity-50"
                >
                   Cancel
                </button>
                <Button 
                   onClick={handleSaveFacility} 
                   disabled={!newFacility.title?.trim() || !newFacility.description?.trim() || !newFacility.images || newFacility.images.length === 0 || isSaving} 
                   className="bg-[#0D9488] text-white rounded-2xl px-10 shadow-xl shadow-[#0D9488]/20 border-none disabled:opacity-50"
                >
                   {isSaving ? <Loader2 className="animate-spin" size={18} /> : (editingIndex !== null ? 'Update Facility' : 'Publish Facility')}
                </Button>
              </div>
          </Card>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
             <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0D9488]"></div>
             <p className="text-navy/40 font-black uppercase tracking-widest text-[10px]">Synchronizing Facilities...</p>
          </div>
        ) : (
          /* Existing Facilities Display Grid */
          <div className="space-y-4">
            {facilities.length === 0 && !isAdding && (
              <Card className="p-20 flex flex-col items-center justify-center text-center space-y-4 bg-gray-50/50 border-dashed border-2 border-gray-200 rounded-[48px]">
                <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center text-navy/20 shadow-sm">
                   <Building size={40} />
                </div>
                <div className="space-y-1">
                   <h3 className="text-xl font-black text-navy">No Facilities Added</h3>
                   <p className="text-sm font-bold text-navy/40 max-w-xs mx-auto">Start by adding your hospital's advanced equipment and amenities to attract more patients.</p>
                </div>
                <Button onClick={() => setIsAdding(true)} className="bg-navy text-white px-8 rounded-2xl border-none">Add Your First Facility</Button>
              </Card>
            )}
            {facilities.map((facility, index) => (
              <Card key={index} className="p-0 bg-white border border-gray-100 rounded-[32px] overflow-hidden hover:shadow-xl hover:shadow-navy/5 transition-all group group/card flex flex-col md:flex-row">
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
                 <div className="p-8 md:w-2/3 flex flex-col justify-center relative">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-navy">{facility.title}</h3>
                        <Badge variant="success" className="text-[8px] bg-green-50 text-green-600 border-none uppercase tracking-widest px-2">Published</Badge>
                    </div>
                    <p className="text-sm font-bold text-navy/60 leading-relaxed mb-6">
                       {facility.description || "No description provided."}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-auto">
                       <Button 
                         onClick={() => handleEditFacility(index)}
                         size="sm" 
                         variant="outline" 
                         className="rounded-xl border-gray-200 text-navy text-[10px] px-6 font-black hover:bg-gray-50"
                       >
                          Edit Details
                       </Button>
                       <Button 
                         onClick={() => handleDeleteFacility(index)}
                         size="sm" 
                         variant="outline" 
                         className="rounded-xl border-red-50/50 text-red-500 hover:bg-red-50 text-[10px] px-6 font-black"
                       >
                          <Trash2 size={14} className="mr-2" /> Remove
                       </Button>
                    </div>
                 </div>
              </Card>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default HospitalFacilities;
