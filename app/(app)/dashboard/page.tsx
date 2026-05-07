import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { UpcomingMilestones } from "@/components/dashboard/UpcomingMilestones";
import { RisksTable } from "@/components/dashboard/RisksTable";
import { formatDate } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [projects, tasks, milestones, risks] = await Promise.all([
    prisma.project.findMany({
      where: { archived: false },
      include: {
        tasks: { select: { status: true, durationDays: true, endDate: true, type: true } },
        _count: { select: { tasks: true } },
      },
    }),
    prisma.projectTask.findMany({
      where: { project: { archived: false } },
      select: { status: true, type: true, endDate: true, priority: true, macroPhase: true, durationDays: true, name: true },
    }),
    prisma.milestone.findMany({
      where: { date: { gte: new Date() }, project: { archived: false } },
      orderBy: { date: "asc" },
      take: 8,
      include: { project: { select: { name: true, code: true } } },
    }),
    prisma.risk.findMany({
      where: { status: "Activo", project: { archived: false } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { project: { select: { name: true, code: true } } },
    }),
  ]);

  const now = new Date();

  const activeProjects = projects.filter((p) => !["Entregado","Cancelado"].includes(p.status));
  const byStatus = {
    "En diseño":    projects.filter((p) => p.status === "En diseño").length,
    "En producción":projects.filter((p) => p.status === "En producción").length,
    "En montaje":   projects.filter((p) => p.status === "En montaje").length,
    "Entregado":    projects.filter((p) => p.status === "Entregado").length,
  };

  const overdueTasks = tasks.filter(
    (t) => !["Completada","Cancelada"].includes(t.status) && new Date(t.endDate) < now
  ).length;

  const criticalOpen = tasks.filter(
    (t) => t.type === "Crítico" && !["Completada","Cancelada"].includes(t.status)
  ).length;

  // Charts data
  const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

  const macroData = [
    "Comercial / Viabilidad",
    "Diseño + Ingeniería",
    "Compras + Producción",
    "Obra + Logística",
    "Montaje + Entrega",
  ].map((phase) => ({
    name: phase.split(" ")[0],
    total: tasks.filter((t) => t.macroPhase === phase).length,
    done:  tasks.filter((t) => t.macroPhase === phase && t.status === "Completada").length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Vista general · ${new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Proyectos activos"  value={activeProjects.length} accent="yellow" />
        <KpiCard label="En diseño"          value={byStatus["En diseño"]} sub="proyectos" />
        <KpiCard label="En producción"      value={byStatus["En producción"]} sub="proyectos" accent="blue" />
        <KpiCard label="En montaje"         value={byStatus["En montaje"]} sub="proyectos" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Entregados"         value={byStatus["Entregado"]} accent="green" />
        <KpiCard label="Tareas vencidas"    value={overdueTasks} accent={overdueTasks > 0 ? "red" : "default"} />
        <KpiCard label="Críticas abiertas"  value={criticalOpen} accent={criticalOpen > 0 ? "red" : "default"} />
        <KpiCard label="Riesgos activos"    value={risks.length} accent={risks.length > 3 ? "red" : "default"} />
      </div>

      {/* Charts + Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCharts statusData={statusData} macroData={macroData} />
        </div>
        <div>
          <UpcomingMilestones milestones={milestones.map((m) => ({
            id: m.id,
            name: m.name,
            date: m.date.toISOString(),
            projectName: m.project.name,
            projectCode: m.project.code,
            status: m.status,
          }))} />
        </div>
      </div>

      {/* Risks */}
      <RisksTable risks={risks.map((r) => ({
        id: r.id,
        description: r.description,
        severity: r.severity,
        probability: r.probability,
        taskCode: r.taskCode,
        projectName: r.project.name,
        projectCode: r.project.code,
        status: r.status,
        mitigation: r.mitigation,
      }))} />
    </div>
  );
}
