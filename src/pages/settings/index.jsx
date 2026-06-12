import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  User,
  Users,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Info,
  Upload,
  X,
} from "lucide-react";
import { Get, Update, Post } from "@/services/https";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Textarea from "@/components/ui/Textarea";

const SocietyConfig = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    president: "",
    vicePresident: "",
    committees: "",
    address: "",
    addressEn: "",
    registrationNo: "",
    taxId: "",
    email: "",
    payee: "",
    signatureUrl: "",
    phone: "",
    receiptNo: 0,
  });

  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  // ดึงข้อมูลเดิมจาก API
  const { data: settings, isLoading } = useQuery({
    queryKey: ["society-settings"],
    queryFn: async () => {
      const res = await Get("/society");
      return res.data;
    },
  });

  // อัปเดตข้อมูลเมื่อโหลดเสร็จ
  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name || "",
        president: settings.president || "",
        vicePresident: settings.vicePresident || "",
        committees: settings.committees || "",
        address: settings.address || "",
        addressEn: settings.addressEn || "",
        registrationNo: settings.registrationNo || "",
        taxId: settings.taxId || "",
        email: settings.email || "",
        payee: settings.payee || "",
        signatureUrl: settings.signatureUrl || "",
        phone: settings.phone || "",
        receiptNo: settings.receiptNo !== undefined && settings.receiptNo !== null ? settings.receiptNo : 0,
      });
    }
  }, [settings]);

  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      addToast("กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP) เท่านั้น", "error");
      return;
    }

    const data = new FormData();
    data.append("file", file);

    setIsUploadingSignature(true);
    try {
      const res = await Post("/society/upload-signature", data);
      if (res.url) {
        setFormData((prev) => ({ ...prev, signatureUrl: res.url }));
        addToast("อัปโหลดลายเซ็นสำเร็จ", "success");
      }
    } catch (error) {
      addToast(error.message || "อัปโหลดรูปล้มเหลว", "error");
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const mutation = useMutation({
    mutationFn: (data) => Update("/society", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["society-settings"]);
      addToast("บันทึกข้อมูลสมาคมสำเร็จ", "success");
    },
    onError: (error) => {
      addToast(error.message || "เกิดข้อผิดพลาด", "error");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading)
    return (
      <div className="p-10 text-center opacity-50">กำลังโหลดข้อมูล...</div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#111]">ตั้งค่าข้อมูลสมาคม</h1>
          <p className="text-base text-[#555]">
            จัดการข้อมูลพื้นฐานและรายชื่อคณะกรรมการของสมาคม
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="bg-[#003527] hover:bg-[#004d39]"
        >
          {mutation.isPending ? (
            "กำลังบันทึก..."
          ) : (
            <>
              <Save size={18} className="mr-2" />
              บันทึกการเปลี่ยนแปลง
            </>
          )}
        </Button>
      </div>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Left Column: Basic Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-[#eceeeb] space-y-4">
            <div className="flex items-center gap-2 text-[#003527] font-semibold">
              ข้อมูลทั่วไป
            </div>

            <div className="space-y-2">
              <Label>ชื่อสมาคม</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="ระบุชื่อสมาคมเต็ม"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>เลขทะเบียนสมาคม / เลขที่</Label>
                <Input
                  value={formData.registrationNo}
                  onChange={(e) =>
                    setFormData({ ...formData, registrationNo: e.target.value })
                  }
                  placeholder="ระบุเลขที่ทะเบียนสมาคม"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>เลขประจำตัวผู้เสียภาษี</Label>
                <Input
                  value={formData.taxId}
                  onChange={(e) =>
                    setFormData({ ...formData, taxId: e.target.value })
                  }
                  placeholder="ระบุเลขประจำตัวผู้เสียภาษี"
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">นายกสมาคม</Label>
                <Input
                  value={formData.president}
                  onChange={(e) =>
                    setFormData({ ...formData, president: e.target.value })
                  }
                  placeholder="ชื่อ-นามสกุล ประธาน"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  รองนายกสมาคม
                </Label>
                <Input
                  value={formData.vicePresident}
                  onChange={(e) =>
                    setFormData({ ...formData, vicePresident: e.target.value })
                  }
                  placeholder="ชื่อ-นามสกุล รองประธาน"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">คณะกรรมการสมาคม</Label>
              <Textarea
                value={formData.committees}
                onChange={(e) =>
                  setFormData({ ...formData, committees: e.target.value })
                }
                placeholder="ระบุรายชื่อกรรมการ (แยกด้วยเครื่องหมายคอมม่า หรือขึ้นบรรทัดใหม่)"
                className="min-h-[150px] resize-none"
              />
              <p className="text-[11px] text-gray-400 italic">
                * รายชื่อนี้จะถูกนำไปใช้ในเอกสารและรายงานต่างๆ ของสมาคม
              </p>
            </div>

             <div className="space-y-2">
              <Label>ผู้รับเงิน</Label>
              <Input
                value={formData.payee}
                onChange={(e) =>
                  setFormData({ ...formData, payee: e.target.value })
                }
                placeholder="ระบุชื่อผู้รับเงิน (เช่น เหรัญญิก หรือ สมาคมฯ)"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>ลายเซ็นผู้รับเงิน</Label>
              <div className="flex flex-col gap-3">
                {formData.signatureUrl ? (
                  <div className="relative inline-block w-48 h-24 border border-gray-200 rounded bg-gray-50 overflow-hidden group">
                    <img src={formData.signatureUrl} alt="Signature" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, signatureUrl: "" })}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${isUploadingSignature ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                      {isUploadingSignature ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500 mb-2" />
                      ) : (
                        <Upload size={20} className="mb-2" />
                      )}
                      <p className="text-xs font-semibold">{isUploadingSignature ? 'กำลังอัปโหลด...' : 'คลิกเพื่ออัปโหลดลายเซ็น'}</p>
                    </div>
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleSignatureUpload} />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>เลขที่ใบเสร็จล่าสุด</Label>
              <Input
                type="number"
                value={formData.receiptNo}
                onChange={(e) =>
                  setFormData({ ...formData, receiptNo: parseInt(e.target.value) || 0 })
                }
                placeholder="ระบุเลขที่ใบเสร็จล่าสุด (เช่น 1000)"
                className="h-11"
              />
              <p className="text-[11px] text-gray-400 italic">
                * ระบบจะนำเลขนี้ไปบวกเพิ่มทีละ 1 เมื่อมีการสร้างรายการบริจาคเงินใหม่
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-[#eceeeb] space-y-4">
            <div className="flex items-center gap-2 text-[#003527] font-semibold">
              ข้อมูลติดต่อ
            </div>

            <div className="space-y-2">
              <Label>ที่อยู่ภาษาไทย</Label>
              <Textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="ระบุที่อยู่เป็นภาษาไทย..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>ที่อยู่ภาษาอังกฤษ</Label>
              <Textarea
                value={formData.addressEn}
                onChange={(e) =>
                  setFormData({ ...formData, addressEn: e.target.value })
                }
                placeholder="ระบุที่อยู่เป็นภาษาอังกฤษ..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">เบอร์โทรศัพท์</Label>
              <Input
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setFormData({ ...formData, phone: val });
                }}
                maxLength={10}
                placeholder="0XXXXXXXXX"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">อีเมล</Label>
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                type="email"
                placeholder="example@email.com"
                className="h-11"
              />
            </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex gap-3">
            <div className="bg-white w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm">
              <Save size={16} className="text-emerald-600" />
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              <strong>เคล็ดลับ:</strong>{" "}
              ข้อมูลเหล่านี้จะถูกนำไปแสดงในหัวกระดาษของใบเสร็จรับเงิน
              และรายงานสรุปประจำปีโดยอัตโนมัติ
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SocietyConfig;
