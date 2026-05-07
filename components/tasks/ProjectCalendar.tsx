"use client";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { MACRO_COLORS } from "@/lib/constants";

// FullCalendar must be client-side only
const FullCalendar = dynamic(() => import("./FullCalendarWrapper"), { ssr: false });

interface Task {
  id: string;
  code: string;
  name: string;
  macroPhase: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
}
interface Milestone {
  id: string;
  name: string;
  date: string;
  status: string;
}

interface Props {
  tasks: Task[];
  milestones: Milestone[];
  projectId: string;
}

export function ProjectCalendar({ tasks, milestones, projectId }: Props) {
  const events = useMemo(() => {
    const taskEvents = tasks
      .filter((t) => t.type !== "Hito")
      .map((t) => ({
        id: t.id,
        title: `${t.code}: ${t.name}`,
        start: t.startDate.split("T")[0],
        end: t.endDate.split("T")[0],
        backgroundColor: MACRO_COLORS[t.macroPhase] ?? "#888",
        borderColor: t.type === "Crítico" ? "#D72638" : MACRO_COLORS[t.macroPhase] ?? "#888",
        textColor: "#fff",
        extendedProps: { type: t.type, status: t.status },
      }));

    const hitoEvents = milestones.map((m) => ({
      id: `m-${m.id}`,
      title: `◆ ${m.name}`,
      start: m.date.split("T")[0],
      backgroundColor: "#F5C400",
      borderColor: "#1F1F1F",
      textColor: "#1F1F1F",
      extendedProps: { type: "Hito", status: m.status },
    }));

    return [...taskEvents, ...hitoEvents];
  }, [tasks, milestones]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <FullCalendar events={events} />
    </div>
  );
}
