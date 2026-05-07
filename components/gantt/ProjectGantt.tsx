"use client";
import { useMemo, useState } from "react";
import { addDays, differenceInCalendarDays, format, startOfWeek, startOfMonth, addMonths, addWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { MACRO_COLORS } from "@/lib/constants";

interface Task {
  id: string;
  code: string;
  macroPhase: string;
  phase: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  predecessorCode: string;
}

type Scale = "days" | "weeks" | "months";

const STATUS_BAR: Record<string, string> = {
  "No iniciada": "#e5e7eb",
  "En curso":    "#3b82f6",
  "Bloqueada":   "#D72638",
  "En revisión": "#F5C400",
  "Completada":  "#10b981",
  "Retrasada":   "#f97316",
  "Cancelada":   "#9ca3af",
};

export function ProjectGantt({ tasks, startDate }: { tasks: Task[]; startDate: string }) {
  const [scale, setScale] = useState<Scale>("weeks");

  const projectStart = useMemo(() => new Date(startDate), [startDate]);
  const projectEnd = useMemo(() => {
    const ends = tasks.map((t) => new Date(t.endDate));
    return ends.reduce((max, d) => d > max ? d : max, projectStart);
  }, [tasks, projectStart]);

  const totalDays = differenceInCalendarDays(projectEnd, projectStart) + 14;

  const colWidth = scale === "days" ? 28 : scale === "weeks" ? 56 : 90;
  const LEFT_COL = 280;

  // Header columns
  const headerCols = useMemo(() => {
    const cols: { label: string; start: Date; days: number }[] = [];
    if (scale === "days") {
      for (let i = 0; i <= totalDays; i++) {
        const d = addDays(projectStart, i);
        cols.push({ label: format(d, "d"), start: d, days: 1 });
      }
    } else if (scale === "weeks") {
      let cur = startOfWeek(projectStart, { weekStartsOn: 1 });
      while (cur <= addDays(projectEnd, 14)) {
        cols.push({ label: format(cur, "d MMM", { locale: es }), start: cur, days: 7 });
        cur = addWeeks(cur, 1);
      }
    } else {
      let cur = startOfMonth(projectStart);
      while (cur <= addMonths(projectEnd, 2)) {
        cols.push({ label: format(cur, "MMM yy", { locale: es }), start: cur, days: 30 });
        cur = addMonths(cur, 1);
      }
    }
    return cols;
  }, [scale, projectStart, projectEnd, totalDays]);

  const totalWidth = headerCols.reduce((s, c) => s + (c.days * (colWidth / (scale === "weeks" ? 7 : scale === "months" ? 30 : 1))), 0);

  function taskX(date: string) {
    return differenceInCalendarDays(new Date(date), projectStart) * (scale === "days" ? colWidth : scale === "weeks" ? colWidth / 7 : colWidth / 30);
  }
  function taskW(start: string, end: string) {
    const days = Math.max(differenceInCalendarDays(new Date(end), new Date(start)) + 1, 1);
    return days * (scale === "days" ? colWidth : scale === "weeks" ? colWidth / 7 : colWidth / 30);
  }

  const today = differenceInCalendarDays(new Date(), projectStart) * (scale === "days" ? colWidth : scale === "weeks" ? colWidth / 7 : colWidth / 30);

  // Group tasks
  const macroPhases = [...new Set(tasks.map((t) => t.macroPhase))];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-[#1F1F1F]">Diagrama de Gantt</h3>
        <div className="flex gap-1">
          {(["days","weeks","months"] as Scale[]).map((s) => (
            <button
              key={s}
              onClick={() => setScale(s)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${scale === s ? "bg-[#1F1F1F] text-white" : "bg-gray-100 text-[#5F6368] hover:bg-gray-200"}`}
            >
              {s === "days" ? "Días" : s === "weeks" ? "Semanas" : "Meses"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex" style={{ minWidth: LEFT_COL + totalWidth + 40 }}>
          {/* Left: task list */}
          <div style={{ width: LEFT_COL, minWidth: LEFT_COL }} className="shrink-0 border-r border-gray-100">
            {/* Header spacer */}
            <div className="h-10 border-b border-gray-100 bg-gray-50" />
            {macroPhases.map((mp) => {
              const mpTasks = tasks.filter((t) => t.macroPhase === mp);
              return (
                <div key={mp}>
                  {/* Macrophase row */}
                  <div
                    className="px-3 py-1.5 text-xs font-semibold text-white flex items-center"
                    style={{ background: MACRO_COLORS[mp] ?? "#888" }}
                  >
                    {mp}
                  </div>
                  {mpTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center px-3 border-b border-gray-50 h-9"
                      style={{ paddingLeft: t.type === "Hito" ? 20 : 12 }}
                    >
                      <span className="text-xs font-mono text-[#5F6368] w-14 shrink-0">{t.code}</span>
                      <span className={`text-xs truncate ${t.type === "Crítico" ? "text-red-600 font-semibold" : t.type === "Hito" ? "text-yellow-700 font-semibold" : "text-[#1F1F1F]"}`}>
                        {t.name}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Right: chart */}
          <div className="flex-1 overflow-x-auto">
            {/* Header */}
            <div className="h-10 flex border-b border-gray-100 bg-gray-50">
              {headerCols.map((c, i) => (
                <div
                  key={i}
                  className="border-r border-gray-100 text-xs text-[#5F6368] flex items-center justify-center shrink-0 font-medium"
                  style={{ width: c.days * (colWidth / (scale === "weeks" ? 7 : scale === "months" ? 30 : 1)) }}
                >
                  {c.label}
                </div>
              ))}
            </div>

            {/* Rows */}
            {macroPhases.map((mp) => {
              const mpTasks = tasks.filter((t) => t.macroPhase === mp);
              return (
                <div key={mp}>
                  {/* Macrophase separator */}
                  <div className="h-[26px] border-b border-gray-100" style={{ background: (MACRO_COLORS[mp] ?? "#888") + "15" }} />
                  {mpTasks.map((t) => {
                    const x = taskX(t.startDate);
                    const w = taskW(t.startDate, t.endDate);
                    const color = t.type === "Crítico" ? "#D72638" : STATUS_BAR[t.status] ?? "#e5e7eb";
                    const isHito = t.type === "Hito";
                    return (
                      <div key={t.id} className="relative h-9 border-b border-gray-50 hover:bg-gray-50/50" style={{ minWidth: totalWidth + 40 }}>
                        {/* Today line */}
                        {today >= 0 && today <= totalWidth && (
                          <div className="absolute top-0 bottom-0 w-px bg-red-400 z-10" style={{ left: today }} />
                        )}
                        {/* Bar or milestone diamond */}
                        {isHito ? (
                          <div
                            className="absolute top-1/2 w-3 h-3 bg-[#F5C400] border-2 border-[#1F1F1F] rotate-45 z-10"
                            style={{ left: x - 6, transform: "translateY(-50%) rotate(45deg)" }}
                            title={t.name}
                          />
                        ) : (
                          <div
                            className="gantt-bar z-10"
                            style={{ left: x, width: Math.max(w, 4), background: color }}
                            title={`${t.code}: ${t.name} (${t.durationDays}d)`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-[#5F6368]">
        {Object.entries(STATUS_BAR).map(([s, c]) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="w-3 h-2.5 rounded-sm" style={{ background: c }} />
            <span>{s}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-[#F5C400] border border-[#1F1F1F] rotate-45" />
          <span>Hito</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-0.5 h-4 bg-red-400" />
          <span>Hoy</span>
        </div>
      </div>
    </div>
  );
}
