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
import { Get, Post, Update, Delete } from "@/services/https";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
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
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: memberDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["member", selectedMemberId],
    queryFn: async () => {
      if (!selectedMemberId) return null;
      const res = await Get(`/members/${selectedMemberId}`);
      return res.data;
    },
    enabled: !!selectedMemberId,
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

  const createMutation = useMutation({
    mutationFn: (data) => Post("/members", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["members"]);
      addToast("เพิ่มข้อมูลสมาชิกเรียบร้อยแล้ว", "success");
      closeModal();
    },
    onError: (err) => {
      addToast(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการเพิ่มข้อมูล",
        "error",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Delete(`/members/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["members"]);
      addToast("ลบข้อมูลสมาชิกเรียบร้อยแล้ว", "success");
      setIsDeleteConfirmOpen(false);
      setMemberToDelete(null);
    },
    onError: (err) => {
      addToast(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการลบข้อมูล",
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
    if (editingMember) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const openCreateModal = () => {
    setEditingMember(null);
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      address: "",
      isMember: true,
    });
    setIsModalOpen(true);
  };

  const triggerDelete = (member) => {
    setMemberToDelete(member);
    setIsDeleteConfirmOpen(true);
  };

  const members = data?.rows || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const associatedPlots = [];
  if (memberDetail?.plot) {
    associatedPlots.push(memberDetail.plot);
  }
  memberDetail?.contracts?.forEach((contract) => {
    if (
      contract.plot &&
      !associatedPlots.some((p) => p.id === contract.plot.id)
    ) {
      associatedPlots.push(contract.plot);
    }
  });

  return (
    <div className="p-6 mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#111]">ทะเบียนสมาชิก</h1>
            <p className="text-base text-[#555]">
              ระบบบริหารจัดการข้อมูลสมาชิกและผู้ติดต่อหลักทั้งหมด
            </p>
          </div>
        </div>
        <Button
          className="w-48 rounded-md bg-[#003527] hover:bg-[#004d39] text-white"
          onClick={openCreateModal}
        >
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
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider text-center">
                  สัญญา
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
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedMemberId(member.id);
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
                            {member.fullName}
                          </p>
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-2 text-sm text-[#777]">
                              <Phone size={14} />
                              {member.phone || "-"}
                            </div>
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
                    <td className="px-6 py-4 text-sm text-[#333] text-center">
                      {member.plot ? (
                        <div className="space-y-1.5 ">
                          <span>{member.contracts?.length}</span>
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
                          className="h-8 w-12 p-0 flex items-center justify-center text-xs font-medium border-gray-200 text-gray-700 hover:bg-gray-50 rounded-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(member);
                          }}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 w-12 p-0 flex items-center justify-center text-xs font-medium border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerDelete(member);
                          }}
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

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeModal}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white w-full max-w-md rounded-xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-[#003527] text-white">
              {/* <h2 className="text-lg font-bold">
                {editingMember ? "แก้ไขข้อมูลสมาชิก" : "เพิ่มสมาชิกใหม่"}
              </h2> */}
              <div>
                <h2 className="text-lg font-bold">
                  {editingMember ? "แก้ไขข้อมูลสมาชิก" : "เพิ่มสมาชิกใหม่"}
                </h2>
                <p className="text-xs opacity-70">
                  กรุณาระบุข้อมูลผู้ติดต่อ
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
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
                <Label required>เบอร์โทรศัพท์</Label>
                <Input
                  placeholder="08X-XXX-XXXX"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
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
                <Textarea
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
                      className={`flex-1 py-2 px-4 rounded-sm border text-sm font-bold transition-all ${
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
            </div>

            <div className="p-6 bg-[#f8faf6] flex gap-3 border-t border-[#eceeeb]">
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
                loading={
                  editingMember
                    ? updateMutation.isPending
                    : createMutation.isPending
                }
              >
                {editingMember ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
                <Trash2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900">
                  ยืนยันการลบข้อมูล
                </h3>
                <p className="text-sm text-[#555]">
                  คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลสมาชิก{" "}
                  <span className="font-bold text-gray-900">
                    "{memberToDelete?.fullName}"
                  </span>
                  ? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-md"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setMemberToDelete(null);
                }}
              >
                ยกเลิก
              </Button>
              <Button
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md border-rose-600"
                onClick={() => deleteMutation.mutate(memberToDelete?.id)}
                loading={deleteMutation.isPending}
              >
                ยืนยันลบ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
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
                    รายละเอียดสมาชิก
                  </h2>
                  <p className="text-sm opacity-70 mt-0.5">
                    {memberDetail?.isMember ? (
                      <span>สมาชิกสมาคม</span>
                    ) : (
                      <span> ทั่วไป</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedMemberId(null);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
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
              ) : (
                <>
                  {/* Personal Info Card */}
                  <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 space-y-3.5">
                    <p className="text-xs text-[#777] uppercase font-bold tracking-wider mb-1">
                      ข้อมูลติดต่อ
                    </p>
                    <div className="space-y-2">
                      <div className="text-lg font-bold text-gray-900">
                        {memberDetail?.fullName}
                      </div>
                      <div className="flex items-start gap-4 mt-1.5 text-base text-gray-600">
                        <div className="flex flex-col items-start text-gray-600 gap-1.5">
                          <span className="flex items-center gap-1.5">
                            <Phone size={15} className="text-gray-600" />
                            {memberDetail.phone || "N/A"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Mail size={15} className="text-gray-600" />
                            {memberDetail.email || "N/A"}
                          </span>
                        </div>
                        <span className="flex items-start gap-1.5 min-w-0">
                          <MapPin
                            size={15}
                            className="text-gray-600 shrink-0 mt-1"
                          />
                          <span className="whitespace-normal break-words">
                            {memberDetail.address || "N/A"}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Associated Plots Section */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center justify-between">
                      <span>หลุมที่รับผิดชอบ / ทำสัญญา</span>
                      <span className="text-xs font-normal text-gray-500 normal-case">
                        ทั้งหมด {associatedPlots.length} หลุม
                      </span>
                    </h3>
                    <div className="grid gap-2">
                      {associatedPlots.length > 0 ? (
                        associatedPlots.map((plot) => {
                          const contract = memberDetail?.contracts?.find(
                            (c) => c.plotId === plot.id,
                          );
                          return (
                            <div
                              key={plot.id}
                              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors flex justify-between items-center"
                            >
                              <div>
                                <p className="font-bold text-gray-900">
                                  หลุม {plot.plotNumber} (ซอย:{" "}
                                  {plot.zone || "-"})
                                </p>
                                <p className="text-xs text-[#555] mt-1.5">
                                  {contract?.contractNumber && (
                                    <span className="text-base">
                                      เลขสัญญา: {contract.contractNumber}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsDetailOpen(false);
                                  navigate(`/plots/detail/${plot.id}`);
                                }}
                                className="h-8 text-xs font-semibold rounded-md border-gray-200 text-gray-700 hover:bg-gray-50"
                              >
                                <ExternalLink size={12} className="mr-1" />
                                ดูรายละเอียดหลุม
                              </Button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-[#777] py-8 bg-gray-50/50 rounded-lg text-center border border-dashed border-gray-200">
                          ยังไม่มีหลุมที่ทำสัญญาหรือรับผิดชอบ
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Deceased Section */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center justify-between">
                      <span>ผู้ล่วงลับในความดูแล</span>
                      <span className="text-xs font-normal text-gray-500 normal-case">
                        ทั้งหมด {memberDetail?.dependents?.length || 0} คน
                      </span>
                    </h3>
                    <div className="grid gap-2">
                      {memberDetail?.dependents?.length > 0 ? (
                        memberDetail.dependents.map((deceased) => (
                          <div
                            key={deceased.id}
                            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="w-full">
                                <div className="flex justify-between items-center w-full">
                                  <p className="text-base font-bold text-gray-900">
                                    {deceased.fullName} (
                                    {deceased.relationship || "N/A"})
                                  </p>

                                  {deceased.plot && (
                                    <div className="flex flex-row items-end text-gray-600">
                                      <div className="text-right">
                                        <span
                                          className="inline-block px-2.5 py-1 bg-[#003527]/5 text-[#003527] rounded text-xs font-bold cursor-pointer"
                                          onClick={() => {
                                            setIsDetailOpen(false);
                                            navigate(
                                              `/plots/detail/${deceased.plot.id}`,
                                            );
                                          }}
                                        >
                                          หลุม {deceased.plot.plotNumber}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-start gap-4 mt-1.5 text-base text-gray-600">
                                  <div className="flex flex-col items-start text-gray-600 gap-1.5">
                                    <p className="text-base text-gray-600">
                                      อายุ: {deceased.age || "N/A"} ปี
                                    </p>
                                    <span className="flex items-center gap-1">
                                      มรณบัตร:{" "}
                                      <a
                                        href={deceased.deathCertificateImage}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center hover:underline cursor-pointer"
                                      >
                                        {deceased.deathCertificateNumber ||
                                          "N/A"}
                                      </a>
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-start text-gray-600 gap-1.5">
                                    <p className="text-base text-gray-600">
                                      บรรจุเมื่อ:{" "}
                                      {deceased.burialDate
                                        ? dayjs(deceased.burialDate).format(
                                            "DD/MM/YYYY HH:mm",
                                          )
                                        : "N/A"}
                                    </p>
                                    <p className="text-base text-gray-600">
                                      ประเภทการบรรจุ:{" "}
                                      {deceased.burialType === "coffin"
                                        ? "โลงศพ"
                                        : "อัฐิ"}
                                    </p>
                                  </div>
                                </div>
                                {/* <p className="text-xs text-[#555] mt-1 space-y-0.5">
                                  {deceased.relationship && (
                                    <span>
                                      ความสัมพันธ์: {deceased.relationship}{" "}
                                      |{" "}
                                    </span>
                                  )}
                                  {deceased.age && (
                                    <span>อายุ: {deceased.age} ปี | </span>
                                  )}
                                  {deceased.burialDate && (
                                    <span>
                                      วันที่ฝัง:{" "}
                                      {dayjs(deceased.burialDate).format(
                                        "DD/MM/YYYY",
                                      )}
                                    </span>
                                  )}
                                </p> */}
                              </div>
                            </div>
                            {deceased.plot && (
                              <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end"></div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-[#777] py-8 bg-gray-50/50 rounded-lg text-center border border-dashed border-gray-200">
                          ไม่มีข้อมูลผู้ล่วงลับในความดูแล
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#f8faf6] border-t border-[#eceeeb] flex justify-end">
              <Button
                variant="outline"
                className="w-28 rounded-md"
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedMemberId(null);
                }}
              >
                ปิด
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
