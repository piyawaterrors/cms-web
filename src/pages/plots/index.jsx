import React, { useState, useEffect, useRef, useMemo } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { Stage, Layer, Rect, Text, Group, Line, Shape } from "react-konva";
import {
  ZoomIn,
  ZoomOut,
  Move,
  Plus,
  Settings2,
  Info as InfoIcon,
  X as XIcon,
  Trash2,
  Save,
  ChevronUp,
  ChevronDown,
  MousePointer2,
  Map as MapIcon,
  ArrowRight,
  Eye,
  History as HistoryIcon,
  Phone,
  MapPin,
  Repeat,
  Mail,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Get, Post, Update, Delete } from "@/services/https";
import { useToast } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import HistoryItem from "@/components/ui/HistoryItem";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Label from "@/components/ui/Label";
import DatePicker from "@/components/ui/DatePicker";

const GRID_SIZE = 50;
const DEFAULT_PLOT_SIZE = 1;

const RELATIONSHIP_OPTIONS = [
  { label: "คู่สมรส", value: "คู่สมรส" },
  { label: "บุตร", value: "บุตร" },
  { label: "บิดา/มารดา", value: "บิดา/มารดา" },
  { label: "พี่น้อง", value: "พี่น้อง" },
  { label: "หลาน", value: "หลาน" },
  { label: "ญาติ", value: "ญาติ" },
  { label: "อื่นๆ", value: "อื่นๆ" },
];

