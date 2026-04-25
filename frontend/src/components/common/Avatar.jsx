import React from 'react';

const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl'
  };

  return (
    <div 
      className={`
        relative inline-flex items-center justify-center overflow-hidden rounded-full font-bold tracking-tight select-none border-2 border-white shadow-sm transition-all duration-200 hover:scale-105
        ${sizes[size]} 
        ${!src ? 'bg-gradient-to-br from-[#0D9488] to-[#14B8A6] text-white' : ''} 
        ${className}
      `}
    >
      {src ? (
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-cover" 
          onError={(e) => { e.target.onerror = null; e.target.src = ''; }} 
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
};

export default Avatar;
