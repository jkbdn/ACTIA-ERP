import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      documents: { orderBy: { createdAt: "desc" } },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await req.json();
  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.client !== undefined && { client: body.client }),
      ...(body.location !== undefined && { location: body.location }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.targetDate !== undefined && { targetDate: new Date(body.targetDate) }),
      ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.estimatedBudget !== undefined && { estimatedBudget: body.estimatedBudget }),
      ...(body.mainResponsibleId !== undefined && { mainResponsibleId: body.mainResponsibleId }),
      ...(body.archived !== undefined && { archived: body.archived }),
    },
  });

  await prisma.activityLog.create({
    data: {
      projectId: id,
      userId: (session.user as any).id,
      action: "UPDATED",
      entityType: "Project",
      entityId: id,
      newValue: JSON.stringify(body),
    },
  });

  return NextResponse.json(project);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
