import React from 'react';

const Card = ({ children, className = '', hover = false }) => {
  return (
    <div 
      className={`
        ${className.includes('bg-') ? '' : 'bg-white'} rounded-3xl border border-gray-100 p-8 shadow-sm transition-all duration-300
        ${hover ? 'hover:shadow-xl hover:shadow-[#0D9488]/10 hover:-translate-y-1 hover:border-[#0D9488]/10' : ''} 
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
