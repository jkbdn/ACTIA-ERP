"use client";
import { useState, useCallback } from "react";
import { StatusBadge, PriorityBadge, TypeBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/date-utils";
import { TASK_STATUSES, TASK_PRIORITIES, MACRO_COLORS } from "@/lib/constants";

interface Task {
  id: string;
  code: string;
  macroPhase: string;
  phase: string;
  package: string;
  name: string;
  responsible: { id: string; name: string } | null;
  collaborators: string;
  predecessorCode: string;
  type: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  deliverable: string;
  acceptanceCriteria: string;
  risk: string;
  status: string;
  priority: string;
  notes: string;
  progress: number;
}

interface Props {
  projectId: string;
  tasks: Task[];
  users: { id: string; name: string; role: string }[];
  onUpdate: () => void;
}

export function TasksTable({ projectId, tasks, users, onUpdate }: Props) {
  const [search, setSearch] = useState("");
  const [macroFilter, setMacroFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);

  const macroPhases = [...new Set(tasks.map((t) => t.macroPhase))];

  const filtered = tasks.filter((t) => {
    const matchSearch = !search || [t.code, t.name, t.phase, t.package].some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchMacro  = !macroFilter || t.macroPhase === macroFilter;
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchMacro && matchStatus;
  });

  // Group by macroPhase
  const grouped = macroPhases.reduce((acc, mp) => {
    acc[mp] = filtered.filter((t) => t.macroPhase === mp);
    return acc;
  }, {} as Record<string, Task[]>);

  async function saveTask(task: Task, fields: Partial<Task>) {
    setSaving(true);
    await fetch(`/api/projects/${projectId}/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, ...fields }),
    });
    setSaving(false);
    onUpdate();
  }

  async function quickStatus(task: Task, status: string) {
    await fetch(`/api/projects/${projectId}/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, status }),
    });
    onUpdate();
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
        <input
          type="text"
          placeholder="Buscar tarea..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#F5C400] w-48"
        />
        <select value={macroFilter} onChange={(e) => setMacroFilter(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#F5C400]">
          <option value="">Todas las macrofases</option>
          {macroPhases.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#F5C400]">
          <option value="">Todos los estados</option>
          {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="ml-auto text-xs text-[#5F6368]">{filtered.length} tareas</span>
      </div>

      {/* Tables grouped by macrophase */}
      {macroPhases.map((mp) => {
        const rows = grouped[mp];
        if (!rows || rows.length === 0) return null;
        const color = MACRO_COLORS[mp] ?? "#888";
        return (
          <div key={mp} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 flex items-center gap-2 border-b border-gray-100" style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
              <span className="text-sm font-semibold text-[#1F1F1F]">{mp}</span>
              <span className="text-xs text-[#5F6368]">{rows.length} tareas</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["ID","Fase","Tarea","Tipo","Dur.","Inicio","Fin","Estado","Prior.","Resp.",""].map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-xs text-[#5F6368] font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => {
                    const overdue = !["Completada","Cancelada"].includes(t.status) && new Date(t.endDate) < new Date();
                    return (
                      <tr
                        key={t.id}
                        className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${t.type === "Hito" ? "bg-[#F5C400]/5" : ""} ${overdue ? "bg-red-50/50" : ""}`}
                      >
                        <td className="px-3 py-2 font-mono text-xs text-[#5F6368] whitespace-nowrap">{t.code}</td>
                        <td className="px-3 py-2 text-xs text-[#5F6368] whitespace-nowrap">{t.phase}</td>
                        <td className="px-3 py-2 max-w-[240px]">
                          <p className="truncate font-medium">{t.name}</p>
                          {t.type === "Hito" && <span className="text-[10px] text-[#F5C400] font-semibold uppercase tracking-wider">◆ Hito</span>}
                          {t.type === "Crítico" && <span className="text-[10px] text-red-600 font-semibold uppercase tracking-wider">⚠ Crítico</span>}
                        </td>
                        <td className="px-3 py-2"><TypeBadge type={t.type} /></td>
                        <td className="px-3 py-2 text-[#5F6368]">{t.durationDays}d</td>
                        <td className="px-3 py-2 text-[#5F6368] whitespace-nowrap">{formatDate(t.startDate)}</td>
                        <td className={`px-3 py-2 whitespace-nowrap ${overdue ? "text-red-600 font-medium" : "text-[#5F6368]"}`}>{formatDate(t.endDate)}</td>
                        <td className="px-3 py-2">
                          <select
                            value={t.status}
                            onChange={(e) => quickStatus(t, e.target.value)}
                            className="text-xs border-0 bg-transparent cursor-pointer focus:outline-none"
                          >
                            {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2"><PriorityBadge priority={t.priority} /></td>
                        <td className="px-3 py-2 text-xs text-[#5F6368] whitespace-nowrap">{t.responsible?.name ?? "—"}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => setEditTask(t)}
                            className="text-xs text-[#5F6368] hover:text-[#1F1F1F] px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Edit modal */}
      {editTask && (
        <TaskEditModal
          task={editTask}
          users={users}
          onClose={() => setEditTask(null)}
          onSave={async (fields) => {
            await saveTask(editTask, fields);
            setEditTask(null);
          }}
          saving={saving}
        />
      )}
    </div>
  );
}

function TaskEditModal({ task, users, onClose, onSave, saving }: {
  task: Task;
  users: { id: string; name: string; role: string }[];
  onClose: () => void;
  onSave: (fields: Partial<Task & { responsibleUserId: string }>) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    status: task.status,
    priority: task.priority,
    durationDays: task.durationDays,
    startDate: task.startDate.split("T")[0],
    endDate: task.endDate.split("T")[0],
    notes: task.notes,
    risk: task.risk,
    progress: task.progress,
    responsibleUserId: task.responsible?.id ?? "",
  });

  function set(key: string, val: any) { setForm((f) => ({ ...f, [key]: val })); }

  return (
    <Modal open title={`Editar: ${task.code} — ${task.name}`} onClose={onClose} size="lg">
      <div className="space-y-4">
        {/* Read-only info */}
        <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-lg p-3 text-xs text-[#5F6368]">
          <div><span className="font-medium block">Macrofase</span>{task.macroPhase}</div>
          <div><span className="font-medium block">Fase</span>{task.phase}</div>
          <div><span className="font-medium block">Tipo</span>{task.type}</div>
          <div><span className="font-medium block">Predecesora</span>{task.predecessorCode || "—"}</div>
          <div><span className="font-medium block">Entregable</span>{task.deliverable || "—"}</div>
          <div><span className="font-medium block">Criterio aceptación</span>{task.acceptanceCriteria || "—"}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Estado</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className="input">
              {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Prioridad</label>
            <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className="input">
              {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Duración (días)</label>
            <input type="number" min={0} value={form.durationDays} onChange={(e) => set("durationDays", parseInt(e.target.value))} className="input" />
          </div>
          <div>
            <label className="label">Responsable</label>
            <select value={form.responsibleUserId} onChange={(e) => set("responsibleUserId", e.target.value)} className="input">
              <option value="">Sin asignar</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fecha inicio</label>
            <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Fecha fin</label>
            <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className="input" />
          </div>
        </div>

        <div>
          <label className="label">Progreso (%)</label>
          <input type="range" min={0} max={100} value={form.progress} onChange={(e) => set("progress", parseInt(e.target.value))} className="w-full" />
          <div className="text-xs text-[#5F6368] text-right">{form.progress}%</div>
        </div>

        <div>
          <label className="label">Riesgo / Alerta</label>
          <input value={form.risk} onChange={(e) => set("risk", e.target.value)} className="input" />
        </div>

        <div>
          <label className="label">Observaciones</label>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="input min-h-[60px] resize-y" />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            disabled={saving}
            onClick={() => onSave(form as any)}
            className="bg-[#F5C400] hover:bg-[#e0b200] disabled:opacity-60 text-[#1F1F1F] font-semibold px-5 py-2 rounded-lg text-sm"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-gray-200 text-[#5F6368] hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </div>

      <style jsx>{`
        .label { display: block; font-size: 11px; font-weight: 500; color: #5F6368; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px; }
        .input { width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; padding: 7px 11px; font-size: 14px; outline: none; transition: border-color 0.15s; }
        .input:focus { border-color: #F5C400; }
      `}</style>
    </Modal>
  );
}
