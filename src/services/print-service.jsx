import React from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import dayjs from "dayjs";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toJpeg } from "html-to-image";

// Helper สำหรับแปลงเลขเป็นคำอ่านภาษาไทย
const toThaiBaht = (number) => {
  if (number === 0) return "ศูนย์บาทถ้วน";
  const numStr = number.toFixed(2).split(".");
  const baht = numStr[0];
  const satang = numStr[1];

  const thaiNums = [
    "ศูนย์",
    "หนึ่ง",
    "สอง",
    "สาม",
    "สี่",
    "ห้า",
    "หก",
    "เจ็ด",
    "แปด",
    "เก้า",
  ];
  const thaiUnits = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

  const convert = (str) => {
    let res = "";
    for (let i = 0; i < str.length; i++) {
      const n = parseInt(str[i]);
      const pos = str.length - i - 1;
      if (n !== 0) {
        if (pos === 1 && n === 1) res += "";
        else if (pos === 1 && n === 2) res += "ยี่";
        else if (pos === 0 && n === 1 && str.length > 1) res += "เอ็ด";
        else res += thaiNums[n];
        res += thaiUnits[pos];
      }
    }
    return res;
  };

  let text = convert(baht) + "บาท";
  if (parseInt(satang) === 0) text += "ถ้วน";
  else text += convert(satang) + "สตางค์";
  return text;
};

