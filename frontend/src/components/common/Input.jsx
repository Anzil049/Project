import React, { useState, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

const Input = forwardRef(({ 
  label, 
  name, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  onBlur,
  error, 
  icon: Icon,
  className = '',
  required = false,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Label Container */}
      <div className={`relative group ${className}`}>
        {/* Icon Prepend */}
        {Icon && (
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10 ${isFocused ? 'text-[#0D9488]' : 'text-navy/40'}`}>
            <Icon size={20} strokeWidth={2} />
          </div>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          ref={ref}
          placeholder={label || placeholder} // Use label as placeholder if provided
          onFocus={() => setIsFocused(true)}
          onBlurCapture={() => setIsFocused(false)}
          required={required}
          {...props}
          className={`
            w-full h-full bg-white border-2 rounded-2xl px-4 py-4 transition-all duration-200 outline-none font-body text-navy
            ${Icon ? 'pl-12' : 'pl-4'}
            ${type === 'password' || (type === 'text' && name?.toLowerCase().includes('password')) ? 'pr-12' : 'pr-4'}
            ${error 
              ? 'border-red-500 bg-red-50/10 focus:border-red-600' 
              : 'border-gray-100 focus:border-[#0D9488]'}
            placeholder:text-navy/30
            peer
          `}
        />

        {/* Removed Floating Label as per user request */}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1.5 px-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle size={14} className="text-red-500 shadow-sm" />
          <span className="text-red-500 text-[11px] font-bold leading-tight">{error}</span>
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