const Plots = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const containerRef = useRef(null);
  const stageRef = useRef(null);

  // States
  const [mode, setMode] = useState("view"); // 'view' or 'edit'
  const [selectedZone, setSelectedZone] = useState("all");
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [selection, setSelection] = useState(null);
  const [showPlotModal, setShowPlotModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRelocationModal, setShowRelocationModal] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [selectedOccupant, setSelectedOccupant] = useState(null);
  const [relocationForm, setRelocationForm] = useState({
    toPlotId: "",
    note: "",
    type: "internal",
  });
  const [plotForm, setPlotForm] = useState({
    plotNumber: "",
    zone: "",
    row: 1,
    column: 1,
    rowSpan: 1,
    colSpan: 1,
    type: "plot",
    status: "available",
    isExempt: false,
    isCommonPlot: false,
  });
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [viewDate, setViewDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickViewId, setQuickViewId] = useState(null);

  const handleRelocateClick = (occupant, fromPlot) => {
    setSelectedOccupant(occupant);
    setSelectedPlot(fromPlot);
    setRelocationForm({
      toPlotId: "",
      note: "",
      type: "internal",
    });
    setShowRelocationModal(true);
  };

  const relocationMutation = useMutation({
    mutationFn: (data) => Post("/relocations", data),
    onSuccess: () => {
      addToast("ย้ายหลุมเรียบร้อยแล้ว", "success");
      setShowRelocationModal(false);
      queryClient.invalidateQueries(["plots"]);
    },
    onError: (error) => {
      addToast(error.message || "เกิดข้อผิดพลาดในการย้ายหลุม", "error");
    },
  });

  const handleRelocateSubmit = () => {
    if (relocationForm.type === "internal" && !relocationForm.toPlotId) {
      addToast("กรุณาเลือกหลุมปลายทาง", "warning");
      return;
    }
    relocationMutation.mutate({
      deceasedId: selectedOccupant.id,
      fromPlotId: selectedPlot.id,
      toPlotId: relocationForm.type === "external" ? null : relocationForm.toPlotId,
      note: relocationForm.type === "external"
        ? `[ย้ายออกภายนอกสมาคม] ${relocationForm.note || ""}`
        : relocationForm.note,
    });
  };

  // Fetch Data
  const { data: plots = [], isLoading } = useQuery({
    queryKey: ["plots", selectedZone, viewDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedZone !== "all") params.append("zone", selectedZone);
      if (viewDate) params.append("date", viewDate);

      const res = await Get(`/plots?${params.toString()}`);
      return res.data;
    },
  });

  const { data: allPlots = [] } = useQuery({
    queryKey: ["plots", "all", viewDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (viewDate) params.append("date", viewDate);
      const res = await Get(`/plots?${params.toString()}`);
      return res.data;
    },
  });

  const { data: plotStatuses = [] } = useQuery({
    queryKey: ["plotStatuses"],
    queryFn: async () => {
      const res = await Get("/plot-statuses");
      return res.data;
    },
  });

  // Unique Zones
  const zones = useMemo(() => {
    const unique = [...new Set(plots.map((p) => p.zone).filter(Boolean))];
    return ["all", ...unique];
  }, [plots]);

  // Mutations
  const updatePlotMutation = useMutation({
    mutationFn: (data) => {
      const { id, ...payload } = data;
      const finalPayload = payload.plotNumber
        ? formatPayload(payload)
        : payload;
      return Update(`/plots/${id}`, finalPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["plots"]);
      setSelectedPlot(null);
      setShowPlotModal(false);
      addToast("อัปเดตข้อมูลเรียบร้อยแล้ว", "success");
    },
  });

  const createPlotMutation = useMutation({
    mutationFn: (data) => Post("/plots", formatPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries(["plots"]);
      addToast("สร้างหลุมเรียบร้อยแล้ว", "success");
      setShowPlotModal(false);
    },
  });

  const deletePlotMutation = useMutation({
    mutationFn: (id) => Delete(`/plots/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["plots"]);
      addToast("ลบหลุมเรียบร้อยแล้ว", "info");
      setShowPlotModal(false);
    },
  });

  const isAreaOccupied = (col, row, colSpan, rowSpan, excludeId = null) => {
    return plots.some((p) => {
      if (p.id === excludeId || p.type === "walkway") return false;
      return (
        col < (p.column || 1) + (p.colSpan || 1) &&
        col + colSpan > (p.column || 1) &&
        row < (p.row || 1) + (p.rowSpan || 1) &&
        row + rowSpan > (p.row || 1)
      );
    });
  };

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Control") setIsCtrlPressed(true);
    };
    const handleKeyUp = (e) => {
      if (e.key === "Control") setIsCtrlPressed(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Resize Handling
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: window.innerHeight - 180,
        });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Zoom handling
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
    if (newScale < 0.2 || newScale > 5) return;

    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleStageMouseDown = (e) => {
    if (mode !== "edit" || e.evt.button === 1 || isCtrlPressed) return;
    if (e.target === stageRef.current) {
      const pos = stageRef.current.getRelativePointerPosition();
      const col = Math.floor(pos.x / GRID_SIZE) + 1;
      const row = Math.floor(pos.y / GRID_SIZE) + 1;
      setSelection({ start: { col, row }, end: { col, row } });
      setIsDragging(true);
    }
  };

  const handleStageMouseMove = (e) => {
    if (!isDragging || !selection) return;
    const pos = stageRef.current.getRelativePointerPosition();
    const col = Math.floor(pos.x / GRID_SIZE) + 1;
    const row = Math.floor(pos.y / GRID_SIZE) + 1;
    setSelection((prev) => ({ ...prev, end: { col, row } }));
  };

  const handleStageMouseUp = () => {
    if (!isDragging || !selection) return;
    setIsDragging(false);

    const col = Math.min(selection.start.col, selection.end.col);
    const row = Math.min(selection.start.row, selection.end.row);
    const colSpan = Math.abs(selection.start.col - selection.end.col) + 1;
    const rowSpan = Math.abs(selection.start.row - selection.end.row) + 1;

    if (isAreaOccupied(col, row, colSpan, rowSpan)) {
      addToast("พื้นที่ถูกจองแล้ว โปรดเลือกพื้นที่ว่างอื่น", "error");
      setSelection(null);
      return;
    }

    setPlotForm({
      plotNumber: "",
      zone: selectedZone === "all" ? "" : selectedZone,
      row,
      column: col,
      rowSpan,
      colSpan,
      type: "plot",
      status: "ว่าง",
      isExempt: false,
      isCommonPlot: false,
    });
    setSelectedPlot(null);
    setShowPlotModal(true);
    setSelection(null);
  };

  const handlePlotClick = (plot) => {
    if (mode === "edit") {
      setSelectedPlot(plot);
      setPlotForm(plot);
      setShowPlotModal(true);
    } else {
      if (plot.type === "walkway") return;
      setQuickViewId(plot.id);
      setShowQuickView(true);
    }
  };

  const handlePlotDragEnd = (e, plot) => {
    const node = e.target;
    const newX = node.x();
    const newY = node.y();
    const col = Math.round(newX / GRID_SIZE) + 1;
    const row = Math.round(newY / GRID_SIZE) + 1;

    if (
      isAreaOccupied(col, row, plot.colSpan || 1, plot.rowSpan || 1, plot.id)
    ) {
      addToast("ย้ายไม่สำเร็จ: ทับหลุมที่มีอยู่เดิม", "warning");
      node.to({
        x: (plot.column - 1) * GRID_SIZE,
        y: (plot.row - 1) * GRID_SIZE,
        duration: 0.2,
        easing: "EaseOut",
      });
      return;
    }

    const payload = formatPayload({ ...plot, column: col, row: row });
    updatePlotMutation.mutate({ id: plot.id, ...payload });
  };

  const formatPayload = (data) => ({
    plotNumber: data.plotNumber,
    zone: data.zone,
    row: data.row ? parseInt(data.row) : null,
    column: data.column ? parseInt(data.column) : null,
    rowSpan: data.rowSpan ? parseInt(data.rowSpan) : 1,
    colSpan: data.colSpan ? parseInt(data.colSpan) : 1,
    type: data.type,
    isExempt: data.isExempt || false,
    isCommonPlot: data.isCommonPlot || false,
  });

  const getStatusColor = (status) => {
    const statusObj = plotStatuses.find(
      (s) => s.key === status || s.label === status,
    );
    return statusObj ? statusObj.color : "#2b6954";
  };

  const getCursor = () => {
    if (isCtrlPressed) return "grab";
    if (mode === "edit") return "crosshair";
    return "grab";
  };

  return (
    //  <div className="p-6 max-w-7xl mx-auto space-y-6">
    //       {/* Header */}
    //       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    //         <div>
    //           <h1 className="text-2xl font-bold text-[#111]">ผังหลุม (Visual Map)</h1>
    //           <p className="text-sm text-[#555]">
    //              จัดการและตรวจสอบสถานะหลุมบนแผนที่
    //           </p>
    //         </div>
    //       </div>

    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#111]">
              ผังหลุม
            </h1>
            <p className="text-base text-[#555]">
              จัดการและตรวจสอบสถานะหลุมบนแผนที่
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Selector (Time Machine) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md h-[42px]">
            <HistoryIcon size={16} className="text-[#003527] shrink-0" />
            <span className="text-xs md:text-sm font-bold text-[#555] whitespace-nowrap uppercase tracking-wider shrink-0">
              ตรวจสอบ ณ วันที่:
            </span>
            <DatePicker
              value={viewDate}
              onChange={(e) => setViewDate(e.target.value)}
              className="w-[180px] text-[#111] h-[42px]"
            />
          </div>

          <Select
            value={selectedZone}
            onChange={setSelectedZone}
            options={zones.map((z) => ({
              label: z === "all" ? "ทุกซอย" : `ซอย ${z}`,
              value: z,
            }))}
            className="w-full md:w-[200px] text-base h-[42px]"
          />

          <div className="flex bg-[#f1f3f1] p-1 gap-1 rounded-md w-full md:w-auto h-[42px]">
            <button
              onClick={() => setMode("view")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md transition-all text-base ${mode === "view" ? "bg-white text-[#003527] font-semibold" : "text-[#555] hover:bg-black/5"}`}
            >
              <MousePointer2 size={16} />
              <span>มุมมอง</span>
            </button>
            <button
              onClick={() => setMode("edit")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md transition-all text-base ${mode === "edit" ? "bg-[#003527] text-white font-semibold" : "text-[#555] hover:bg-black/5"}`}
            >
              <Settings2 size={16} />
              <span>แก้ไข</span>
            </button>
          </div>
        </div>
      </div>
      {/* Main Canvas Area */}
      <div
        className="relative flex-1 overflow-hidden border border-gray-600 rounded-lg"
        ref={containerRef}
      >
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <div className="flex bg-white/80 backdrop-blur-md p-1 rounded-md border border-gray-200 shadow-sm">
            <button
              onClick={() => setStageScale((s) => Math.min(s * 1.2, 5))}
              className="p-2.5 hover:bg-[#003527]/10 rounded-sm text-[#003527] transition-colors"
              title="ซูมเข้า"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={() => setStageScale((s) => Math.max(s / 1.2, 0.2))}
              className="p-2.5 hover:bg-[#003527]/10 rounded-sm text-[#003527] transition-colors"
              title="ซูมออก"
            >
              <ZoomOut size={20} />
            </button>
            <div className="w-px bg-[#eceeeb] m-1" />
            <button
              onClick={() => {
                setStageScale(1);
                setStagePos({ x: 0, y: 0 });
              }}
              className="p-2.5 hover:bg-[#003527]/10 rounded-sm text-[#003527] transition-colors"
              title="จัดตำแหน่งเริ่มต้น"
            >
              <Move size={20} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-4 left-4 z-30 flex flex-row flex-wrap gap-x-4 gap-y-2 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-md border border-white text-xs md:text-sm font-semibold text-[#333] shadow-sm max-w-[calc(100%-180px)]">
          {plotStatuses.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-sm border border-black/10"
                style={{ backgroundColor: s.color }}
              />
              <span className="capitalize whitespace-nowrap">
                {s.label} ({s.key})
              </span>
            </div>
          ))}
        </div>

        <Stage
          width={dimensions.width}
          height={dimensions.height}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePos.x}
          y={stagePos.y}
          onWheel={handleWheel}
          draggable={mode === "view" || isCtrlPressed}
          onDragEnd={(e) => {
            if (e.target === e.target.getStage())
              setStagePos({ x: e.target.x(), y: e.target.y() });
          }}
          ref={stageRef}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          className={`bg-white transition-all ${isCtrlPressed ? "cursor-grabbing" : mode === "edit" ? "cursor-crosshair" : "cursor-grab"}`}
        >
          <Layer listening={false}>
            <Rect width={5000} height={5000} fill="#fcfdfa" />
            <Shape
              sceneFunc={(context, shape) => {
                context.beginPath();
                const size = 5000;
                for (let i = 0; i <= size / GRID_SIZE; i++) {
                  const pos = i * GRID_SIZE;
                  context.moveTo(pos, 0);
                  context.lineTo(pos, size);
                  context.moveTo(0, pos);
                  context.lineTo(size, pos);
                }
                context.strokeStyle = "#cbd5e1";
                context.lineWidth = 1;
                context.stroke();
                context.fillStrokeShape(shape);
              }}
              listening={false}
            />
          </Layer>
          <Layer>
            {plots.map((plot) => (
              <Group
                key={plot.id}
                x={(plot.column - 1) * GRID_SIZE}
                y={(plot.row - 1) * GRID_SIZE}
                draggable={mode === "edit"}
                onClick={() => handlePlotClick(plot)}
                onDragEnd={(e) => handlePlotDragEnd(e, plot)}
              >
                <Rect
                  x={1}
                  y={1}
                  width={plot.colSpan * GRID_SIZE - 2}
                  height={plot.rowSpan * GRID_SIZE - 2}
                  fill={plot.type === "walkway" ? "#ffffff" : getStatusColor(plot.status)}
                  cornerRadius={4}
                  stroke={
                    selectedPlot?.id === plot.id ? "#003527" : "transparent"
                  }
                  strokeWidth={2}
                  opacity={1}
                />
                <Text
                  text={plot.plotNumber}
                  width={plot.colSpan * GRID_SIZE}
                  height={plot.rowSpan * GRID_SIZE}
                  align="center"
                  verticalAlign="middle"
                  fill={
                    plot.type === "walkway"
                      ? "#111111"
                      : plot.isExempt
                        ? "black"
                        : "white"
                  }
                  fontSize={13}
                  fontStyle="bold"
                  listening={false}
                />
              </Group>
            ))}
            {isDragging && selection && (
              <Rect
                x={
                  (Math.min(selection.start.col, selection.end.col) - 1) *
                  GRID_SIZE
                }
                y={
                  (Math.min(selection.start.row, selection.end.row) - 1) *
                  GRID_SIZE
                }
                width={
                  (Math.abs(selection.start.col - selection.end.col) + 1) *
                  GRID_SIZE
                }
                height={
                  (Math.abs(selection.start.row - selection.end.row) + 1) *
                  GRID_SIZE
                }
                fill="rgba(43, 105, 84, 0.15)"
                stroke="#2b6954"
                strokeWidth={1.5}
                dash={[6, 3]}
              />
            )}
          </Layer>
        </Stage>
      </div>
      {/* Plot Modal */}
      {showPlotModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowPlotModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-[#003527] text-white">
              <h2 className="text-lg font-bold">
                {plotForm.id ? "แก้ไขหลุม" : "สร้างหลุมใหม่"}
              </h2>
              <button
                onClick={() => setShowPlotModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <Label>หมายเลขหลุม</Label>
                  <Input
                    value={plotForm.plotNumber}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, plotNumber: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>ซอย</Label>
                  <Input
                    value={plotForm.zone}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, zone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <Label>ประเภท</Label>
                  <Select
                    value={plotForm.type}
                    onChange={(val) => {
                      const updates = { type: val };
                      if (val === "walkway") {
                        updates.isExempt = false;
                        updates.isCommonPlot = false;
                      }
                      setPlotForm({ ...plotForm, ...updates });
                    }}
                    options={[
                      { label: "หลุม", value: "plot" },
                      { label: "ทางเดิน", value: "walkway" },
                    ]}
                  />
                </div>
              </div>
              {plotForm.type !== "walkway" && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isExempt"
                      checked={plotForm.isExempt}
                      onChange={(e) =>
                        setPlotForm({ ...plotForm, isExempt: e.target.checked })
                      }
                    />
                    <Label htmlFor="isExempt">หลุมยกเว้น (Exempt)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isCommonPlot"
                      checked={plotForm.isCommonPlot}
                      onChange={(e) =>
                        setPlotForm({
                          ...plotForm,
                          isCommonPlot: e.target.checked,
                        })
                      }
                    />
                    <Label htmlFor="isCommonPlot">หลุมรวม (Common Plot)</Label>
                  </div>
                </div>
              )}
              {plotForm.id && plotForm.type !== "walkway" && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-[10px] text-[#777] uppercase font-bold tracking-wider mb-1">
                    สถานะปัจจุบัน
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: getStatusColor(plotForm.status),
                      }}
                    />
                    <span className="text-sm font-bold text-[#111]">
                      {plotStatuses.find((s) => s.key === plotForm.status)?.label ||
                        ({
                          available: "ว่าง",
                          occupied: "บรรจุแล้ว",
                          reserved: "จองแล้ว",
                          expired: "หมดสัญญา",
                          common: "หลุมรวม",
                        }[plotForm.status] || plotForm.status)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 bg-[#f8faf6] flex justify-end gap-3 border-t border-[#eceeeb]">
              {plotForm.id && (
                <Button
                  variant="ghost"
                  className="text-rose-600 mr-auto"
                  onClick={() => {
                    if (window.confirm("ลบหลุมนี้?"))
                      deletePlotMutation.mutate(plotForm.id);
                  }}
                >
                  ลบ
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowPlotModal(false)}>
                ยกเลิก
              </Button>
              <Button
                className="bg-[#003527] text-white"
                onClick={() => {
                  if (plotForm.id) updatePlotMutation.mutate(plotForm);
                  else createPlotMutation.mutate(plotForm);
                }}
              >
                บันทึกข้อมูล
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Quick View Modal */}
      {showQuickView && (
        <QuickViewModal
          id={quickViewId}
          onClose={() => setShowQuickView(false)}
          onEdit={() => navigate(`/plots/detail/${quickViewId}`)}
          onRelocate={handleRelocateClick}
        />
      )}
      {/* Relocation Modal */}
      {showRelocationModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl overflow-hidden border border-[#eceeeb]">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-[#003527] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-md flex items-center justify-center text-white">
                  <Repeat size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">ย้ายหลุม</h2>
                  <p className="text-xs opacity-70">
                    ระบุหลุมปลายทางเพื่อทำการย้ายร่าง
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRelocationModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Deceased Info */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-[10px] text-[#777] uppercase font-bold tracking-wider mb-2">
                  ผู้ล่วงลับที่ต้องการย้าย
                </p>
                <p className="text-base font-bold text-[#111]">
                  {selectedOccupant?.fullName}
                </p>
                <p className="text-xs text-[#555]">
                  ปัจจุบันอยู่ที่: {selectedPlot?.plotNumber} (ซอย{" "}
                  {selectedPlot?.zone})
                </p>
              </div>

              {/* Relocation Type Selector */}
              <div className="space-y-2">
                <Label>ประเภทการย้าย</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setRelocationForm({
                        ...relocationForm,
                        type: "internal",
                      })
                    }
                    className={`flex-1 py-2 px-3 rounded-sm border text-xs font-semibold transition-all cursor-pointer ${
                      relocationForm.type === "internal"
                        ? "bg-[#003527] text-white border-[#003527]"
                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    ย้ายภายในสุสาน
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRelocationForm({
                        ...relocationForm,
                        type: "external",
                        toPlotId: "",
                      })
                    }
                    className={`flex-1 py-2 px-3 rounded-sm border text-xs font-semibold transition-all cursor-pointer ${
                      relocationForm.type === "external"
                        ? "bg-[#003527] text-white border-[#003527]"
                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    ย้ายออกภายนอกสมาคม
                  </button>
                </div>
              </div>

              {/* Target Selection */}
              {relocationForm.type === "internal" && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <Label required>เลือกหลุมปลายทาง</Label>
                  <Select
                    value={relocationForm.toPlotId}
                    onChange={(val) =>
                      setRelocationForm({ ...relocationForm, toPlotId: val })
                    }
                    options={allPlots
                      .filter(
                        (p) => p.status === "ว่าง" || p.id === selectedPlot?.id,
                      )
                      .map((p) => ({
                        label: `${p.plotNumber} (ซอย ${p.zone})`,
                        value: p.id,
                      }))}
                    placeholder="ค้นหาหรือเลือกหลุมว่าง..."
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>เหตุผล / หมายเหตุเพิ่มเติม</Label>
                <Textarea
                  placeholder="ระบุเหตุผลการย้าย..."
                  value={relocationForm.note}
                  onChange={(e) =>
                    setRelocationForm({
                      ...relocationForm,
                      note: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#eceeeb] flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-md"
                onClick={() => setShowRelocationModal(false)}
              >
                ยกเลิก
              </Button>
              <Button
                className="flex-1 bg-[#003527] text-white rounded-md"
                onClick={handleRelocateSubmit}
                loading={relocationMutation.isPending}
              >
                ยืนยันการย้าย
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for Quick View
const QuickViewModal = ({ id, onClose, onEdit, onRelocate }) => {
  const [activeTab, setActiveTab] = useState("current");
  const navigate = useNavigate();

  const { data: plot, isLoading } = useQuery({
    queryKey: ["plot", id],
    queryFn: async () => {
      const res = await Get(`/plots/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (!id) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4">
      <div className="bg-white w-full max-w-2xl max-h-[95vh] rounded-lg flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-[#003527] text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-md flex items-center justify-center text-white">
              <InfoIcon size={26} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                หลุมหมายเลข {plot?.plotNumber}
              </h3>
              <p className="text-sm opacity-70">
                โซน: {plot?.zone} | สถานะ:{" "}
                <span>
                  {plot?.status === "available"
                    ? "ว่าง"
                    : plot?.status === "occupied"
                      ? "บรรจุแล้ว"
                      : plot?.status === "reserved"
                        ? "จองแล้ว"
                        : plot?.status === "expired"
                          ? "หมดสัญญา"
                          : plot?.status === "common"
                            ? "หลุมรวม"
                            : plot?.status}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <XIcon size={22} />
          </button>
        </div>
        <div className="flex border-b border-gray-200 px-6 bg-white sticky top-0 z-10">
          <button
            onClick={() => setActiveTab("current")}
            className={`py-4 px-4 text-base font-bold transition-all border-b-2 ${
              activeTab === "current"
                ? "border-[#064e3b] text-[#064e3b]"
                : "border-transparent text-[#555] hover:text-[#111]"
            }`}
          >
            ข้อมูลปัจจุบัน
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-4 px-4 text-base font-bold transition-all border-b-2 ${
              activeTab === "history"
                ? "border-[#064e3b] text-[#064e3b]"
                : "border-transparent text-[#555] hover:text-[#111]"
            }`}
          >
            ประวัติการทำรายการ
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003527]" />
            </div>
          ) : activeTab === "current" ? (
            <div className="space-y-6">
              {!plot?.isCommonPlot && (
                <>
                  {plot?.contracts?.[0]?.contractNumber && (
                    <div className="p-4 bg-[#003527]/5 rounded-md border border-[#003527]/10">
                      <p className="text-sm font-bold text-[#003527] uppercase tracking-wider mb-1">
                        หมายเลขสัญญา
                      </p>
                      <p className="text-xl font-bold text-[#003527] tracking-wider">
                        {plot.contracts[0].contractNumber}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-sm font-bold text-[#777] uppercase tracking-wider mb-1">
                        วันเริ่มสัญญา
                      </p>
                      <p className="text-xl font-bold">
                        {plot?.contracts?.[0]?.startDate
                          ? dayjs(plot.contracts[0].startDate).format("DD/MM/YYYY")
                          : "-"}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-sm font-bold text-[#777] uppercase tracking-wider mb-1">
                        วันสิ้นสุดสัญญา
                      </p>
                      <p className="text-xl font-bold">
                        {plot?.contracts?.[0]?.endDate
                          ? dayjs(plot.contracts[0].endDate).format("DD/MM/YYYY")
                          : "-"}
                      </p>
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                  รายชื่อผู้ติดต่อ
                </h4>
                <div className="grid gap-2">
                  {plot?.members?.length > 0 ? (
                    plot?.members?.map((m, i) => (
                      <div
                        key={i}
                        className="p-4 bg-white rounded-md border border-gray-200"
                      >
                        <span className="text-base font-bold text-gray-900">
                          {m.fullName}
                        </span>
                        <div className="flex items-start gap-4 mt-1.5 text-base text-gray-600">
                          <div className="flex flex-col items-start text-gray-600 gap-1.5">
                            <span className="flex items-center gap-1.5">
                              <Phone size={15} className="text-gray-600" />
                              {m.phone || "N/A"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Mail size={15} className="text-gray-600" />
                              {m.email || "N/A"}
                            </span>
                          </div>
                          <span className="flex items-start gap-1.5 min-w-0">
                            <MapPin
                              size={15}
                              className="text-gray-600 shrink-0 mt-1"
                            />
                            <span className="whitespace-normal break-words">
                              {m.address || "N/A"}
                            </span>
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#777] py-4 bg-gray-50 rounded-md text-center border border-dashed border-gray-200">
                      ยังไม่มีรายชื่อผู้ติดต่อ
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                  รายชื่อผู้ล่วงลับ
                </h4>
                <div className="grid gap-2">
                  {plot?.occupants?.length > 0 ? (
                    plot.occupants.map((o) => (
                      <div
                        key={o.id}
                        className="p-4 bg-white rounded-md border border-gray-200"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-base font-bold text-gray-900">
                            {o.fullName}
                          </p>
                          <button
                            onClick={() => onRelocate(o, plot)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[#eceeeb] text-xs font-bold text-[#003527] hover:bg-[#003527]/5 transition-all uppercase tracking-wider"
                          >
                            <Repeat size={14} />
                            ย้ายหลุม
                          </button>
                        </div>
                        <div className="flex items-start gap-4 mt-1.5 text-base text-gray-600">
                          <div className="flex flex-col items-start text-gray-600 gap-1.5">
                            <p className="text-base text-gray-600">
                              อายุ: {o.age || "N/A"} ปี
                            </p>
                            <span className="flex items-center gap-1">
                              มรณบัตร:{" "}
                              <a
                                href={o.deathCertificateImage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center hover:underline cursor-pointer"
                              >
                                {o.deathCertificateNumber || "N/A"}
                              </a>
                            </span>
                          </div>
                          <div className="flex flex-col items-start text-gray-600 gap-1.5">
                            <p className="text-base text-gray-600">
                              บรรจุเมื่อ:{" "}
                              {o.burialDate
                                ? dayjs(o.burialDate).format("DD/MM/YYYY HH:mm")
                                : "N/A"}
                            </p>
                            <p className="text-base text-gray-600">
                              ประเภทการบรรจุ:{" "}
                              {o.burialType === "coffin" ? "โลงศพ" : "อัฐิ"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#777] py-4 bg-gray-50 rounded-md text-center border border-dashed border-gray-200">
                      ยังไม่มีการบรรจุผู้ล่วงลับ
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {plot?.logs?.length > 0 ? (
                plot.logs.map((log) => <HistoryItem key={log.id} log={log} />)
              ) : (
                <p className="text-sm text-[#777] py-4 bg-gray-50 rounded-md text-center border border-dashed border-gray-200">
                  ยังไม่มีประวัติการทำรายการ
                </p>
              )}
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-200 bg-white flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-md"
            onClick={onClose}
          >
            ปิดหน้าต่าง
          </Button>
          <Button
            className="flex-1 bg-[#003527] hover:bg-[#004d39] text-white rounded-md flex items-center justify-center gap-2"
            onClick={onEdit}
          >
            {plot?.isCommonPlot || plot?.status !== "available"
              ? "ดูรายละเอียด / แก้ไข"
              : "สร้างสัญญาใหม่"}
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Plots;
