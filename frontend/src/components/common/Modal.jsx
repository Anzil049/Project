import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className = '',
  noPadding = false
}) => {
  // Use a simple effect to handle scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0C1A2E]/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        className={`
          relative w-full bg-white rounded-3xl shadow-2xl overflow-hidden
          ${sizes[size]} 
          ${className}
          transition-all duration-300 animate-in zoom-in-95 fade-in slide-in-from-bottom-4
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-heading font-bold text-navy">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-navy/40 hover:bg-gray-100 hover:text-navy transition-all duration-200 active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className={`${noPadding ? '' : 'p-8'} max-h-[80vh] overflow-y-auto font-body`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
