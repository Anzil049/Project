import React from 'react';
import Spinner from './Spinner';

const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false, 
  onClick, 
  children, 
  fullWidth = false,
  className = '',
  type = 'button'
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold tracking-tight rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0";

  const variants = {
    primary: "bg-[#0D9488] text-white hover:bg-[#115E59] shadow-lg shadow-[#0D9488]/20 focus:ring-[#0D9488]/50",
    outline: "border-2 border-[#0D9488] text-[#0D9488] hover:bg-[#F0FDFA] focus:ring-[#0D9488]/30",
    ghost: "text-[#0D9488] hover:bg-[#F0FDFA] border-2 border-transparent",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 focus:ring-red-500/50"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base font-bold",
    lg: "px-8 py-4 text-lg font-extrabold"
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Spinner size="sm" color={variant === 'outline' || variant === 'ghost' ? 'primary' : 'white'} />
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
