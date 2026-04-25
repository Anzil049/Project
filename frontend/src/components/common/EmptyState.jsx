import React from 'react';
import Button from './Button';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto ${className}`}>
      {/* Icon Wrapper */}
      <div className="bg-[#F0F9FF] p-6 rounded-full mb-6 border-2 border-white shadow-sm transition-transform hover:scale-110 duration-300">
        {Icon && (
          <Icon className="text-[#0D9488] w-12 h-12" strokeWidth={1.5} />
        )}
      </div>

      <h3 className="text-2xl font-heading font-bold text-navy mb-2 tracking-tight">
        {title}
      </h3>
      
      <p className="text-navy/50 text-base leading-relaxed mb-8 font-body">
        {description}
      </p>

      {actionLabel && (
        <Button 
          variant="primary" 
          onClick={onAction}
          className="shadow-xl shadow-[#0D9488]/20"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
