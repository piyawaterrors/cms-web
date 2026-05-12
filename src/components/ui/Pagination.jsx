import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./Button";

const Pagination = ({ 
  currentPage, 
  totalPages: propTotalPages, 
  pageSize,
  onPageChange, 
  totalCount, 
  showingCount,
  className = "" 
}) => {
  const totalPages = propTotalPages || Math.ceil(totalCount / (pageSize || 10));
  const currentShowing = showingCount || (currentPage === totalPages ? (totalCount % pageSize || pageSize) : pageSize);

  if (totalCount === 0) return null;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200 bg-white ${className}`}>
      {/* Items Summary */}
      <div className="flex items-center gap-2 text-sm text-[#555] order-2 sm:order-1">
        <span>แสดง</span>
        <span className="text-[#111] font-semibold">{currentShowing}</span>
        <span>จากทั้งหมด</span>
        <span className="text-[#111] font-semibold">{totalCount}</span>
        <span>รายการ</span>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-2 order-1 sm:order-2">
        {/* Previous Button */}
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={`h-9 w-9 flex items-center justify-center rounded-md border transition-all ${
            currentPage === 1
              ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
              : "border-gray-200 text-[#333] hover:border-[#003527] hover:bg-[#003527]/5 active:scale-95"
          }`}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5) {
              if (currentPage > 3) {
                pageNum = currentPage - 2 + i;
                if (pageNum + (4 - i) > totalPages)
                  pageNum = totalPages - (4 - i);
              }
            }
            if (pageNum <= 0 || pageNum > totalPages) return null;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`h-9 min-w-[36px] px-2 flex items-center justify-center rounded-md text-sm font-medium transition-all border ${
                  currentPage === pageNum
                    ? "bg-[#003527] border-[#003527] text-white"
                    : "bg-white border-gray-200 text-[#555] hover:border-[#003527] hover:text-[#003527]"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <div className="flex items-center">
              <span className="px-1 text-[#999]">...</span>
              <button
                onClick={() => onPageChange(totalPages)}
                className="h-9 min-w-[36px] px-2 flex items-center justify-center rounded-md text-sm font-medium bg-white border border-gray-200 text-[#555] hover:border-[#003527] hover:text-[#003527] transition-all"
              >
                {totalPages}
              </button>
            </div>
          )}
        </div>

        {/* Next Button */}
        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={`h-9 w-9 flex items-center justify-center rounded-md border transition-all ${
            currentPage >= totalPages
              ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
              : "border-gray-200 text-[#333] hover:border-[#003527] hover:bg-[#003527]/5 active:scale-95"
          }`}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
