import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Get, Update } from "@/services/https";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Pagination from "@/components/ui/Pagination";
import { useNavigate } from "react-router-dom";
import Select from "@/components/ui/Select";

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

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading } = useQuery({
    queryKey: ["deceaseds", debouncedSearch, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      params.append("page", page);
      params.append("limit", limit);
      const res = await Get(`/deceaseds?${params.toString()}`);
      return res.data;
    },
    placeholderData: (previousData) => previousData,
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

  const openModal = (deceased) => {
    setEditingDeceased(deceased);
    setFormData({
      fullName: deceased.fullName || "",
      deathCertificateNumber: deceased.deathCertificateNumber || "",
      burialDate: deceased.burialDate || "",
      burialType: deceased.burialType || "coffin",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDeceased(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const deceasedList = data?.rows || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">ทะเบียนศพส่วนกลาง</h1>
          <p className="text-sm text-[#555]">
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
                    className="hover:bg-gray-50/50 transition-colors"
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
                      ) : (
                        <span className="text-xs text-gray-400">
                          ไม่ระบุตำแหน่ง
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#333] text-center">
                      {deceased.burialDate
                        ? dayjs(deceased.burialDate).format("DD/MM/YYYY")
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
                              {deceased.contact.email && (
                                <p className="text-[10px] text-gray-400">
                                  {deceased.contact.email}
                                </p>
                              )}
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
                          className="h-8 w-12 px-3 text-xs font-medium"
                          onClick={() => navigate(`/plots/${deceased.plotId}`)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          className="h-8 w-12 text-xs font-medium"
                          onClick={() => openModal(deceased)}
                        >
                          <Trash2 size={14} />
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
                <Label>วันที่บรรจุ (ค.ศ.)</Label>
                <Input
                  type="date"
                  value={
                    formData.burialDate
                      ? dayjs(formData.burialDate).format("YYYY-MM-DD")
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
    </div>
  );
};

export default DeceasedRegistry;
