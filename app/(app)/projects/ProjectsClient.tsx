"use client";
import { useState, useRef, useEffect } from "react";
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
  archived: boolean;
  estimatedBudget: number | null;
  mainResponsible: { name: string } | null;
  tasks: { status: string; durationDays: number; endDate: string }[];
  _count: { tasks: number; risks: number };
}

function ProjectMenu({ project, onArchive, onDelete, onDuplicate }: {
  project: Project;
  onArchive: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0, dropUp: false });
  const btnRef = useRef<HTMLButtonElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpen(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropUp = rect.bottom + 160 > window.innerHeight;
      setPos({
        top: dropUp ? rect.top - 132 : rect.bottom + 4,
        right: window.innerWidth - rect.right,
        dropUp,
      });
    }
    setOpen((v) => !v);
  }

  return (
    <div ref={ref} className="relative" onClick={(e) => e.preventDefault()}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="p-1.5 rounded-md hover:bg-gray-100 text-[#5F6368] hover:text-[#1F1F1F] transition-colors"
        title="Opciones"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="4" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="10" cy="16" r="1.5"/>
        </svg>
      </button>
      {open && (
        <div
          className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl w-44 py-1 text-sm"
          style={{ top: pos.top, right: pos.right }}
        >
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onDuplicate(); }}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-[#1F1F1F] flex items-center gap-2.5"
          >
            <span>📋</span> Duplicar
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onArchive(); }}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-[#1F1F1F] flex items-center gap-2.5"
          >
            <span>{project.archived ? "📤" : "📥"}</span>
            {project.archived ? "Desarchivar" : "Archivar"}
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onDelete(); }}
            className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-[#D72638] flex items-center gap-2.5"
          >
            <span>🗑️</span> Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

function ConfirmDeleteModal({ project, onConfirm, onCancel }: {
  project: Project;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xl">🗑️</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1F1F1F]">Eliminar proyecto</h2>
            <p className="text-sm text-[#5F6368]">Esta acción no se puede deshacer</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
          <p className="text-xs text-[#5F6368] font-mono mb-0.5">{project.code}</p>
          <p className="font-semibold text-[#1F1F1F]">{project.name}</p>
          <p className="text-sm text-[#5F6368]">{project.client}</p>
        </div>

        <p className="text-sm text-[#5F6368] mb-5">
          Se eliminarán permanentemente todas las <strong className="text-[#1F1F1F]">{project._count.tasks} tareas</strong>,
          riesgos, hitos y el historial de actividad asociados.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-[#1F1F1F] font-medium rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#D72638] hover:bg-red-700 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProjectsClient({ projects: initialProjects }: { projects: Project[] }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = projects.filter((p) => {
    const matchText = !filter || [p.name, p.client, p.code].some((s) => s.toLowerCase().includes(filter.toLowerCase()));
    const matchStatus = !statusFilter || p.status === statusFilter;
    const matchArchived = showArchived ? p.archived : !p.archived;
    return matchText && matchStatus && matchArchived;
  });

  async function handleDelete(project: Project) {
    setLoading(project.id);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    setDeleteTarget(null);
    setLoading(null);
  }

  async function handleArchive(project: Project) {
    setLoading(project.id);
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !project.archived }),
    });
    setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, archived: !p.archived } : p));
    setLoading(null);
  }

  async function handleDuplicate(project: Project) {
    setLoading(project.id);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: project.code + "-COPIA",
        name: project.name + " (copia)",
        client: project.client,
        location: project.location,
        systemType: "Entramado ligero",
        startDate: project.startDate,
        targetDate: project.targetDate,
        status: "Iniciación",
        priority: project.priority,
        estimatedBudget: project.estimatedBudget,
        mainResponsibleId: null,
      }),
    });
    if (res.ok) {
      const newProject = await res.json();
      router.push(`/projects/${newProject.id}`);
    }
    setLoading(null);
  }

  return (
    <div className="space-y-5">
      {deleteTarget && (
        <ConfirmDeleteModal
          project={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <PageHeader
        title="Proyectos"
        subtitle={`${projects.filter(p => !p.archived).length} proyectos activos`}
        actions={
          <button
            onClick={() => router.push("/projects/new")}
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
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`px-3 py-2 rounded-lg text-sm border transition-colors ${showArchived ? "bg-[#1F1F1F] text-white border-[#1F1F1F]" : "bg-white border-gray-200 text-[#5F6368] hover:border-gray-300"}`}
        >
          {showArchived ? "📤 Archivados" : "📥 Ver archivados"}
        </button>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setView("cards")} className={`px-3 py-1.5 rounded text-sm ${view === "cards" ? "bg-[#1F1F1F] text-white" : "bg-white border border-gray-200 text-[#5F6368]"}`}>Cards</button>
          <button onClick={() => setView("table")} className={`px-3 py-1.5 rounded text-sm ${view === "table" ? "bg-[#1F1F1F] text-white" : "bg-white border border-gray-200 text-[#5F6368]"}`}>Tabla</button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-[#5F6368]">
          <p className="text-lg font-medium">{showArchived ? "No hay proyectos archivados" : "No hay proyectos"}</p>
          <p className="text-sm mt-1">
            {showArchived ? "Los proyectos archivados aparecerán aquí." : "Crea tu primer proyecto con el botón superior."}
          </p>
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
              <div key={p.id} className={`relative bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-all group ${p.archived ? "border-gray-200 opacity-70" : "border-gray-100 hover:border-[#F5C400]/50"} ${loading === p.id ? "pointer-events-none opacity-50" : ""}`}>
                {/* Menu */}
                <div className="absolute top-3 right-3">
                  <ProjectMenu
                    project={p}
                    onArchive={() => handleArchive(p)}
                    onDelete={() => setDeleteTarget(p)}
                    onDuplicate={() => handleDuplicate(p)}
                  />
                </div>

                <Link href={`/projects/${p.id}`} className="block">
                  <div className="flex items-start justify-between mb-3 pr-8">
                    <div>
                      <span className="text-xs text-[#5F6368] font-mono">{p.code}</span>
                      {p.archived && <span className="ml-2 text-xs bg-gray-100 text-[#5F6368] px-1.5 py-0.5 rounded">Archivado</span>}
                      <h3 className="font-semibold text-[#1F1F1F] text-base mt-0.5">{p.name}</h3>
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
              </div>
            );
          })}
        </div>
      )}

      {/* Table view */}
      {view === "table" && filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-visible">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Código","Proyecto","Cliente","Estado","Prioridad","Inicio","Objetivo","Progreso","Responsable",""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-[#5F6368] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${loading === p.id ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-mono text-xs text-[#5F6368] cursor-pointer" onClick={() => router.push(`/projects/${p.id}`)}>{p.code}</td>
                  <td className="px-4 py-3 font-semibold cursor-pointer" onClick={() => router.push(`/projects/${p.id}`)}>
                    {p.name}
                    {p.archived && <span className="ml-2 text-xs bg-gray-100 text-[#5F6368] px-1.5 py-0.5 rounded">Archivado</span>}
                  </td>
                  <td className="px-4 py-3 text-[#5F6368] cursor-pointer" onClick={() => router.push(`/projects/${p.id}`)}>{p.client}</td>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => router.push(`/projects/${p.id}`)}><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => router.push(`/projects/${p.id}`)}><PriorityBadge priority={p.priority} /></td>
                  <td className="px-4 py-3 text-[#5F6368] cursor-pointer" onClick={() => router.push(`/projects/${p.id}`)}>{formatDate(p.startDate)}</td>
                  <td className="px-4 py-3 text-[#5F6368] cursor-pointer" onClick={() => router.push(`/projects/${p.id}`)}>{formatDate(p.targetDate)}</td>
                  <td className="px-4 py-3 w-32 cursor-pointer" onClick={() => router.push(`/projects/${p.id}`)}><ProgressBar value={projectProgress(p.tasks)} /></td>
                  <td className="px-4 py-3 text-[#5F6368] cursor-pointer" onClick={() => router.push(`/projects/${p.id}`)}>{p.mainResponsible?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <ProjectMenu
                      project={p}
                      onArchive={() => handleArchive(p)}
                      onDelete={() => setDeleteTarget(p)}
                      onDuplicate={() => handleDuplicate(p)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
