import React from "react";
import { createRoot } from "react-dom/client";
import dayjs from "dayjs";

// Helper สำหรับแปลงเลขเป็นคำอ่านภาษาไทย
const toThaiBaht = (number) => {
  if (number === 0) return "ศูนย์บาทถ้วน";
  const numStr = number.toFixed(2).split(".");
  const baht = numStr[0];
  const satang = numStr[1];

  const thaiNums = [
    "ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า",
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
const ReceiptTemplate = ({ donation, society }) => {
  const donationDate = dayjs(donation.donationDate)
    .add(543, "year")
    .format("D MMMM YYYY");
  const printDate = dayjs().add(543, "year").format("D MMMM YYYY HH:mm:ss");

  return (
    <div
      style={{
        padding: "40px",
        color: "#111",
        lineHeight: "1.6",
        fontFamily: "'Sarabun', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
        @media print {
          body { padding: 0; margin: 0; }
          .no-print { display: none; }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "30px",
          borderBottom: "2px solid #003527",
          paddingBottom: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{ fontSize: "28px", fontWeight: "bold", color: "#003527" }}
          >
            e-<span style={{ color: "#555" }}>Donation</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <h1 style={{ fontSize: "32px", margin: 0, color: "#003527" }}>
            ใบรับเงินบริจาค
          </h1>
          <div style={{ fontSize: "14px", marginTop: "5px" }}>
            เลขที่: DN-{donation.id.toString().padStart(6, "0")}-
            {dayjs(donation.donationDate).format("YYYY")}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "180px 1fr",
          gap: "20px",
          marginTop: "40px",
        }}
      >
        <div style={{ fontWeight: 600, color: "#555" }}>ผู้บริจาค</div>
        <div>
          <div style={{ fontSize: "18px" }}>{donation.donorName}</div>
          <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
            เลขประจำตัวประชาชน / เลขประจำตัวผู้เสียภาษีอากร: XXXXXXXXXXXXX
          </div>
        </div>

        <div style={{ fontWeight: 600, color: "#555" }}>หน่วยรับบริจาค</div>
        <div>
          <div style={{ fontSize: "18px" }}>
            {society?.name || "สมาคมสุสาน"}
          </div>
          <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
            {society?.address || "-"}
          </div>
          <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
            เบอร์โทรศัพท์: {society?.phone || "-"}
          </div>
        </div>

        <div style={{ fontWeight: 600, color: "#555" }}>วันที่บริจาค</div>
        <div style={{ fontSize: "18px" }}>{donationDate}</div>

        <div style={{ fontWeight: 600, color: "#555" }}>จำนวนเงินบริจาค</div>
        <div>
          <div style={{ fontSize: "18px", fontWeight: "bold" }}>
            {Number(donation.amount).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}{" "}
            บาท
          </div>
          <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
            ( {toThaiBaht(Number(donation.amount))} )
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "100px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div style={{ textAlign: "center", width: "300px" }}>
          <div
            style={{
              borderBottom: "1px dotted #999",
              marginBottom: "10px",
              width: "100%",
              height: "40px",
            }}
          ></div>
          <div style={{ fontWeight: 600 }}>
            {society?.president ||
              "...................................................."}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>ผู้มีอำนาจลงนาม</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600, color: "#555" }}>
            วันเดือนปีที่ขอพิมพ์
          </div>
          <div style={{ fontSize: "14px" }}>{printDate}</div>
        </div>
      </div>

      <div
        style={{
          fontSize: "11px",
          color: "#999",
          marginTop: "40px",
          borderTop: "1px solid #eee",
          paddingTop: "10px",
        }}
      >
        หมายเหตุ: 1. ข้อมูลบริจาคของท่านได้บันทึกไว้ในระบบบริจาคอิเล็กทรอนิกส์
        (e-Donation) ท่านสามารถตรวจสอบได้ที่เว็บไซต์กรมสรรพากร (www.rd.go.th)
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
