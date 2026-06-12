import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  History as HistoryIcon,
  X as XIcon,
  Trash2,
  Pencil,
  Upload,
  Image as ImageIcon,
  Printer,
} from "lucide-react";
import { Get, Post, Update, Delete } from "@/services/https";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Label from "@/components/ui/Label";
import HistoryItem from "@/components/ui/HistoryItem";
import DatePicker from "@/components/ui/DatePicker";
import TimePicker from "@/components/ui/TimePicker";
import DateTimePicker from "@/components/ui/DateTimePicker";
import { compressImage } from "@/utils/imageCompressor";

import { PrintDialog } from "@/components/ui/PrintDialog";

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

const formatNumberWithCommas = (val) => {
  if (val === undefined || val === null || val === "") return "";
  const clean = val.toString().replace(/,/g, "");
  const parts = clean.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

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
  const [uploadingCertIndexes, setUploadingCertIndexes] = useState({});
  const [isUploadingPaymentProof, setIsUploadingPaymentProof] = useState(false);
  const paymentProofInputRef = useRef(null);
  const [activeMemberDropdownIdx, setActiveMemberDropdownIdx] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    year: dayjs().year(),
    paymentDate: dayjs().format("YYYY-MM-DD"),
    paymentType: "cash",
    type: "maintenance",
    notes: "",
    paymentProofImage: "",
  });
  const [printTarget, setPrintTarget] = useState(null);

  const { data: plot, isLoading } = useQuery({
    queryKey: ["plot", id],
    queryFn: async () => {
      const res = await Get(`/plots/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: membersList } = useQuery({
    queryKey: ["all-members-lookup"],
    queryFn: async () => {
      const res = await Get("/members?limit=1000");
      return res.data?.rows || [];
    },
  });

  const { data: society } = useQuery({
    queryKey: ["society-settings"],
    queryFn: async () => {
      const res = await Get("/society");
      return res.data;
    },
  });

  const hasActiveContract = plot?.contracts?.some((c) => c.status === "active");
  const hasDeceased = plot?.occupants?.some((o) => !o.isArchived);

  useEffect(() => {
    if (plot) {
      const activeContract = plot.contracts?.find((c) => c.status === "active");
      const activeOccupants =
        plot.occupants?.filter((o) => !o.isArchived) || [];
      const type = plot.isCommonPlot
        ? "occupied"
        : activeOccupants.length > 0
          ? "occupied"
          : "reserved";

      const startDate =
        activeContract?.startDate || dayjs().format("YYYY-MM-DD");
      const endDate =
        activeContract?.endDate ||
        dayjs(startDate).add(30, "year").format("YYYY-MM-DD");

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBookingForm({
        type,
        booking: { startDate, endDate },
        deceaseds:
          activeOccupants.length > 0
            ? activeOccupants.map((o) => ({
                id: o.id,
                fullName: o.fullName || "",
                deathCertificateNumber: o.deathCertificateNumber || "",
                deathCertificateImage: o.deathCertificateImage || "",
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
          email: m.email || "",
          lineId: m.lineId || "",
          isMember: m.isMember || false,
          address: m.address || "",
        })) || [
          {
            fullName: "",
            phone: "",
            email: "",
            lineId: "",
            isMember: false,
            address: "",
          },
        ],
      });
    }
  }, [plot]);

  useEffect(() => {
    if (plot?.isExempt && activeTab === "payments") {
      setActiveTab("current");
    }
  }, [plot, activeTab]);

  const handlePaymentProofUpload = async (file) => {
    setIsUploadingPaymentProof(true);
    try {
      const compressedFile = await compressImage(file);
      const data = new FormData();
      data.append("file", compressedFile);

      const res = await Post("/plots/upload-payment-proof", data);

      if (res.data && res.data.url) {
        setPaymentForm((prev) => ({
          ...prev,
          paymentProofImage: res.data.url,
        }));
        addToast("อัปโหลดหลักฐานการชำระเงินสำเร็จ", "success");
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      addToast(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ",
        "error",
      );
    } finally {
      setIsUploadingPaymentProof(false);
    }
  };

  const handleDeceasedCertUpload = async (idx, file) => {
    if (!file) return;

    setUploadingCertIndexes((prev) => ({ ...prev, [idx]: true }));
    try {
      const compressedFile = await compressImage(file);
      const data = new FormData();
      data.append("file", compressedFile);

      const res = await Post("/deceaseds/upload-certificate", data);

      if (res.data && res.data.url) {
        const newList = [...bookingForm.deceaseds];
        newList[idx].deathCertificateImage = res.data.url;
        setBookingForm({
          ...bookingForm,
          deceaseds: newList,
        });
        addToast("อัปโหลดรูปใบมรณะบัตรสำเร็จ", "success");
      } else {
        throw new Error("Invalid server response");
      }
    } catch (err) {
      addToast(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ",
        "error",
      );
    } finally {
      setUploadingCertIndexes((prev) => ({ ...prev, [idx]: false }));
    }
  };

  const saveBookingMutation = useMutation({
    mutationFn: (payload) => {
      // Validation
      if (payload.type === "occupied" && !plot?.isCommonPlot) {
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

      // Check duplicates
      const contactNames = finalPayload.members.map((m) =>
        m.fullName.trim().toLowerCase(),
      );
      const hasDuplicateContacts = contactNames.some(
        (name, idx) => contactNames.indexOf(name) !== idx,
      );
      if (hasDuplicateContacts) {
        throw new Error("ข้อมูลผู้ติดต่อต้องไม่ซ้ำกัน");
      }

      const deceasedNames = finalPayload.deceaseds.map((d) =>
        d.fullName.trim().toLowerCase(),
      );
      const hasDuplicateDeceaseds = deceasedNames.some(
        (name, idx) => deceasedNames.indexOf(name) !== idx,
      );
      if (hasDuplicateDeceaseds) {
        throw new Error("ข้อมูลผู้ล่วงลับต้องไม่ซ้ำกัน");
      }

      const hasDuplicateBetween = contactNames.some((cName) =>
        deceasedNames.includes(cName),
      );
      if (hasDuplicateBetween) {
        throw new Error("ผู้ติดต่อและผู้ล่วงลับต้องไม่เป็นคนเดียวกัน");
      }

      const isAlreadyBooked = plot?.isCommonPlot
        ? plot?.members?.length > 0 || plot?.occupants?.length > 0
        : plot?.contracts?.some((c) => c.status === "active");

      return isAlreadyBooked
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
      const sanitized = {
        ...payload,
        amount: Number(payload.amount?.toString().replace(/,/g, "")),
      };
      if (editingPayment) {
        return Update(`/plots/${id}/payments/${editingPayment.id}`, sanitized);
      }
      return Post(`/plots/${id}/pay-annual-fee`, sanitized);
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

  const handlePrintPayment = (p) => {
    const contract = plot?.contracts?.find((c) => c.id === p.contractId);
    const donorName = contract?.member?.fullName || plot?.members?.[0]?.fullName || "ผู้ชำระเงิน";
    const simulatedDonation = {
      id: p.id,
      donorName,
      amount: Number(p.amount),
      donationDate: p.paymentDate,
      donationYear: p.year,
      paymentMethod: p.paymentType,
      type: p.type || "maintenance",
      notes: p.notes,
      receiptNo: p.receiptNo || null,
    };
    setPrintTarget({ donation: simulatedDonation, plotNumber: plot?.plotNumber });
  };

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
      deathCertificateImage: "",
      age: "",
      relationship: "",
      burialType: "coffin",
      contactIndex: 0,
    };

    const newMembers = bookingForm.members.filter((_, i) => i !== index);
    const updatedMembers =
      newMembers.length > 0
        ? newMembers
        : [
            {
              fullName: "",
              phone: "",
              email: "",
              lineId: "",
              isMember: false,
              address: "",
            },
          ];

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
    <div className="p-6 space-y-6">
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
            <h1 className="text-2xl font-bold text-[#111]">รายละเอียดสัญญา</h1>
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
        {["current", "history", "payments"]
          .filter((tab) => !(plot?.isExempt && tab === "payments"))
          .map((tab) => (
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
            {!plot?.isCommonPlot && (
              <div className="bg-white p-6 rounded-md border border-gray-200 space-y-6">
                <div className="flex items-center gap-2 text-[#111] font-semibold">
                  เลือกประเภท
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
                    ข้อมูลการทำสัญญา
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label required>วันที่ทำสัญญา</Label>
                      <DatePicker
                        value={bookingForm.booking.startDate}
                        disabled={hasActiveContract}
                        className={
                          hasActiveContract
                            ? "bg-gray-50 cursor-not-allowed"
                            : ""
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
                      <DatePicker
                        value={bookingForm.booking.endDate}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Deceaseds */}
            {bookingForm.type === "occupied" && (
              <div className="bg-white p-6 rounded-md border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
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
                            deathCertificateImage: "",
                            age: "",
                            relationship: "",
                            burialDate: dayjs().format("YYYY-MM-DDTHH:mm"),
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
                        {(() => {
                          const isDuplicateDeceased =
                            d.fullName?.trim() &&
                            bookingForm.deceaseds.some(
                              (dec, dIdx) =>
                                dIdx !== idx &&
                                dec.fullName?.trim().toLowerCase() ===
                                  d.fullName?.trim().toLowerCase(),
                            );
                          const isSameAsContact =
                            d.fullName?.trim() &&
                            bookingForm.members.some(
                              (m) =>
                                m.fullName?.trim().toLowerCase() ===
                                d.fullName?.trim().toLowerCase(),
                            );
                          return (
                            <>
                              {isDuplicateDeceased && (
                                <span className="text-xs text-rose-500 mt-1 block">
                                  รายชื่อนี้ซ้ำกับผู้ล่วงลับท่านอื่น
                                </span>
                              )}
                              {isSameAsContact && (
                                <span className="text-xs text-rose-500 mt-1 block">
                                  รายชื่อนี้ซ้ำกับผู้ติดต่อ
                                </span>
                              )}
                            </>
                          );
                        })()}
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
                          <Label required>วันที่และเวลาฝัง/บรรจุ</Label>
                          <DateTimePicker
                            value={d.burialDate || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newList = [...bookingForm.deceaseds];
                              newList[idx].burialDate = val;
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
                        {/* Death Certificate Image Upload */}
                        <div className="space-y-1 md:col-span-2">
                          <Label>ใบมรณะบัตร (รูปภาพ)</Label>
                          <div className="flex gap-2">
                            <div className="flex-grow flex items-center min-h-[44px] px-1 overflow-hidden">
                              {uploadingCertIndexes[idx] ? (
                                <span className="text-sm text-gray-400 italic">
                                  กำลังอัปโหลด...
                                </span>
                              ) : d.deathCertificateImage ? (
                                <a
                                  className="text-base font-medium text-[#003527] underline truncate cursor-pointer"
                                  title={decodeURIComponent(
                                    d.deathCertificateImage.split("/").pop(),
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  href={d.deathCertificateImage}
                                >
                                  {decodeURIComponent(
                                    d.deathCertificateImage.split("/").pop(),
                                  )}
                                </a>
                              ) : (
                                <span className="text-sm text-gray-400 italic">
                                  ยังไม่ได้อัปโหลดรูปใบมรณะบัตร...
                                </span>
                              )}
                            </div>
                            <input
                              type="file"
                              id={`cert-upload-${idx}`}
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) handleDeceasedCertUpload(idx, file);
                              }}
                            />
                            {d.deathCertificateImage &&
                              d.deathCertificateImage.startsWith("http") && (
                                <a
                                  href={d.deathCertificateImage}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-11 h-11 border border-gray-200 flex items-center justify-center rounded-md hover:bg-gray-50 text-blue-600 shrink-0"
                                  title="ดูรูปภาพใบมรณะบัตร"
                                >
                                  <ImageIcon size={18} />
                                </a>
                              )}
                            <div className="shrink-0">
                              <Button
                                type="button"
                                variant="outline"
                                className="w-11 h-11 p-0 flex items-center justify-center border-gray-200"
                                onClick={() =>
                                  document
                                    .getElementById(`cert-upload-${idx}`)
                                    .click()
                                }
                                title="อัปโหลดรูปใบมรณะบัตร"
                                loading={uploadingCertIndexes[idx]}
                              >
                                <Upload size={18} />
                              </Button>
                            </div>
                          </div>
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
                        lineId: "",
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
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-gray-800">
                        ผู้ติดต่อลำดับที่ {idx + 1}
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
                          className="p-1 disabled:opacity-30 hover:bg-white rounded transition-colors"
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
                          className="p-1 disabled:opacity-30 hover:bg-white rounded transition-colors"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </div>
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
                        className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-full transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                    {member.id && (
                      <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded text-xs font-medium border border-blue-100 h-[34px]">
                        <span>เชื่อมโยงประวัติเดิม</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newMembers = [...bookingForm.members];
                            delete newMembers[idx].id;
                            setBookingForm({
                              ...bookingForm,
                              members: newMembers,
                            });
                            addToast(
                              "ยกเลิกการเชื่อมโยงประวัติเดิมแล้ว (จะถูกบันทึกเป็นผู้ติดต่อคนใหม่)",
                              "info",
                            );
                          }}
                          className="hover:text-blue-900 underline font-bold"
                        >
                          ยกเลิกเชื่อมโยง
                        </button>
                      </div>
                    )}

                    {!member.id &&
                      member.fullName &&
                      (membersList || []).some(
                        (m) => m.fullName.trim() === member.fullName.trim(),
                      ) && (
                        <button
                          type="button"
                          onClick={() => {
                            const match = (membersList || []).find(
                              (m) =>
                                m.fullName.trim() === member.fullName.trim(),
                            );
                            if (match) {
                              const newMembers = [...bookingForm.members];
                              newMembers[idx] = {
                                ...newMembers[idx],
                                id: match.id,
                                phone: match.phone || newMembers[idx].phone,
                                email: match.email || newMembers[idx].email,
                                lineId: match.lineId || newMembers[idx].lineId,
                                address:
                                  match.address || newMembers[idx].address,
                                isMember:
                                  match.isMember || newMembers[idx].isMember,
                              };
                              setBookingForm({
                                ...bookingForm,
                                members: newMembers,
                              });
                              addToast(
                                "เชื่อมโยงประวัติเดิมเรียบร้อยแล้ว",
                                "success",
                              );
                            }
                          }}
                          className="text-xs font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded hover:bg-emerald-100 transition-colors h-[34px]"
                        >
                          เชื่อมโยงประวัติเดิม
                        </button>
                      )}

                    {member.fullName && hasActiveContract && (
                      <button
                        type="button"
                        onClick={() => moveToDeceased(idx)}
                        className="text-xs font-semibold text-amber-700 border border-amber-200 bg-amber-50 px-3 py-1.5 rounded hover:bg-amber-100 transition-colors h-[34px]"
                      >
                        ย้ายเป็นผู้ล่วงลับ
                      </button>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors h-[34px]">
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
                        className="w-4 h-4 text-[#003527] rounded focus:ring-[#003527] cursor-pointer"
                      />
                      <span className="text-xs font-medium text-gray-700">
                        สมาชิกสมาคม
                      </span>
                    </label>
                  </div>
                  <div className="space-y-1 relative">
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
                      onFocus={() => setActiveMemberDropdownIdx(idx)}
                      onBlur={() => {
                        setTimeout(() => {
                          setActiveMemberDropdownIdx(null);
                        }, 200);
                      }}
                      placeholder="พิมพ์เพื่อค้นหา หรือพิมพ์สร้างผู้ติดต่อใหม่"
                    />

                    {(() => {
                      const isDuplicateContact =
                        member.fullName?.trim() &&
                        bookingForm.members.some(
                          (m, mIdx) =>
                            mIdx !== idx &&
                            m.fullName?.trim().toLowerCase() ===
                              member.fullName?.trim().toLowerCase(),
                        );
                      const isSameAsDeceased =
                        member.fullName?.trim() &&
                        bookingForm.deceaseds?.some(
                          (d) =>
                            d.fullName?.trim().toLowerCase() ===
                            member.fullName?.trim().toLowerCase(),
                        );
                      return (
                        <>
                          {isDuplicateContact && (
                            <span className="text-xs text-rose-500 mt-1 block">
                              รายชื่อนี้ซ้ำกับผู้ติดต่อท่านอื่น
                            </span>
                          )}
                          {isSameAsDeceased && (
                            <span className="text-xs text-rose-500 mt-1 block">
                              รายชื่อนี้ซ้ำกับผู้ล่วงลับ
                            </span>
                          )}
                        </>
                      );
                    })()}

                    {/* Autocomplete Dropdown */}
                    {activeMemberDropdownIdx === idx &&
                      (member.fullName || "").trim().length > 0 && (
                        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {(() => {
                            const query = (member.fullName || "")
                              .toLowerCase()
                              .trim();
                            const filtered = (membersList || []).filter(
                              (m) =>
                                m.fullName.toLowerCase().includes(query) &&
                                !bookingForm.members.some(
                                  (bm, bIdx) =>
                                    bIdx !== idx &&
                                    (bm.id === m.id ||
                                      bm.fullName?.trim().toLowerCase() ===
                                        m.fullName.trim().toLowerCase()),
                                ),
                            );

                            if (filtered.length === 0) {
                              return (
                                <div className="p-3 text-xs text-[#777] text-center">
                                  ไม่พบสมาชิกชื่อ "{member.fullName}"
                                  (สามารถพิมพ์ต่อเพื่อสร้างใหม่)
                                </div>
                              );
                            }

                            return filtered.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  const newMembers = [...bookingForm.members];
                                  newMembers[idx] = {
                                    id: m.id,
                                    fullName: m.fullName,
                                    phone: m.phone || "",
                                    email: m.email || "",
                                    lineId: m.lineId || "",
                                    address: m.address || "",
                                    isMember: m.isMember || false,
                                  };
                                  setBookingForm({
                                    ...bookingForm,
                                    members: newMembers,
                                  });
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex flex-col border-b border-gray-100 last:border-0"
                              >
                                <span className="font-bold text-gray-900">
                                  {m.fullName}
                                </span>
                                <span className="text-xs text-[#555]">
                                  เบอร์โทร: {m.phone || "-"} |{" "}
                                  {m.isMember
                                    ? "สมาชิกสมาคม"
                                    : "ผู้ติดต่อภายนอก"}
                                </span>
                              </button>
                            ));
                          })()}
                        </div>
                      )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label>Line ID</Label>
                    <Input
                      placeholder="กรอก Line ID (ถ้ามี)"
                      value={member.lineId || ""}
                      onChange={(e) => {
                        const newMembers = [...bookingForm.members];
                        newMembers[idx].lineId = e.target.value;
                        setBookingForm({
                          ...bookingForm,
                          members: newMembers,
                        });
                      }}
                    />
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
            ประวัติการทำรายการ
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
        <div className="bg-white rounded-xl border border-[#eceeeb] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
            <div>
              <div className="flex items-center gap-2 font-semibold text-[#111]">
                ประวัติการชำระเงินรายปี
              </div>
              <p className="text-sm text-gray-500">
                ชำระทุก 1 ปี เพื่อรักษาความต่อเนื่องของสัญญา
              </p>
            </div>
            {plot?.contracts?.length > 0 && (
              <Button
                className="h-8 bg-[#003527] text-white rounded-md px-6 animate-all duration-200 hover:bg-[#002219]"
                onClick={() => {
                  setPaymentForm({
                    amount: "",
                    year: dayjs().year(),
                    paymentDate: dayjs().format("YYYY-MM-DD"),
                    paymentType: "cash",
                    type: "maintenance",
                    notes: "",
                    paymentProofImage: "",
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
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase">
                    ปีที่ชำระ
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase text-right">
                    จำนวนเงิน
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase">
                    วันที่ชำระ
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase">
                    ประเภท
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase text-center">
                    หลักฐาน
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase">
                    หมายเหตุ
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase text-center">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {plot?.contracts?.flatMap((c) => c.payments || []).length >
                0 ? (
                  plot.contracts
                    .flatMap((c) => c.payments || [])
                    .sort((a, b) => b.year - a.year)
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-[#111]">
                          พ.ศ. {p.year + 543}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-[#003527]">
                          ฿{Number(p.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#555]">
                          {dayjs(p.paymentDate)
                            .add(543, "year")
                            .format("DD/MM/YYYY")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#003527]">
                              {p.type === "booking" && "ค่าจองหลุม"}
                              {p.type === "renewal" && "ค่าต่ออายุ"}
                              {(p.type === "maintenance" || !p.type) &&
                                "ค่าบำรุงรายปี"}
                            </span>
                            <span className={`text-xs font-medium ${
                              p.paymentType === "cash" ? "text-orange-700" : "text-blue-700"
                            }`}>
                              {p.paymentType === "cash" ? "เงินสด" : "เงินโอน"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {p.paymentProofImage ? (
                            <a
                              href={p.paymentProofImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-600 rounded-sm hover:bg-blue-100 transition-colors"
                              title="ดูหลักฐานการชำระเงิน"
                            >
                              <ImageIcon size={16} />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-300">
                              ไม่มีหลักฐาน
                            </span>
                          )}
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate"
                          title={p.notes || ""}
                        >
                          {p.notes
                            ? p.notes.length > 30
                              ? p.notes.substring(0, 30) + "..."
                              : p.notes
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handlePrintPayment(p)}
                              className="h-8 w-12 text-xs font-medium"
                              title="พิมพ์ใบเสร็จ"
                            >
                              <Printer size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingPayment(p);
                                setPaymentForm({
                                  amount: p.amount,
                                  year: p.year,
                                  paymentDate: dayjs(p.paymentDate).format(
                                    "YYYY-MM-DD",
                                  ),
                                  paymentType: p.paymentType,
                                  type: p.type || "maintenance",
                                  notes: p.notes || "",
                                  paymentProofImage: p.paymentProofImage || "",
                                });
                                setShowPaymentModal(true);
                              }}
                              className="h-8 w-12 text-xs font-medium"
                              title="แก้ไข"
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "ยืนยันการลบข้อมูลการชำระเงิน?",
                                  )
                                ) {
                                  deletePaymentMutation.mutate(p.id);
                                }
                              }}
                              className="h-8 w-12 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                              title="ลบ"
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
                        {dayjs(plot.contracts[0].endDate)
                          .add(543, "year")
                          .format("DD/MM/YYYY")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#999] font-bold uppercase tracking-widest mb-1">
                        วันสิ้นสุดสัญญาใหม่:
                      </p>
                      <p className="font-bold text-gray-900 text-sm">
                        {dayjs(plot.contracts[0].endDate)
                          .add(30, "year")
                          .add(543, "year")
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
                      return { label: `${year + 543}`, value: year };
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <Label required>จำนวนเงิน (บาท)</Label>
                  <Input
                    type="text"
                    value={formatNumberWithCommas(paymentForm.amount)}
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
                        setPaymentForm({ ...paymentForm, amount: clean });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label required>วันที่ชำระเงิน</Label>
                <DatePicker
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
                <Label required>ประเภทค่าธรรมเนียม</Label>
                <div className="flex gap-2">
                  {[
                    { label: "ค่าบำรุงรายปี", value: "maintenance" },
                    { label: "ค่าต่ออายุ", value: "renewal" },
                    { label: "ค่าจองหลุม", value: "booking" },
                  ].map((fee) => (
                    <button
                      key={fee.value}
                      type="button"
                      onClick={() =>
                        setPaymentForm({
                          ...paymentForm,
                          type: fee.value,
                        })
                      }
                      className={`flex-1 py-2 px-3 rounded-sm border text-xs font-bold transition-all ${
                        paymentForm.type === fee.value
                          ? "bg-[#003527] text-white border-[#003527]"
                          : "bg-white text-[#777] border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {fee.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label required>ช่องทางการชำระเงิน</Label>
                <div className="flex gap-2">
                  {[
                    { label: "เงินสด", value: "cash" },
                    { label: "เงินโอน", value: "transfer" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
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
                />
              </div>

              <div className="space-y-1">
                <Label>หลักฐานการชำระเงิน (รูปใบเสร็จ/สลิป)</Label>
                <div className="flex gap-2">
                  <div className="flex-grow flex items-center min-h-[44px] px-1 overflow-hidden">
                    {isUploadingPaymentProof ? (
                      <span className="text-sm text-gray-400 italic">
                        กำลังอัปโหลด...
                      </span>
                    ) : paymentForm.paymentProofImage ? (
                      <a
                        className="text-base font-medium text-[#003527] underline truncate cursor-pointer"
                        title={decodeURIComponent(
                          paymentForm.paymentProofImage.split("/").pop(),
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        href={paymentForm.paymentProofImage}
                      >
                        {decodeURIComponent(
                          paymentForm.paymentProofImage.split("/").pop(),
                        )}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400 italic">
                        ยังไม่ได้อัปโหลดรูปหลักฐานการชำระเงิน...
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={paymentProofInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) handlePaymentProofUpload(file);
                    }}
                  />
                  {paymentForm.paymentProofImage &&
                    paymentForm.paymentProofImage.startsWith("http") && (
                      <a
                        href={paymentForm.paymentProofImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 border border-gray-200 flex items-center justify-center rounded-md hover:bg-gray-50 text-blue-600 shrink-0"
                        title="ดูรูปภาพหลักฐานการชำระเงิน"
                      >
                        <ImageIcon size={18} />
                      </a>
                    )}
                  <div className="shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-11 h-11 p-0 flex items-center justify-center border-gray-200"
                      onClick={() => paymentProofInputRef.current?.click()}
                      title="อัปโหลดหลักฐานการชำระเงิน"
                      loading={isUploadingPaymentProof}
                    >
                      <Upload size={18} />
                    </Button>
                  </div>
                </div>
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
      {/* ── Print Dialog ── */}
      {printTarget && society && (
        <PrintDialog
          donation={printTarget.donation}
          society={society}
          plotNumber={printTarget.plotNumber}
          onClose={() => setPrintTarget(null)}
        />
      )}
    </div>
  );
};

export default PlotDetail;
