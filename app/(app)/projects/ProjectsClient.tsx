"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatDate, projectProgress } from "@/lib/date-utils";
import { PROJECT_STATUSES } from "@/lib/constants";

interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  location: string;
  startDate: string;
  targetDate: string;
  status: string;
  priority: string;
  estimatedBudget: number | null;
  mainResponsible: { name: string } | null;
  tasks: { status: string; durationDays: number; endDate: string }[];
  _count: { tasks: number; risks: number };
}

export function ProjectsClient({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView] = useState<"cards" | "table">("cards");

  const filtered = projects.filter((p) => {
    const matchText = !filter || [p.name, p.client, p.code].some((s) => s.toLowerCase().includes(filter.toLowerCase()));
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchText && matchStatus;
  });

  async function handleNew() {
    router.push("/projects/new");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Proyectos"
        subtitle={`${projects.length} proyectos activos`}
        actions={
          <button
            onClick={handleNew}
            className="bg-[#F5C400] hover:bg-[#e0b200] text-[#1F1F1F] font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + Nuevo proyecto
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input
          type="text"
          placeholder="Buscar proyectos..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-200 bg-white rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-[#F5C400] w-60"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F5C400]"
        >
          <option value="">Todos los estados</option>
          {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setView("cards")} className={`px-3 py-1.5 rounded text-sm ${view === "cards" ? "bg-[#1F1F1F] text-white" : "bg-white border border-gray-200 text-[#5F6368]"}`}>Cards</button>
          <button onClick={() => setView("table")} className={`px-3 py-1.5 rounded text-sm ${view === "table" ? "bg-[#1F1F1F] text-white" : "bg-white border border-gray-200 text-[#5F6368]"}`}>Tabla</button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-[#5F6368]">
          <p className="text-lg font-medium">No hay proyectos</p>
          <p className="text-sm mt-1">Crea tu primer proyecto con el botón superior.</p>
        </div>
      )}

      {/* Cards view */}
      {view === "cards" && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const progress = projectProgress(p.tasks);
            const overdue = p.tasks.filter(
              (t) => !["Completada","Cancelada"].includes(t.status) && new Date(t.endDate) < new Date()
            ).length;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-[#F5C400]/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs text-[#5F6368] font-mono">{p.code}</span>
                    <h3 className="font-semibold text-[#1F1F1F] text-base mt-0.5 group-hover:text-[#1F1F1F]">{p.name}</h3>
                    <p className="text-sm text-[#5F6368]">{p.client}</p>
                  </div>
                  <PriorityBadge priority={p.priority} />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <StatusBadge status={p.status} />
                  {overdue > 0 && (
                    <span className="badge bg-red-100 text-red-700">{overdue} vencidas</span>
                  )}
                </div>

                <ProgressBar value={progress} />

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#5F6368]">
                  <div>
                    <span className="block font-medium text-[#1F1F1F]">{formatDate(p.startDate)}</span>
                    <span>Inicio</span>
                  </div>
                  <div>
                    <span className="block font-medium text-[#1F1F1F]">{formatDate(p.targetDate)}</span>
                    <span>Objetivo</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-[#5F6368]">
                  <span>{p._count.tasks} tareas · {p._count.risks} riesgos</span>
                  {p.mainResponsible && <span>{p.mainResponsible.name}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Table view */}
      {view === "table" && filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Código","Proyecto","Cliente","Estado","Prioridad","Inicio","Objetivo","Progreso","Responsable"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-[#5F6368] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/projects/${p.id}`)}>
                  <td className="px-4 py-3 font-mono text-xs text-[#5F6368]">{p.code}</td>
                  <td className="px-4 py-3 font-semibold">{p.name}</td>
                  <td className="px-4 py-3 text-[#5F6368]">{p.client}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={p.priority} /></td>
                  <td className="px-4 py-3 text-[#5F6368]">{formatDate(p.startDate)}</td>
                  <td className="px-4 py-3 text-[#5F6368]">{formatDate(p.targetDate)}</td>
                  <td className="px-4 py-3 w-32"><ProgressBar value={projectProgress(p.tasks)} /></td>
                  <td className="px-4 py-3 text-[#5F6368]">{p.mainResponsible?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
