import React from 'react';

const Textarea = ({ 
  placeholder, 
  value, 
  onChange, 
  className = "", 
  rows = 3,
  ...props 
}) => {
  return (
    <div className="relative w-full group">
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className={`
          w-full py-2.5 px-3 bg-white border border-[#d1d5db] rounded-md
          text-[#111] text-base placeholder-[#999]
          focus:outline-none focus:ring-2 focus:ring-[#003527]/20 focus:border-[#003527]
          transition-all duration-200 resize-none
          ${className}
        `}
        {...props}
      />
    </div>
  );
};

export default Textarea;
