import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: { sortOrder: "asc" }, include: { responsible: true } },
      risks: true,
      milestones: { orderBy: { date: "asc" } },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const wb = new ExcelJS.Workbook();
  wb.creator = "ACTIA ERP";
  wb.created = new Date();

  const ACTIA_YELLOW = "FFF5C400";
  const DARK = "FF1F1F1F";
  const GRAY = "FFF5F5F2";

  function headerStyle(ws: ExcelJS.Worksheet, row: number, cols: string[]) {
    const r = ws.getRow(row);
    cols.forEach((col, i) => {
      const cell = r.getCell(i + 1);
      cell.value = col;
      cell.font = { bold: true, color: { argb: DARK }, name: "Calibri", size: 10 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACTIA_YELLOW } };
      cell.border = { bottom: { style: "thin", color: { argb: "FFCCCCCC" } } };
      cell.alignment = { horizontal: "left", vertical: "middle", wrapText: false };
    });
    r.height = 20;
    r.commit();
  }

  const fmtDate = (d: Date | null) => d ? format(d, "dd/MM/yyyy", { locale: es }) : "";

  // === RESUMEN ===
  const wsRes = wb.addWorksheet("Resumen");
  wsRes.columns = [{ width: 30 }, { width: 50 }];
  wsRes.addRow(["ACTIA ERP — Informe de Proyecto"]);
  wsRes.getRow(1).font = { bold: true, size: 14 };
  wsRes.addRow([]);
  wsRes.addRow(["Código", project.code]);
  wsRes.addRow(["Nombre", project.name]);
  wsRes.addRow(["Cliente", project.client]);
  wsRes.addRow(["Ubicación", project.location]);
  wsRes.addRow(["Sistema", project.systemType]);
  wsRes.addRow(["Estado", project.status]);
  wsRes.addRow(["Prioridad", project.priority]);
  wsRes.addRow(["Inicio", fmtDate(project.startDate)]);
  wsRes.addRow(["Objetivo", fmtDate(project.targetDate)]);
  wsRes.addRow(["Presupuesto est.", project.estimatedBudget ? `${project.estimatedBudget.toLocaleString("es-ES")} €` : "—"]);
  wsRes.addRow([]);
  wsRes.addRow(["Total tareas", project.tasks.length]);
  wsRes.addRow(["Completadas", project.tasks.filter((t) => t.status === "Completada").length]);
  wsRes.addRow(["Generado", format(new Date(), "dd/MM/yyyy HH:mm")]);

  // === TAREAS ===
  const wsTasks = wb.addWorksheet("Tareas");
  const taskCols = ["ID","Macrofase","Fase","Paquete","Tarea","Responsable","Colaboradores","Predecesora","Tipo","Duración","Inicio","Fin","Entregable","Criterio aceptación","Riesgo","Estado","Prioridad","Progreso (%)","Observaciones"];
  const taskWidths = [9,24,18,16,40,18,22,12,12,9,13,13,30,30,30,14,10,10,25];
  wsTasks.columns = taskWidths.map((w) => ({ width: w }));
  headerStyle(wsTasks, 1, taskCols);
  wsTasks.autoFilter = "A1:S1";
  wsTasks.views = [{ state: "frozen", ySplit: 1 }];

  project.tasks.forEach((t) => {
    const row = wsTasks.addRow([
      t.code, t.macroPhase, t.phase, t.package, t.name,
      t.responsible?.name ?? "",
      t.collaborators,
      t.predecessorCode,
      t.type,
      t.durationDays,
      fmtDate(t.startDate),
      fmtDate(t.endDate),
      t.deliverable,
      t.acceptanceCriteria,
      t.risk,
      t.status,
      t.priority,
      t.progress,
      t.notes,
    ]);
    if (t.type === "Hito") {
      row.eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF9C4" } }; });
    }
    if (t.type === "Crítico") {
      row.getCell(1).font = { color: { argb: "FFD72638" }, bold: true };
    }
  });

  // === RIESGOS ===
  const wsRisks = wb.addWorksheet("Riesgos");
  wsRisks.columns = [{ width: 10 }, { width: 35 }, { width: 10 }, { width: 10 }, { width: 30 }, { width: 12 }];
  headerStyle(wsRisks, 1, ["Tarea","Descripción","Severidad","Probabilidad","Mitigación","Estado"]);
  project.risks.forEach((r) => {
    wsRisks.addRow([r.taskCode, r.description, r.severity, r.probability, r.mitigation, r.status]);
  });

  // === HITOS ===
  const wsHitos = wb.addWorksheet("Hitos");
  wsHitos.columns = [{ width: 40 }, { width: 14 }, { width: 14 }];
  headerStyle(wsHitos, 1, ["Nombre","Fecha","Estado"]);
  project.milestones.forEach((m) => {
    wsHitos.addRow([m.name, fmtDate(m.date), m.status]);
  });

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `${project.code}_${project.name.replace(/[^a-z0-9]/gi, "_")}.xlsx`;

  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
