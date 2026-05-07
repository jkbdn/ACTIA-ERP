import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlobalGantt } from "@/components/gantt/GlobalGantt";

export const dynamic = "force-dynamic";

export default async function GanttPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { archived: false },
    include: {
      tasks: {
        select: {
          macroPhase: true,
          startDate: true,
          endDate: true,
          status: true,
          type: true,
        },
      },
    },
    orderBy: { startDate: "asc" },
  });

  const data = projects.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    client: p.client,
    status: p.status,
    priority: p.priority,
    startDate: p.startDate.toISOString(),
    targetDate: p.targetDate.toISOString(),
    tasks: p.tasks.map((t) => ({
      macroPhase: t.macroPhase,
      startDate: t.startDate.toISOString(),
      endDate: t.endDate.toISOString(),
      status: t.status,
      type: t.type,
    })),
  }));

  return (
    <div className="space-y-5">
      <PageHeader title="Gantt General" subtitle="Vista de todos los proyectos activos por macrofase" />
      <GlobalGantt projects={data} />
    </div>
  );
}
