"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { addDays, differenceInCalendarDays, format, addMonths, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { MACRO_COLORS, STATUS_DOT } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/Badge";

interface ProjectData {
  id: string;
  code: string;
  name: string;
  client: string;
  status: string;
  priority: string;
  startDate: string;
  targetDate: string;
  tasks: {
    macroPhase: string;
    startDate: string;
    endDate: string;
    status: string;
    type: string;
  }[];
}

const MACRO_ORDER = [
  "Comercial / Viabilidad",
  "Diseño + Ingeniería",
  "Compras + Producción",
  "Obra + Logística",
  "Montaje + Entrega",
];

export function GlobalGantt({ projects }: { projects: ProjectData[] }) {
  const [showMacro, setShowMacro] = useState(true);

  const earliest = useMemo(() => {
    const dates = projects.map((p) => new Date(p.startDate));
    return dates.reduce((min, d) => d < min ? d : min, new Date());
  }, [projects]);

  const latest = useMemo(() => {
    const dates = projects.map((p) => new Date(p.targetDate));
    return dates.reduce((max, d) => d > max ? d : max, new Date());
  }, [projects]);

  const COL_W = 80; // px per month
  const LEFT = 260;

  const months = useMemo(() => {
    const cols = [];
    let cur = startOfMonth(earliest);
    while (cur <= addMonths(latest, 1)) {
      cols.push(cur);
      cur = addMonths(cur, 1);
    }
    return cols;
  }, [earliest, latest]);

  const totalWidth = months.length * COL_W;

  function xOf(date: string) {
    return Math.max(0, differenceInCalendarDays(new Date(date), startOfMonth(earliest))) * (COL_W / 30);
  }
  function wOf(start: string, end: string) {
    return Math.max(4, differenceInCalendarDays(new Date(end), new Date(start)) * (COL_W / 30));
  }

  const todayX = differenceInCalendarDays(new Date(), startOfMonth(earliest)) * (COL_W / 30);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">Gantt de empresa · escala mensual</h3>
          <button
            onClick={() => setShowMacro(!showMacro)}
            className="text-xs text-[#5F6368] border border-gray-200 px-2 py-1 rounded hover:bg-gray-50"
          >
            {showMacro ? "Vista simple" : "Vista por macrofase"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {MACRO_ORDER.map((mp) => (
            <div key={mp} className="flex items-center gap-1 text-xs text-[#5F6368]">
              <div className="w-3 h-2.5 rounded-sm" style={{ background: MACRO_COLORS[mp] }} />
              <span>{mp.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: LEFT + totalWidth + 40 }}>
          {/* Header */}
          <div className="flex border-b border-gray-100 bg-gray-50">
            <div style={{ width: LEFT, minWidth: LEFT }} className="border-r border-gray-100 shrink-0 h-10" />
            {months.map((m, i) => (
              <div
                key={i}
                className="border-r border-gray-100 text-xs text-[#5F6368] font-medium flex items-center justify-center shrink-0 h-10"
                style={{ width: COL_W }}
              >
                {format(m, "MMM yy", { locale: es })}
              </div>
            ))}
          </div>

          {/* Project rows */}
          {projects.map((p) => {
            const macroSpans = MACRO_ORDER.map((mp) => {
              const mpTasks = p.tasks.filter((t) => t.macroPhase === mp);
              if (!mpTasks.length) return null;
              const start = mpTasks.reduce((min, t) => new Date(t.startDate) < new Date(min) ? t.startDate : min, mpTasks[0].startDate);
              const end   = mpTasks.reduce((max, t) => new Date(t.endDate) > new Date(max) ? t.endDate : max, mpTasks[0].endDate);
              const doneCount = mpTasks.filter((t) => t.status === "Completada").length;
              return { mp, start, end, doneCount, total: mpTasks.length };
            }).filter(Boolean);

            return (
              <div key={p.id} className="flex border-b border-gray-100 hover:bg-gray-50/50 group">
                {/* Label */}
                <div style={{ width: LEFT, minWidth: LEFT }} className="border-r border-gray-100 px-3 py-2 flex flex-col justify-center shrink-0">
                  <Link href={`/projects/${p.id}`} className="text-sm font-semibold text-[#1F1F1F] hover:text-[#F5C400] truncate">
                    {p.name}
                  </Link>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-[#5F6368] font-mono">{p.code}</span>
                    <StatusBadge status={p.status} />
                  </div>
                </div>

                {/* Chart area */}
                <div className="relative flex-1" style={{ minHeight: 52, minWidth: totalWidth }}>
                  {/* Today */}
                  {todayX >= 0 && todayX <= totalWidth && (
                    <div className="absolute top-0 bottom-0 w-px bg-red-400 z-10" style={{ left: todayX }} />
                  )}

                  {/* Project overall bar (faint) */}
                  <div
                    className="absolute top-1/2 h-1.5 rounded-full opacity-20"
                    style={{
                      left: xOf(p.startDate),
                      width: wOf(p.startDate, p.targetDate),
                      background: "#1F1F1F",
                      transform: "translateY(-50%)",
                    }}
                  />

                  {showMacro ? (
                    macroSpans.map((span) => span && (
                      <div
                        key={span.mp}
                        className="absolute h-5 rounded-sm flex items-center px-1 overflow-hidden cursor-default z-10"
                        style={{
                          left: xOf(span.start),
                          width: Math.max(wOf(span.start, span.end), 8),
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: MACRO_COLORS[span.mp] ?? "#888",
                          opacity: span.doneCount === span.total ? 0.5 : 1,
                        }}
                        title={`${span.mp}: ${span.doneCount}/${span.total} completadas`}
                      >
                        <span className="text-white text-[9px] font-semibold truncate">
                          {span.doneCount === span.total ? "✓" : ""} {span.mp.split(" ")[0]}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div
                      className="absolute h-6 rounded-sm"
                      style={{
                        left: xOf(p.startDate),
                        width: wOf(p.startDate, p.targetDate),
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: p.priority === "Crítica" ? "#D72638" : "#F5C400",
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
