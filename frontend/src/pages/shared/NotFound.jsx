import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Stethoscope, Search, Ghost } from 'lucide-react';
import { Button } from '../../components/common';
import { ROUTES } from '../../constants/routes';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 font-body transition-colors duration-500 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <h1 className="text-[30vw] font-black text-navy select-none">404</h1>
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-12">
        <motion.div 
           initial={{ opacity: 0, y: 50, rotate: -10 }}
           animate={{ opacity: 1, y: 0, rotate: 0 }}
           transition={{ type: "spring", damping: 10, stiffness: 100 }}
           className="relative inline-block"
        >
          <div className="w-48 h-48 bg-teal-50 rounded-[60px] flex items-center justify-center text-[#0D9488] shadow-2xl shadow-teal-500/10 mx-auto">
             <Stethoscope size={80} className="animate-pulse" />
          </div>
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500 rounded-3xl flex items-center justify-center text-white shadow-xl"
          >
             <Search size={24} />
          </motion.div>
        </motion.div>

        <div className="space-y-4">
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.3 }}
             className="inline-flex px-4 py-1.5 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-[0.3em] border border-red-100"
           >
             Security Discrepancy Detected
           </motion.div>
           <motion.h1 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             className="text-6xl font-heading font-black text-navy tracking-tighter"
           >
             Lost in the <span className="text-[#0D9488]">Ward?</span>
           </motion.h1>
           <motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.5 }}
             className="text-lg text-navy/40 font-bold max-w-md mx-auto"
           >
             The medical protocol you're requesting doesn't exist in our current synchronisation.
           </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link to={ROUTES.HOME} className="w-full md:w-auto">
             <Button className="w-full h-16 px-10 rounded-3xl bg-[#0D9488] text-white font-black uppercase tracking-widest shadow-2xl shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all text-xs">
                Back to Diagnostics <Home size={18} className="ml-3" />
             </Button>
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="w-full md:w-auto h-16 px-10 rounded-3xl bg-white border border-gray-100 text-navy font-black uppercase tracking-widest hover:bg-gray-50 transition-all text-xs flex items-center justify-center gap-3"
          >
             <ArrowLeft size={18} /> Reverse Protocol
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="pt-20 flex items-center justify-center gap-8"
        >
          <div className="flex items-center gap-3 text-navy/20">
             <Ghost size={20} />
             <span className="text-[10px] font-black uppercase tracking-widest italic">Anomalous Route</span>
          </div>
          <div className="w-1 h-1 bg-gray-200 rounded-full" />
          <div className="text-[10px] font-black uppercase tracking-widest text-navy/20">
            System ID: 0x404_MED_ERR
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
