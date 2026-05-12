import React from 'react';

const Input = ({ 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  icon: Icon, 
  className = "", 
  ...props 
}) => {
  return (
    <div className="relative w-full group">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777] group-focus-within:text-[#003527] transition-colors">
          <Icon size={20} strokeWidth={2} />
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`
          w-full py-2 px-3 bg-white border border-[#d1d5db] rounded-md
          text-[#111] text-base placeholder-[#999]
          focus:outline-none focus:ring-2 focus:ring-[#003527]/20 focus:border-[#003527]
          transition-all duration-200
          ${Icon ? 'pl-10' : ''}
          ${className}
        `}
        {...props}
      />
    </div>
  );
};

export default Input;
