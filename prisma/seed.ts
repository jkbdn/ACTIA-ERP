import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TASK_TEMPLATES = [
  { code:"COM-01", macroPhase:"Comercial / Viabilidad", phase:"Captación", package:"Oferta", name:"Registro de oportunidad y datos del cliente", defaultResponsibleRole:"Desarrollo negocio", collaborators:"Dirección", predecessorCode:"", type:"Secuencial", defaultDurationDays:1, deliverable:"Ficha de oportunidad", acceptanceCriteria:"Ficha completa con alcance, parcela, programa y presupuesto objetivo", defaultRisk:"Datos incompletos del cliente", defaultPriority:"Media", sortOrder:1 },
  { code:"COM-02", macroPhase:"Comercial / Viabilidad", phase:"Captación", package:"Requisitos", name:"Programa funcional y necesidades del cliente", defaultResponsibleRole:"Arquitectura", collaborators:"Cliente / Comercial", predecessorCode:"COM-01", type:"Secuencial", defaultDurationDays:2, deliverable:"Programa de necesidades", acceptanceCriteria:"Programa validado por cliente", defaultRisk:"Cambios tardíos de alcance", defaultPriority:"Media", sortOrder:2 },
  { code:"COM-03", macroPhase:"Comercial / Viabilidad", phase:"Viabilidad", package:"Parcela", name:"Análisis de parcela, accesos y condicionantes", defaultResponsibleRole:"Arquitectura", collaborators:"Obra / Ingeniería", predecessorCode:"COM-02", type:"Secuencial", defaultDurationDays:2, deliverable:"Informe de condicionantes", acceptanceCriteria:"Accesos, grúa, normativa y restricciones identificadas", defaultRisk:"Acceso insuficiente para transporte o grúa", defaultPriority:"Alta", sortOrder:3 },
  { code:"COM-04", macroPhase:"Comercial / Viabilidad", phase:"Viabilidad", package:"Coste", name:"Viabilidad técnico-económica preliminar", defaultResponsibleRole:"Dirección técnica", collaborators:"Costes / Producción", predecessorCode:"COM-03", type:"Crítico", defaultDurationDays:5, deliverable:"Informe de viabilidad", acceptanceCriteria:"Margen, riesgos y plazo validados", defaultRisk:"Costes no realistas o alcance indefinido", defaultPriority:"Alta", sortOrder:4 },
  { code:"COM-05", macroPhase:"Comercial / Viabilidad", phase:"Decisión", package:"Hito", name:"Go / No-go del proyecto", defaultResponsibleRole:"Dirección", collaborators:"Cliente / Comercial", predecessorCode:"COM-04", type:"Hito", defaultDurationDays:0, deliverable:"Acta de decisión", acceptanceCriteria:"Decisión tomada y condiciones documentadas", defaultRisk:"Avanzar sin condiciones claras", defaultPriority:"Alta", sortOrder:5 },
  { code:"DIS-01", macroPhase:"Diseño + Ingeniería", phase:"Diseño DfMA", package:"Sistema", name:"Definir sistema de entramado ligero, modulación y prefabricación", defaultResponsibleRole:"Arquitectura", collaborators:"Ingeniería / Producción", predecessorCode:"COM-05", type:"Crítico", defaultDurationDays:3, deliverable:"Estrategia DfMA", acceptanceCriteria:"Sistema, módulo, transporte y montaje coherentes", defaultRisk:"Diseño no fabricable", defaultPriority:"Alta", sortOrder:6 },
  { code:"DIS-02", macroPhase:"Diseño + Ingeniería", phase:"Diseño DfMA", package:"Arquitectura", name:"Modulación, retícula estructural y criterios de panelización", defaultResponsibleRole:"Arquitectura", collaborators:"Ingeniería / Producción", predecessorCode:"DIS-01", type:"Secuencial", defaultDurationDays:4, deliverable:"Plano de modulación", acceptanceCriteria:"Retícula y panelización preliminar aprobadas", defaultRisk:"Paneles demasiado grandes o ineficientes", defaultPriority:"Alta", sortOrder:7 },
  { code:"DIS-03", macroPhase:"Diseño + Ingeniería", phase:"Arquitectura", package:"Anteproyecto", name:"Anteproyecto compatible con entramado ligero", defaultResponsibleRole:"Arquitectura", collaborators:"Cliente / Costes", predecessorCode:"DIS-02", type:"Secuencial", defaultDurationDays:10, deliverable:"Anteproyecto", acceptanceCriteria:"Distribución, volumetría y criterio constructivo aprobados", defaultRisk:"Cambios de cliente después de ingeniería", defaultPriority:"Media", sortOrder:8 },
  { code:"DIS-04", macroPhase:"Diseño + Ingeniería", phase:"Arquitectura", package:"Validación", name:"Validación cliente y congelación de alcance básico", defaultResponsibleRole:"Arquitectura", collaborators:"Cliente / Dirección", predecessorCode:"DIS-03", type:"Control", defaultDurationDays:2, deliverable:"Acta de validación", acceptanceCriteria:"Alcance congelado para avanzar a básico", defaultRisk:"No congelar alcance", defaultPriority:"Alta", sortOrder:9 },
  { code:"DIS-05", macroPhase:"Diseño + Ingeniería", phase:"Licencia", package:"Proyecto básico", name:"Proyecto básico / documentación para licencia", defaultResponsibleRole:"Arquitectura", collaborators:"Consultores", predecessorCode:"DIS-04", type:"Secuencial", defaultDurationDays:20, deliverable:"Proyecto básico", acceptanceCriteria:"Documentación lista para tramitación", defaultRisk:"Retrasos administrativos", defaultPriority:"Media", sortOrder:10 },
  { code:"ENG-01", macroPhase:"Diseño + Ingeniería", phase:"BIM", package:"Modelo", name:"Modelo BIM base coordinado", defaultResponsibleRole:"BIM Manager", collaborators:"Arquitectura / Ingeniería", predecessorCode:"DIS-05", type:"Crítico", defaultDurationDays:5, deliverable:"Modelo BIM base", acceptanceCriteria:"Niveles, ejes, familias y codificación definidos", defaultRisk:"Modelo sin codificación para producción", defaultPriority:"Alta", sortOrder:11 },
  { code:"ENG-02", macroPhase:"Diseño + Ingeniería", phase:"Ingeniería", package:"Estructura", name:"Cálculo estructural de entramado ligero", defaultResponsibleRole:"Ingeniería estructuras", collaborators:"Arquitectura", predecessorCode:"ENG-01", type:"Crítico", defaultDurationDays:10, deliverable:"Memoria y predimensionado estructural", acceptanceCriteria:"Secciones, arriostramiento y cargas validadas", defaultRisk:"Cambios por cálculo tardío", defaultPriority:"Alta", sortOrder:12 },
  { code:"ENG-03", macroPhase:"Diseño + Ingeniería", phase:"Coordinación", package:"MEP", name:"Coordinación arquitectura-estructura-instalaciones", defaultResponsibleRole:"BIM Manager", collaborators:"MEP / Producción", predecessorCode:"ENG-02", type:"Crítico", defaultDurationDays:8, deliverable:"Modelo coordinado", acceptanceCriteria:"Interferencias resueltas y pasos previstos", defaultRisk:"Colisiones en taller u obra", defaultPriority:"Alta", sortOrder:13 },
  { code:"ENG-04", macroPhase:"Diseño + Ingeniería", phase:"Taller", package:"Paneles", name:"Detalles de paneles, encuentros, huecos y nudos", defaultResponsibleRole:"Oficina técnica", collaborators:"Producción / Ingeniería", predecessorCode:"ENG-03", type:"Crítico", defaultDurationDays:8, deliverable:"Detalles de taller", acceptanceCriteria:"Nudos, huecos, uniones y tolerancias definidos", defaultRisk:"Detalle insuficiente para fabricación", defaultPriority:"Alta", sortOrder:14 },
  { code:"ENG-05", macroPhase:"Diseño + Ingeniería", phase:"Física edificio", package:"Envolvente", name:"Estrategia higrotérmica, estanqueidad y protección madera", defaultResponsibleRole:"Ingeniería envolvente", collaborators:"Arquitectura / Obra", predecessorCode:"ENG-04", type:"Control", defaultDurationDays:4, deliverable:"Informe higrotérmico", acceptanceCriteria:"Capas, membranas y puntos críticos definidos", defaultRisk:"Riesgo de humedad / condensación", defaultPriority:"Alta", sortOrder:15 },
  { code:"ENG-06", macroPhase:"Diseño + Ingeniería", phase:"Revisión DfMA", package:"Fabricabilidad", name:"Revisión integral DfMA y congelación para producción", defaultResponsibleRole:"Dirección técnica", collaborators:"Arquitectura / Producción / Obra", predecessorCode:"ENG-05", type:"Hito", defaultDurationDays:3, deliverable:"Acta de congelación de diseño", acceptanceCriteria:"Diseño liberado para compras y taller", defaultRisk:"Fabricar con diseño no cerrado", defaultPriority:"Alta", sortOrder:16 },
  { code:"PRO-01", macroPhase:"Compras + Producción", phase:"Compras", package:"Materiales", name:"Lista de materiales: madera, tableros, herrajes, membranas", defaultResponsibleRole:"Compras", collaborators:"Oficina técnica", predecessorCode:"ENG-06", type:"Crítico", defaultDurationDays:3, deliverable:"BOM / mediciones", acceptanceCriteria:"Cantidades verificadas contra modelo y planos", defaultRisk:"Errores de medición", defaultPriority:"Alta", sortOrder:17 },
  { code:"PRO-02", macroPhase:"Compras + Producción", phase:"Compras", package:"Proveedores", name:"Solicitud y comparativo de ofertas de proveedores críticos", defaultResponsibleRole:"Compras", collaborators:"Dirección / Producción", predecessorCode:"PRO-01", type:"Secuencial", defaultDurationDays:7, deliverable:"Comparativo ofertas", acceptanceCriteria:"Coste, plazo y condiciones comparadas", defaultRisk:"Plazos de suministro largos", defaultPriority:"Media", sortOrder:18 },
  { code:"PRO-03", macroPhase:"Compras + Producción", phase:"Compras", package:"Contratación", name:"Adjudicación de proveedores críticos", defaultResponsibleRole:"Dirección", collaborators:"Compras", predecessorCode:"PRO-02", type:"Hito", defaultDurationDays:3, deliverable:"Pedidos / contratos", acceptanceCriteria:"Pedidos emitidos con plazo y especificación cerrada", defaultRisk:"Proveedores sin capacidad", defaultPriority:"Alta", sortOrder:19 },
  { code:"PRO-04", macroPhase:"Compras + Producción", phase:"Compras", package:"Trazabilidad", name:"Plan de acopio y trazabilidad FSC/PEFC si aplica", defaultResponsibleRole:"Compras", collaborators:"Calidad / Producción", predecessorCode:"PRO-03", type:"Control", defaultDurationDays:2, deliverable:"Plan de acopio", acceptanceCriteria:"Materiales identificados, certificados y trazables", defaultRisk:"Material no conforme", defaultPriority:"Media", sortOrder:20 },
  { code:"FAB-01", macroPhase:"Compras + Producción", phase:"Producción off-site", package:"Taller", name:"Planos de taller / CAD-CAM / listas de corte", defaultResponsibleRole:"Oficina técnica", collaborators:"Producción", predecessorCode:"ENG-06", type:"Crítico", defaultDurationDays:7, deliverable:"Planos de taller", acceptanceCriteria:"Planos revisados y aptos para fabricación", defaultRisk:"Errores CAD-CAM", defaultPriority:"Alta", sortOrder:21 },
  { code:"FAB-02", macroPhase:"Compras + Producción", phase:"Producción off-site", package:"Liberación", name:"Revisión de taller y liberación a fabricación", defaultResponsibleRole:"Producción", collaborators:"Oficina técnica / Calidad", predecessorCode:"FAB-01", type:"Hito", defaultDurationDays:2, deliverable:"Liberación de taller", acceptanceCriteria:"Sin incidencias abiertas críticas", defaultRisk:"Fabricar con incidencias abiertas", defaultPriority:"Alta", sortOrder:22 },
  { code:"FAB-03", macroPhase:"Compras + Producción", phase:"Producción off-site", package:"Suministro", name:"Recepción y verificación de madera y tableros", defaultResponsibleRole:"Producción", collaborators:"Compras / Calidad", predecessorCode:"PRO-04", type:"Control", defaultDurationDays:5, deliverable:"Recepción materiales", acceptanceCriteria:"Material conforme en calidad, humedad y dimensiones", defaultRisk:"Humedad o defectos de madera", defaultPriority:"Alta", sortOrder:23 },
  { code:"FAB-04", macroPhase:"Compras + Producción", phase:"Producción off-site", package:"Paneles", name:"Fabricación de paneles de muros", defaultResponsibleRole:"Producción", collaborators:"Calidad", predecessorCode:"FAB-03", type:"Crítico", defaultDurationDays:10, deliverable:"Paneles de muro fabricados", acceptanceCriteria:"Dimensiones, escuadras y uniones verificadas", defaultRisk:"Reprocesos en taller", defaultPriority:"Alta", sortOrder:24 },
  { code:"FAB-05", macroPhase:"Compras + Producción", phase:"Producción off-site", package:"Forjados/cubierta", name:"Fabricación de forjados y cubierta", defaultResponsibleRole:"Producción", collaborators:"Calidad", predecessorCode:"FAB-04", type:"Crítico", defaultDurationDays:8, deliverable:"Forjados/cubierta fabricados", acceptanceCriteria:"Elementos identificados y protegidos", defaultRisk:"Daños por manipulación", defaultPriority:"Alta", sortOrder:25 },
  { code:"FAB-06", macroPhase:"Compras + Producción", phase:"Producción off-site", package:"Preinstalaciones", name:"Preinstalaciones y premontajes en taller si aplica", defaultResponsibleRole:"Producción", collaborators:"MEP / Calidad", predecessorCode:"FAB-05", type:"Paralelo", defaultDurationDays:5, deliverable:"Preinstalaciones", acceptanceCriteria:"Pasos, cajas y reservas ejecutadas según modelo", defaultRisk:"Reservas mal ubicadas", defaultPriority:"Media", sortOrder:26 },
  { code:"FAB-07", macroPhase:"Compras + Producción", phase:"Producción off-site", package:"Calidad", name:"Control de calidad final y embalaje protegido", defaultResponsibleRole:"Calidad", collaborators:"Producción / Logística", predecessorCode:"FAB-06", type:"Control", defaultDurationDays:3, deliverable:"Checklist calidad taller", acceptanceCriteria:"Paneles etiquetados, protegidos y listos para transporte", defaultRisk:"Daños por falta de protección", defaultPriority:"Alta", sortOrder:27 },
  { code:"OBR-01", macroPhase:"Obra + Logística", phase:"Obra previa", package:"Replanteo", name:"Replanteo de parcela y comprobación de accesos", defaultResponsibleRole:"Jefe de obra", collaborators:"Topografía / Logística", predecessorCode:"DIS-05", type:"Paralelo", defaultDurationDays:1, deliverable:"Acta de replanteo", acceptanceCriteria:"Ejes, cotas y accesos confirmados", defaultRisk:"Error de replanteo", defaultPriority:"Alta", sortOrder:28 },
  { code:"OBR-02", macroPhase:"Obra + Logística", phase:"Obra previa", package:"Cimentación", name:"Movimiento de tierras y cimentación", defaultResponsibleRole:"Jefe de obra", collaborators:"Subcontrata / Dirección obra", predecessorCode:"OBR-01", type:"Crítico", defaultDurationDays:15, deliverable:"Cimentación ejecutada", acceptanceCriteria:"Cotas y anclajes según tolerancias", defaultRisk:"Cimentación fuera de tolerancia", defaultPriority:"Alta", sortOrder:29 },
  { code:"OBR-03", macroPhase:"Obra + Logística", phase:"Obra previa", package:"Tolerancias", name:"Control de tolerancias de cimentación y anclajes", defaultResponsibleRole:"Calidad", collaborators:"Jefe de obra / Topografía", predecessorCode:"OBR-02", type:"Control", defaultDurationDays:2, deliverable:"Informe tolerancias", acceptanceCriteria:"Tolerancias compatibles con paneles", defaultRisk:"Montaje bloqueado por tolerancias", defaultPriority:"Alta", sortOrder:30 },
  { code:"LOG-01", macroPhase:"Obra + Logística", phase:"Logística", package:"Montaje", name:"Plan de montaje, izado y seguridad", defaultResponsibleRole:"Jefe de montaje", collaborators:"PRL / Producción / Logística", predecessorCode:"ENG-06", type:"Crítico", defaultDurationDays:4, deliverable:"Plan de montaje", acceptanceCriteria:"Secuencia, medios auxiliares y riesgos definidos", defaultRisk:"Plan insuficiente de izado", defaultPriority:"Alta", sortOrder:31 },
  { code:"LOG-02", macroPhase:"Obra + Logística", phase:"Logística", package:"Transporte", name:"Plan de transporte just-in-time y orden de carga", defaultResponsibleRole:"Logística", collaborators:"Producción / Jefe montaje", predecessorCode:"LOG-01", type:"Crítico", defaultDurationDays:3, deliverable:"Plan logístico", acceptanceCriteria:"Camiones y orden de descarga coordinados con montaje", defaultRisk:"Acopio imposible en obra", defaultPriority:"Alta", sortOrder:32 },
  { code:"LOG-03", macroPhase:"Obra + Logística", phase:"Logística", package:"Clima", name:"Plan de protección ante lluvia y ventanas meteorológicas", defaultResponsibleRole:"Jefe de montaje", collaborators:"PRL / Calidad", predecessorCode:"LOG-02", type:"Control", defaultDurationDays:2, deliverable:"Plan de protección", acceptanceCriteria:"Lonas, protecciones y procedimiento definidos", defaultRisk:"Madera expuesta a humedad", defaultPriority:"Alta", sortOrder:33 },
  { code:"MON-01", macroPhase:"Montaje + Entrega", phase:"Montaje", package:"Recepción", name:"Recepción de paneles en obra y comprobación documental", defaultResponsibleRole:"Jefe de montaje", collaborators:"Calidad / Logística", predecessorCode:"FAB-07", type:"Control", defaultDurationDays:1, deliverable:"Acta recepción obra", acceptanceCriteria:"Paneles sin daños y documentación completa", defaultRisk:"Paneles dañados o incompletos", defaultPriority:"Alta", sortOrder:34 },
  { code:"MON-02", macroPhase:"Montaje + Entrega", phase:"Montaje", package:"Estructura", name:"Montaje de muros planta baja", defaultResponsibleRole:"Jefe de montaje", collaborators:"Equipo montaje / Grúa", predecessorCode:"MON-01", type:"Crítico", defaultDurationDays:3, deliverable:"Muros PB montados", acceptanceCriteria:"Aplomado, fijaciones y arriostramiento correcto", defaultRisk:"Desviaciones de montaje", defaultPriority:"Alta", sortOrder:35 },
  { code:"MON-03", macroPhase:"Montaje + Entrega", phase:"Montaje", package:"Estructura", name:"Montaje de forjado y muros superiores", defaultResponsibleRole:"Jefe de montaje", collaborators:"Equipo montaje / Grúa", predecessorCode:"MON-02", type:"Crítico", defaultDurationDays:4, deliverable:"Estructura intermedia montada", acceptanceCriteria:"Tolerancias y uniones verificadas", defaultRisk:"Retrasos por secuencia de grúa", defaultPriority:"Alta", sortOrder:36 },
  { code:"MON-04", macroPhase:"Montaje + Entrega", phase:"Montaje", package:"Cubierta", name:"Montaje de cubierta y cierre estructural", defaultResponsibleRole:"Jefe de montaje", collaborators:"Equipo montaje", predecessorCode:"MON-03", type:"Crítico", defaultDurationDays:3, deliverable:"Cubierta montada", acceptanceCriteria:"Edificio cerrado estructuralmente", defaultRisk:"Lluvia antes de cerrar cubierta", defaultPriority:"Alta", sortOrder:37 },
  { code:"MON-05", macroPhase:"Montaje + Entrega", phase:"Montaje", package:"Estanqueidad", name:"Sellados, barrera de vapor y continuidad de envolvente", defaultResponsibleRole:"Jefe de obra", collaborators:"Calidad / Envolvente", predecessorCode:"MON-04", type:"Control", defaultDurationDays:3, deliverable:"Checklist estanqueidad", acceptanceCriteria:"Continuidad de capas verificada", defaultRisk:"Pérdidas de estanqueidad", defaultPriority:"Alta", sortOrder:38 },
  { code:"MON-06", macroPhase:"Montaje + Entrega", phase:"Montaje", package:"Control", name:"Revisión estructural post-montaje", defaultResponsibleRole:"Ingeniería estructuras", collaborators:"Jefe de montaje / Calidad", predecessorCode:"MON-05", type:"Hito", defaultDurationDays:1, deliverable:"Acta revisión estructural", acceptanceCriteria:"Uniones y arriostramientos conformes", defaultRisk:"No conformidades estructurales", defaultPriority:"Alta", sortOrder:39 },
  { code:"MEP-01", macroPhase:"Montaje + Entrega", phase:"Interior", package:"Instalaciones", name:"Instalaciones interiores y conexiones principales", defaultResponsibleRole:"MEP", collaborators:"Jefe de obra", predecessorCode:"MON-06", type:"Secuencial", defaultDurationDays:12, deliverable:"Instalaciones ejecutadas", acceptanceCriteria:"Instalaciones probadas y sin interferencias", defaultRisk:"Rozas o pasos no previstos", defaultPriority:"Media", sortOrder:40 },
  { code:"MEP-02", macroPhase:"Montaje + Entrega", phase:"Interior", package:"Aislamiento", name:"Aislamiento, trasdosados y control de puentes térmicos", defaultResponsibleRole:"Jefe de obra", collaborators:"Calidad / MEP", predecessorCode:"MEP-01", type:"Secuencial", defaultDurationDays:8, deliverable:"Aislamiento y trasdosados", acceptanceCriteria:"Capas instaladas según detalle higrotérmico", defaultRisk:"Huecos o discontinuidades", defaultPriority:"Alta", sortOrder:41 },
  { code:"MEP-03", macroPhase:"Montaje + Entrega", phase:"Exterior", package:"Envolvente", name:"Fachada, carpinterías y remates exteriores", defaultResponsibleRole:"Jefe de obra", collaborators:"Subcontratas / Calidad", predecessorCode:"MEP-02", type:"Secuencial", defaultDurationDays:10, deliverable:"Envolvente exterior", acceptanceCriteria:"Carpinterías selladas y fachada terminada", defaultRisk:"Infiltraciones / remates deficientes", defaultPriority:"Alta", sortOrder:42 },
  { code:"MEP-04", macroPhase:"Montaje + Entrega", phase:"Interior", package:"Acabados", name:"Acabados interiores", defaultResponsibleRole:"Jefe de obra", collaborators:"Subcontratas", predecessorCode:"MEP-03", type:"Secuencial", defaultDurationDays:15, deliverable:"Acabados terminados", acceptanceCriteria:"Acabados según estándar y mediciones", defaultRisk:"Retrasos por oficios", defaultPriority:"Media", sortOrder:43 },
  { code:"QA-01", macroPhase:"Montaje + Entrega", phase:"Calidad", package:"Ensayos", name:"Blower door / control de estanqueidad", defaultResponsibleRole:"Calidad", collaborators:"Jefe de obra / Envolvente", predecessorCode:"MEP-04", type:"Control", defaultDurationDays:1, deliverable:"Informe ensayo", acceptanceCriteria:"Resultado dentro del objetivo definido", defaultRisk:"Fugas no localizadas", defaultPriority:"Alta", sortOrder:44 },
  { code:"QA-02", macroPhase:"Montaje + Entrega", phase:"Entrega", package:"Repasos", name:"Repasos, punch list y no conformidades", defaultResponsibleRole:"Jefe de obra", collaborators:"Calidad / Cliente", predecessorCode:"QA-01", type:"Control", defaultDurationDays:5, deliverable:"Lista de repasos cerrada", acceptanceCriteria:"Sin pendientes críticos para entrega", defaultRisk:"Repasos abiertos", defaultPriority:"Alta", sortOrder:45 },
  { code:"QA-03", macroPhase:"Montaje + Entrega", phase:"Entrega", package:"Documentación", name:"As-built, manual de mantenimiento y garantías", defaultResponsibleRole:"BIM Manager", collaborators:"Calidad / Administración", predecessorCode:"QA-02", type:"Secuencial", defaultDurationDays:5, deliverable:"Dossier final", acceptanceCriteria:"As-built, garantías y manuales entregados", defaultRisk:"Falta de documentación", defaultPriority:"Media", sortOrder:46 },
  { code:"QA-04", macroPhase:"Montaje + Entrega", phase:"Entrega", package:"Hito", name:"Entrega cliente y activación postventa", defaultResponsibleRole:"Dirección", collaborators:"Jefe de obra / Cliente", predecessorCode:"QA-03", type:"Hito", defaultDurationDays:1, deliverable:"Acta de entrega", acceptanceCriteria:"Entrega firmada y canal postventa definido", defaultRisk:"Incidencias post-entrega", defaultPriority:"Alta", sortOrder:47 },
];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function computeTaskDates(
  templates: typeof TASK_TEMPLATES,
  projectStart: Date
): Map<string, { startDate: Date; endDate: Date }> {
  const dates = new Map<string, { startDate: Date; endDate: Date }>();
  const byCode = new Map(templates.map((t) => [t.code, t]));

  function resolve(code: string): { startDate: Date; endDate: Date } {
    if (dates.has(code)) return dates.get(code)!;
    const t = byCode.get(code)!;
    let start = projectStart;
    if (t.predecessorCode && byCode.has(t.predecessorCode)) {
      const pred = resolve(t.predecessorCode);
      start = new Date(pred.endDate);
      if (t.type !== "Paralelo") start = addDays(start, 1);
    }
    const end = addDays(start, Math.max(t.defaultDurationDays - 1, 0));
    dates.set(code, { startDate: start, endDate: end });
    return { startDate: start, endDate: end };
  }

  for (const t of templates) resolve(t.code);
  return dates;
}

