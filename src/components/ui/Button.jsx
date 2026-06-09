import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ 
  children, 
  onClick, 
  type = "button", 
  variant = "primary", 
  className = "", 
  icon: Icon,
  disabled = false,
  loading = false,
  title,
  ...props
}) => {
  const variants = {
    primary: "bg-[#003527] text-white hover:bg-[#064e3b] active:bg-[#002117]",
    secondary: "bg-gray-100 text-[#333] hover:bg-gray-200 active:bg-gray-300",
    outline: "bg-transparent border border-[#d1d5db] text-[#333] hover:bg-[#064e3b]/20",
    ghost: "bg-transparent text-[#555] hover:bg-black/5 active:bg-black/10",
    danger: "bg-transparent text-[#ba1a1a] hover:bg-rose-50 active:bg-rose-100"
  };

  const isButtonDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isButtonDisabled}
      className={`
        relative group/btn-tooltip
        flex items-center justify-center gap-2 transition-all duration-200
        cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale-[0.5]
        ${className.includes('p-') ? '' : 'px-4 py-2.5'} 
        rounded-sm text-sm font-medium
        ${variants[variant]}
        ${isButtonDisabled ? '' : 'active:scale-95'}
        ${className}
      `}
      {...props}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {!loading && children}
      {loading && <span>กำลังทำรายการ...</span>}
      {!loading && Icon && <Icon size={18} strokeWidth={2} />}

      {/* Custom Tooltip */}
      {title && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-[#003527] text-white text-[11px] font-medium rounded shadow-lg opacity-0 scale-95 pointer-events-none group-hover/btn-tooltip:opacity-100 group-hover/btn-tooltip:scale-100 transition-all duration-150 z-50 whitespace-nowrap border border-emerald-800/20">
          {title}
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[5px] border-transparent border-t-[#003527]" />
        </span>
      )}
    </button>
  );
};

export default Button;
