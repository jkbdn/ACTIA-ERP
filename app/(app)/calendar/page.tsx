import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlobalCalendarClient } from "./GlobalCalendarClient";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [milestones, tasks] = await Promise.all([
    prisma.milestone.findMany({
      where: { project: { archived: false } },
      include: { project: { select: { id: true, name: true, code: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.projectTask.findMany({
      where: { type: { in: ["Hito", "Crítico", "Control"] }, project: { archived: false } },
      include: { project: { select: { id: true, name: true, code: true } } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const events = [
    ...milestones.map((m) => ({
      id: `m-${m.id}`,
      title: `◆ ${m.project.code}: ${m.name}`,
      start: m.date.toISOString().split("T")[0],
      backgroundColor: "#F5C400",
      borderColor: "#1F1F1F",
      textColor: "#1F1F1F",
    })),
    ...tasks.map((t) => ({
      id: `t-${t.id}`,
      title: `${t.project.code} · ${t.code}: ${t.name}`,
      start: t.startDate.toISOString().split("T")[0],
      end: t.endDate.toISOString().split("T")[0],
      backgroundColor: t.type === "Crítico" ? "#D72638" : "#3b82f6",
      borderColor: t.type === "Crítico" ? "#D72638" : "#3b82f6",
      textColor: "#fff",
    })),
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Calendario General" subtitle="Hitos, entregas y fechas críticas de todos los proyectos" />
      <GlobalCalendarClient events={events} />
    </div>
  );
}