async function main() {
  console.log("🌱 Seeding ACTIA ERP (modo seguro — no borra datos existentes)...");

  // ── Usuarios (upsert por email — no toca los existentes) ──────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@actia.tech" },
    update: {},
    create: { name: "Administrador ACTIA", email: "admin@actia.tech", passwordHash: await bcrypt.hash("actia2026", 10), role: "Administrador" },
  });
  const arch = await prisma.user.upsert({
    where: { email: "arquitectura@actia.tech" },
    update: {},
    create: { name: "Ana García", email: "arquitectura@actia.tech", passwordHash: await bcrypt.hash("actia2026", 10), role: "Arquitectura" },
  });
  const ing = await prisma.user.upsert({
    where: { email: "ingenieria@actia.tech" },
    update: {},
    create: { name: "Carlos López", email: "ingenieria@actia.tech", passwordHash: await bcrypt.hash("actia2026", 10), role: "Ingeniería" },
  });
  const prod = await prisma.user.upsert({
    where: { email: "produccion@actia.tech" },
    update: {},
    create: { name: "Marta Ruiz", email: "produccion@actia.tech", passwordHash: await bcrypt.hash("actia2026", 10), role: "Producción" },
  });
  console.log("✅ Usuarios verificados");

  // ── Plantillas de tareas (upsert por code — no toca las existentes) ────────
  for (const t of TASK_TEMPLATES) {
    await prisma.taskTemplate.upsert({
      where: { code: t.code },
      update: {},
      create: t,
    });
  }
  console.log("✅ Plantillas de tareas verificadas (47)");

  // ── Proyectos de ejemplo (solo crea si no existen por code) ───────────────
  const DEMO_PROJECTS = [
    {
      code: "PRY-2026-001",
      name: "Residencia de Lloret de Mar",
      client: "Família Puigdomènech",
      location: "Lloret de Mar, Girona",
      startDate: new Date("2026-01-15"),
      targetDate: new Date("2026-10-31"),
      status: "En producción",
      priority: "Alta",
      mainResponsibleId: arch.id,
      estimatedBudget: 385000,
      notes: "Vivienda unifamiliar entramado ligero, 210m². Parcela con pendiente y vistas al mar.",
    },
    {
      code: "PRY-2026-002",
      name: "Residencia de Llinars del Vallès",
      client: "Familia Torrent",
      location: "Llinars del Vallès, Barcelona",
      startDate: new Date("2026-03-01"),
      targetDate: new Date("2026-12-15"),
      status: "En diseño",
      priority: "Media",
      mainResponsibleId: arch.id,
      estimatedBudget: 295000,
      notes: "Vivienda unifamiliar de una planta, 160m². Sistema entramado ligero con cubierta a dos aguas.",
    },
    {
      code: "PRY-2026-003",
      name: "Edificio Plurifamiliar Palamós II",
      client: "Promotora Costa Brava Habitatge S.L.",
      location: "Palamós, Girona",
      startDate: new Date("2025-10-01"),
      targetDate: new Date("2026-11-30"),
      status: "En producción",
      priority: "Crítica",
      mainResponsibleId: ing.id,
      estimatedBudget: 1480000,
      notes: "10 viviendas en bloque de 4 plantas. Estructura completa en entramado ligero. Certificación energética A.",
    },
    {
      code: "PRY-2026-004",
      name: "Escola La Mar",
      client: "Ajuntament de Palamós",
      location: "Palamós, Girona",
      startDate: new Date("2026-02-01"),
      targetDate: new Date("2027-01-31"),
      status: "En diseño",
      priority: "Alta",
      mainResponsibleId: admin.id,
      estimatedBudget: 920000,
      notes: "Edificio escolar de dos plantas, 680m². Construcción en madera con criterios Passivhaus y uso público.",
    },
    {
      code: "PRY-2026-005",
      name: "Edificio Palau",
      client: "Palau Inversions Immobiliàries S.L.",
      location: "Palau-solità i Plegamans, Barcelona",
      startDate: new Date("2026-04-15"),
      targetDate: new Date("2027-03-31"),
      status: "Iniciación",
      priority: "Media",
      mainResponsibleId: ing.id,
      estimatedBudget: 760000,
      notes: "6 viviendas plurifamiliares con estructura de madera. Proyecto en fase de viabilidad técnica.",
    },
  ];

  const templateList = await prisma.taskTemplate.findMany({ orderBy: { sortOrder: "asc" } });

  for (const p of DEMO_PROJECTS) {
    // Comprueba si ya existe — si existe, lo salta completamente
    const existing = await prisma.project.findUnique({ where: { code: p.code } });
    if (existing) {
      console.log(`⏭️  Proyecto ${p.code} ya existe — omitido`);
      continue;
    }

    const proj = await prisma.project.create({ data: p });
    const dates = computeTaskDates(TASK_TEMPLATES, p.startDate);

    for (const tmpl of templateList) {
      const d = dates.get(tmpl.code) ?? { startDate: p.startDate, endDate: p.startDate };
      let taskStatus = "No iniciada";
      if (p.status === "En producción") {
        if (tmpl.sortOrder <= 22) taskStatus = "Completada";
        else if (tmpl.sortOrder <= 27) taskStatus = "En curso";
      } else if (p.status === "En diseño") {
        if (tmpl.sortOrder <= 5) taskStatus = "Completada";
        else if (tmpl.sortOrder <= 9) taskStatus = "En curso";
      } else if (p.status === "Iniciación") {
        if (tmpl.sortOrder <= 2) taskStatus = "Completada";
        else if (tmpl.sortOrder <= 4) taskStatus = "En curso";
      }

      await prisma.projectTask.create({
        data: {
          projectId: proj.id,
          templateId: tmpl.id,
          code: tmpl.code,
          macroPhase: tmpl.macroPhase,
          phase: tmpl.phase,
          package: tmpl.package,
          name: tmpl.name,
          responsibleUserId: tmpl.sortOrder % 4 === 0 ? prod.id : tmpl.sortOrder % 3 === 0 ? ing.id : arch.id,
          collaborators: tmpl.collaborators,
          predecessorCode: tmpl.predecessorCode,
          type: tmpl.type,
          durationDays: tmpl.defaultDurationDays,
          startDate: d.startDate,
          endDate: d.endDate,
          deliverable: tmpl.deliverable,
          acceptanceCriteria: tmpl.acceptanceCriteria,
          risk: tmpl.defaultRisk,
          status: taskStatus,
          priority: tmpl.defaultPriority,
          sortOrder: tmpl.sortOrder,
          progress: taskStatus === "Completada" ? 100 : taskStatus === "En curso" ? 50 : 0,
        },
      });
    }

    // Hitos
    const hitoTemplates = TASK_TEMPLATES.filter((t) => t.type === "Hito");
    for (const h of hitoTemplates) {
      const d = dates.get(h.code);
      if (d) {
        await prisma.milestone.create({
          data: { projectId: proj.id, name: h.name, date: d.startDate, type: "Hito", status: "Pendiente" },
        });
      }
    }

    // Riesgos de ejemplo
    await prisma.risk.createMany({
      data: [
        { projectId: proj.id, taskCode: "COM-04", description: "Costes no realistas en estimación inicial", severity: "Alta", probability: "Media", mitigation: "Revisión con proveedor de referencia", status: "Activo" },
        { projectId: proj.id, taskCode: "ENG-06", description: "Diseño no congelado antes de fabricación", severity: "Alta", probability: "Alta", mitigation: "Acta de congelación obligatoria antes de FAB-01", status: "Activo" },
        { projectId: proj.id, taskCode: "OBR-02", description: "Cimentación fuera de tolerancia", severity: "Media", probability: "Baja", mitigation: "Control topográfico en cada fase", status: "Activo" },
      ],
    });

    console.log(`✅ Proyecto ${proj.code} - ${proj.name} creado`);
  }

  console.log("\n✅ Seed completado!");
  console.log("  Usuarios:");
  console.log("    admin@actia.tech          / actia2026  (Administrador)");
  console.log("    arquitectura@actia.tech   / actia2026  (Arquitectura)");
  console.log("    ingenieria@actia.tech     / actia2026  (Ingeniería)");
  console.log("    produccion@actia.tech     / actia2026  (Producción)");
}

main().catch(console.error).finally(() => prisma.$disconnect());
