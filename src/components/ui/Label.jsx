import React from 'react';

const Label = ({ children, htmlFor, className = "", required = false }) => {
  return (
    <label 
      htmlFor={htmlFor} 
      className={`block text-sm font-medium text-[#111] mb-1.5 ${className}`}
    >
      {children}
      {required && <span className="text-[#ba1a1a] ml-1">*</span>}
    </label>
  );
};

export default Label;