// Component สำหรับหน้าตาใบเสร็จ
export const ReceiptTemplate = ({ donation, society }) => {
  const formatAmount = (val) => {
    return Number(val).toLocaleString(undefined, {
      minimumFractionDigits: 2,
    });
  };

  const getDonationTypeLabel = (type) => {
    switch (type) {
      case "penalty":
        return "ค่าปรับสัญญา (Contract Penalty)";
      case "general":
        return "บริจาคทั่วไป (General Donation)";
      case "festival":
        return "ทำบุญตามเทศกาล (Festival Donation)";
      case "other":
        return "อื่นๆ (Other)";
      default:
        return type || "";
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        color: "#000",
        lineHeight: "1.4",
        fontFamily: "'Sarabun', sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
        @media print {
          body { padding: 0; margin: 0; }
          .no-print { display: none; }
        }
      `}</style>

      {/* Header Info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "15px",
        }}
      >
        {/* Left Side: Address Info */}
        <div style={{ width: "58%" }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          >
            {society?.name || "สมาคมสุสานพัทยา"} Pattaya Cemetery Association
          </div>
          <div style={{ fontSize: "12px", color: "#222", lineHeight: "1.4" }}>
            {society?.address ||
              "10/89 หมู่ที่ 9 ถ.สุขุมวิท ต.หนองปรือ อ.บางละมุง จ.ชลบุรี 20150"}
          </div>
          <div style={{ fontSize: "12px", color: "#222", lineHeight: "1.4" }}>
            {society?.addressEn ||
              "10/89 Moo 9 Sukhumvit Road, Nongprue, Banglamung, Chonburi 20150"}
          </div>
          <div style={{ fontSize: "12px", color: "#222", marginTop: "4px" }}>
            โทร. (Tel.) {society?.phone || "096-658-8812"}
          </div>
          <div style={{ fontSize: "12px", color: "#222" }}>
            Email: {society?.email || "pattayacemetery@gmail.com"}
          </div>
        </div>

        {/* Right Side: Reg & Tax Info */}
        <div style={{ width: "38%", fontSize: "12px", lineHeight: "1.5" }}>
          <div>
            <strong>เลขที่ (No.):</strong>{" "}
            {donation.receiptNo
              ? donation.receiptNo.toString().padStart(6, "0")
              : `DN-${donation.id.toString().substring(0, 8)}`}
          </div>
          <div style={{ marginTop: "4px" }}>
            <strong>ทะเบียนสมาคมเลขที่</strong>{" "}
            {society?.registrationNo || "จ.930"}
          </div>
          <div style={{ fontSize: "11px", color: "#444" }}>
            (Register No. {society?.registrationNo || "Jor. 930"})
          </div>
          <div style={{ marginTop: "4px" }}>
            <strong>เลขประจำตัวผู้เสียภาษี:</strong>{" "}
            {society?.taxId || "0993000163478"}
          </div>
          <div style={{ fontSize: "11px", color: "#444" }}>
            (Tax ID.: {society?.taxId || "0993000163478"})
          </div>
        </div>
      </div>

      {/* Receipt Title Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          margin: "15px 0 25px 0",
          borderTop: "1px solid #111",
          paddingTop: "15px",
        }}
      >
        <div style={{ width: "25%" }}></div>
        <div style={{ width: "50%", textAlign: "center" }}>
          <div style={{ fontSize: "20px", fontWeight: "bold" }}>
            ใบเสร็จรับเงิน
          </div>
          <div
            style={{ fontSize: "18px", fontWeight: "bold", marginTop: "-4px" }}
          >
            RECEIPT
          </div>
          <div
            style={{
              fontSize: "12px",
              fontStyle: "italic",
              color: "#333",
              marginTop: "2px",
            }}
          >
            ต้นฉบับ/Original
          </div>
        </div>
        <div style={{ width: "25%", display: "flex", justifyContent: "flex-end", alignItems: "flex-end", fontSize: "13px" }}>
          <span style={{ flexShrink: 0, marginRight: "5px", paddingBottom: "2px" }}>วันที่ (Date)</span>
          <div
            style={{
              borderBottom: "1px solid #111",
              minWidth: "120px",
              textAlign: "center",
              fontWeight: "bold",
              paddingBottom: "2px",
            }}
          >
            {dayjs(donation.donationDate).add(543, "year").format("DD/MM/YYYY")}
          </div>
        </div>
      </div>

      {/* Received From Section */}
      <div
        style={{
          margin: "25px 0",
          fontSize: "14px",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <span style={{ flexShrink: 0, marginRight: "5px", paddingBottom: "2px" }}>
          ได้รับเงินจาก (Received from):
        </span>
        <div
          style={{
            flexGrow: 1,
            borderBottom: "1px dotted #111",
            paddingLeft: "10px",
            fontWeight: "bold",
            fontSize: "15px",
            paddingBottom: "2px",
          }}
        >
          {donation.donorName}
        </div>
      </div>

      {/* Description Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
          marginTop: "20px",
          border: "1px solid #111",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#fcfdfc" }}>
            <th
              style={{
                border: "1px solid #111",
                padding: "8px 10px",
                width: "8%",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              ลำดับ
              <br />
              No.
            </th>
            <th
              style={{
                border: "1px solid #111",
                padding: "8px 10px",
                width: "72%",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              รายการ
              <br />
              Description
            </th>
            <th
              style={{
                border: "1px solid #111",
                padding: "8px 10px",
                width: "20%",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              จำนวนเงิน
              <br />
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Active Row: Display only the printed item */}
          <tr>
            <td
              style={{
                border: "1px solid #111",
                padding: "8px 10px",
                textAlign: "center",
              }}
            >
              1
            </td>
            <td style={{ border: "1px solid #111", padding: "8px 10px" }}>
              {donation.type === "maintenance" && (
                <>
                  เงินบริจาค: ค่าบำรุงรายปี ปี {donation.donationYear + 543}{" "}
                  หลุม / ช่องอัฐิ {donation.plotNumber ? `หมายเลข ${donation.plotNumber}` : ""} (Annual Fee for year {donation.donationYear} -
                  Plot / Niche {donation.plotNumber ? `No. ${donation.plotNumber}` : ""}) {donation.notes || ""}
                </>
              )}
              {donation.type === "renewal" && (
                <>
                  เงินบริจาค: ค่าต่ออายุหลุม / ช่องอัฐิ {donation.plotNumber ? `หมายเลข ${donation.plotNumber}` : ""} ________ ปี (Renewal Fee
                  ________ year(s) - Plot / Niche {donation.plotNumber ? `No. ${donation.plotNumber}` : ""}) {donation.notes || ""}
                </>
              )}
              {donation.type === "booking" && (
                <>
                  เงินบริจาค: ค่าจองหลุม / ช่องอัฐิ {donation.plotNumber ? `หมายเลข ${donation.plotNumber}` : ""} (Reservation Fee - Plot /
                  Niche {donation.plotNumber ? `No. ${donation.plotNumber}` : ""}) {donation.notes || ""}
                </>
              )}
              {donation.type === "penalty" && (
                <>
                  เงินบริจาค: ค่าปรับสัญญา {donation.plotNumber ? `หลุมหมายเลข ${donation.plotNumber}` : ""} (Contract Penalty {donation.plotNumber ? `for Plot No. ${donation.plotNumber}` : ""}){" "}
                  {donation.notes || ""}
                </>
              )}
              {donation.type !== "maintenance" &&
                donation.type !== "renewal" &&
                donation.type !== "booking" &&
                donation.type !== "penalty" && (
                  <>
                    อื่น ๆ (Other): {getDonationTypeLabel(donation.type)} {donation.plotNumber ? `หมายเลข ${donation.plotNumber}` : ""}
                  </>
                )}
            </td>
            <td
              style={{
                border: "1px solid #111",
                padding: "8px 10px",
                textAlign: "right",
                fontWeight: "bold",
              }}
            >
              {formatAmount(donation.amount)}
            </td>
          </tr>

          {/* Spacer Row 1 */}
          <tr>
            <td
              style={{
                border: "1px solid #111",
                padding: "8px 10px",
                height: "30px",
                textAlign: "center",
              }}
            ></td>
            <td style={{ border: "1px solid #111", padding: "8px 10px" }}></td>
            <td style={{ border: "1px solid #111", padding: "8px 10px" }}></td>
          </tr>

          {/* Spacer Row 2 */}
          <tr>
            <td
              style={{
                border: "1px solid #111",
                padding: "8px 10px",
                height: "30px",
                textAlign: "center",
              }}
            ></td>
            <td style={{ border: "1px solid #111", padding: "8px 10px" }}></td>
            <td style={{ border: "1px solid #111", padding: "8px 10px" }}></td>
          </tr>

          {/* Total Row */}
          <tr style={{ fontWeight: "bold" }}>
            <td
              colSpan="2"
              style={{
                border: "1px solid #111",
                padding: "8px 10px",
                textAlign: "right",
              }}
            >
              <span
                style={{
                  float: "left",
                  fontWeight: "normal",
                  fontSize: "12px",
                  color: "#333",
                  fontStyle: "italic",
                }}
              >
                ( {toThaiBaht(Number(donation.amount))} )
              </span>
              รวมเป็นเงิน/Total
            </td>
            <td
              style={{
                border: "1px solid #111",
                padding: "8px 10px",
                textAlign: "right",
                fontSize: "14px",
              }}
            >
              {formatAmount(donation.amount)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Payment Method Section */}
      <div
        style={{
          margin: "25px 0",
          fontSize: "13px",
          display: "flex",
          gap: "35px",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: "bold" }}>ชำระโดย (Paid by):</span>
        <span
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <span
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              border: "1px solid #111",
              textAlign: "center",
              lineHeight: "12px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {donation.paymentMethod === "cash" ? "✓" : ""}
          </span>
          เงินสด (Cash)
        </span>
        <span
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <span
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              border: "1px solid #111",
              textAlign: "center",
              lineHeight: "12px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {donation.paymentMethod === "transfer" ? "✓" : ""}
          </span>
          โอนผ่านธนาคาร (Bank Transfer)
        </span>
        <span
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <span
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              border: "1px solid #111",
              textAlign: "center",
              lineHeight: "12px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {donation.paymentMethod !== "cash" &&
            donation.paymentMethod !== "transfer"
              ? "✓"
              : ""}
          </span>
          อื่น ๆ (Other){" "}
          {donation.paymentMethod !== "cash" &&
          donation.paymentMethod !== "transfer"
            ? `(${donation.paymentMethod})`
            : "______________"}
        </span>
      </div>

      {/* Signature Section */}
      <div
        style={{
          marginTop: "40px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div style={{ textAlign: "center", width: "260px" }}>
          <div
            style={{
              borderBottom: "1px solid #111",
              width: "100%",
              height: "25px",
              marginBottom: "5px",
            }}
          ></div>
          <div style={{ fontSize: "13px", fontWeight: "bold" }}>
            ({" "}
            {society?.payee ||
              society?.president ||
              "...................................................."}{" "}
            )
          </div>
          <div style={{ fontSize: "12px", color: "#444", marginTop: "2px" }}>
            ผู้รับเงิน (Receiver)
          </div>
        </div>
      </div>
    </div>
  );
};

export const PrintService = {
  printDonationReceipt: (donation, society) => {
    // 1. สร้าง Iframe ซ่อนไว้ในหน้าปัจจุบัน
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.id = "print-iframe";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;

    // 2. เตรียมเอกสารภายใน Iframe
    iframeDoc.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>body { margin: 0; }</style>
        </head>
        <body>
          <div id="print-root"></div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // 3. Render React Component ลงใน Iframe
    const container = iframeDoc.getElementById("print-root");
    const root = createRoot(container);
    root.render(<ReceiptTemplate donation={donation} society={society} />);

    // 4. สั่งพิมพ์และลบ Iframe ออกเมื่อเสร็จ
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // ลบ Iframe ทิ้งหลังจากพิมพ์ (ใช้เวลาเผื่อเล็กน้อย)
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  },
};

// Build a full HTML string from the ReceiptTemplate for iframe / PDF use
export const buildReceiptHtml = (donation, society, pageWidth = "210mm", size = "A4") => {
  const bodyHtml = renderToStaticMarkup(
    <ReceiptTemplate donation={donation} society={society} />
  );

  // A5: body = paper width (148mm), content-wrapper renders at A4 width (210mm)
  // then scale visually to 148mm so nothing is clipped
  const isA5 = size === "A5";
  const scale = isA5 ? (148 / 210).toFixed(4) : "1";
  const wrapperStyle = isA5
    ? `width: 210mm; transform: scale(${scale}); transform-origin: top left;`
    : "";
  const bodyWidth = isA5 ? "148mm" : pageWidth;

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; overflow-x: hidden; }
    body { font-family: 'Sarabun', sans-serif; width: ${bodyWidth}; }
    #content-wrapper { ${wrapperStyle} }
  </style>
</head>
<body>
  <div id="content-wrapper">
    ${bodyHtml}
  </div>
</body>
</html>`;
};

export const generatePdf = async (iframe, dimensions, filename) => {
  if (!iframe) return;
  const { width, height } = dimensions;

  const iframeWindow = iframe.contentWindow;
  const iframeDoc = iframeWindow.document;
  const contentWrapper = iframeDoc.getElementById("content-wrapper");

  if (!contentWrapper) {
    console.error("Could not find content-wrapper element in iframe");
    return;
  }

  // 1. Wait for iframe fonts to be completely ready
  try {
    if (iframeDoc.fonts && iframeDoc.fonts.ready) {
      await iframeDoc.fonts.ready;
    }
  } catch (err) {
    console.warn("Error waiting for iframe fonts ready:", err);
  }

  // Wait a small extra buffer to ensure layout settles
  await new Promise((r) => setTimeout(r, 100));

  // 2. Save original styling states so we can restore them later
  const origIframeWidth = iframe.style.width;
  const origIframeHeight = iframe.style.height;

  const origBodyWidth = iframeDoc.body.style.width;
  const origBodyOverflow = iframeDoc.body.style.overflow;
  const origBodyMargin = iframeDoc.body.style.margin;

  const origWrapperTransform = contentWrapper.style.transform;
  const origWrapperWidth = contentWrapper.style.width;
  const origWrapperTransformOrigin = contentWrapper.style.transformOrigin;

  // 3. Temporarily set to A4 baseline dimensions so html2canvas renders the crisp 210mm layout
  iframe.style.width = "210mm";
  iframe.style.height = "auto";

  iframeDoc.body.style.width = "210mm";
  iframeDoc.body.style.overflow = "visible";
  iframeDoc.body.style.margin = "0";

  contentWrapper.style.transform = "none";
  contentWrapper.style.width = "210mm";

  // Give the browser a frame to apply styles and recalculate layout
  await new Promise((r) => setTimeout(r, 150));

  try {
    // 4. Capture the content-wrapper using html-to-image's toJpeg
    // This uses SVG foreignObject rendering, which utilizes the browser's native text engine,
    // thereby solving the Thai vowel shifting / floating diacritics bug in html2canvas.
    const imgData = await toJpeg(contentWrapper, {
      quality: 0.95,
      pixelRatio: 3, // High resolution (300 DPI equivalent)
      backgroundColor: "#ffffff",
      fontEmbedCSS: `@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');`,
    });

    // 5. Restore original styles
    iframe.style.width = origIframeWidth;
    iframe.style.height = origIframeHeight;

    iframeDoc.body.style.width = origBodyWidth;
    iframeDoc.body.style.overflow = origBodyOverflow;
    iframeDoc.body.style.margin = origBodyMargin;

    contentWrapper.style.transform = origWrapperTransform;
    contentWrapper.style.width = origWrapperWidth;
    contentWrapper.style.transformOrigin = origWrapperTransformOrigin;

    // 6. Generate PDF and add the image fitted to the chosen page format (A4/A5)
    const pdf = new jsPDF({
      orientation: width > height ? "landscape" : "portrait",
      unit: "mm",
      format: [width, height],
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfW = width;
    const pdfH = (imgProps.height * pdfW) / imgProps.width;

    pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
    pdf.save(filename);
  } catch (err) {
    // Make sure we restore styles even if html2canvas fails
    iframe.style.width = origIframeWidth;
    iframe.style.height = origIframeHeight;

    iframeDoc.body.style.width = origBodyWidth;
    iframeDoc.body.style.overflow = origBodyOverflow;
    iframeDoc.body.style.margin = origBodyMargin;

    contentWrapper.style.transform = origWrapperTransform;
    contentWrapper.style.width = origWrapperWidth;
    contentWrapper.style.transformOrigin = origWrapperTransformOrigin;

    throw err;
  }
};
