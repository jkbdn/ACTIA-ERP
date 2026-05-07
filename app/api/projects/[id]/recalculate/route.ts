import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tasks = await prisma.projectTask.findMany({
    where: { projectId: id },
    orderBy: { sortOrder: "asc" },
  });

  const startDate = project.startDate;
  const byCode = new Map(tasks.map((t) => [t.code, t]));
  const dateMap = new Map<string, { start: Date; end: Date }>();

  function resolve(code: string): { start: Date; end: Date } {
    if (dateMap.has(code)) return dateMap.get(code)!;
    const t = byCode.get(code);
    if (!t) return { start: new Date(startDate), end: new Date(startDate) };

    if (t.manuallyLocked) {
      dateMap.set(code, { start: new Date(t.startDate), end: new Date(t.endDate) });
      return dateMap.get(code)!;
    }

    let start = new Date(startDate);
    if (t.predecessorCode && byCode.has(t.predecessorCode)) {
      const pred = resolve(t.predecessorCode);
      start = addDays(new Date(pred.end), t.type === "Paralelo" ? 0 : 1);
    }
    const end = addDays(start, Math.max(t.durationDays - 1, 0));
    dateMap.set(code, { start, end });
    return { start, end };
  }

  for (const t of tasks) resolve(t.code);

  // Bulk update
  const updates = tasks.map((t) => {
    const d = dateMap.get(t.code) ?? { start: new Date(startDate), end: new Date(startDate) };
    return prisma.projectTask.update({
      where: { id: t.id },
      data: { startDate: d.start, endDate: d.end },
    });
  });

  await prisma.$transaction(updates);

  const updated = await prisma.projectTask.findMany({
    where: { projectId: id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ ok: true, tasks: updated });
}
