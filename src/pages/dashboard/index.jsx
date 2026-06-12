import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  Users,
  UserCheck,
  Grid,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Get } from "@/services/https";
import Button from "@/components/ui/Button";

const donationTypeOptions = [
  { label: "ค่าบำรุงรักษา", value: "maintenance" },
  { label: "บริจาคทั่วไป", value: "general" },
  { label: "ทำบุญตามเทศกาล", value: "festival" },
  { label: "อื่นๆ", value: "other" },
];

const categories = [
  { key: "maintenance", color: "#003527", label: "ค่าบำรุงรักษา" },
  { key: "general", color: "#10b981", label: "บริจาคทั่วไป" },
  { key: "festival", color: "#f59e0b", label: "ทำบุญตามเทศกาล" },
  { key: "other", color: "#6b7280", label: "อื่นๆ" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [hoveredData, setHoveredData] = useState(null);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      const res = await Get("/dashboard");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003527]" />
        <p className="text-sm text-gray-500 font-medium">กำลังโหลดข้อมูลแดชบอร์ด...</p>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    deceasedCount: 0,
    deceasedCoffinCount: 0,
    deceasedAshesCount: 0,
    associationMemberCount: 0,
    generalContactCount: 0,
    totalPlotsCount: 0,
    plotStatusCounts: {
      available: 0,
      occupied: 0,
      reserved: 0,
      expired: 0,
      exempt: 0
    },
    nearExpiryCount: 0,
  };

  const nearExpiryList = dashboardData?.nearExpiryContracts || [];

  // Group chart data by year
  const chartDataGrouped = {};
  (dashboardData?.donationChart || []).forEach((item) => {
    if (!chartDataGrouped[item.year]) {
      chartDataGrouped[item.year] = {
        year: item.year,
        maintenance: 0,
        general: 0,
        festival: 0,
        other: 0,
        total: 0,
      };
    }
    chartDataGrouped[item.year][item.type] = item.amount;
    chartDataGrouped[item.year].total += item.amount;
  });

  const chartData = Object.values(chartDataGrouped).sort(
    (a, b) => a.year - b.year,
  );

  // SVG Chart layout settings
  const width = 600;
  const height = 300;
  const padding = { top: 25, right: 30, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxTotal = Math.max(...chartData.map((d) => d.total), 1000);
  const getX = (index) => {
    if (chartData.length <= 1) {
      return padding.left + chartWidth / 2;
    }
    return padding.left + index * (chartWidth / (chartData.length - 1));
  };
  const getY = (val) => {
    return padding.top + chartHeight - (val / maxTotal) * chartHeight;
  };

  return (
    <div className="p-6 mx-auto space-y-8 max-w-7xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ด</h1>
        <p className="text-base text-gray-500 mt-1">
          ภาพรวมข้อมูลสถิติ ทะเบียนสุสาน และสรุปยอดเงินบริจาคของระบบ
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: ข้อมูลหลุมทั้งหมด */}
        <div className="bg-white p-6 rounded-xl border border-[#eceeeb] shadow-sm flex items-center justify-between transition-all lg:col-span-2">
          <div className="space-y-3 w-full">
            <div>
              <p className="text-sm font-semibold text-gray-500">ข้อมูลหลุมทั้งหมด</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <p className="text-3xl font-extrabold text-[#003527]">
                  {stats.totalPlotsCount.toLocaleString()}
                </p>
                <span className="text-sm text-gray-500 font-medium">หลุม</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2b6954]" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ว่าง</p>
                  <p className="text-sm font-extrabold text-gray-900">{(stats.plotStatusCounts?.available || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">บรรจุแล้ว</p>
                  <p className="text-sm font-extrabold text-gray-900">{(stats.plotStatusCounts?.occupied || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">จองแล้ว</p>
                  <p className="text-sm font-extrabold text-gray-900">{(stats.plotStatusCounts?.reserved || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#71717a]" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">หมดสัญญา</p>
                  <p className="text-sm font-extrabold text-gray-900">{(stats.plotStatusCounts?.expired || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300 border border-gray-400" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ยกเว้น</p>
                  <p className="text-sm font-extrabold text-gray-900">{(stats.plotStatusCounts?.exempt || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-[#003527]/10 flex items-center justify-center text-[#003527] shrink-0 self-start">
            <Grid size={24} />
          </div>
        </div>

        {/* Metric 2: ข้อมูลสมาชิก */}
        <div className="bg-white p-6 rounded-xl border border-[#eceeeb] shadow-sm flex items-center justify-between transition-all lg:col-span-1">
          <div className="space-y-3 w-full">
            <div>
              <p className="text-sm font-semibold text-gray-500">ข้อมูลผู้ลงทะเบียน</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <p className="text-3xl font-extrabold text-gray-900">
                  {((stats.associationMemberCount || 0) + (stats.generalContactCount || 0)).toLocaleString()}
                </p>
                <span className="text-sm text-gray-500 font-medium">ราย</span>
              </div>
            </div>
            <div className="flex gap-4 pt-3 border-t border-gray-100">
              <div className="flex-1 col-span-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">สมาชิกสมาคม</p>
                <p className="text-base font-extrabold text-gray-900">{(stats.associationMemberCount || 0).toLocaleString()}</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="flex-1 col-span-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">บุคคลทั่วไป</p>
                <p className="text-base font-extrabold text-gray-900">{(stats.generalContactCount || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 self-start">
            <Users size={24} />
          </div>
        </div>
        {/* Metric 3: จำนวนผู้ล่วงลับ */}
        <div className="bg-white p-6 rounded-xl border border-[#eceeeb] shadow-sm flex items-center justify-between transition-all lg:col-span-1">
          <div className="space-y-3 w-full">
            <div>
              <p className="text-sm font-semibold text-gray-500">จำนวนผู้ล่วงลับ</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <p className="text-3xl font-extrabold text-[#92400e]">
                  {stats.deceasedCount.toLocaleString()}
                </p>
                <span className="text-sm text-gray-500 font-medium">ราย</span>
              </div>
            </div>
            <div className="flex gap-4 pt-3 border-t border-gray-100">
              <div className="flex-1 col-span-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">โลงศพ</p>
                <p className="text-base font-extrabold text-gray-900">{(stats.deceasedCoffinCount || 0).toLocaleString()}</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="flex-1 col-span-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">อัฐิ</p>
                <p className="text-base font-extrabold text-gray-900">{(stats.deceasedAshesCount || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 self-start">
            <span className="text-xl font-bold">☠</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Notifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Annual Donations Chart */}
        <div className="lg:col-span-7">
          <div className="relative bg-white p-6 rounded-xl border border-[#eceeeb] shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">สถิติยอดเงินบริจาคประจำปี</h3>
                <p className="text-xs text-gray-500">ยอดเงินบริจาครวมแต่ละปี แยกตามประเภท</p>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm min-h-[250px]">
                ไม่มีข้อมูลเงินบริจาค
              </div>
            ) : (
              <div className="relative flex-1 flex flex-col justify-between relative-chart-container">
                {/* Responsive Container */}
                <div className="w-full overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto min-w-[500px]"
                  >
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                      const y = padding.top + chartHeight * (1 - ratio);
                      const val = Math.round(maxTotal * ratio);
                      return (
                        <g key={i} className="opacity-40">
                          <line
                            x1={padding.left}
                            y1={y}
                            x2={width - padding.right}
                            y2={y}
                            stroke="#e2e8f0"
                            strokeDasharray="4 4"
                            strokeWidth={1}
                          />
                          <text
                            x={padding.left - 10}
                            y={y + 4}
                            textAnchor="end"
                            className="text-[10px] fill-gray-400 font-medium font-sans"
                          >
                            {val >= 1000000
                              ? `${(val / 1000000).toFixed(1)}M`
                              : val >= 1000
                                ? `${(val / 1000).toFixed(0)}k`
                                : val}
                          </text>
                        </g>
                      );
                    })}

                    {/* Trend Lines for Categories */}
                    {categories.map((cat) => {
                      const points = chartData.map((item, index) => ({
                        x: getX(index),
                        y: getY(item[cat.key] || 0),
                      }));

                      const pathD = points
                        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                        .join(" ");

                      return (
                        <g key={cat.key}>
                          {chartData.length > 1 && (
                            <path
                              d={pathD}
                              fill="none"
                              stroke={cat.color}
                              strokeWidth={3}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="transition-all duration-300"
                            />
                          )}
                        </g>
                      );
                    })}

                    {/* Interactive points & hover guidelines */}
                    {chartData.map((item, index) => {
                      const x = getX(index);
                      const isHovered = hoveredData?.year === item.year;

                      return (
                        <g key={item.year}>
                          {/* Guideline */}
                          <line
                            x1={x}
                            y1={padding.top}
                            x2={x}
                            y2={padding.top + chartHeight}
                            stroke="#cbd5e1"
                            strokeWidth={1}
                            strokeDasharray="2 2"
                            className={`transition-opacity duration-150 ${isHovered ? "opacity-100" : "opacity-0"}`}
                          />

                          {/* Year Label */}
                          <text
                            x={x}
                            y={height - padding.bottom + 20}
                            textAnchor="middle"
                            className={`text-[11px] font-semibold transition-colors duration-150 ${isHovered ? "fill-[#003527] font-bold" : "fill-gray-500"}`}
                          >
                            {item.year + 543}
                          </text>

                          {/* Dots for each category on this year */}
                          {categories.map((cat) => {
                            const val = item[cat.key] || 0;
                            const y = getY(val);

                            return (
                              <circle
                                key={cat.key}
                                cx={x}
                                cy={y}
                                r={isHovered ? 6 : 4}
                                fill={cat.color}
                                stroke="#ffffff"
                                strokeWidth={2}
                                className="transition-all duration-150"
                              />
                            );
                          })}
                        </g>
                      );
                    })}

                    {/* Transparent hover areas */}
                    {chartData.map((item, index) => {
                      const x = getX(index);
                      const hoverWidth =
                        chartData.length <= 1
                          ? chartWidth
                          : chartWidth / (chartData.length - 1);
                      const hoverX = x - hoverWidth / 2;

                      return (
                        <rect
                          key={`hover-${item.year}`}
                          x={hoverX}
                          y={padding.top}
                          width={hoverWidth}
                          height={chartHeight}
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={(e) => {
                            const parent = e.currentTarget.closest(".relative-chart-container");
                            const parentRect = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };
                            setHoveredData({
                              ...item,
                              x: e.clientX - parentRect.left,
                              y: e.clientY - parentRect.top - 15,
                            });
                          }}
                          onMouseMove={(e) => {
                            const parent = e.currentTarget.closest(".relative-chart-container");
                            const parentRect = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };
                            setHoveredData({
                              ...item,
                              x: e.clientX - parentRect.left,
                              y: e.clientY - parentRect.top - 15,
                            });
                          }}
                          onMouseLeave={() => setHoveredData(null)}
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 justify-center border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                    <span className="w-3 h-3 rounded bg-[#003527]" />
                    <span>ค่าบำรุงรักษา</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                    <span className="w-3 h-3 rounded bg-[#10b981]" />
                    <span>บริจาคทั่วไป</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                    <span className="w-3 h-3 rounded bg-[#f59e0b]" />
                    <span>ทำบุญตามเทศกาล</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                    <span className="w-3 h-3 rounded bg-[#6b7280]" />
                    <span>อื่นๆ</span>
                  </div>
                </div>

                {/* Tooltip Card */}
                {hoveredData && hoveredData.x !== undefined && (
                  <div
                    style={{
                      left: `${hoveredData.x}px`,
                      top: `${hoveredData.y}px`,
                      transform: "translate(-50%, -105%)",
                    }}
                    className="absolute bg-white/95 backdrop-blur-md p-4 rounded-lg shadow-xl border border-gray-100 min-w-[180px] z-10 text-xs space-y-2 pointer-events-none animate-in fade-in zoom-in-95 duration-100"
                  >
                    <p className="font-bold text-[#003527] border-b border-gray-100 pb-1.5 text-sm">
                      ยอดบริจาคปี {hoveredData.year + 543}
                    </p>
                    <div className="space-y-1 text-gray-600 font-medium">
                      <div className="flex justify-between gap-4">
                        <span>ค่าบำรุงรักษา:</span>
                        <span className="font-bold text-gray-900">
                          ฿{(hoveredData.maintenance || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>บริจาคทั่วไป:</span>
                        <span className="font-bold text-gray-900">
                          ฿{(hoveredData.general || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>ทำบุญตามเทศกาล:</span>
                        <span className="font-bold text-gray-900">
                          ฿{(hoveredData.festival || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>อื่นๆ:</span>
                        <span className="font-bold text-gray-900">
                          ฿{(hoveredData.other || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between border-t border-gray-100 pt-1.5 font-bold text-sm text-[#003527]">
                      <span>ยอดรวมทั้งหมด:</span>
                      <span>฿{(hoveredData.total || 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Expiry Alerts */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-xl border border-[#eceeeb] shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  สัญญาใกล้หมดอายุ (ภายใน 6 เดือน)
                </h3>
                <p className="text-xs text-gray-500">
                  รายชื่อหลุมที่ใกล้หมดสัญญาทำไว้กับสมาคม
                </p>
              </div>
              <div className="flex items-center gap-1 bg-rose-50 text-rose-600 px-2.5 py-1 rounded text-xs font-semibold">
                <AlertTriangle size={14} />
                <span>{nearExpiryList.length} รายการ</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[350px] pr-1">
              {nearExpiryList.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm py-12">
                  ไม่มีสัญญากำลังจะหมดอายุภายใน 6 เดือนนี้
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {nearExpiryList.map((contract) => (
                    <div
                      key={contract.id}
                      className="py-3.5 flex justify-between items-center hover:bg-gray-50/50 px-2 rounded-lg transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            หลุม {contract.plot?.plotNumber || "N/A"}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full font-medium">
                            เหลือ {dayjs(contract.endDate).diff(dayjs(), "day")}{" "}
                            วัน
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-0.5 font-sans">
                          <p>ผู้ติดต่อ: {contract.member?.fullName || "N/A"}</p>
                          <p>เบอร์โทร: {contract.member?.phone || "-"}</p>
                          <p className="font-medium text-rose-600 font-sans">
                            หมดสัญญา:{" "}
                            {dayjs(contract.endDate)
                              .add(543, "year")
                              .format("DD/MM/YYYY")}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/plots/detail/${contract.plot?.id}`)}
                        className="p-2 bg-gray-50 text-gray-600 rounded-full hover:bg-[#003527] hover:text-white transition-all shadow-sm flex items-center justify-center cursor-pointer"
                        title="ดูรายละเอียดหลุม"
                      >
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
