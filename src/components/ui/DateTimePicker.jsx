import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];
const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];
const THAI_WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

const DateTimePicker = ({
  value = "",
  onChange,
  required = false,
  disabled = false,
  placeholder = "เลือกวันที่และเวลา...",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Current view month & year (in AD for internal dayjs operations)
  const [viewDate, setViewDate] = useState(() => {
    return value ? dayjs(value) : dayjs();
  });

  const [viewMode, setViewMode] = useState("days"); // "days" | "months" | "years"
  const [yearRangeStart, setYearRangeStart] = useState(() => {
    const currentYear = (value ? dayjs(value) : dayjs()).year();
    return Math.floor(currentYear / 10) * 10;
  });

  const containerRef = useRef(null);
  const hoursRef = useRef(null);
  const minutesRef = useRef(null);

  const [placement, setPlacement] = useState({
    positionY: "bottom",
    positionX: "left",
  });

  // Parse value
  const dateObj = value ? dayjs(value) : null;
  const selectedDate = dateObj;
  const selectedHour = dateObj ? dateObj.format("HH") : "09";
  const selectedMinute = dateObj ? dateObj.format("mm") : "00";

  // Generate hours (00-23) and minutes (00-59)
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  // Calculate dynamic placement to avoid overflow
  useEffect(() => {
    const handleReposition = () => {
      if (isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const popupWidth = 448; // w-[28rem] matches 28rem = 448px
        const popupHeight = 390; // Max height approximation
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

  // Scroll time columns on open
  useEffect(() => {
    if (isOpen) {
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

  // Toggle open and sync view date
  const toggleOpen = () => {
    if (!isOpen) {
      setViewDate(value ? dayjs(value) : dayjs());
      setViewMode("days");
    }
    setIsOpen(!isOpen);
  };

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setViewMode("days");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format date-time for text input display (DD/MM/YYYY HH:mm น.)
  const getDisplayValue = () => {
    if (!value) return "";
    const dateObj = dayjs(value);
    const day = dateObj.format("DD");
    const month = dateObj.format("MM");
    const yearBE = dateObj.year() + 543;
    const time = dateObj.format("HH:mm");
    return `${day}/${month}/${yearBE} ${time} น.`;
  };

  const handlePrev = () => {
    if (viewMode === "days") {
      setViewDate(viewDate.subtract(1, "month"));
    } else if (viewMode === "months") {
      setViewDate(viewDate.subtract(1, "year"));
    } else if (viewMode === "years") {
      setYearRangeStart(yearRangeStart - 10);
    }
  };

  const handleNext = () => {
    if (viewMode === "days") {
      setViewDate(viewDate.add(1, "month"));
    } else if (viewMode === "months") {
      setViewDate(viewDate.add(1, "year"));
    } else if (viewMode === "years") {
      setYearRangeStart(yearRangeStart + 10);
    }
  };

  const selectDay = (day) => {
    const baseDate = viewDate.date(day);
    const newDate = baseDate.hour(parseInt(selectedHour)).minute(parseInt(selectedMinute));
    const dateStr = newDate.format("YYYY-MM-DDTHH:mm");
    onChange?.({
      target: {
        value: dateStr,
      },
    });
  };

  const selectMonth = (monthIdx) => {
    setViewDate(viewDate.month(monthIdx));
    setViewMode("days");
  };

  const selectYear = (year) => {
    setViewDate(viewDate.year(year));
    setViewMode("months");
  };

  const handleHourSelect = (hour) => {
    const baseDate = selectedDate || dayjs();
    const newDate = baseDate.hour(parseInt(hour)).minute(parseInt(selectedMinute));
    onChange?.({
      target: {
        value: newDate.format("YYYY-MM-DDTHH:mm"),
      },
    });
  };

  const handleMinuteSelect = (minute) => {
    const baseDate = selectedDate || dayjs();
    const newDate = baseDate.hour(parseInt(selectedHour)).minute(parseInt(minute));
    onChange?.({
      target: {
        value: newDate.format("YYYY-MM-DDTHH:mm"),
      },
    });
  };

  const handleSetNow = () => {
    const now = dayjs();
    onChange?.({
      target: {
        value: now.format("YYYY-MM-DDTHH:mm"),
      },
    });
    setViewDate(now);
  };

  const handleConfirm = () => {
    if (!value) {
      const now = dayjs().hour(parseInt(selectedHour)).minute(parseInt(selectedMinute));
      onChange?.({
        target: {
          value: now.format("YYYY-MM-DDTHH:mm"),
        },
      });
    }
    setIsOpen(false);
  };

  // Generate calendar grid
  const renderCalendarDays = () => {
    const daysInMonth = viewDate.daysInMonth();
    const firstDayIndex = viewDate.startOf("month").day();

    const prevMonth = viewDate.subtract(1, "month");
    const prevMonthDays = prevMonth.daysInMonth();

    const cells = [];

    // Padding from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      cells.push(
        <button
          key={`prev-${day}`}
          type="button"
          disabled
          className="w-9 h-9 text-xs text-gray-300 flex items-center justify-center cursor-not-allowed"
        >
          {day}
        </button>
      );
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected =
        selectedDate &&
        selectedDate.date() === day &&
        selectedDate.month() === viewDate.month() &&
        selectedDate.year() === viewDate.year();
      const isToday =
        dayjs().date() === day &&
        dayjs().month() === viewDate.month() &&
        dayjs().year() === viewDate.year();

      cells.push(
        <button
          key={`day-${day}`}
          type="button"
          onClick={() => selectDay(day)}
          className={`
            w-9 h-9 text-sm rounded-lg flex items-center justify-center transition-all duration-150
            ${
              isSelected
                ? "bg-[#003527] text-white font-semibold shadow-sm"
                : isToday
                ? "border border-[#003527] text-[#003527] font-semibold hover:bg-[#003527]/5"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          {day}
        </button>
      );
    }

    // Padding from next month
    const totalCells = cells.length;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
      cells.push(
        <button
          key={`next-${day}`}
          type="button"
          disabled
          className="w-9 h-9 text-xs text-gray-300 flex items-center justify-center cursor-not-allowed"
        >
          {day}
        </button>
      );
    }

    return cells;
  };

  const renderMonths = () => {
    return THAI_MONTHS_SHORT.map((month, idx) => {
      const isCurrentMonth = viewDate.month() === idx;
      return (
        <button
          key={month}
          type="button"
          onClick={() => selectMonth(idx)}
          className={`
            py-3 text-sm rounded-lg text-center transition-all duration-150 font-medium
            ${
              isCurrentMonth
                ? "bg-[#003527] text-white font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          {month}
        </button>
      );
    });
  };

  const renderYears = () => {
    const years = [];
    for (let i = 0; i < 12; i++) {
      const yearAD = yearRangeStart + i;
      const yearBE = yearAD + 543;
      const isCurrentYear = viewDate.year() === yearAD;

      years.push(
        <button
          key={yearAD}
          type="button"
          onClick={() => selectYear(yearAD)}
          className={`
            py-3 text-sm rounded-lg text-center transition-all duration-150 font-medium
            ${
              isCurrentYear
                ? "bg-[#003527] text-white font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          {yearBE}
        </button>
      );
    }
    return years;
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          readOnly
          required={required}
          disabled={disabled}
          className={`
            w-full py-2 pl-3 pr-10 bg-white border border-[#d1d5db] rounded-md
            text-[#111] text-base placeholder-[#999] cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-[#003527]/20 focus:border-[#003527]
            transition-all duration-200
            ${disabled ? "bg-gray-50 cursor-not-allowed opacity-60" : ""}
          `}
          placeholder={placeholder}
          value={getDisplayValue()}
          onClick={disabled ? undefined : toggleOpen}
        />
        <div
          onClick={disabled ? undefined : toggleOpen}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-[#777] transition-colors ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:text-gray-900"
          }`}
        >
          <CalendarIcon size={18} />
        </div>
      </div>

      {isOpen && (
        <div
          className={`
            absolute bg-white border border-gray-200 shadow-2xl rounded-xl p-4 w-[28rem] z-[150] 
            animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-3
            ${placement.positionY === "top" ? "bottom-full mb-1" : "top-full mt-1"}
            ${placement.positionX === "right" ? "right-0" : "left-0"}
          `}
        >
          <div className="flex gap-4">
            {/* Left side: Calendar */}
            <div className="w-72 flex flex-col">
              {/* Header navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex gap-1 text-sm font-bold text-gray-800">
                  {viewMode === "days" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setViewMode("months")}
                        className="px-1.5 py-0.5 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        {THAI_MONTHS[viewDate.month()]}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode("years");
                          setYearRangeStart(Math.floor(viewDate.year() / 10) * 10);
                        }}
                        className="px-1.5 py-0.5 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        {viewDate.year() + 543}
                      </button>
                    </>
                  )}

                  {viewMode === "months" && (
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("years");
                        setYearRangeStart(Math.floor(viewDate.year() / 10) * 10);
                      }}
                      className="px-2 py-0.5 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      {viewDate.year() + 543}
                    </button>
                  )}

                  {viewMode === "years" && (
                    <span className="px-2 py-0.5">
                      {yearRangeStart + 543} - {yearRangeStart + 11 + 543}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Days View */}
              {viewMode === "days" && (
                <>
                  <div className="grid grid-cols-7 gap-1 text-center mb-1 text-xs font-semibold text-gray-400">
                    {THAI_WEEKDAYS.map((day) => (
                      <div key={day} className="py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
                </>
              )}

              {/* Months View */}
              {viewMode === "months" && (
                <div className="grid grid-cols-3 gap-2 py-2">{renderMonths()}</div>
              )}

              {/* Years View */}
              {viewMode === "years" && (
                <div className="grid grid-cols-3 gap-2 py-2">{renderYears()}</div>
              )}
            </div>

            {/* Vertical Divider */}
            <div className="border-r border-gray-100" />

            {/* Right side: Time Picker */}
            <div className="flex-1 flex flex-col">
              <div className="grid grid-cols-2 text-center text-xs font-bold text-gray-400 border-b border-gray-100 pb-1 mb-1.5">
                <div>ชม.</div>
                <div>นาที</div>
              </div>

              {/* Time select columns */}
              <div className="grid grid-cols-2 gap-2 h-68">
                {/* Hours list */}
                <div
                  ref={hoursRef}
                  className="overflow-y-auto pr-1 flex flex-col gap-0.5 custom-scrollbar scroll-smooth"
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
                          py-1 text-center text-xs font-semibold rounded-md transition-all duration-100
                          ${
                            isActive
                              ? "bg-[#003527] text-white font-bold"
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
                  className="overflow-y-auto pr-1 flex flex-col gap-0.5 custom-scrollbar scroll-smooth"
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
                          py-1 text-center text-xs font-semibold rounded-md transition-all duration-100
                          ${
                            isActive
                              ? "bg-[#003527] text-white font-bold"
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
          </div>

          {/* Action buttons at the bottom */}
          <div className="border-t border-gray-100 pt-2 grid grid-cols-2 gap-2">
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

export default DateTimePicker;
