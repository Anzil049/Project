import React, { useState, useCallback, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Badge, Button, Avatar, Skeleton } from '../../components/common';
import { 
  Bell, Calendar, Droplets, MessageSquare, 
  Check, MoreVertical, Trash2, Clock, 
  ChevronRight, Filter, CheckCircle2
} from 'lucide-react';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('All'); 
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const categories = [
    { id: 'All', label: 'All', icon: Bell },
    { id: 'Appointments', label: 'Appointments', icon: Calendar },
    { id: 'Blood', label: 'Blood Requests', icon: Droplets },
    { id: 'Consultations', label: 'Consultations', icon: MessageSquare }
  ];

  const initialNotifications = [
    {
      id: 1,
      type: 'Appointments',
      title: 'Appointment Confirmed',
      message: 'Your consultation with Dr. Rajesh Khanna for tomorrow at 10:00 AM has been confirmed.',
      time: '10 mins ago',
      isUnread: true,
      sender: 'MedCare Central'
    },
    {
      id: 2,
      type: 'Blood',
      title: 'Urgent Blood Request',
      message: 'Urgent need for B+ blood at City Hospital. 3 units required immediately.',
      time: '45 mins ago',
      isUnread: true,
      sender: 'Red Cross'
    },
    {
      id: 3,
      type: 'Consultations',
      title: 'New Message',
      message: 'Dr. Sneha Kapoor sent you a follow-up message regarding your latest test reports.',
      time: '2 hours ago',
      isUnread: false,
      sender: 'Dr. Sneha Kapoor'
    },
    {
      id: 4,
      type: 'Appointments',
      title: 'Reminder: Lab Test',
      message: "Don't forget your scheduled blood test at Lifeline Diagnostics tomorrow morning.",
      time: '5 hours ago',
      isUnread: false,
      sender: 'Lifeline Labs'
    },
    {
      id: 5,
      type: 'Blood',
      title: 'Donation Successful',
      message: 'Thank you for your blood donation! Your certificates are now available in your profile.',
      time: '1 day ago',
      isUnread: false,
      sender: 'Blood Bank'
    },
    {
      id: 6,
      type: 'Consultations',
      title: 'Video Consultation Invite',
      message: 'A new video consultation session has been scheduled for Friday, 11:30 AM.',
      time: '2 days ago',
      isUnread: false,
      sender: 'Online Support'
    }
  ];

  const [notifications, setNotifications] = useState(initialNotifications);

  const fetchMore = useCallback(async () => {
    if (page >= 3) {
      setHasMore(false);
      return;
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const moreNotifications = initialNotifications.map(n => ({
      ...n,
      id: Math.random(),
      time: `${page + 1} days ago`,
      isUnread: false
    }));

    setNotifications(prev => [...prev, ...moreNotifications]);
    setPage(prev => prev + 1);
  }, [page]);

  const [isFetching, lastElementRef] = useInfiniteScroll(fetchMore);

  const filteredNotifications = activeTab === 'All' 
    ? notifications 
    : notifications.filter(n => n.type === activeTab);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isUnread: false })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'Appointments': return <Calendar size={18} className="text-blue-500" />;
      case 'Blood': return <Droplets size={18} className="text-red-500" />;
      case 'Consultations': return <MessageSquare size={18} className="text-[#0D9488]" />;
      default: return <Bell size={18} className="text-gray-400" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'Appointments': return 'bg-blue-50';
      case 'Blood': return 'bg-red-50';
      case 'Consultations': return 'bg-teal-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <DashboardLayout title="Notifications Center">
      <div className="max-w-4xl mx-auto space-y-8 pb-20 font-body animate-in fade-in duration-700">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-heading font-black text-navy tracking-tight transition-colors">
              Alerts & <span className="text-[#0D9488]">Inbox</span>
            </h1>
            <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em] flex items-center gap-2">
              <Bell size={14} className="text-[#0D9488]" /> Stay updated with your health and medical network
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <Button 
               variant="outline" 
               onClick={markAllAsRead}
               className="rounded-2xl border-gray-100 text-[10px] font-black uppercase tracking-widest px-6 h-12 flex items-center gap-2 transition-colors"
             >
                <CheckCircle2 size={16} /> Mark all read
             </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white p-1.5 rounded-[24px] border border-gray-100 shadow-sm overflow-x-auto [&::-webkit-scrollbar]:hidden transition-colors">
          {categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-6 py-3 rounded-[20px] text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === cat.id ? 'bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/20' : 'text-navy/40 hover:text-navy hover:bg-gray-50'}`}
            >
              <cat.icon size={16} />
              {cat.label}
              {cat.id === 'All' && notifications.filter(n => n.isUnread).length > 0 && (
                <span className="ml-1 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            <>
              {filteredNotifications.map((notif, idx) => (
                <div 
                  key={notif.id} 
                  ref={idx === filteredNotifications.length - 1 ? lastElementRef : null}
                >
                  <Card 
                    className={`p-6 border-none transition-all duration-300 group hover:shadow-xl hover:shadow-navy/5 relative overflow-hidden ${notif.isUnread ? 'bg-white ring-1 ring-[#0D9488]/10' : 'bg-white opacity-80'}`}
                  >
                    {notif.isUnread && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-[#0D9488]" />
                    )}
                    
                    <div className="flex items-start gap-6 leading-none">
                      <div className={`p-4 rounded-[22px] flex-shrink-0 ${getBgColor(notif.type)} shadow-inner`}>
                        {getIcon(notif.type)}
                      </div>
                      
                      <div className="flex-1 space-y-2 text-left">
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-widest">
                             {notif.type} • {notif.sender}
                           </p>
                           <span className="text-[10px] font-bold text-navy/30 flex items-center gap-1">
                             <Clock size={12} /> {notif.time}
                           </span>
                        </div>
                        
                        <div className="text-left">
                          <h3 className={`text-lg font-black tracking-tight ${notif.isUnread ? 'text-navy' : 'text-navy/70'}`}>
                            {notif.title}
                          </h3>
                          <p className="text-sm font-medium text-navy/50 leading-relaxed mt-1">
                            {notif.message}
                          </p>
                        </div>
    
                        <div className="flex items-center gap-4 pt-4">
                           <button className="text-[10px] font-black text-[#0D9488] uppercase tracking-[0.2em] flex items-center gap-1 hover:gap-2 transition-all">
                               Action Required <ChevronRight size={12} />
                           </button>
                           <div className="flex-1" />
                           <button 
                            onClick={() => deleteNotification(notif.id)}
                            className="p-2 text-navy/20 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
              
              {isFetching && hasMore && (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Card key={i} className="p-6 border-none bg-white">
                      <div className="flex items-start gap-6">
                        <Skeleton variant="rect" width={56} height={56} className="rounded-[22px]" />
                        <div className="flex-1 space-y-3">
                          <div className="flex justify-between">
                             <Skeleton variant="text" width={120} height={12} />
                             <Skeleton variant="text" width={60} height={12} />
                          </div>
                          <Skeleton variant="text" width="60%" height={24} />
                          <Skeleton variant="text" width="90%" height={16} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {!hasMore && (
                <div className="py-10 text-center">
                  <p className="text-[10px] font-black text-navy/20 uppercase tracking-[0.3em]">End of notification history</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-dashed border-gray-200 rounded-[32px] p-20 text-center flex flex-col items-center transition-colors">
               <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6">
                  <Bell size={40} />
               </div>
               <h3 className="text-2xl font-black text-navy mb-2">No notifications found</h3>
               <p className="text-sm font-medium text-navy/30">
                 You're all caught up! There are no {activeTab === 'All' ? '' : activeTab.toLowerCase()} alerts for now.
               </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
