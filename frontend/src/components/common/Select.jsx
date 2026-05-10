import React, { useState, forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

const Select = forwardRef(({ 
  label, 
  name, 
  options = [], 
  value, 
  onChange, 
  error, 
  required = false,
  className = '',
  disabled = false,
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-navy/40 pl-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative group">
        <select
          id={name}
          name={name}
          {...(value !== undefined ? { value: value ?? '' } : {})}
          onChange={onChange}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          disabled={disabled}
          {...props}
          className={`
            w-full bg-white border-2 rounded-2xl px-4 py-4 transition-all duration-200 outline-none font-body text-navy appearance-none cursor-pointer
            ${error 
              ? 'border-red-500 bg-red-50/10 focus:border-red-600' 
              : 'border-gray-100 focus:border-[#0D9488]'}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
          `}
        >
          <option value="" disabled>Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value || opt} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
        
        <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${isFocused ? 'text-[#0D9488]' : 'text-navy/40'}`}>
          <ChevronDown size={18} strokeWidth={2.5} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1.5 px-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle size={14} className="text-red-500" />
          <span className="text-red-500 text-[11px] font-bold">{error}</span>
        </div>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
