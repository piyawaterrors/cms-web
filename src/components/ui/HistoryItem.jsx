import React, { useState } from "react";
import dayjs from "dayjs";
import { ChevronUp, ChevronDown, Phone, MapPin, Mail } from "lucide-react";

const getActionTypeLabel = (actionType) => {
  switch (actionType) {
    case "pre-booking":
    case "booking":
      return "การจองใหม่";
    case "update":
      return "แก้ไขข้อมูล";
    case "renewal":
      return "ต่ออายุสัญญา";
    case "payment":
      return "ชำระเงิน";
    case "payment_update":
      return "แก้ไขการชำระเงิน";
    case "payment_delete":
      return "ลบการชำระเงิน";
    case "relocation_out":
      return "ย้ายออก";
    case "relocation_in":
      return "รับย้ายเข้า";
    default:
      return "บันทึกประวัติ";
  }
};

const getActionTypeStyle = (actionType) => {
  switch (actionType) {
    case "pre-booking":
    case "booking":
      return "bg-green-50 text-green-700 border-green-100";
    case "update":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "renewal":
      return "bg-purple-50 text-purple-700 border-purple-100";
    case "payment":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "payment_update":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "payment_delete":
      return "bg-rose-50 text-rose-700 border-rose-100";
    case "relocation_out":
      return "bg-indigo-50 text-indigo-700 border-indigo-100";
    case "relocation_in":
      return "bg-teal-50 text-teal-700 border-teal-100";
    default:
      return "bg-gray-50 text-gray-700 border-gray-100";
  }
};

const HistoryItem = ({ log }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`bg-white rounded-md border border-gray-200 overflow-hidden transition-all hover:ring-1 hover:ring-[#003527]/20 ${
        isExpanded ? "ring-1 ring-[#003527]/20" : ""
      }`}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-start gap-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center gap-2 flex-wrap mb-2">
            <div>
              <span
                className={`px-2 py-0.5 rounded text-sm font-bold uppercase border ${getActionTypeStyle(log.actionType)}`}
              >
                {getActionTypeLabel(log.actionType)}
              </span>
              <span className="text-sm text-gray-600 uppercase font-medium">
                {dayjs(log.createdAt).add(543, "year").format("DD/MM/YYYY HH:mm")}
              </span>
            </div>
            {log.createdByName && (
              <span className="text-xs text-gray-600 font-medium ">
                โดย: {log.createdByName}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-[#003527] pl-3">
            {log.notes}
          </p>
        </div>
        <div className="shrink-0 pt-1">
          {isExpanded ? (
            <ChevronUp size={16} className="text-[#999]" />
          ) : (
            <ChevronDown size={16} className="text-[#999]" />
          )}
        </div>
      </div>
      {isExpanded && (
        <div className="px-4 pb-4 transition-all duration-200">
          <div className="pt-3 border-t border-gray-200 space-y-4">
            {log.contract?.contractNumber && (
              <div className="p-3 bg-gray-50 rounded-md border border-gray-200 flex justify-between items-center text-sm text-gray-700">
                <div>
                  <span className="font-bold text-gray-900">
                    หมายเลขสัญญา: {log.contract.contractNumber}
                  </span>
                </div>
              </div>
            )}
            {log.snapshot && (
              <div className="space-y-4 pt-1">
                {log.snapshot.deceaseds?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                      รายชื่อผู้ล่วงลับ
                    </h4>
                    <div className="grid gap-2">
                      {log.snapshot.deceaseds.map((o, i) => (
                        <div
                          key={i}
                          className="p-4 bg-white rounded-md border border-gray-200"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-base font-bold text-gray-900">
                              {o.fullName}
                            </p>
                            {/* <button
                              onClick={() => onRelocate(o, plot)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[#eceeeb] text-xs font-bold text-[#003527] hover:bg-[#003527]/5 transition-all uppercase tracking-wider"
                            >
                              <Repeat size={14} />
                              ย้ายหลุม
                            </button> */}
                          </div>
                          <div className="flex items-start gap-4 mt-1.5 text-base text-gray-600">
                            <div className="flex flex-col items-start text-gray-600 gap-1.5">
                              <p className="text-base text-gray-600">
                                อายุ: {o.age || "N/A"} ปี
                              </p>
                              <span className="flex items-center gap-1">
                                มรณบัตร:{" "}
                                <a
                                  href={o.deathCertificateImage}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center hover:underline cursor-pointer"
                                >
                                  {o.deathCertificateNumber || "N/A"}
                                </a>
                              </span>
                            </div>
                            <div className="flex flex-col items-start text-gray-600 gap-1.5">
                              <p className="text-base text-gray-600">
                                บรรจุเมื่อ:{" "}
                                {o.burialDate
                                  ? dayjs(o.burialDate).add(543, "year").format(
                                      "DD/MM/YYYY HH:mm",
                                    )
                                  : "N/A"}
                              </p>
                              <p className="text-base text-gray-600">
                                ประเภทการบรรจุ:{" "}
                                {o.burialType === "coffin" ? "โลงศพ" : "อัฐิ"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {log.snapshot.members?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                      รายชื่อผู้ติดต่อ
                    </h4>
                    <div className="grid gap-2">
                      {log.snapshot.members.map((m, i) => (
                        <div
                          key={i}
                          className="p-4 bg-white rounded-md border border-gray-200"
                        >
                          <span className="text-base font-bold text-gray-900">
                            {m.fullName}
                          </span>
                          <div className="flex items-start gap-4 mt-1.5 text-base text-gray-600">
                            <div className="flex flex-col items-start text-gray-600">
                              <span className="flex items-center gap-1.5">
                                <Phone size={15} className="text-gray-600" />
                                {m.phone || "N/A"}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Mail size={14} className="text-gray-600" />
                                {m.email || "N/A"}
                              </span>
                            </div>
                            <span className="flex items-start gap-1.5 min-w-0">
                              <MapPin
                                size={15}
                                className="text-gray-600 shrink-0 mt-1"
                              />
                              <span className="whitespace-normal break-words">
                                {m.address || "N/A"}
                              </span>
                            </span>
                          </div>
                        </div>
                        // <div
                        //   key={i}
                        //   className="p-4 bg-white rounded-md border border-gray-200"
                        // >
                        //   <span className="text-sm font-bold text-gray-900">
                        //     {m.fullName}
                        //   </span>
                        //   <div className="flex items-start gap-4 mt-1 text-sm text-gray-600">
                        //     <div className="flex flex-col">
                        //       <span className="flex items-center gap-1">
                        //         <Phone size={14} className="text-gray-600" />
                        //         {m.phone || "N/A"}
                        //       </span>
                        //       <span className="flex items-center gap-1">
                        //         <Mail size={14} className="text-gray-600" />
                        //         {m.email || "N/A"}
                        //       </span>
                        //     </div>
                        //     <span className="flex items-start gap-1 min-w-0">
                        //       <MapPin
                        //         size={14}
                        //         className="text-gray-600 shrink-0 mt-0.5"
                        //       />
                        //       <span className="whitespace-normal break-words">
                        //         {m.address || "N/A"}
                        //       </span>
                        //     </span>
                        //   </div>
                        // </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryItem;
