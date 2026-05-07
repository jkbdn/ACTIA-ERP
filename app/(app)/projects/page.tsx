import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProjectsClient } from "./ProjectsClient";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { archived: false },
    include: {
      mainResponsible: { select: { id: true, name: true } },
      tasks: { select: { status: true, durationDays: true, endDate: true } },
      _count: { select: { tasks: true, risks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = projects.map((p) => ({
    ...p,
    startDate: p.startDate.toISOString(),
    targetDate: p.targetDate.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    tasks: p.tasks.map((t) => ({ ...t, endDate: t.endDate.toISOString() })),
  }));

  return (
    <div>
      <ProjectsClient projects={serialized} />
    </div>
  );
}
