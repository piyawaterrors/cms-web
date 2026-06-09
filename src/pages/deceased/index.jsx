import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  User,
  Calendar,
  MapPin,
  ExternalLink,
  Phone,
  FileText,
  Pencil,
  X,
  Trash2,
  Upload,
  Image as ImageIcon,
  Mail,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Get, Update, Post } from "@/services/https";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Pagination from "@/components/ui/Pagination";
import { useNavigate } from "react-router-dom";
import Select from "@/components/ui/Select";
import { compressImage } from "@/utils/imageCompressor";

const BURIAL_TYPE_OPTIONS = [
  { label: "โลงศพ", value: "coffin" },
  { label: "อัฐิ", value: "ashes" },
];

const DeceasedRegistry = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deceasedFilter, setDeceasedFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeceased, setEditingDeceased] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    deathCertificateNumber: "",
    burialDate: "",
    burialType: "coffin",
  });

  // Detail Modal State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDeceasedId, setSelectedDeceasedId] = useState(null);

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [deceasedFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ["deceaseds", debouncedSearch, deceasedFilter, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (deceasedFilter) params.append("status", deceasedFilter);
      params.append("page", page);
      params.append("limit", limit);
      const res = await Get(`/deceaseds?${params.toString()}`);
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const { data: deceasedDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["deceasedDetail", selectedDeceasedId],
    queryFn: async () => {
      if (!selectedDeceasedId) return null;
      const res = await Get(`/deceaseds/${selectedDeceasedId}`);
      return res.data;
    },
    enabled: !!selectedDeceasedId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => Update(`/deceaseds/${editingDeceased.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["deceaseds"]);
      addToast("อัปเดตข้อมูลผู้ล่วงลับเรียบร้อยแล้ว", "success");
      closeModal();
    },
    onError: (err) => {
      addToast(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล",
        "error",
      );
    },
  });

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const openModal = (deceased) => {
    setEditingDeceased(deceased);
    setFormData({
      fullName: deceased.fullName || "",
      deathCertificateNumber: deceased.deathCertificateNumber || "",
      deathCertificateImage: deceased.deathCertificateImage || "",
      burialDate: deceased.burialDate || "",
      burialType: deceased.burialType || "coffin",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDeceased(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressedFile = await compressImage(file);
      const data = new FormData();
      data.append("file", compressedFile);

      const res = await Post("/deceaseds/upload-certificate", data);

      if (res.data && res.data.url) {
        setFormData((prev) => ({
          ...prev,
          deathCertificateImage: res.data.url,
        }));
        addToast("อัปโหลดรูปใบมรณะบัตรสำเร็จ", "success");
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      addToast(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ",
        "error",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const deceasedList = data?.rows || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="p-6 mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#111]">ทะเบียนศพส่วนกลาง</h1>
          <p className="text-base text-[#555]">
            ระบบสืบค้นรายชื่อผู้ล่วงลับและประวัติการบรรจุศพทั้งหมด
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 w-full">
          <Label>ค้นหารายชื่อผู้ล่วงลับ</Label>
          <div className="relative">
            <Input
              placeholder="ค้นหาชื่อ หรือ เลขที่ใบมรณะบัตร..."
              className="rounded-md border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="relative flex-1 w-full">
          <Label>สถานะ</Label>
          <Select
            size="sm"
            options={[
              { value: "all", label: "ทั้งหมด" },
              { value: "active", label: "อยู่ในสุสาน" },
              { value: "archived", label: "ย้ายออกแล้ว" },
            ]}
            value={deceasedFilter}
            onChange={setDeceasedFilter}
            className="border-gray-200 w-full md:w-48"
          />
        </div>
      </div>

      {/* Deceased Table */}
      <div className="bg-white rounded-md border border-[#eceeeb] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#eceeeb]">
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider">
                  ข้อมูลผู้ล่วงลับ
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider">
                  ตำแหน่งที่บรรจุ
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider text-center">
                  วันที่บรรจุ
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider text-center">
                  ประเภท
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider">
                  ผู้ติดต่อ
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider text-center">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-20 text-center text-[#999]"
                  >
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : deceasedList.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-20 text-center text-[#999]"
                  >
                    ไม่พบข้อมูลผู้ล่วงลับ
                  </td>
                </tr>
              ) : (
                deceasedList.map((deceased) => (
                  <tr
                    key={deceased.id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedDeceasedId(deceased.id);
                      setIsDetailOpen(true);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-[#777]">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#111]">
                            {deceased.fullName}
                          </p>
                          {deceased.deathCertificateNumber && (
                            <p className="text-sm flex items-center gap-1 text-[#777]">
                              ใบมรณะ: {deceased.deathCertificateNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#333]">
                      {deceased.plot ? (
                        <div className="space-y-1">
                          <div className="flex flex-col">
                            <span>
                              เลขหลุม: {deceased.plot.plotNumber} | ซอย:{" "}
                              {deceased.plot.zone}
                            </span>
                          </div>
                        </div>
                      ) : deceased.isArchived ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-xs font-semibold">
                          ย้ายออก
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          ไม่ระบุตำแหน่ง
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#333] text-center">
                      {deceased.burialDate
                        ? dayjs(deceased.burialDate).format("DD/MM/YYYY HH:mm")
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {deceased.burialType === "coffin" ? (
                        <span className="text-sm font-medium text-amber-700">
                          โลงศพ
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-blue-700">
                          อัฐิ
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#333]">
                      {deceased.contact ? (
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-[#111]">
                              {deceased.contact.fullName}
                            </p>
                            <div className="flex flex-col gap-0.5">
                              <p className="text-xs text-gray-500">
                                {deceased.contact.phone || "-"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span>ไม่พบข้อมูลผู้ติดต่อ</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        <Button
                          variant="outline"
                          className="h-8 w-12 p-0 flex items-center justify-center text-xs font-medium border-gray-200 text-gray-700 hover:bg-gray-50 rounded-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (deceased.plotId)
                              navigate(`/plots/detail/${deceased.plotId}`);
                          }}
                          disabled={!deceased.plotId}
                          title="ดูรายละเอียด"
                        >
                          <ExternalLink size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-12 p-0 flex items-center justify-center text-xs font-medium border-gray-200 text-gray-700 hover:bg-gray-50 rounded-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(deceased);
                          }}
                          title="แก้ไขข้อมูล"
                        >
                          <Pencil size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalCount={totalCount}
          showingCount={deceasedList.length}
        />
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#003527] text-white">
              <h2 className="text-lg font-bold">แก้ไขข้อมูลผู้ล่วงลับ</h2>
              <button
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                onClick={closeModal}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <Label required>ชื่อ-นามสกุล</Label>
                <Input
                  placeholder="กรอกชื่อ-นามสกุล"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>เลขที่ใบมรณะบัตร</Label>
                <Input
                  placeholder="ระบุเลขที่ใบมรณะบัตร (ถ้ามี)"
                  value={formData.deathCertificateNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deathCertificateNumber: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>ใบมรณะบัตร (รูปภาพ)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={
                      isUploading
                        ? "กำลังอัปโหลด..."
                        : "ยังไม่ได้อัปโหลดรูปใบมรณะบัตร..."
                    }
                    value={
                      formData.deathCertificateImage
                        ? formData.deathCertificateImage.startsWith("http")
                          ? "มีรูปภาพใบมรณะบัตรแล้ว"
                          : formData.deathCertificateImage
                        : ""
                    }
                    readOnly
                    className="bg-gray-50"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <div className="shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-[42px] w-[42px] p-0 flex items-center justify-center border-gray-200"
                      onClick={() => fileInputRef.current?.click()}
                      title="อัปโหลดรูปใบมรณะบัตร"
                      loading={isUploading}
                    >
                      <Upload size={18} />
                    </Button>
                  </div>
                  {formData.deathCertificateImage &&
                    formData.deathCertificateImage.startsWith("http") && (
                      <a
                        href={formData.deathCertificateImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-[42px] w-[42px] border border-gray-200 flex items-center justify-center rounded-md hover:bg-gray-50 text-blue-600 shrink-0"
                        title="ดูรูปภาพใบมรณะบัตร"
                      >
                        <ImageIcon size={18} />
                      </a>
                    )}
                </div>
              </div>

              <div className="space-y-1">
                <Label>วันที่และเวลาบรรจุ (ค.ศ.)</Label>
                <Input
                  type="datetime-local"
                  value={
                    formData.burialDate
                      ? dayjs(formData.burialDate).format("YYYY-MM-DDTHH:mm")
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, burialDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label required>ประเภทการบรรจุ</Label>
                <Select
                  value={formData.burialType}
                  onChange={(val) =>
                    setFormData({ ...formData, burialType: val })
                  }
                  options={BURIAL_TYPE_OPTIONS}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-md"
                  onClick={closeModal}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#003527] text-white rounded-md"
                  loading={updateMutation.isPending}
                >
                  บันทึกการแก้ไข
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deceased Detail Modal */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-xl max-h-[90vh] rounded-xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-[#eceeeb] flex justify-between items-center bg-[#003527] text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-md flex items-center justify-center text-white">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    รายละเอียดผู้ล่วงลับ
                  </h2>
                  <p className="text-sm opacity-70 mt-0.5">
                    {deceasedDetail?.plot ? (
                      <span>หลุม {deceasedDetail.plot.plotNumber}</span>
                    ) : (
                      <span>ไม่ระบุตำแหน่ง</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedDeceasedId(null);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoadingDetail ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003527]" />
                  <p className="text-sm text-gray-500">
                    กำลังโหลดรายละเอียด...
                  </p>
                </div>
              ) : deceasedDetail ? (
                <>
                  {/* Deceased Info Card */}
                  <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                    <p className="text-xs text-[#777] uppercase font-bold tracking-wider mb-1">
                      ข้อมูลผู้ล่วงลับ
                    </p>
                    <div className="space-y-3">
                      <div className="text-lg font-bold text-gray-900">
                        {deceasedDetail.fullName}
                      </div>

                      <div className="flex items-start gap-8 mt-1.5 text-base text-gray-600">
                        <div className="flex flex-col items-start text-gray-600 gap-1.5">
                          <span className="flex items-center">
                            อายุ:{" "}
                            {deceasedDetail.age
                              ? `${deceasedDetail.age} ปี`
                              : "-"}
                          </span>
                          <span className="flex items-center gap-1">
                            มรณบัตร:{" "}
                            <a
                              href={deceasedDetail.deathCertificateImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center hover:underline cursor-pointer"
                            >
                              {deceasedDetail.deathCertificateNumber || "N/A"}
                            </a>
                          </span>
                        </div>
                        <div className="flex flex-col items-start text-gray-600 gap-1.5">
                          <span className="flex items-cente">
                            วันที่บรรจุ:{" "}
                            {deceasedDetail.burialDate
                              ? dayjs(deceasedDetail.burialDate).format(
                                  "DD/MM/YYYY HH:mm",
                                )
                              : "-"}
                          </span>
                          <span className="flex items-center">
                            ประเภทการบรรจุ:{" "}
                            {deceasedDetail.burialType === "coffin"
                              ? "โลงศพ"
                              : "อัฐิ"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Card */}
                  {deceasedDetail.contact ? (
                    <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 space-y-3.5">
                      <p className="text-xs text-[#777] uppercase font-bold tracking-wider mb-1">
                        ข้อมูลผู้ติดต่อ
                      </p>
                      <div className="space-y-2">
                        <div className="text-lg font-bold text-gray-900">
                          {deceasedDetail.contact.fullName}
                        </div>
                        <div className="flex items-start gap-4 mt-1.5 text-base text-gray-600">
                          <div className="flex flex-col items-start text-gray-600 gap-1.5">
                            <span className="flex items-center gap-1.5">
                              <Phone size={15} className="text-gray-600" />
                              {deceasedDetail.contact.phone || "N/A"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Mail size={15} className="text-gray-600" />
                              {deceasedDetail.contact.email || "N/A"}
                            </span>
                          </div>
                          <span className="flex items-start gap-1.5 min-w-0">
                            <MapPin
                              size={15}
                              className="text-gray-600 shrink-0 mt-1"
                            />
                            <span className="whitespace-normal break-words">
                              {deceasedDetail.contact.address || "N/A"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 text-center text-sm text-gray-500 py-8">
                      ไม่พบข้อมูลผู้ติดต่อ
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                      ตำแหน่งที่บรรจุ (หลุมศพ)
                    </h3>
                    {deceasedDetail.plot ? (
                      <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-900">
                            หลุม {deceasedDetail.plot.plotNumber} (ซอย:{" "}
                            {deceasedDetail.plot.zone || "-"})
                          </p>
                          {deceasedDetail.plot.contracts?.[0] && (
                            <p className="text-base text-[#555] mt-1.5">
                              หมายเลขสัญญา:{" "}
                              {deceasedDetail.plot.contracts[0].contractNumber}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDetailOpen(false);
                            navigate(`/plots/detail/${deceasedDetail.plot.id}`);
                          }}
                          className="h-8 text-xs font-semibold rounded-md border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                          <ExternalLink size={12} className="mr-1" />
                          ดูรายละเอียดหลุม
                        </Button>
                      </div>
                    ) : deceasedDetail.isArchived ? (
                      <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg flex flex-col gap-1">
                        <p className="font-bold text-rose-700 text-sm">ย้ายออก (ภายนอกสมาคม)</p>
                        <p className="text-xs">ผู้ล่วงลับนี้ได้รับการย้ายออกนอกสมาคมแล้ว</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 py-4 bg-gray-50 rounded-lg text-center border border-dashed border-gray-200">
                        ยังไม่ได้ระบุตำแหน่งหลุมศพ
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-gray-500 text-sm">
                  ไม่พบข้อมูลรายละเอียดผู้ล่วงลับ
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeceasedRegistry;
