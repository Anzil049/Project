import React from 'react';
import { Button } from '../common';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PageWrapper = ({ 
  title, 
  subtitle, 
  children, 
  action, 
  backButton = false,
  className = ''
}) => {
  const navigate = useNavigate();

  return (
    <div className={`space-y-8 pb-12 ${className}`}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          {backButton && (
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-primary font-bold text-sm mb-3 hover:-translate-x-1 transition-transform group"
            >
              <ArrowLeft size={16} className="group-hover:scale-110 transition-transform" />
              Back to previous
            </button>
          )}
          <h1 className="text-4xl font-heading font-black text-navy leading-none tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-navy/50 font-body font-medium text-lg max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {action && (
          <div className="flex-shrink-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <Button 
              variant={action.variant || 'primary'} 
              onClick={action.onClick}
              className="px-8 shadow-xl shadow-primary/20"
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="animate-in fade-in zoom-in-95 duration-500 delay-150">
        {children}
      </div>
    </div>
  );
};

export default PageWrapper;
