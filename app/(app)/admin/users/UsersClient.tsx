"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";

const ROLES = ["Administrador", "Arquitectura", "Ingeniería", "Producción", "Comercial"];

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date | string;
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    Administrador: "bg-purple-100 text-purple-700",
    Arquitectura:  "bg-yellow-100 text-yellow-700",
    Ingeniería:    "bg-blue-100 text-blue-700",
    Producción:    "bg-green-100 text-green-700",
    Comercial:     "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role] ?? "bg-gray-100 text-gray-600"}`}>
      {role}
    </span>
  );
}

function UserModal({ user, onSave, onClose }: {
  user: Partial<User> | null;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}) {
  const isEdit = !!user?.id;
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "Arquitectura",
    password: "",
    passwordConfirm: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isEdit && !form.password) { setError("La contraseña es obligatoria"); return; }
    if (form.password && form.password !== form.passwordConfirm) { setError("Las contraseñas no coinciden"); return; }
    if (form.password && form.password.length < 6) { setError("Mínimo 6 caracteres"); return; }
    setSaving(true);
    try {
      const body: any = { name: form.name, email: form.email, role: form.role };
      if (form.password) body.password = form.password;
      await onSave(body);
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Error al guardar");
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#1F1F1F]">
            {isEdit ? "Editar usuario" : "Nuevo usuario"}
          </h2>
          <button onClick={onClose} className="text-[#5F6368] hover:text-[#1F1F1F] p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#5F6368] uppercase tracking-wider mb-1.5">Nombre completo</label>
            <input
              value={form.name} onChange={(e) => set("name", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F5C400]"
              placeholder="Ana García" required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5F6368] uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F5C400]"
              placeholder="ana@actia.tech" required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5F6368] uppercase tracking-wider mb-1.5">Rol</label>
            <select
              value={form.role} onChange={(e) => set("role", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F5C400]"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-[#5F6368] mb-3">
              {isEdit ? "Deja en blanco para no cambiar la contraseña" : "Contraseña de acceso"}
            </p>
            <div className="space-y-3">
              <input
                type="password" value={form.password} onChange={(e) => set("password", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F5C400]"
                placeholder={isEdit ? "Nueva contraseña (opcional)" : "Contraseña *"}
              />
              {form.password && (
                <input
                  type="password" value={form.passwordConfirm} onChange={(e) => set("passwordConfirm", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#F5C400]"
                  placeholder="Repetir contraseña"
                />
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3.5 py-2.5">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-[#1F1F1F] font-medium rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-[#F5C400] hover:bg-[#e0b200] disabled:opacity-50 text-[#1F1F1F] font-semibold rounded-lg py-2.5 text-sm transition-colors">
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UsersClient({ users: initialUsers, currentUserId }: {
  users: User[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [modal, setModal] = useState<"new" | User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSave(data: any) {
    if (modal === "new") {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al crear");
      }
      const user = await res.json();
      setUsers((prev) => [...prev, user].sort((a, b) => a.name.localeCompare(b.name)));
    } else if (modal && typeof modal !== "string") {
      const res = await fetch(`/api/users/${modal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al actualizar");
      }
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
    }
  }

  async function handleDelete(user: User) {
    setLoading(user.id);
    await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    setDeleteTarget(null);
    setLoading(null);
  }

  return (
    <div className="space-y-5">
      {modal !== null && (
        <UserModal
          user={modal === "new" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-2">Eliminar usuario</h2>
            <p className="text-sm text-[#5F6368] mb-5">
              ¿Eliminar a <strong className="text-[#1F1F1F]">{deleteTarget.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteTarget)}
                className="flex-1 bg-[#D72638] hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-semibold">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Usuarios"
        subtitle={`${users.length} usuarios registrados`}
        actions={
          <button
            onClick={() => setModal("new")}
            className="bg-[#F5C400] hover:bg-[#e0b200] text-[#1F1F1F] font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + Nuevo usuario
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Nombre","Email","Rol","Alta",""].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs text-[#5F6368] font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${loading === u.id ? "opacity-50" : ""}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F5C400]/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-[#1F1F1F]">{u.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-[#1F1F1F]">{u.name}</p>
                      {u.id === currentUserId && <p className="text-xs text-[#5F6368]">Tú</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-[#5F6368]">{u.email}</td>
                <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                <td className="px-5 py-3.5 text-[#5F6368] text-xs">
                  {new Date(u.createdAt as string).toLocaleDateString("es-ES")}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setModal(u)}
                      className="text-xs text-[#5F6368] hover:text-[#1F1F1F] border border-gray-200 hover:border-gray-300 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                    {u.id !== currentUserId && (
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="text-xs text-[#D72638] hover:text-red-700 border border-red-100 hover:border-red-200 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>ℹ️ Solo administradores</strong> pueden acceder a esta página y gestionar usuarios.
        Los cambios surten efecto de inmediato — el usuario puede iniciar sesión con sus nuevas credenciales al instante.
      </div>
    </div>
  );
}
