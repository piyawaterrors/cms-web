import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const Select = ({
  options = [],
  value,
  onChange,
  placeholder = "เลือกรายการ",
  icon: Icon,
  className = "",
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  // ปิด Dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={selectRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative w-full py-2 px-3 bg-white border rounded-md outline-none
          flex items-center justify-between cursor-pointer transition-all duration-200
          ${
            isOpen
              ? "border-[#003527] ring-2 ring-[#003527]/20"
              : "border-[#d1d5db]"
          }
          ${Icon ? "pl-10" : ""}
        `}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]">
              <Icon size={20} strokeWidth={2} />
            </div>
          )}
          <span
            className={`truncate text-base ${!selectedOption ? "text-[#999]" : "text-[#111]"}`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`text-[#777] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-[110] w-full mt-1.5 bg-white border border-[#d1d5db] rounded-lg overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`
                  flex items-center justify-between mx-1 px-2 rounded-md py-2 cursor-pointer text-base transition-colors
                  ${
                    value === option.value
                      ? "bg-[#f0fdf4] text-[#003527] font-medium"
                      : "text-[#111] hover:bg-[#f0fdf4]"
                  }
                `}
              >
                <span>{option.label}</span>
                {value === option.value && <Check size={14} />}
              </div>
            ))}
            {options.length === 0 && (
              <div className="px-4 py-3 text-sm text-[#999] text-center">
                ไม่มีข้อมูล
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Select;
