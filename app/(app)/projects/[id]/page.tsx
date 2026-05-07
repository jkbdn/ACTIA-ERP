import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { ProjectDetailClient } from "./ProjectDetailClient";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      mainResponsible: { select: { id: true, name: true, role: true } },
      tasks: {
        orderBy: { sortOrder: "asc" },
        include: { responsible: { select: { id: true, name: true } } },
      },
      milestones: { orderBy: { date: "asc" } },
      risks: { orderBy: { createdAt: "desc" } },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!project) notFound();

  const users = await prisma.user.findMany({ select: { id: true, name: true, role: true } });

  // Serialize dates
  const serialized = {
    ...project,
    startDate: project.startDate.toISOString(),
    targetDate: project.targetDate.toISOString(),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    tasks: project.tasks.map((t) => ({
      ...t,
      startDate: t.startDate.toISOString(),
      endDate: t.endDate.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
    milestones: project.milestones.map((m) => ({
      ...m,
      date: m.date.toISOString(),
      createdAt: m.createdAt.toISOString(),
    })),
    risks: project.risks.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    activityLogs: project.activityLogs.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    })),
  };

  return <ProjectDetailClient project={serialized} users={users} />;
}
