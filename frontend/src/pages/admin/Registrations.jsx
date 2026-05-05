import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge } from '../../components/common';
import { 
  Building2, Stethoscope, Search, Check, X, FileText, Download, ShieldAlert
} from 'lucide-react';
import adminService from '../../services/adminService';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Registrations = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRejectId, setSelectedRejectId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [activeCertUrl, setActiveCertUrl] = useState(null);

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPendingRegistrations();
      setApplications(data);
    } catch (error) {
      toast.error('Failed to load pending registrations');
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleApprove = async (id) => {
    try {
      toast.loading('Approving application...', { id: 'approve' });
      await adminService.approveRegistration(id);
      setApplications(prev => prev.filter(app => app.id !== id));
      toast.success('Application approved successfully!', { id: 'approve' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve application', { id: 'approve' });
    }
  };

  const openRejectModal = (id) => {
    setSelectedRejectId(id);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) return;
    
    try {
      setProcessing(true);
      toast.loading('Rejecting application...', { id: 'reject' });
      await adminService.rejectRegistration(selectedRejectId, rejectionReason);
      setApplications(prev => prev.filter(app => app.id !== selectedRejectId));
      setRejectModalOpen(false);
      setSelectedRejectId(null);
      toast.success('Application rejected and user notified.', { id: 'reject' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject application', { id: 'reject' });
    } finally {
      setProcessing(false);
    }
  };

  const [downloadingAction, setDownloadingAction] = useState(null); // 'view-ID' or 'download-ID'

  const handleDownload = async (url, id, shouldDownload = true) => {
    const actionKey = `${shouldDownload ? 'download' : 'view'}-${id}`;
    try {
      setDownloadingAction(actionKey);
      const response = await api.get(`/admin/download-certificate?url=${encodeURIComponent(url)}`, {
        responseType: 'blob'
      });
      
      const contentType = response.headers['content-type'] || 'application/pdf';
      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);
      
      if (shouldDownload) {
        const ext = url.split('.').pop().toLowerCase();
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `certificate-${id.substring(0, 8)}.${ext}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
      } else {
        // For inline viewing, we open the blob URL which now has the correct content type
        window.open(blobUrl, '_blank');
      }
    } catch (error) {
      toast.error('Failed to access document. Please try again.');
    } finally {
      setDownloadingAction(null);
    }
  };

  const [activeAppId, setActiveAppId] = useState(null);

  const openCertModal = (url, id) => {
    setActiveCertUrl(url);
    setActiveAppId(id);
    setCertModalOpen(true);
  };

  return (
    <DashboardLayout title="Verification Queue" role="admin">
      <div className="max-w-6xl mx-auto pb-20 font-body animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight">
              Onboarding <span className="text-[#0D9488]">Queue</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <ShieldAlert size={14} className="text-orange-500" /> Pending identity verifications
            </p>
          </div>
          <div className="relative w-full md:w-64">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/40" />
             <input 
               type="text" 
               placeholder="Search registry..." 
               className="w-full bg-white border-2 border-gray-100 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-navy outline-none focus:border-[#0D9488] transition-all"
             />
          </div>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {loading ? (
             <div className="col-span-full py-20 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0D9488] mx-auto mb-4"></div>
                <p className="text-navy/60 font-bold">Loading registrations...</p>
             </div>
           ) : applications.length === 0 ? (
             <div className="col-span-full py-20 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px]">
                <ShieldAlert size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-black text-navy">Queue Clear!</h3>
                <p className="text-sm font-bold text-navy/40 mt-2">There are no pending registrations awaiting review.</p>
             </div>
           ) : applications.map((app) => (
             <Card key={app.id} className="p-6 border border-gray-100 bg-white hover:shadow-xl transition-all duration-300 flex flex-col group">
               <div className="flex items-start justify-between mb-6">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${app.type === 'hospital' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                   {app.type === 'hospital' ? <Building2 size={24} /> : <Stethoscope size={24} />}
                 </div>
                 <Badge bg="bg-amber-50" text="text-amber-600" className="text-[10px] font-black uppercase text-amber-600 border-none shadow-none">
                    Pending
                 </Badge>
               </div>
               
               <div className="mb-6 flex-1">
                 <h3 className="text-lg font-black text-navy mb-1 line-clamp-1">{app.name}</h3>
                 <p className="text-xs font-bold text-navy/40 line-clamp-1">{app.email}</p>
                 <div className="mt-4 inline-block bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-black uppercase text-navy/40 tracking-widest leading-none">Submitted</p>
                    <p className="text-xs font-bold text-navy mt-1">{new Date(app.submittedAt).toLocaleString()}</p>
                 </div>
               </div>

               <div className="space-y-3 mt-auto">
                 <Button 
                   variant="outline" 
                   fullWidth 
                   onClick={() => openCertModal(app.certPreview, app.id)}
                   className="text-xs font-black rounded-xl border-gray-200"
                 >
                    <FileText size={14} className="mr-2" /> View Certificate
                 </Button>
                 <div className="grid grid-cols-2 gap-3">
                   <Button 
                      onClick={() => handleApprove(app.id)}
                      className="bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 text-xs font-black rounded-xl"
                   >
                      <Check size={14} className="mr-2" /> Approve
                   </Button>
                   <Button 
                      variant="danger"
                      onClick={() => openRejectModal(app.id)}
                      className="text-xs font-black rounded-xl shadow-lg shadow-red-500/20"
                   >
                      <X size={14} className="mr-2" /> Reject
                   </Button>
                 </div>
               </div>
             </Card>
           ))}
        </div>

      </div>

      {/* REJECTION MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-navy/80 backdrop-blur-sm" onClick={() => setRejectModalOpen(false)}></div>
          <Card className="relative w-full max-w-md bg-white p-8 rounded-[32px] shadow-2xl z-10 animate-in zoom-in-95 duration-200">
             <div className="flex items-center gap-3 text-red-500 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                   <X size={20} />
                </div>
                <h2 className="text-xl font-heading font-black text-navy">Reject Application</h2>
             </div>
             
             <p className="text-xs font-bold text-navy/60 mb-6 leading-relaxed">
                Please provide a distinct reason for rejecting this medical application. This response will be securely emailed to the applicant for their transparent record.
             </p>
             
             <textarea 
                className="w-full text-sm font-bold text-navy bg-gray-50 border border-gray-200 rounded-[20px] px-5 py-4 outline-none focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all resize-none h-32 mb-6"
                placeholder="Enter rejection reason here..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
             />
             
             <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setRejectModalOpen(false)} className="text-navy/60 hover:bg-gray-100 rounded-xl px-6 font-black text-xs">
                   Cancel
                </Button>
                <Button 
                   variant="danger" 
                   onClick={submitRejection} 
                   disabled={!rejectionReason.trim() || processing}
                   loading={processing}
                   className="rounded-xl px-6 font-black text-xs shadow-lg shadow-red-500/20"
                >
                   Drop Final Rejection
                </Button>
             </div>
          </Card>
        </div>
      )}

      {/* CERTIFICATE VIEWER MODAL */}
      {certModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-12 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-navy/90 backdrop-blur-md" onClick={() => setCertModalOpen(false)}></div>
          <div className="relative w-full max-w-4xl max-h-full flex flex-col items-center justify-center z-10 animate-in zoom-in-95 duration-200">
             
             <div className="w-full flex justify-end gap-4 mb-4">
               <button 
                 disabled={downloadingAction !== null}
                 onClick={() => handleDownload(activeCertUrl, activeAppId, false)}
                 className="h-10 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 backdrop-blur-md transition-all disabled:opacity-50"
               >
                  {downloadingAction === `view-${activeAppId}` ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                  ) : (
                    <Download size={14} />
                  )}
                  {downloadingAction === `view-${activeAppId}` ? 'Loading...' : 'Open Original File'}
               </button>
               <button onClick={() => setCertModalOpen(false)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all">
                   <X size={20} />
               </button>
             </div>

             <div className="w-full bg-black/50 rounded-[32px] overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center min-h-[50vh] p-4">
               {activeCertUrl ? (
                 <div className="flex flex-col items-center gap-6 w-full">
                   <img 
                     src={activeCertUrl.toLowerCase().endsWith('.pdf') ? activeCertUrl.replace(/\.pdf$/i, '.jpg') : activeCertUrl} 
                     alt="Certificate Preview" 
                     className="max-w-full max-h-[60vh] rounded-xl shadow-2xl border border-white/10"
                     onError={(e) => {
                       // Fallback if JPG conversion fails: show a document icon
                       e.target.style.display = 'none';
                       document.getElementById('pdf-fallback').style.display = 'block';
                     }}
                   />
                   <div id="pdf-fallback" className="hidden text-center py-12">
                      <FileText size={64} className="text-white/20 mx-auto mb-4" />
                      <p className="text-white font-bold">Document Preview Ready</p>
                   </div>
                   
                   <button 
                     disabled={downloadingAction !== null}
                     onClick={() => handleDownload(activeCertUrl, activeAppId, true)}
                     className={`bg-[#0D9488] hover:bg-[#0D9488]/80 text-white font-black rounded-2xl px-8 py-3 shadow-xl shadow-[#0D9488]/20 transition-all flex items-center justify-center gap-2 ${downloadingAction !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                   >
                     {downloadingAction === `download-${activeAppId}` ? (
                       <>
                         <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                         Securely Fetching...
                       </>
                     ) : (
                       <>
                         <Download size={16} /> Download Full Certificate
                       </>
                     )}
                   </button>
                 </div>
               ) : (
                 <div className="text-center py-20">
                   <ShieldAlert size={48} className="text-white/20 mx-auto mb-4" />
                   <p className="text-white font-bold">No certificate file was uploaded for this account.</p>
                 </div>
               )}
             </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Registrations;
