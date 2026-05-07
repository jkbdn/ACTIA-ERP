import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const tasks = await prisma.projectTask.findMany({
    where: { projectId: id },
    orderBy: { sortOrder: "asc" },
    include: { responsible: { select: { id: true, name: true } } },
  });
  return NextResponse.json(tasks);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await req.json(); // { taskId, ...fields }
  const { taskId, ...fields } = body;

  const task = await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      ...(fields.status !== undefined && { status: fields.status }),
      ...(fields.priority !== undefined && { priority: fields.priority }),
      ...(fields.notes !== undefined && { notes: fields.notes }),
      ...(fields.risk !== undefined && { risk: fields.risk }),
      ...(fields.progress !== undefined && { progress: fields.progress }),
      ...(fields.responsibleUserId !== undefined && { responsibleUserId: fields.responsibleUserId }),
      ...(fields.durationDays !== undefined && { durationDays: fields.durationDays }),
      ...(fields.startDate !== undefined && {
        startDate: new Date(fields.startDate),
        manuallyLocked: true,
      }),
      ...(fields.endDate !== undefined && {
        endDate: new Date(fields.endDate),
        manuallyLocked: true,
      }),
      ...(fields.manuallyLocked !== undefined && { manuallyLocked: fields.manuallyLocked }),
    },
  });

  // Log
  await prisma.activityLog.create({
    data: {
      projectId: id,
      userId: (session.user as any).id,
      action: "TASK_UPDATED",
      entityType: "ProjectTask",
      entityId: taskId,
      newValue: JSON.stringify(fields),
    },
  });

  return NextResponse.json(task);
}
