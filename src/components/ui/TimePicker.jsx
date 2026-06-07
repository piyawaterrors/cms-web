import React, { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";

const TimePicker = ({
  value = "",
  onChange,
  disabled = false,
  required = false,
  placeholder = "เลือกเวลา...",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const hoursRef = useRef(null);
  const minutesRef = useRef(null);

  const [placement, setPlacement] = useState({
    positionY: "bottom",
    positionX: "left",
  });

  // Split value into hour and minute (default to 09:00 if empty)
  const timeParts = value ? value.split(":") : [];
  const selectedHour = timeParts[0] || "09";
  const selectedMinute = timeParts[1] || "00";

  // Generate hours (00-23) and minutes (00-59)
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  // Toggle open
  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reposition logic to avoid screen overflow
  useEffect(() => {
    const handleReposition = () => {
      if (isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const popupWidth = 240; // width of the popup (w-60 is 240px)
        const popupHeight = 290; // height of the popup including header and confirm button
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const spaceBelow = windowHeight - rect.bottom;
        const spaceAbove = rect.top;

        let positionY = "bottom";
        if (spaceBelow < popupHeight && spaceAbove > spaceBelow) {
          positionY = "top";
        }

        let positionX = "left";
        if (rect.left + popupWidth > windowWidth) {
          if (rect.right - popupWidth >= 0) {
            positionX = "right";
          }
        }
        if (rect.left < 0 && rect.left + popupWidth <= windowWidth) {
          positionX = "left";
        }

        setPlacement({ positionY, positionX });
      }
    };

    if (isOpen) {
      handleReposition();
      window.addEventListener("resize", handleReposition);
      window.addEventListener("scroll", handleReposition, { capture: true });
    }

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, { capture: true });
    };
  }, [isOpen]);

  // Scroll active elements to middle of lists on open
  useEffect(() => {
    if (isOpen) {
      // Delay slightly to ensure component has mounted and rendered the lists
      const timer = setTimeout(() => {
        const activeHourEl = hoursRef.current?.querySelector('[data-active="true"]');
        if (activeHourEl && hoursRef.current) {
          hoursRef.current.scrollTop =
            activeHourEl.offsetTop -
            hoursRef.current.clientHeight / 2 +
            activeHourEl.clientHeight / 2;
        }

        const activeMinuteEl = minutesRef.current?.querySelector('[data-active="true"]');
        if (activeMinuteEl && minutesRef.current) {
          minutesRef.current.scrollTop =
            activeMinuteEl.offsetTop -
            minutesRef.current.clientHeight / 2 +
            activeMinuteEl.clientHeight / 2;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedHour, selectedMinute]);

  const handleHourSelect = (hour) => {
    const newTime = `${hour}:${selectedMinute}`;
    onChange?.({ target: { value: newTime } });
  };

  const handleMinuteSelect = (minute) => {
    const newTime = `${selectedHour}:${minute}`;
    onChange?.({ target: { value: newTime } });
  };

  const handleSetNow = () => {
    const now = new Date();
    const currentH = now.getHours().toString().padStart(2, "0");
    const currentM = now.getMinutes().toString().padStart(2, "0");
    const newTime = `${currentH}:${currentM}`;
    onChange?.({ target: { value: newTime } });
  };

  const handleConfirm = () => {
    if (!value) {
      onChange?.({ target: { value: `${selectedHour}:${selectedMinute}` } });
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full group ${className}`} ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          readOnly
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value ? `${selectedHour}:${selectedMinute} น.` : ""}
          onClick={toggleOpen}
          className={`
            w-full py-2 pl-3 pr-10 bg-white border border-[#d1d5db] rounded-md
            text-[#111] text-base cursor-pointer placeholder-[#999]
            focus:outline-none focus:ring-2 focus:ring-[#003527]/20 focus:border-[#003527]
            transition-all duration-200
            ${disabled ? "bg-gray-50 cursor-not-allowed opacity-60" : ""}
          `}
        />
        <div
          onClick={toggleOpen}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-[#777] transition-colors duration-200 ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer group-hover:text-gray-900"
          }`}
        >
          <Clock size={18} />
        </div>
      </div>

      {isOpen && (
        <div
          className={`
            absolute bg-white border border-gray-200 shadow-2xl rounded-xl p-4 w-72 z-[150] 
            animate-in fade-in zoom-in-95 duration-150 flex flex-col
            ${placement.positionY === "top" ? "bottom-full mb-1" : "top-full mt-1"}
            ${placement.positionX === "right" ? "right-0" : "left-0"}
          `}
        >
          {/* Top Time Display Box */}
          <div className="flex items-center justify-center bg-[#003527]/5 border border-[#003527]/10 rounded-xl py-2 px-3 mb-3">
            <Clock size={16} className="text-[#003527] mr-2" />
            <span className="text-xl font-extrabold text-[#003527] tracking-widest">
              {selectedHour}
            </span>
            <span className="text-xl font-extrabold text-[#003527] mx-1.5 animate-pulse">:</span>
            <span className="text-xl font-extrabold text-[#003527] tracking-widest">
              {selectedMinute}
            </span>
            <span className="text-xs font-semibold text-gray-500 ml-1.5">น.</span>
          </div>

          {/* Header */}
          <div className="grid grid-cols-2 text-center text-xs font-bold text-gray-500 border-b border-gray-100 pb-2 mb-2">
            <div>ชั่วโมง</div>
            <div>นาที</div>
          </div>

          {/* Time select columns */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-3 h-40">
              {/* Hours list */}
              <div
                ref={hoursRef}
                className="overflow-y-auto pr-1 flex flex-col gap-1 custom-scrollbar scroll-smooth"
              >
                {hours.map((h) => {
                  const isActive = h === selectedHour;
                  return (
                    <button
                      key={h}
                      type="button"
                      data-active={isActive}
                      onClick={() => handleHourSelect(h)}
                      className={`
                        py-1.5 text-center text-sm font-semibold rounded-lg transition-all duration-100
                        ${
                          isActive
                            ? "bg-[#003527] text-white font-bold shadow-sm"
                            : "text-gray-700 hover:bg-gray-100"
                        }
                      `}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>

              {/* Minutes list */}
              <div
                ref={minutesRef}
                className="overflow-y-auto pr-1 flex flex-col gap-1 custom-scrollbar scroll-smooth"
              >
                {minutes.map((m) => {
                  const isActive = m === selectedMinute;
                  return (
                    <button
                      key={m}
                      type="button"
                      data-active={isActive}
                      onClick={() => handleMinuteSelect(m)}
                      className={`
                        py-1.5 text-center text-sm font-semibold rounded-lg transition-all duration-100
                        ${
                          isActive
                            ? "bg-[#003527] text-white font-bold shadow-sm"
                            : "text-gray-700 hover:bg-gray-100"
                        }
                      `}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-100 pt-3 mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleSetNow}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors border border-gray-200"
            >
              ตอนนี้
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-2 bg-[#003527] hover:bg-[#004d39] text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;
