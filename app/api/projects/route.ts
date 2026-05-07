import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";
import { z } from "zod";

const CreateProjectSchema = z.object({
  name: z.string().min(2),
  client: z.string().min(1),
  location: z.string().default(""),
  systemType: z.string().default("Entramado ligero"),
  startDate: z.string(),
  targetDate: z.string(),
  status: z.string().default("En diseño"),
  priority: z.string().default("Media"),
  mainResponsibleId: z.string().optional().nullable(),
  estimatedBudget: z.number().optional().nullable(),
  notes: z.string().default(""),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const archived = searchParams.get("archived") === "true";

  const projects = await prisma.project.findMany({
    where: {
      archived,
      ...(status ? { status } : {}),
    },
    include: {
      mainResponsible: { select: { id: true, name: true, role: true } },
      tasks: { select: { status: true, durationDays: true, type: true, endDate: true } },
      milestones: { orderBy: { date: "asc" }, take: 3 },
      _count: { select: { tasks: true, risks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = CreateProjectSchema.parse(body);

  // Generate unique code
  const count = await prisma.project.count();
  const code = `PRY-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

  const startDate = new Date(data.startDate);

  const project = await prisma.project.create({
    data: {
      code,
      name: data.name,
      client: data.client,
      location: data.location,
      systemType: data.systemType,
      startDate,
      targetDate: new Date(data.targetDate),
      status: data.status,
      priority: data.priority,
      mainResponsibleId: data.mainResponsibleId || null,
      estimatedBudget: data.estimatedBudget || null,
      notes: data.notes,
    },
  });

  // Generate tasks from templates
  const templates = await prisma.taskTemplate.findMany({ orderBy: { sortOrder: "asc" } });

  // Compute dates respecting dependencies
  const dateMap = new Map<string, { start: Date; end: Date }>();

  function resolveDate(code: string): { start: Date; end: Date } {
    if (dateMap.has(code)) return dateMap.get(code)!;
    const t = templates.find((x) => x.code === code);
    if (!t) return { start: startDate, end: startDate };

    let start = new Date(startDate);
    if (t.predecessorCode) {
      const pred = resolveDate(t.predecessorCode);
      start = addDays(new Date(pred.end), t.type === "Paralelo" ? 0 : 1);
    }
    const end = addDays(start, Math.max(t.defaultDurationDays - 1, 0));
    dateMap.set(code, { start, end });
    return { start, end };
  }

  for (const t of templates) resolveDate(t.code);

  for (const t of templates) {
    const d = dateMap.get(t.code) ?? { start: startDate, end: startDate };
    await prisma.projectTask.create({
      data: {
        projectId: project.id,
        templateId: t.id,
        code: t.code,
        macroPhase: t.macroPhase,
        phase: t.phase,
        package: t.package,
        name: t.name,
        responsibleUserId: data.mainResponsibleId || null,
        collaborators: t.collaborators,
        predecessorCode: t.predecessorCode,
        type: t.type,
        durationDays: t.defaultDurationDays,
        startDate: d.start,
        endDate: d.end,
        deliverable: t.deliverable,
        acceptanceCriteria: t.acceptanceCriteria,
        risk: t.defaultRisk,
        status: "No iniciada",
        priority: t.defaultPriority,
        sortOrder: t.sortOrder,
      },
    });
  }

  // Create milestones from Hito tasks
  const hitoTemplates = templates.filter((t) => t.type === "Hito");
  for (const h of hitoTemplates) {
    const d = dateMap.get(h.code);
    if (d) {
      await prisma.milestone.create({
        data: { projectId: project.id, name: h.name, date: d.start, type: "Hito", status: "Pendiente" },
      });
    }
  }

  await prisma.activityLog.create({
    data: {
      projectId: project.id,
      userId: (session.user as any).id,
      action: "CREATED",
      entityType: "Project",
      entityId: project.id,
      newValue: project.name,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
