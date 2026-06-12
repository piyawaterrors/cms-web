import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Download, Loader2 } from "lucide-react";
import { buildReceiptHtml, generatePdf } from "@/services/print-service";
import dayjs from "dayjs";

/**
 * PrintDialog
 * Props:
 *  - donation  : donation/payment object
 *  - society   : society settings object
 *  - plotNumber: (optional) เลขหลุม — ถ้ามีจะใช้ใน filename แทน donorName
 *  - onClose   : function to close the dialog
 */
export const PrintDialog = ({ donation, society, plotNumber, onClose }) => {
  const [size, setSize] = useState("A4");
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef(null);

  const SIZE_MM = {
    A4: { width: 210, height: 297, css: "210mm", heightCss: "297mm" },
    A5: { width: 148, height: 210, css: "148mm", heightCss: "210mm" },
  };

  // Rebuild HTML whenever donation / society / size / plotNumber changes
  const getHtml = useCallback(
    () => buildReceiptHtml({ ...donation, plotNumber }, society, SIZE_MM[size].css, size),
    [donation, society, size, plotNumber],
  );

  // Push new HTML into iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.srcdoc = getHtml();
  }, [getHtml]);

  // Build filename -----------------------------------------------
  const buildFileName = () => {
    const date = dayjs(donation.donationDate || donation.paymentDate)
      .add(543, "year")
      .format("DDMMYYYY");

    if (plotNumber) {
      // Plot payment: ใช้เลขหลุม + ประเภท + วันที่
      const typeLabel =
        donation.type === "booking"
          ? "จองหลุม"
          : donation.type === "renewal"
            ? "ต่ออายุ"
            : donation.type === "penalty"
              ? "คาปรับ"
              : "บำรุงรายปี";
      return `หลุม${plotNumber}_${typeLabel}_${date}.pdf`;
    } else {
      // Donation: ใช้ชื่อผู้บริจาค + ประเภท + วันที่
      const safeName = (donation.donorName || "บริจาค").replace(/\s+/g, "_");
      const typeLabel =
        donation.type === "maintenance"
          ? "บำรุงรายปี"
          : donation.type === "penalty"
            ? "คาปรับ"
            : donation.type === "booking"
              ? "จองหลุม"
              : donation.type || "อื่นๆ";
      return `${safeName}_${typeLabel}_${date}.pdf`;
    }
  };

  // Download -------------------------------------------------------
  const handleDownload = async () => {
    setLoading(true);
    try {
      const iframe = iframeRef.current;
      const dimensions = SIZE_MM[size];
      const filename = buildFileName();
      await generatePdf(iframe, dimensions, filename);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 flex items-start justify-center backdrop-blur-sm z-50 pt-8 pb-8"
      // onClick={handleBackdrop}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full flex flex-col"
        style={{ maxWidth: "880px", maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ───────────────────────────────────── */}
        <div className="p-6 border-b rounded-t-xl border-gray-100 flex justify-between items-center bg-[#003527] text-white">
          <div>
            <h2 className="text-lg font-bold">พิมพ์ใบเสร็จ</h2>
          </div>
          <button
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {/* <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">พิมพ์ใบเสร็จ</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div> */}

        {/* ── Size selector ────────────────────────────── */}
        <div className="flex items-center gap-6 px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <span className="text-sm font-semibold text-gray-600">
            ขนาดกระดาษ:
          </span>
          {Object.entries(SIZE_MM).map(([key, val]) => (
            <label
              key={key}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <input
                type="radio"
                name="printSize"
                value={key}
                checked={size === key}
                onChange={() => setSize(key)}
                className="accent-[#003527]"
              />
              <span className="font-medium text-gray-800">{key}</span>
              <span className="text-gray-400 text-xs">
                {val.width} × {val.height} mm
              </span>
            </label>
          ))}
        </div>

        {/* ── Preview (scrollable) ─────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-gray-100 min-h-0 flex justify-center py-4 px-4">
          <iframe
            ref={iframeRef}
            title="receipt-preview"
            style={{
              width: SIZE_MM[size].css,
              height: SIZE_MM[size].heightCss,
              border: "none",
              background: "#fff",
              boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
              borderRadius: "4px",
              display: "block",
            }}
          />
        </div>

        {/* ── Actions ──────────────────────────────────── */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm rounded-md bg-[#003527] text-white hover:bg-[#004d38] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
            {loading ? "กำลังสร้าง PDF..." : "ดาวน์โหลด PDF"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default PrintDialog;
