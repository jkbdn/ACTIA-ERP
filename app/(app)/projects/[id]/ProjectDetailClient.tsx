"use client";
import { useState } from "react";
import Link from "next/link";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { TasksTable } from "@/components/tasks/TasksTable";
import { ProjectGantt } from "@/components/gantt/ProjectGantt";
import { ProjectCalendar } from "@/components/tasks/ProjectCalendar";
import { formatDate, projectProgress } from "@/lib/date-utils";

const TABS = ["Resumen", "Tareas", "Gantt", "Calendario", "Riesgos", "Historial"] as const;

interface Props {
  project: any;
  users: { id: string; name: string; role: string }[];
}

export function ProjectDetailClient({ project: initialProject, users }: Props) {
  const [project, setProject] = useState(initialProject);
  const [tab, setTab] = useState<typeof TABS[number]>("Resumen");

  async function refreshProject() {
    const res = await fetch(`/api/projects/${project.id}`);
    if (res.ok) {
      const data = await res.json();
      setProject({
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        targetDate: new Date(data.targetDate).toISOString(),
        createdAt: new Date(data.createdAt).toISOString(),
        updatedAt: new Date(data.updatedAt).toISOString(),
        tasks: data.tasks.map((t: any) => ({
          ...t,
          startDate: new Date(t.startDate).toISOString(),
          endDate: new Date(t.endDate).toISOString(),
          createdAt: new Date(t.createdAt).toISOString(),
          updatedAt: new Date(t.updatedAt).toISOString(),
        })),
        milestones: data.milestones.map((m: any) => ({ ...m, date: new Date(m.date).toISOString(), createdAt: new Date(m.createdAt).toISOString() })),
        risks: data.risks.map((r: any) => ({ ...r, createdAt: new Date(r.createdAt).toISOString() })),
        activityLogs: data.activityLogs.map((l: any) => ({ ...l, createdAt: new Date(l.createdAt).toISOString() })),
      });
    }
  }

  const progress = projectProgress(project.tasks);
  const overdue = project.tasks.filter(
    (t: any) => !["Completada","Cancelada"].includes(t.status) && new Date(t.endDate) < new Date()
  ).length;
  const criticalOpen = project.tasks.filter((t: any) => t.type === "Crítico" && !["Completada","Cancelada"].includes(t.status)).length;
  const completed = project.tasks.filter((t: any) => t.status === "Completada").length;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#5F6368]">
        <Link href="/projects" className="hover:text-[#1F1F1F]">Proyectos</Link>
        <span>/</span>
        <span className="text-[#1F1F1F] font-medium">{project.name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <span className="text-xs font-mono text-[#5F6368]">{project.code}</span>
            <h1 className="text-2xl font-bold text-[#1F1F1F] mt-1">{project.name}</h1>
            <p className="text-[#5F6368] mt-0.5">{project.client} · {project.location || "Sin ubicación"}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} />
            {project.estimatedBudget && (
              <span className="badge bg-gray-100 text-gray-700">
                {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(project.estimatedBudget)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-[#5F6368] text-xs block">Inicio</span><span className="font-medium">{formatDate(project.startDate)}</span></div>
          <div><span className="text-[#5F6368] text-xs block">Objetivo</span><span className="font-medium">{formatDate(project.targetDate)}</span></div>
          <div><span className="text-[#5F6368] text-xs block">Responsable</span><span className="font-medium">{project.mainResponsible?.name ?? "—"}</span></div>
          <div><span className="text-[#5F6368] text-xs block">Sistema</span><span className="font-medium">{project.systemType}</span></div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[#5F6368]">Progreso global</span>
            <span className="text-xs font-medium">{completed}/{project.tasks.length} tareas completadas</span>
          </div>
          <ProgressBar value={progress} />
        </div>
      </div>

      {/* KPIs row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total tareas"    value={project.tasks.length} />
        <KpiCard label="Completadas"     value={completed} accent="green" />
        <KpiCard label="Vencidas"        value={overdue} accent={overdue > 0 ? "red" : "default"} />
        <KpiCard label="Críticas abiertas" value={criticalOpen} accent={criticalOpen > 0 ? "red" : "default"} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-[#F5C400] text-[#1F1F1F]"
                  : "border-transparent text-[#5F6368] hover:text-[#1F1F1F]"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === "Resumen" && <SummaryTab project={project} />}
      {tab === "Tareas" && (
        <TasksTable
          projectId={project.id}
          tasks={project.tasks}
          users={users}
          onUpdate={refreshProject}
        />
      )}
      {tab === "Gantt" && <ProjectGantt tasks={project.tasks} startDate={project.startDate} />}
      {tab === "Calendario" && <ProjectCalendar tasks={project.tasks} milestones={project.milestones} projectId={project.id} />}
      {tab === "Riesgos" && <RisksTab risks={project.risks} />}
      {tab === "Historial" && <HistoryTab logs={project.activityLogs} />}
    </div>
  );
}

function SummaryTab({ project }: { project: any }) {
  const byMacro: Record<string, { total: number; done: number }> = {};
  for (const t of project.tasks) {
    if (!byMacro[t.macroPhase]) byMacro[t.macroPhase] = { total: 0, done: 0 };
    byMacro[t.macroPhase].total++;
    if (t.status === "Completada") byMacro[t.macroPhase].done++;
  }

  return (
    <div className="space-y-4">
      {project.notes && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-2">Observaciones</h3>
          <p className="text-[#5F6368] text-sm">{project.notes}</p>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold mb-4">Avance por macrofase</h3>
        <div className="space-y-3">
          {Object.entries(byMacro).map(([phase, { total, done }]) => (
            <div key={phase}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{phase}</span>
                <span className="text-[#5F6368]">{done}/{total}</span>
              </div>
              <ProgressBar value={total ? Math.round((done / total) * 100) : 0} />
            </div>
          ))}
        </div>
      </div>
      {project.milestones.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4">Hitos</h3>
          <div className="space-y-2">
            {project.milestones.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-[#F5C400] rounded-sm rotate-45 shrink-0" />
                <span className="flex-1">{m.name}</span>
                <span className="text-[#5F6368]">{formatDate(m.date)}</span>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RisksTab({ risks }: { risks: any[] }) {
  if (risks.length === 0) return <p className="text-[#5F6368] text-sm py-8 text-center">No hay riesgos registrados.</p>;
  const severityColor: Record<string, string> = {
    Alta: "text-red-600 bg-red-50",
    Media: "text-yellow-700 bg-yellow-50",
    Baja: "text-green-700 bg-green-50",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {["Tarea","Descripción","Severidad","Prob.","Mitigación","Estado"].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs text-[#5F6368] font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {risks.map((r) => (
            <tr key={r.id} className="border-b border-gray-50">
              <td className="px-4 py-2 text-xs font-mono text-[#5F6368]">{r.taskCode || "—"}</td>
              <td className="px-4 py-2">{r.description}</td>
              <td className="px-4 py-2"><span className={`badge ${severityColor[r.severity] ?? "bg-gray-100 text-gray-600"}`}>{r.severity}</span></td>
              <td className="px-4 py-2 text-[#5F6368]">{r.probability}</td>
              <td className="px-4 py-2 text-[#5F6368] text-xs">{r.mitigation || "—"}</td>
              <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTab({ logs }: { logs: any[] }) {
  const actionLabel: Record<string, string> = {
    CREATED: "Proyecto creado",
    UPDATED: "Proyecto actualizado",
    TASK_UPDATED: "Tarea actualizada",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold mb-4">Historial de cambios</h3>
      {logs.length === 0 ? (
        <p className="text-[#5F6368] text-sm">Sin actividad registrada.</p>
      ) : (
        <div className="space-y-3">
          {logs.map((l) => (
            <div key={l.id} className="flex gap-3 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F5C400] mt-1.5 shrink-0" />
              <div className="flex-1">
                <span className="font-medium">{actionLabel[l.action] ?? l.action}</span>
                {l.entityType === "ProjectTask" && <span className="text-[#5F6368]"> — {l.entityId.slice(0, 8)}…</span>}
                {l.user && <span className="text-[#5F6368]"> por {l.user.name}</span>}
              </div>
              <span className="text-xs text-[#5F6368] shrink-0">{formatDate(l.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
