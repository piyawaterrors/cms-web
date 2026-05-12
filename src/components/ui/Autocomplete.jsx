import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X } from "lucide-react";
import { Get } from "@/services/https";

const Autocomplete = ({
  placeholder = "ค้นหา...",
  value = "",
  onChange,
  onSelect,
  apiEndpoint = "/members",
  labelField = "fullName",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchOptions = async (search) => {
    if (!search || search.length < 2) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await Get(`${apiEndpoint}?search=${search}&limit=5`);
      setOptions(res.data.rows || []);
    } catch (err) {
      console.error("Autocomplete fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isOpen && inputValue) {
        fetchOptions(inputValue);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue, isOpen]);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          className="w-full py-2 px-3 rounded-md border border-[#d1d5db] text-base focus:outline-none focus:ring-2 focus:ring-[#003527]/20 focus:border-[#003527] transition-all placeholder-[#999]"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange?.(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue("");
              onChange?.("");
              setOptions([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (options.length > 0 || loading) && (
        <div className="absolute z-[110] w-full mt-1 bg-white rounded-md border border-gray-100 shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
          {loading ? (
            <div className="p-4 text-center text-xs text-gray-400 italic">
              กำลังค้นหา...
            </div>
          ) : (
            options.map((option) => (
              <div
                key={option.id}
                onClick={() => {
                  setInputValue(option[labelField]);
                  onSelect?.(option);
                  setIsOpen(false);
                }}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
              >
                <div className="font-medium text-sm text-gray-900">
                  {option[labelField]} {option.phone && `(${option.phone})`}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Autocomplete;
