"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PROJECT_STATUSES, PROJECT_PRIORITIES } from "@/lib/constants";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    client: "",
    location: "",
    systemType: "Entramado ligero",
    startDate: new Date().toISOString().split("T")[0],
    targetDate: "",
    status: "En diseño",
    priority: "Media",
    estimatedBudget: "",
    notes: "",
  });

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.targetDate) { setError("La fecha objetivo es obligatoria."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          estimatedBudget: form.estimatedBudget ? parseFloat(form.estimatedBudget) : null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const proj = await res.json();
      router.push(`/projects/${proj.id}`);
    } catch (err: any) {
      setError(err.message ?? "Error al crear el proyecto.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Nuevo proyecto"
        subtitle="Se generarán automáticamente las 47 tareas del flujo base"
        actions={
          <button onClick={() => router.back()} className="text-sm text-[#5F6368] hover:text-[#1F1F1F]">
            ← Volver
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
        {/* Name + Client */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nombre del proyecto *">
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} className="input" placeholder="Ej. Vivienda Unifamiliar Navacerrada" />
          </Field>
          <Field label="Cliente *">
            <input required value={form.client} onChange={(e) => set("client", e.target.value)} className="input" placeholder="Nombre del cliente" />
          </Field>
        </div>

        {/* Location + System */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Ubicación">
            <input value={form.location} onChange={(e) => set("location", e.target.value)} className="input" placeholder="Ciudad, provincia" />
          </Field>
          <Field label="Sistema constructivo">
            <input value={form.systemType} onChange={(e) => set("systemType", e.target.value)} className="input" />
          </Field>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Fecha de inicio *">
            <input required type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className="input" />
          </Field>
          <Field label="Fecha objetivo de entrega *">
            <input required type="date" value={form.targetDate} onChange={(e) => set("targetDate", e.target.value)} className="input" />
          </Field>
        </div>

        {/* Status + Priority + Budget */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Estado inicial">
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className="input">
              {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Prioridad">
            <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className="input">
              {PROJECT_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Presupuesto estimado (€)">
            <input type="number" value={form.estimatedBudget} onChange={(e) => set("estimatedBudget", e.target.value)} className="input" placeholder="0" />
          </Field>
        </div>

        {/* Notes */}
        <Field label="Observaciones">
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="input min-h-[80px] resize-y" placeholder="Notas generales del proyecto..." />
        </Field>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#F5C400] hover:bg-[#e0b200] disabled:opacity-60 text-[#1F1F1F] font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? "Creando proyecto..." : "Crear proyecto y generar tareas"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2.5 rounded-lg text-sm border border-gray-200 text-[#5F6368] hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </form>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
          background: white;
        }
        .input:focus { border-color: #F5C400; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#5F6368] uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}
