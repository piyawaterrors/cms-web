import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  UserPlus,
  Phone,
  MapPin,
  ExternalLink,
  Filter,
  CheckCircle2,
  XCircle,
  Pencil,
  X,
  Plus,
  User,
  Trash2,
  Mail,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Get, Update } from "@/services/https";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Pagination from "@/components/ui/Pagination";
import { useNavigate } from "react-router-dom";

const Members = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset to first page on filter change
  useEffect(() => {
    setPage(1);
  }, [memberFilter]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    isMember: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["members", debouncedSearch, memberFilter, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (memberFilter !== "all") params.append("isMember", memberFilter);
      params.append("page", page);
      params.append("limit", limit);
      const res = await Get(`/members?${params.toString()}`);
      return res.data; // Now returns { count, rows }
    },
    placeholderData: (previousData) => previousData,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => Update(`/members/${editingMember.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["members"]);
      addToast("อัปเดตข้อมูลสมาชิกเรียบร้อยแล้ว", "success");
      closeModal();
    },
    onError: (err) => {
      addToast(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล",
        "error",
      );
    },
  });

  const openModal = (member) => {
    setEditingMember(member);
    setFormData({
      fullName: member.fullName || "",
      phone: member.phone || "",
      email: member.email || "",
      address: member.address || "",
      isMember: member.isMember || false,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const members = data?.rows || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">ทะเบียนสมาชิก</h1>
          <p className="text-sm text-[#555]">
            ระบบบริหารจัดการข้อมูลสมาชิกและผู้ติดต่อหลักทั้งหมด
          </p>
        </div>
        <Button className="w-48 rounded-md bg-[#003527] hover:bg-[#004d39] text-white">
          <UserPlus size={18} />
          เพิ่มสมาชิกใหม่
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 w-full">
          <Label>ค้นหา</Label>
          <Input
            placeholder="ค้นหาชื่อ หรือ เบอร์โทรศัพท์..."
            className="rounded-md border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative flex-1 w-full">
          <Label>สถานะ</Label>
          <Select
            size="sm"
            options={[
              { value: "all", label: "ทั้งหมด" },
              { value: "true", label: "สมาชิกสมาคม" },
              { value: "false", label: "ไม่ใช่สมาชิก" },
            ]}
            value={memberFilter}
            onChange={setMemberFilter}
            className="border-gray-200 w-full md:w-48"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-md border border-[#eceeeb] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#eceeeb]">
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider">
                  ข้อมูลสมาชิก
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider">
                  การติดต่อ
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider text-center">
                  สถานะสมาชิก
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider">
                  หลุมและสัญญา
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
                    colSpan="5"
                    className="px-6 py-20 text-center text-[#999]"
                  >
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-20 text-center text-[#999]"
                  >
                    ไม่พบข้อมูลสมาชิก
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-[#777]">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#111]">
                            {member.fullName}
                          </p>
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-2 text-sm text-[#777]">
                              <Phone size={14} />
                              {member.phone || "-"}
                            </div>
                            {member.email && (
                              <div className="flex items-center gap-2 text-sm text-[#777]">
                                <Mail size={14} />
                                {member.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#333] max-w-[350px]">
                      <div className="flex items-start gap-2">
                        <MapPin
                          size={16}
                          className="mt-0.5 shrink-0 text-[#777]"
                        />
                        <span className="whitespace-normal break-words">
                          {member.address || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {member.isMember ? (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 border border-green-100 rounded text-xs font-medium">
                            <CheckCircle2 size={12} />
                            สมาชิก
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 text-gray-500 border border-gray-100 rounded text-xs font-medium">
                            <XCircle size={12} />
                            ทั่วไป
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#333]">
                      {member.plot ? (
                        <div className="space-y-1.5 ">
                          <div className="flex flex-col text-[#555]">
                            <span>
                              เลขหลุม: {member.plot.plotNumber} | ซอย:{" "}
                              {member.plot.zone}
                            </span>
                            {member.contracts?.[0] && (
                              <span>
                                สัญญา:{" "}
                                {dayjs(member.contracts[0].startDate).format(
                                  "DD/MM/YYYY",
                                )}{" "}
                                -{" "}
                                {dayjs(member.contracts[0].endDate).format(
                                  "DD/MM/YYYY",
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          ไม่มีข้อมูลหลุม
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-center items-center gap-2">
                        <Button
                          variant="outline"
                          className="h-8 w-12 px-3 text-xs font-medium"
                          onClick={() =>
                            member.plot && navigate(`/plots/${member.plot.id}`)
                          }
                          disabled={!member.plot}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          className="h-8 w-12 text-xs font-medium"
                          onClick={() => openModal(member)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      {/* <div className="flex flex-col justify-center items-center gap-2">
                        <Button
                          variant="outline"
                          className="h-8 w-24 px-3 text-xs font-bold uppercase rounded border-gray-200"
                          onClick={() =>
                            member.plot && navigate(`/plots/${member.plot.id}`)
                          }
                          disabled={!member.plot}
                        >
                          <ExternalLink size={14} className="mr-1" />
                          ดูหลุม
                        </Button>
                        <Button
                          className="h-8 w-24 px-3 text-xs font-bold uppercase rounded bg-[#1e293b] text-white"
                          onClick={() => openModal(member)}
                        >
                          <Pencil size={14} className="mr-1" />
                          แก้ไข
                        </Button>
                      </div> */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalCount={totalCount}
          showingCount={members.length}
        />
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#003527] text-white">
              <h2 className="text-lg font-bold">แก้ไขข้อมูลสมาชิก</h2>
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
                <Label>เบอร์โทรศัพท์</Label>
                <Input
                  placeholder="08X-XXX-XXXX"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>อีเมล</Label>
                <Input
                  type="email"
                  placeholder="example@domain.com"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>ที่อยู่</Label>
                <textarea
                  className="w-full min-h-[100px] p-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003527]/20 focus:border-[#003527] transition-all"
                  placeholder="กรอกที่อยู่ปัจจุบัน..."
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>สถานะสมาชิกสมาคม</Label>
                <div className="flex gap-2">
                  {[
                    { label: "สมาชิกสมาคม", value: true },
                    { label: "ทั่วไป", value: false },
                  ].map((status) => (
                    <button
                      key={status.label}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, isMember: status.value })
                      }
                      className={`flex-1 h-8 py-2 px-4 rounded-sm border text-xs font-bold transition-all ${
                        formData.isMember === status.value
                          ? "bg-[#003527] text-white border-[#003527]"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
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

export default Members;
