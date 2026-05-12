import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  History as HistoryIcon,
  Eye,
  Info as InfoIcon,
  Phone,
  MapPin,
  X as XIcon,
  ArrowRight,
  Trash2,
  Pencil,
} from "lucide-react";
import { Get, Post, Update, Delete } from "@/services/https";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Label from "@/components/ui/Label";
import HistoryItem from "@/components/ui/HistoryItem";

const RELATIONSHIP_OPTIONS = [
  { label: "คู่สมรส", value: "คู่สมรส" },
  { label: "บุตร", value: "บุตร" },
  { label: "บิดา/มารดา", value: "บิดา/มารดา" },
  { label: "พี่น้อง", value: "พี่น้อง" },
  { label: "หลาน", value: "หลาน" },
  { label: "ญาติ", value: "ญาติ" },
  { label: "อื่นๆ", value: "อื่นๆ" },
];

const BURIAL_TYPE_OPTIONS = [
  { label: "โลงศพ", value: "coffin" },
  { label: "อัฐิ", value: "ashes" },
];

const PlotDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [bookingForm, setBookingForm] = useState({
    type: "occupied", // occupied or reserved
    booking: {
      startDate: "",
      endDate: "",
    },
    deceaseds: [],
    members: [],
  });
  const [activeTab, setActiveTab] = useState("current");
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    year: dayjs().year(),
    paymentDate: dayjs().format("YYYY-MM-DD"),
    paymentType: "cash",
    notes: "",
  });

  const { data: plot, isLoading } = useQuery({
    queryKey: ["plot", id],
    queryFn: async () => {
      const res = await Get(`/plots/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const hasActiveContract = plot?.contracts?.some((c) => !c.isArchived);
  const hasDeceased = plot?.occupants?.some((o) => !o.isArchived);

  useEffect(() => {
    if (plot) {
      const activeContract = plot.contracts?.find((c) => !c.isArchived);
      const activeOccupants =
        plot.occupants?.filter((o) => !o.isArchived) || [];
      const type = activeOccupants.length > 0 ? "occupied" : "reserved";

      const startDate =
        activeContract?.startDate || dayjs().format("YYYY-MM-DD");
      const endDate =
        activeContract?.endDate ||
        dayjs(startDate).add(30, "year").format("YYYY-MM-DD");

      setBookingForm({
        type,
        booking: { startDate, endDate },
        deceaseds:
          activeOccupants.length > 0
            ? activeOccupants.map((o) => ({
                id: o.id,
                fullName: o.fullName || "",
                deathCertificateNumber: o.deathCertificateNumber || "",
                age: o.age || "",
                relationship: o.relationship || "",
                burialDate: o.burialDate || "",
                burialType: o.burialType || "coffin",
                contactId: o.contactId,
                contactIndex:
                  plot.members?.findIndex((m) => m.id === o.contactId) ?? 0,
              }))
            : [],
        members: plot.members?.map((m) => ({
          id: m.id,
          fullName: m.fullName || "",
          phone: m.phone || "",
          isMember: m.isMember || false,
          address: m.address || "",
        })) || [{ fullName: "", phone: "", isMember: false, address: "" }],
      });
    }
  }, [plot]);

  const saveBookingMutation = useMutation({
    mutationFn: (payload) => {
      // Validation
      if (payload.type === "occupied") {
        const validDeceaseds = payload.deceaseds?.filter((d) =>
          d.fullName?.trim(),
        );
        if (!validDeceaseds || validDeceaseds.length === 0) {
          throw new Error(
            "หากเลือกสถานะ 'บรรจุ' ต้องระบุข้อมูลผู้ล่วงลับอย่างน้อย 1 ท่าน",
          );
        }
      }

      if (
        !payload.members ||
        payload.members.filter((m) => m.fullName?.trim()).length === 0
      ) {
        throw new Error("ต้องระบุข้อมูลผู้ติดต่ออย่างน้อย 1 ท่าน");
      }

      const finalPayload = {
        ...payload,
        deceaseds: payload.deceaseds?.filter((d) => d.fullName?.trim()) || [],
        members: payload.members?.filter((m) => m.fullName?.trim()) || [],
      };

      const hasActiveContract = plot?.contracts?.some((c) => !c.isArchived);
      return hasActiveContract
        ? Update(`/plots/${id}/booking`, finalPayload)
        : Post(`/plots/${id}/book`, finalPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["plots"]);
      queryClient.invalidateQueries(["plot", id]);
      addToast("บันทึกข้อมูลเรียบร้อยแล้ว", "success");
      navigate("/plots");
    },
    onError: (err) => {
      addToast(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        "error",
      );
    },
  });

  const renewMutation = useMutation({
    mutationFn: () => Post(`/plots/${id}/renew`),
    onSuccess: () => {
      queryClient.invalidateQueries(["plots"]);
      queryClient.invalidateQueries(["plot", id]);
      addToast("ต่ออายุสัญญาเรียบร้อยแล้ว (+30 ปี)", "success");
      setShowRenewModal(false);
    },
    onError: (err) => {
      addToast(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการต่ออายุสัญญา",
        "error",
      );
    },
  });
  const payFeeMutation = useMutation({
    mutationFn: (payload) => {
      if (editingPayment) {
        return Update(`/plots/${id}/payments/${editingPayment.id}`, payload);
      }
      return Post(`/plots/${id}/pay-annual-fee`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["plot", id]);
      addToast(
        editingPayment
          ? "แก้ไขข้อมูลการชำระเงินเรียบร้อยแล้ว"
          : "บันทึกการชำระเงินเรียบร้อยแล้ว",
        "success",
      );
      setShowPaymentModal(false);
      setEditingPayment(null);
    },
    onError: (err) => {
      addToast(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        "error",
      );
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId) => Delete(`/plots/${id}/payments/${paymentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["plot", id]);
      addToast("ลบข้อมูลการชำระเงินเรียบร้อยแล้ว", "success");
    },
    onError: (err) => {
      addToast(err.response?.data?.message || "ไม่สามารถลบข้อมูลได้", "error");
    },
  });

  const moveToDeceased = (index) => {
    const member = bookingForm.members[index];
    if (!member.fullName) return;

    const newDeceased = {
      fullName: member.fullName,
      deathCertificateNumber: "",
      age: "",
      relationship: "",
      burialType: "coffin",
      contactIndex: 0,
    };

    const newMembers = bookingForm.members.filter((_, i) => i !== index);
    const updatedMembers =
      newMembers.length > 0
        ? newMembers
        : [{ fullName: "", phone: "", isMember: false, address: "" }];

    setBookingForm({
      ...bookingForm,
      type: "occupied",
      deceaseds: [...bookingForm.deceaseds, newDeceased],
      members: updatedMembers,
    });
    addToast(
      `ย้ายคุณ ${member.fullName} ไปยังรายชื่อผู้ล่วงลับแล้ว`,
      "success",
    );
  };

  if (isLoading)
    return <div className="p-8 text-center">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/plots")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#111]">
              รายละเอียดและแก้ไขข้อมูล
            </h1>
            <p className="text-[#555] text-sm">
              หลุมหมายเลข:{" "}
              <span className="font-bold text-[#003527]">
                {plot?.plotNumber}
              </span>{" "}
              | โซน: {plot?.zone} | สถานะ:{" "}
              <span className="font-bold">
                {plot?.status === "available"
                  ? "ว่าง"
                  : plot?.status === "occupied"
                    ? "บรรจุแล้ว"
                    : plot?.status === "reserved"
                      ? "จองแล้ว"
                      : plot?.status === "expired"
                        ? "หมดสัญญา"
                        : plot?.status}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="w-32"
            onClick={() => navigate("/plots")}
          >
            ย้อนกลับ
          </Button>
          {activeTab === "current" && (
            <>
              {plot?.contracts?.length > 0 &&
                dayjs(plot.contracts[0].endDate).diff(dayjs(), "year") <= 1 && (
                  <Button
                    variant="outline"
                    className="w-48"
                    onClick={() => setShowRenewModal(true)}
                    loading={renewMutation.isPending}
                  >
                    <HistoryIcon size={16} className="mr-2" /> ต่ออายุสัญญา
                  </Button>
                )}
              <Button
                className="w-48"
                onClick={() => saveBookingMutation.mutate(bookingForm)}
                loading={saveBookingMutation.isPending}
              >
                บันทึกข้อมูล
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {["current", "history", "payments"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 px-6 text-sm font-bold transition-all border-b-2 ${
              activeTab === tab
                ? "border-[#003527] text-[#003527]"
                : "border-transparent text-[#555] hover:text-[#111]"
            }`}
          >
            {tab === "current"
              ? "ข้อมูลปัจจุบัน"
              : tab === "history"
                ? "ประวัติการทำรายการ"
                : "ประวัติการชำระเงิน"}
          </button>
        ))}
      </div>

      {activeTab === "current" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Booking Type */}
            <div className="bg-white p-6 rounded-md border border-gray-200 space-y-6">
              <div className="flex items-center gap-2 text-[#111] font-semibold">
                เลือกประเภทการจอง
              </div>
              <div className="flex gap-4">
                {["occupied", "reserved"].map((type) => (
                  <button
                    key={type}
                    disabled={type === "reserved" && hasDeceased}
                    onClick={() => {
                      setBookingForm({
                        ...bookingForm,
                        type: type,
                      });
                    }}
                    className={`flex-1 py-4 px-4 rounded-md border-2 transition-all flex flex-col items-center gap-1 ${
                      bookingForm.type === type
                        ? "border-[#003527] bg-[#f0fdf4] text-[#003527]"
                        : type === "reserved" && hasDeceased
                          ? "border-gray-50 bg-gray-50 text-[#bbb] cursor-not-allowed"
                          : "border-gray-100 text-[#555] hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-bold text-base">
                      {type === "occupied" ? "บรรจุ" : "ยังไม่บรรจุ"}
                    </span>
                    <span className="text-sm opacity-70 text-center">
                      {type === "occupied"
                        ? "ต้องระบุข้อมูลผู้ล่วงลับ"
                        : "ต้องระบุข้อมูลผู้ติดต่อ"}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 text-[#111] font-semibold">
                  ข้อมูลการจอง
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label required>วันที่เริ่มจอง</Label>
                    <Input
                      type="date"
                      value={bookingForm.booking.startDate}
                      disabled={hasActiveContract}
                      className={
                        hasActiveContract ? "bg-gray-50 cursor-not-allowed" : ""
                      }
                      onChange={(e) => {
                        const start = e.target.value;
                        const end = dayjs(start)
                          .add(30, "year")
                          .format("YYYY-MM-DD");
                        setBookingForm({
                          ...bookingForm,
                          booking: { startDate: start, endDate: end },
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>วันที่สิ้นสุด (30 ปี)</Label>
                    <Input
                      type="date"
                      value={bookingForm.booking.endDate}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Deceaseds */}
            {bookingForm.type === "occupied" && (
              <div className="bg-white p-6 rounded-md border border-gray-200 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2 text-[111] font-semibold">
                    รายชื่อผู้ล่วงลับ
                  </div>
                  <Button
                    variant="outline"
                    className="h-8"
                    onClick={() =>
                      setBookingForm({
                        ...bookingForm,
                        deceaseds: [
                          ...bookingForm.deceaseds,
                          {
                            fullName: "",
                            deathCertificateNumber: "",
                            age: "",
                            relationship: "",
                            burialDate: dayjs().format("YYYY-MM-DD"),
                            burialType: "coffin",
                            contactIndex: 0,
                          },
                        ],
                      })
                    }
                  >
                    + เพิ่มรายชื่อ
                  </Button>
                </div>
                <div className="space-y-4">
                  {bookingForm.deceaseds.map((d, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gray-50/50 rounded-md border border-gray-200 space-y-4 relative"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-[111] font-semibold">
                          ลำดับที่ {idx + 1}
                        </div>
                        {bookingForm.deceaseds.length > 1 && (
                          <button
                            onClick={() =>
                              setBookingForm({
                                ...bookingForm,
                                deceaseds: bookingForm.deceaseds.filter(
                                  (_, i) => i !== idx,
                                ),
                              })
                            }
                            className="text-rose-500 hover:bg-rose-50 p-1 rounded-full"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label>ผู้ติดต่อที่ดูแล</Label>
                          <Select
                            value={d.contactIndex}
                            onChange={(val) => {
                              const newList = [...bookingForm.deceaseds];
                              newList[idx].contactIndex = val;
                              setBookingForm({
                                ...bookingForm,
                                deceaseds: newList,
                              });
                            }}
                            options={bookingForm.members.map((m, mIdx) => ({
                              label: m.fullName || `ผู้ติดต่อคนที่ ${mIdx + 1}`,
                              value: mIdx,
                            }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>ความสัมพันธ์</Label>
                          <Select
                            value={d.relationship}
                            onChange={(val) => {
                              const newList = [...bookingForm.deceaseds];
                              newList[idx].relationship = val;
                              setBookingForm({
                                ...bookingForm,
                                deceaseds: newList,
                              });
                            }}
                            options={RELATIONSHIP_OPTIONS}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label required>ชื่อ-นามสกุล</Label>
                        <Input
                          placeholder="ระบุชื่อผู้ล่วงลับ"
                          value={d.fullName}
                          onChange={(e) => {
                            const newList = [...bookingForm.deceaseds];
                            newList[idx].fullName = e.target.value;
                            setBookingForm({
                              ...bookingForm,
                              deceaseds: newList,
                            });
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label required>อายุ (ปี)</Label>
                          <Input
                            type="number"
                            placeholder="อายุ"
                            value={d.age}
                            onChange={(e) => {
                              const newList = [...bookingForm.deceaseds];
                              newList[idx].age = e.target.value;
                              setBookingForm({
                                ...bookingForm,
                                deceaseds: newList,
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label required>วันที่ฝัง/บรรจุ</Label>
                          <Input
                            type="date"
                            value={d.burialDate}
                            onChange={(e) => {
                              const newList = [...bookingForm.deceaseds];
                              newList[idx].burialDate = e.target.value;
                              setBookingForm({
                                ...bookingForm,
                                deceaseds: newList,
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>เลขใบมรณบัตร</Label>
                          <Input
                            placeholder="ระบุเลขใบมรณบัตร"
                            value={d.deathCertificateNumber}
                            onChange={(e) => {
                              const newList = [...bookingForm.deceaseds];
                              newList[idx].deathCertificateNumber =
                                e.target.value;
                              setBookingForm({
                                ...bookingForm,
                                deceaseds: newList,
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label required>ประเภทการบรรจุ</Label>
                          <Select
                            value={d.burialType}
                            onChange={(val) => {
                              const newList = [...bookingForm.deceaseds];
                              newList[idx].burialType = val;
                              setBookingForm({
                                ...bookingForm,
                                deceaseds: newList,
                              });
                            }}
                            options={BURIAL_TYPE_OPTIONS}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Members / Contacts */}
          <div className="bg-white p-6 rounded-md border border-gray-200 space-y-4 h-fit">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[111] font-semibold">
                ผู้ติดต่อหลัก
              </div>
              <Button
                variant="outline"
                className="h-8"
                onClick={() =>
                  setBookingForm({
                    ...bookingForm,
                    members: [
                      ...bookingForm.members,
                      {
                        fullName: "",
                        phone: "",
                        email: "",
                        isMember: false,
                        address: "",
                      },
                    ],
                  })
                }
              >
                + เพิ่มผู้ติดต่อ
              </Button>
            </div>
            <div className="space-y-6">
              {bookingForm.members.map((member, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gray-50/50 rounded-md border border-gray-200 space-y-4 relative"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 text-sm text-[111] font-semibold">
                        ลำดับที่ {idx + 1}
                      </div>
                      <div className="flex bg-gray-100 rounded p-0.5 ml-2">
                        <button
                          disabled={idx === 0}
                          onClick={() => {
                            const newMembers = [...bookingForm.members];
                            [newMembers[idx], newMembers[idx - 1]] = [
                              newMembers[idx - 1],
                              newMembers[idx],
                            ];
                            setBookingForm({
                              ...bookingForm,
                              members: newMembers,
                            });
                          }}
                          className="p-1 disabled:opacity-30"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          disabled={idx === bookingForm.members.length - 1}
                          onClick={() => {
                            const newMembers = [...bookingForm.members];
                            [newMembers[idx], newMembers[idx + 1]] = [
                              newMembers[idx + 1],
                              newMembers[idx],
                            ];
                            setBookingForm({
                              ...bookingForm,
                              members: newMembers,
                            });
                          }}
                          className="p-1 disabled:opacity-30"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {member.fullName && hasActiveContract && (
                        <button
                          onClick={() => moveToDeceased(idx)}
                          className="text-[10px] font-bold text-amber-600 border border-amber-200 bg-amber-50 px-2 py-1 rounded hover:bg-amber-100 transition-colors"
                        >
                          ย้ายเป็นผู้ล่วงลับ
                        </button>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={member.isMember}
                          onChange={(e) => {
                            const newMembers = [...bookingForm.members];
                            newMembers[idx].isMember = e.target.checked;
                            setBookingForm({
                              ...bookingForm,
                              members: newMembers,
                            });
                          }}
                          className="w-4 h-4 text-[#003527] rounded focus:ring-[#003527]"
                        />
                        <span className="text-xs text-gray-600">
                          สมาชิกสมาคม
                        </span>
                      </label>
                      {bookingForm.members.length > 1 && (
                        <button
                          onClick={() =>
                            setBookingForm({
                              ...bookingForm,
                              members: bookingForm.members.filter(
                                (_, i) => i !== idx,
                              ),
                            })
                          }
                          className="text-rose-500 hover:bg-rose-50 p-1 rounded-full"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label required>ชื่อ-นามสกุล</Label>
                    <Input
                      value={member.fullName}
                      onChange={(e) => {
                        const newMembers = [...bookingForm.members];
                        newMembers[idx].fullName = e.target.value;
                        setBookingForm({
                          ...bookingForm,
                          members: newMembers,
                        });
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label required>เบอร์โทรศัพท์</Label>
                      <Input
                        maxLength={10}
                        value={member.phone}
                        onChange={(e) => {
                          const newMembers = [...bookingForm.members];
                          newMembers[idx].phone = e.target.value;
                          setBookingForm({
                            ...bookingForm,
                            members: newMembers,
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>อีเมล</Label>
                      <Input
                        type="email"
                        placeholder="example@domain.com"
                        value={member.email || ""}
                        onChange={(e) => {
                          const newMembers = [...bookingForm.members];
                          newMembers[idx].email = e.target.value;
                          setBookingForm({
                            ...bookingForm,
                            members: newMembers,
                          });
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>ที่อยู่</Label>
                    <Textarea
                      rows={2}
                      value={member.address}
                      onChange={(e) => {
                        const newMembers = [...bookingForm.members];
                        newMembers[idx].address = e.target.value;
                        setBookingForm({ ...bookingForm, members: newMembers });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === "history" ? (
        <div className="bg-white p-6 rounded-md border border-gray-200">
          <div className="flex items-center gap-2 text-[#111] font-semibold">
            เลือกประเภทประวัติการทำรายการย้อนหลังการจอง
          </div>
          <div className="mt-6 space-y-3">
            {plot?.logs?.length > 0 ? (
              plot.logs.map((log) => <HistoryItem key={log.id} log={log} />)
            ) : (
              <p className="py-20 text-center text-[#999]">
                ยังไม่มีประวัติการทำรายการ
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
            <div>
              <div className="flex items-center gap-2 text-[#111] font-semibold">
                ประวัติการชำระเงินรายปี
              </div>
              <p className="text-xs text-[#111]">
                ชำระทุก 1 ปี เพื่อรักษาความต่อเนื่องของสัญญา
              </p>
            </div>
            {plot?.contracts?.length > 0 && (
              <Button
                className="h-8 bg-[#003527] text-white rounded-md px-6"
                onClick={() => {
                  setPaymentForm({
                    amount: "",
                    year: dayjs().year(),
                    paymentDate: dayjs().format("YYYY-MM-DD"),
                    paymentType: "cash",
                    notes: "",
                  });
                  setEditingPayment(null);
                  setShowPaymentModal(true);
                }}
              >
                เพิ่มการชำระเงิน
              </Button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-bold text-[#777] uppercase tracking-wider">
                    ปีที่ชำระ
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-[#777] uppercase tracking-wider">
                    จำนวนเงิน
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-[#777] uppercase tracking-wider">
                    วันที่ชำระ
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-[#777] uppercase tracking-wider">
                    ประเภท/หมายเหตุ
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-[#777] uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-[#777] uppercase tracking-wider text-right">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {plot?.contracts?.flatMap((c) => c.payments || []).length >
                0 ? (
                  plot.contracts
                    .flatMap((c) => c.payments || [])
                    .sort((a, b) => b.year - a.year)
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-bold text-[#111]">
                          พ.ศ. {p.year + 543}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#555]">
                          {Number(p.amount).toLocaleString()} บาท
                        </td>
                        <td className="px-6 py-4 text-sm text-[#555]">
                          {dayjs(p.paymentDate).format("DD/MM/YYYY")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-700">
                              {p.paymentType === "cash" ? "เงินสด" : "เงินโอน"}
                            </span>
                            {p.notes && (
                              <span className="text-[10px] text-[#999]">
                                {p.notes}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 uppercase">
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingPayment(p);
                                setPaymentForm({
                                  amount: p.amount,
                                  year: p.year,
                                  paymentDate: dayjs(p.paymentDate).format(
                                    "YYYY-MM-DD",
                                  ),
                                  paymentType: p.paymentType,
                                  notes: p.notes || "",
                                });
                                setShowPaymentModal(true);
                              }}
                              className="p-1 hover:bg-gray-100 rounded text-blue-600 transition-colors"
                              title="แก้ไข"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "ยืนยันการลบข้อมูลการชำระเงิน?",
                                  )
                                ) {
                                  deletePaymentMutation.mutate(p.id);
                                }
                              }}
                              className="p-1 hover:bg-gray-100 rounded text-red-600 transition-colors"
                              title="ลบ"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-20 text-center text-[#999]"
                    >
                      ยังไม่มีประวัติการชำระเงิน
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-md border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-[#f0fdf4] rounded-full flex items-center justify-center mx-auto">
                <HistoryIcon size={32} className="text-[#003527]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">
                  ยืนยันการต่ออายุสัญญา
                </h3>
                <p className="text-[#777] text-sm">
                  คุณต้องการต่ออายุสัญญาสำหรับหลุมหมายเลข{" "}
                  <span className="font-bold text-[#003527]">
                    {plot?.plotNumber}
                  </span>
                </p>
                <p className="text-sm">
                  ไปอีก <span className="font-bold text-gray-900">30 ปี</span>{" "}
                  ใช่หรือไม่?
                </p>
                {plot?.contracts?.[0] && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200 text-left text-xs space-y-2">
                    <div>
                      <p className="text-[#999] font-bold uppercase tracking-widest mb-1">
                        วันเริ่มสัญญาใหม่:
                      </p>
                      <p className="font-bold text-gray-900 text-sm">
                        {dayjs(plot.contracts[0].endDate).format("DD/MM/YYYY")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#999] font-bold uppercase tracking-widest mb-1">
                        วันสิ้นสุดสัญญาใหม่:
                      </p>
                      <p className="font-bold text-gray-900 text-sm">
                        {dayjs(plot.contracts[0].endDate)
                          .add(30, "year")
                          .format("DD/MM/YYYY")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-md"
                onClick={() => setShowRenewModal(false)}
              >
                ยกเลิก
              </Button>
              <Button
                className="flex-1 rounded-md bg-[#003527] text-white"
                onClick={() => renewMutation.mutate()}
                loading={renewMutation.isPending}
              >
                ยืนยันต่อสัญญา
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#003527] text-white">
              <div>
                <h2 className="text-lg font-bold">
                  {editingPayment
                    ? "แก้ไขการชำระเงิน"
                    : "บันทึกการชำระเงินรายปี"}
                </h2>
                <p className="text-xs opacity-70">
                  {editingPayment
                    ? "แก้ไขรายละเอียดการชำระเงินที่ต้องการ"
                    : "ระบุรายละเอียดการชำระเงินค่าดูแลสุสาน"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setEditingPayment(null);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label required>ปีที่ชำระ</Label>
                  <Select
                    value={paymentForm.year}
                    onChange={(val) =>
                      setPaymentForm({ ...paymentForm, year: parseInt(val) })
                    }
                    options={Array.from({ length: 61 }, (_, i) => {
                      const year = dayjs().year() - 30 + i;
                      return { label: `${year}`, value: year };
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <Label required>จำนวนเงิน (บาท)</Label>
                  <Input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, amount: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label required>วันที่ชำระเงิน</Label>
                <Input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentDate: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label required>ประเภทการชำระ</Label>
                <div className="flex gap-2">
                  {[
                    { label: "เงินสด", value: "cash" },
                    { label: "เงินโอน", value: "transfer" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() =>
                        setPaymentForm({
                          ...paymentForm,
                          paymentType: type.value,
                        })
                      }
                      className={`flex-1 py-2 px-4 rounded-sm border text-sm font-bold transition-all ${
                        paymentForm.paymentType === type.value
                          ? "bg-[#003527] text-white border-[#003527]"
                          : "bg-white text-[#777] border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label>หมายเหตุ</Label>
                <Textarea
                  placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)..."
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPaymentModal(false)}
              >
                ยกเลิก
              </Button>
              <Button
                className="flex-1"
                loading={payFeeMutation.isPending}
                onClick={() => payFeeMutation.mutate(paymentForm)}
              >
                บันทึกการชำระเงิน
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlotDetail;
