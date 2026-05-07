import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

const REQUIRED_COLS = ["ID", "Macrofase", "Fase", "Paquete", "Tarea", "Tipo", "Duración (días)"];

function excelDateToDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "number") {
    const d = new Date((val - 25569) * 86400 * 1000);
    return d;
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });

  // Find the sheet
  const sheetName = wb.SheetNames.find((n) => n.toLowerCase().includes("flujo") || n.toLowerCase().includes("entramado"))
    ?? wb.SheetNames[0];

  const ws = wb.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

  if (rows.length === 0) return NextResponse.json({ error: "Hoja vacía" }, { status: 400 });

  // Validate required columns
  const cols = Object.keys(rows[0]);
  const missing = REQUIRED_COLS.filter((c) => !cols.some((k) => k.toLowerCase().includes(c.toLowerCase())));
  if (missing.length > 0) {
    return NextResponse.json({ error: `Columnas faltantes: ${missing.join(", ")}` }, { status: 400 });
  }

  // Map rows to templates
  function get(row: any, ...keys: string[]) {
    for (const k of keys) {
      const match = Object.keys(row).find((rk) => rk.toLowerCase().replace(/[^a-z]/g, "").includes(k.toLowerCase().replace(/[^a-z]/g, "")));
      if (match && row[match] !== "") return String(row[match]).trim();
    }
    return "";
  }

  const templates = rows
    .filter((r) => get(r, "ID") && get(r, "Tarea", "Nombre"))
    .map((r, i) => ({
      code:                get(r, "ID"),
      macroPhase:          get(r, "Macrofase"),
      phase:               get(r, "Fase"),
      package:             get(r, "Paquete"),
      name:                get(r, "Tarea", "Nombre"),
      defaultResponsibleRole: get(r, "Responsable"),
      collaborators:       get(r, "Colaboradores"),
      predecessorCode:     get(r, "Predecesora"),
      type:                get(r, "Tipo") || "Secuencial",
      defaultDurationDays: parseInt(get(r, "Duracion", "Días")) || 1,
      deliverable:         get(r, "Entregable"),
      acceptanceCriteria:  get(r, "Criterio", "Aceptacion"),
      defaultRisk:         get(r, "Riesgo", "Alerta"),
      defaultPriority:     get(r, "Prioridad") || "Media",
      sortOrder:           i + 1,
    }));

  return NextResponse.json({ preview: templates, count: templates.length, sheet: sheetName });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { templates } = await req.json();
  if (!templates || !Array.isArray(templates)) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  // Replace all templates
  await prisma.taskTemplate.deleteMany();
  for (const t of templates) {
    await prisma.taskTemplate.create({ data: t });
  }

  return NextResponse.json({ ok: true, count: templates.length });
}
