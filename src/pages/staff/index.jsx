import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  User,
  Mail,
  X,
  Search,
} from "lucide-react";
import { GetSearch, Post, Update, Delete } from "@services/https";
import { useToast } from "@contexts/ToastContext";
import { useAuth } from "@contexts/AuthContext";
import Button from "@components/ui/Button";
import Input from "@components/ui/Input";
import Label from "@components/ui/Label";
import Select from "@components/ui/Select";
import Pagination from "@components/ui/Pagination";

const Staff = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { role: currentRole, user: currentUser } = useAuth();

  // เช็คสิทธิ์การแก้ไขข้อมูล
  const canEdit = (targetUser) => {
    if (!targetUser) return false;
    if (currentRole !== "admin") return false;
    if (targetUser.role === "admin" && targetUser.id !== currentUser?.id) {
      return false;
    }
    return true;
  };

  // เช็คสิทธิ์การลบข้อมูล
  const canDelete = (targetUser) => {
    if (!targetUser) return false;
    if (currentRole !== "admin") return false;
    if (targetUser.id === currentUser?.id) return false;
    if (targetUser.role === "admin") return false;
    return true;
  };

  // State สำหรับ Modal และการแก้ไข
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    limit: 10,
    role: "",
  });

  // ทำ Debounce สำหรับการค้นหา (หน่วงเวลา 500ms)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // รีเซ็ตไปหน้าแรกเมื่อมีการค้นหาใหม่
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // รีเซ็ตไปหน้าแรกเมื่อมีการเปลี่ยนบทบาท
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters.role]);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    fullName: "",
    role: "staff",
  });

  // ดึงข้อมูลพนักงาน (ใช้ debouncedSearch แทน search)
  const {
    data: users,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["users", debouncedSearch, currentPage, filters],
    queryFn: async () => {
      const response = await GetSearch("/users", {
        params: {
          search: debouncedSearch,
          limit: filters.limit,
          offset: (currentPage - 1) * filters.limit,
          role: filters.role,
        },
      });
      return response.data;
    },
    placeholderData: (previousData) => previousData, // รักษาข้อมูลเดิมไว้ขณะโหลดใหม่
  });

  // Mutation สำหรับสร้าง/แก้ไข
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingUser) {
        const response = await Update(`/users/${editingUser.id}`, data);
        return response.data;
      }
      const response = await Post("/users", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      addToast(
        editingUser ? "แก้ไขข้อมูลพนักงานสำเร็จ" : "สร้างพนักงานใหม่สำเร็จ",
        "success",
      );
      closeModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || "เกิดข้อผิดพลาด", "error");
    },
  });

  // Mutation สำหรับการลบ
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await Delete(`/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      addToast("ลบพนักงานเรียบร้อยแล้ว", "success");
    },
    onError: () => {
      addToast("ไม่สามารถลบข้อมูลได้", "error");
    },
  });

  const openModal = (user = null) => {
    if (user) {
      if (!canEdit(user)) {
        addToast("คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้งานรายนี้", "error");
        return;
      }
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: "", // ไม่แสดงรหัสผ่านเดิม
        email: user.email || "",
        fullName: user.fullName || "",
        role: user.role || "staff",
      });
    } else {
      if (currentRole !== "admin") {
        addToast("คุณไม่มีสิทธิ์เพิ่มพนักงานใหม่", "error");
        return;
      }
      setEditingUser(null);
      setFormData({
        username: "",
        password: "",
        email: "",
        fullName: "",
        role: "staff",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleDelete = (id) => {
    const targetUser = users?.rows?.find((u) => u.id === id);
    if (!canDelete(targetUser)) {
      if (targetUser?.id === currentUser?.id) {
        addToast("คุณไม่สามารถลบข้อมูลของตนเองได้", "error");
      } else {
        addToast("คุณไม่มีสิทธิ์ในการจัดการข้อมูลผู้ใช้งานรายนี้", "error");
      }
      return;
    }
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานรายนี้?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading)
    return (
      <div className="p-8 text-center text-[#777]">กำลังโหลดข้อมูล...</div>
    );

  return (
    <div className="p-6 mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#111]">บริหารพนักงาน</h1>
          <p className="text-base text-[#555]">
            จัดการบัญชีผู้ใช้งานพนักงานและสิทธิ์การเข้าถึง
          </p>
        </div>
        {currentRole === "admin" && (
          <Button onClick={() => openModal()}>
            <Plus size={18} />
            เพิ่มพนักงานใหม่
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 w-full">
          <Label>ค้นหา</Label>
          <Input
            placeholder="ค้นหาชื่อ หรือ อีเมล..."
            className="rounded-md border-gray-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative flex-1 w-full">
          <Label>สถานะ</Label>
          <Select
            size="sm"
            options={[
              { label: "ทุกสิทธิ์", value: "" },
              { label: "ผู้ดูแลระบบ", value: "admin" },
              { label: "พนักงาน", value: "staff" },
            ]}
            value={filters.role}
            onChange={(val) => setFilters({ ...filters, role: val })}
            className="border-gray-200 w-full md:w-48"
          />
        </div>
      </div>

      <div className="bg-white rounded-md border border-[#eceeeb] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#eceeeb]">
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider">
                  ข้อมูลพนักงาน
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider">
                  ชื่อผู้ใช้งาน
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider text-center">
                  บทบาทสิทธิ์
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider text-center">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users?.rows?.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-20 text-center text-[#999]"
                  >
                    ไม่พบข้อมูลพนักงาน
                  </td>
                </tr>
              ) : (
                users?.rows?.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-[#777]">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-[#111]">
                            {user.fullName || "-"}
                          </p>
                          <p className="text-[#777]">{user.email || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#333]">
                      {user.username}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 border border-green-100 rounded text-xs font-medium">
                          <Shield size={12} />
                          {user.role === "admin" ? "ผู้ดูแลระบบ" : "พนักงาน"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        {canEdit(user) ? (
                          <Button
                            variant="outline"
                            className="h-8 w-12 text-xs font-medium"
                            onClick={() => openModal(user)}
                          >
                            <Pencil size={14} />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="h-8 w-12 text-xs font-medium opacity-40 cursor-not-allowed"
                            disabled
                            title="ไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้งานรายนี้"
                          >
                            <Pencil size={14} />
                          </Button>
                        )}
                        {canDelete(user) ? (
                          <Button
                            variant="outline"
                            className="h-8 w-12 p-0 flex items-center justify-center text-xs font-medium border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-md"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="h-8 w-12 p-0 flex items-center justify-center text-xs font-medium border-gray-200 text-gray-400 opacity-40 cursor-not-allowed rounded-md"
                            disabled
                            title={
                              user.id === currentUser?.id
                                ? "ไม่สามารถลบข้อมูลของตนเองได้"
                                : "ไม่มีสิทธิ์ลบข้อมูลผู้ใช้งานรายนี้"
                            }
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil((users?.count || 0) / filters.limit)}
          onPageChange={setCurrentPage}
          totalCount={users?.count || 0}
          showingCount={users?.rows?.length || 0}
        />
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#003527] text-white">
              <div>
                <h2 className="text-lg font-bold">
                  {editingUser ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
                </h2>
                <p className="text-xs opacity-70">
                  ระบุรายละเอียดและกำหนดสิทธิ์การเข้าถึงระบบ
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
              <div className="space-y-1">
                <Label htmlFor="fullName">ชื่อ-นามสกุล</Label>
                <Input
                  id="fullName"
                  placeholder="กรอกชื่อ-นามสกุล"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@domain.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="username" required>
                  ชื่อผู้ใช้งาน
                </Label>
                <Input
                  id="username"
                  placeholder="สำหรับใช้ Login"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" required={!editingUser}>
                  รหัสผ่าน
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={
                    editingUser
                      ? "ปล่อยว่างไว้หากไม่ต้องการเปลี่ยน"
                      : "รหัสผ่านขั้นต่ำ 6 ตัวอักษร"
                  }
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingUser}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="role">บทบาทในระบบ</Label>
                <Select
                  id="role"
                  options={[
                    { label: "พนักงาน (Staff)", value: "staff" },
                    { label: "ผู้ดูแลระบบ (Admin)", value: "admin" },
                  ]}
                  value={formData.role}
                  onChange={(val) => setFormData({ ...formData, role: val })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={closeModal}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  loading={saveMutation.isPending}
                >
                  {saveMutation.isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
