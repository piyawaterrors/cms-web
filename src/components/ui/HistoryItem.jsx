import React, { useState } from "react";
import dayjs from "dayjs";
import { ChevronUp, ChevronDown, Phone, MapPin, Mail } from "lucide-react";

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
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                log.actionType === "pre-booking"
                  ? "bg-green-50 text-green-700 border-green-100"
                  : "bg-blue-50 text-blue-700 border-blue-100"
              }`}
            >
              {log.actionType === "pre-booking" ? "การจองใหม่" : "แก้ไขข้อมูล"}
            </span>
            <span className="text-xs text-gray-600 uppercase font-medium">
              {dayjs(log.createdAt).format("DD/MM/YYYY HH:mm")}
            </span>
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
          <div className="pt-3 border-t border-gray-100 space-y-4">
            {log.snapshot && (
              <div className="space-y-4 pt-1">
                {log.snapshot.deceaseds?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">
                      รายชื่อผู้ล่วงลับ
                    </h4>
                    <div className="grid gap-2">
                      {log.snapshot.deceaseds.map((d, i) => (
                        <div
                          key={i}
                          className="p-4 bg-white rounded-md border border-gray-200"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-900">
                              {d.fullName}
                            </span>
                          </div>
                          <div className="flex gap-4 items-center mt-1">
                            <p className="text-sm text-gray-600 mt-1">
                              อายุ: {d.age || "N/A"} ปี
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              มรณบัตร: {d.deathCertificateNumber || "N/A"}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              ประเภทการบรรจุ:{" "}
                              {d.burialType === "coffin" ? "โลงศพ" : "อัฐิ"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {log.snapshot.members?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">
                      รายชื่อผู้ติดต่อ
                    </h4>
                    <div className="grid gap-2">
                      {log.snapshot.members.map((m, i) => (
                        <div
                          key={i}
                          className="p-4 bg-white rounded-md border border-gray-200"
                        >
                          <span className="text-sm font-bold text-gray-900">
                            {m.fullName}
                          </span>
                          <div className="flex items-start gap-4 mt-1 text-sm text-gray-600">
                            <div className="flex flex-col">
                              <span className="flex items-center gap-1">
                                <Phone size={14} className="text-gray-600" />
                                {m.phone || "N/A"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail size={14} className="text-gray-600" />
                                {m.email || "N/A"}
                              </span>
                            </div>
                            <span className="flex items-start gap-1 min-w-0">
                              <MapPin
                                size={14}
                                className="text-gray-600 shrink-0 mt-0.5"
                              />
                              <span className="whitespace-normal break-words">
                                {m.address || "N/A"}
                              </span>
                            </span>
                          </div>
                        </div>
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
