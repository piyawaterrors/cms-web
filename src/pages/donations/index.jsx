import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { PrintService } from "@/services/print-service";
import {
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  X,
  Upload,
  User,
  Image as ImageIcon,
  Printer,
} from "lucide-react";
import { Get, Post, Update, Delete } from "@/services/https";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Label from "@/components/ui/Label";
import Pagination from "@/components/ui/Pagination";
import Autocomplete from "@/components/ui/Autocomplete";
import Textarea from "@/components/ui/Textarea";
import DatePicker from "@/components/ui/DatePicker";
import { compressImage } from "@/utils/imageCompressor";

const formatNumberWithCommas = (val) => {
  if (val === undefined || val === null || val === "") return "";
  const clean = val.toString().replace(/,/g, "");
  const parts = clean.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

const Donations = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startYear, setStartYear] = useState(dayjs().year());
  const [endYear, setEndYear] = useState(dayjs().year());
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState(null);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // รีเซ็ตหน้าเมื่อมีการค้นหาใหม่
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const [formData, setFormData] = useState({
    donorName: "",
    amount: "",
    donationDate: dayjs().format("YYYY-MM-DD"),
    donationYear: dayjs().year(),
    type: "maintenance",
    paymentMethod: "transfer",
    slipUrl: "",
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = React.useRef(null);

  const yearOptions = [
    { label: "ทั้งหมด", value: "" },
    ...Array.from({ length: 61 }, (_, i) => {
      const year = dayjs().year() + 30 - i;
      return { label: `${year + 543}`, value: year };
    }),
  ];

  const donationTypeOptions = [
    { label: "บริจาคทั่วไป", value: "general" },
    { label: "ทำบุญตามเทศกาล", value: "festival" },
    { label: "อื่นๆ", value: "other" },
  ];

  const paymentMethodOptions = [
    { label: "เงินโอน", value: "transfer" },
    { label: "เงินสด", value: "cash" },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ["donations", debouncedSearch, startYear, endYear, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (startYear) params.append("startYear", startYear);
      if (endYear) params.append("endYear", endYear);
      params.append("page", page);
      params.append("limit", limit);
      const res = await Get(`/donations?${params.toString()}`);
      return res.data;
    },
  });

  const { data: summaryData } = useQuery({
    queryKey: ["donation-summary", startYear, endYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startYear) params.append("startYear", startYear);
      if (endYear) params.append("endYear", endYear);
      const res = await Get(`/donations/summary?${params.toString()}`);
      return res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: (payload) => {
      if (editingDonation) {
        return Update(`/donations/${editingDonation.id}`, payload);
      }
      return Post("/donations", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["donations"]);
      queryClient.invalidateQueries(["donation-summary"]);
      addToast(
        editingDonation ? "แก้ไขข้อมูลสำเร็จ" : "บันทึกข้อมูลสำเร็จ",
        "success",
      );
      closeModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || "เกิดข้อผิดพลาด", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Delete(`/donations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["donations"]);
      queryClient.invalidateQueries(["donation-summary"]);
      addToast("ลบข้อมูลเรียบร้อยแล้ว", "success");
    },
  });

  // ดึงข้อมูลสมาคมมาใช้ในใบเสร็จ
  const { data: society } = useQuery({
    queryKey: ["society-settings"],
    queryFn: async () => {
      const res = await Get("/society");
      return res.data;
    },
  });

  const handlePrint = (donation) => {
    PrintService.printDonationReceipt(donation, society);
  };

  const openModal = (donation = null) => {
    if (donation) {
      setEditingDonation(donation);
      setFormData({
        donorName: donation.donorName,
        amount: donation.amount,
        donationDate: donation.donationDate,
        donationYear: donation.donationYear,
        type: donation.type || "maintenance",
        paymentMethod: donation.paymentMethod || "transfer",
        slipUrl: donation.slipUrl || "",
        notes: donation.notes || "",
      });
    } else {
      setEditingDonation(null);
      setFormData({
        donorName: "",
        amount: "",
        donationDate: dayjs().format("YYYY-MM-DD"),
        donationYear: startYear || dayjs().year(),
        type: "maintenance",
        paymentMethod: "transfer",
        slipUrl: "",
        notes: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDonation(null);
    setSelectedFile(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // สร้าง FormData เพื่อส่งข้อมูลแบบ Multipart
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });

    // แนบไฟล์รูปภาพ (ถ้ามีการเลือกใหม่)
    if (selectedFile) {
      data.append("file", selectedFile);
    }

    mutation.mutate(data);
  };

  const handleDelete = (id) => {
    if (window.confirm("คุณต้องการลบข้อมูลการบริจาคนี้ใช่หรือไม่?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressedFile = await compressImage(file);
      setSelectedFile(compressedFile);
      setFormData((prev) => ({ ...prev, slipUrl: compressedFile.name }));
    } catch (err) {
      addToast("เกิดข้อผิดพลาดในการประมวลผลรูปภาพ", "error");
    }
  };

  return (
    <div className="p-6 mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#111]">
            ระบบจัดการเงินบริจาค
          </h1>
          <p className="text-base text-[#555]">
            บันทึกและตรวจสอบข้อมูลการบริจาคประจำปี
          </p>
        </div>
        <Button onClick={() => openModal()} className="w-48">
          <Plus size={18} />
          เพิ่มรายการบริจาค
        </Button>
      </div>

      {/* Summary Card & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-[#003527] text-white p-6 rounded-lg shadow-sm space-y-2 h-full">
            <div className="flex items-center gap-2 opacity-80">
              <DollarSign size={20} />
              <span className="text-sm font-medium">
                ยอดบริจาครวม
                {startYear && endYear
                  ? ` ช่วงปี ${startYear + 543} - ${endYear + 543}`
                  : startYear
                    ? ` ตั้งแต่ปี ${startYear + 543}`
                    : endYear
                      ? ` จนถึงปี ${endYear + 543}`
                      : " ทุกปี"}
              </span>
            </div>
            <div className="text-3xl font-bold">
              ฿{Number(summaryData?.total || 0).toLocaleString()}
            </div>
            <p className="text-xs opacity-60">
              สรุปรายรับจากการบริจาคตามช่วงเวลาที่เลือก
            </p>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Input
                placeholder="ค้นหาชื่อผู้บริจาค หรือหมายเหตุ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-full md:w-40">
                <Select
                  className="h-11"
                  value={startYear}
                  onChange={(val) => {
                    setStartYear(val ? Number(val) : "");
                    setPage(1);
                  }}
                  options={yearOptions}
                  placeholder="ตั้งแต่ปี"
                />
              </div>
              <span className="text-gray-400">ถึง</span>
              <div className="w-full md:w-40">
                <Select
                  className="h-11"
                  value={endYear}
                  onChange={(val) => {
                    setEndYear(val ? Number(val) : "");
                    setPage(1);
                  }}
                  options={yearOptions}
                  placeholder="ถึงปี"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Donation Table */}
      <div className="bg-white rounded-xl border border-[#eceeeb] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase">
                  ผู้บริจาค
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase">
                  ประเภท
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase text-center">
                  การชำระเงิน
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase text-center">
                  ประจำปี
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase text-right">
                  จำนวนเงิน
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase">
                  วันที่
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase text-center">
                  สลิป
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase text-center">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="7" className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : data?.rows?.length > 0 ? (
                data.rows.map((donation) => (
                  <tr
                    key={donation.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-[#777]">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#111]">
                            {donation.donorName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-600">
                        {donationTypeOptions.find(
                          (t) => t.value === donation.type,
                        )?.label || "ทั่วไป"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex text-sm font-medium ${
                          donation.paymentMethod === "cash"
                            ? "text-orange-700"
                            : "text-blue-700"
                        }`}
                      >
                        {donation.paymentMethod === "cash"
                          ? "เงินสด"
                          : "เงินโอน"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-600">
                        {donation.donationYear
                          ? `${donation.donationYear + 543}`
                          : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-[#003527]">
                        ฿{Number(donation.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {dayjs(donation.donationDate)
                        .add(543, "year")
                        .format("DD/MM/YYYY")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {donation.slipUrl ? (
                        <a
                          href={donation.slipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-600 rounded-sm hover:bg-blue-100 transition-colors"
                          title="ดูสลิป"
                        >
                          <ImageIcon size={16} />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">ไม่มีสลิป</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handlePrint(donation)}
                          className="h-8 w-12 text-xs font-medium"
                          title="พิมพ์ใบเสร็จ"
                        >
                          <Printer size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => openModal(donation)}
                          className="h-8 w-12 text-xs font-medium"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-12 p-0 flex items-center justify-center text-xs font-medium border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-md"
                          onClick={() => handleDelete(donation.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-20 text-center text-gray-400"
                  >
                    ไม่พบข้อมูลการบริจาค
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && (
          <div className="p-4 border-t border-gray-50">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(data.count / limit)}
              onPageChange={setPage}
              totalCount={data.count}
              showingCount={data.rows.length}
            />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#003527] text-white">
              <div>
                <h2 className="text-lg font-bold">
                  {editingDonation
                    ? "แก้ไขข้อมูลการบริจาค"
                    : "เพิ่มรายการบริจาคใหม่"}
                </h2>
                <p className="text-xs opacity-70">
                  ระบุรายละเอียดการบริจาคเงิน
                </p>
              </div>
              <button
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                onClick={closeModal}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1 */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label required>ชื่อผู้บริจาค</Label>
                    <Autocomplete
                      placeholder="พิมพ์ค้นหาชื่อผู้ติดต่อ/สมาชิก..."
                      value={formData.donorName}
                      onChange={(val) =>
                        setFormData({ ...formData, donorName: val })
                      }
                      onSelect={(member) => {
                        setFormData({
                          ...formData,
                          donorName: member.fullName,
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label required>วันที่บริจาค</Label>
                    <DatePicker
                      value={formData.donationDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          donationDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label required>ประเภทการชำระ</Label>
                    <div className="flex gap-2">
                      {paymentMethodOptions.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              paymentMethod: type.value,
                            })
                          }
                          className={`flex-1 py-2 px-4 rounded-sm border text-sm font-bold transition-all ${
                            formData.paymentMethod === type.value
                              ? "bg-[#003527] text-white border-[#003527]"
                              : "bg-white text-[#777] border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label required>จำนวนเงิน (บาท)</Label>
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={formatNumberWithCommas(formData.amount)}
                      onChange={(e) => {
                        let clean = e.target.value.replace(/,/g, "");
                        if (
                          clean.startsWith("0") &&
                          clean.length > 1 &&
                          clean[1] !== "."
                        ) {
                          clean = clean.replace(/^0+/, "");
                          if (clean === "") clean = "0";
                        }
                        if (clean === "" || /^\d*\.?\d*$/.test(clean)) {
                          setFormData({ ...formData, amount: clean });
                        }
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label required>บริจาคประจำปี</Label>
                    <Select
                      value={formData.donationYear}
                      onChange={(val) =>
                        setFormData({ ...formData, donationYear: Number(val) })
                      }
                      options={yearOptions}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label required>ประเภทการบริจาค</Label>
                    <Select
                      value={formData.type}
                      onChange={(val) =>
                        setFormData({ ...formData, type: val })
                      }
                      options={donationTypeOptions}
                    />
                  </div>
                </div>
              </div>

              {/* Full Width Fields */}
              <div className="space-y-1">
                <Label>หมายเหตุ</Label>
                <Textarea
                  placeholder="ระบุรายละเอียดเพิ่มเติม..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div className="space-y-1">
                <Label>หลักฐานการโอน (รูปภาพสลิป)</Label>
                <div className="flex gap-2">
                  <div className="flex-grow flex items-center min-h-[44px] px-1 overflow-hidden">
                    {formData.slipUrl ? (
                      <a
                        className="text-base font-medium text-[#003527] underline truncate cursor-pointer"
                        title={decodeURIComponent(
                          formData.slipUrl.split("/").pop(),
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        href={
                          formData.slipUrl.startsWith("http")
                            ? formData.slipUrl
                            : selectedFile
                              ? URL.createObjectURL(selectedFile)
                              : "#"
                        }
                      >
                        {decodeURIComponent(formData.slipUrl.split("/").pop())}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400 italic">
                        ยังไม่ได้อัปโหลดรูปสลิป...
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  {formData.slipUrl && (
                    <a
                      href={
                        formData.slipUrl.startsWith("http")
                          ? formData.slipUrl
                          : selectedFile
                            ? URL.createObjectURL(selectedFile)
                            : "#"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-11 h-11 border border-gray-200 flex items-center justify-center rounded-md hover:bg-gray-50 text-blue-600 shrink-0"
                      title="ดูรูปภาพสลิป"
                    >
                      <ImageIcon size={18} />
                    </a>
                  )}
                  <div className="shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-11 h-11 p-0 flex items-center justify-center border-gray-200"
                      onClick={() => fileInputRef.current?.click()}
                      title="อัปโหลดสลิป"
                    >
                      <Upload size={18} />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={closeModal}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-[#003527] text-white"
                  loading={mutation.isPending}
                >
                  {editingDonation ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donations;
