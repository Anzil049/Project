import React from 'react';

const Badge = ({ children, label, variant = 'neutral', className = '' }) => {
  const variants = {
    success: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/50',
    warning: 'bg-amber-100/80 text-amber-700 border-amber-200/50',
    danger: 'bg-red-100/80 text-red-700 border-red-200/50',
    info: 'bg-sky-100/80 text-sky-700 border-sky-200/50',
    neutral: 'bg-slate-100/80 text-slate-700 border-slate-200/50',
    none: ''
  };

  const activeVariant = variants[variant] || variants.neutral;
  const isCustomBg = className.includes('bg-');
  const finalVariant = isCustomBg && variant === 'neutral' ? '' : activeVariant;

  return (
    <span 
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border 
        ${finalVariant} 
        ${className} 
        transition-all duration-200 hover:scale-105 active:scale-95 cursor-default select-none
      `}
    >
      {children || label}
    </span>
  );
};

export default Badge;
