export const TASK_STATUSES = [
  "No iniciada",
  "En curso",
  "Bloqueada",
  "En revisión",
  "Completada",
  "Retrasada",
  "Cancelada",
] as const;

export const TASK_PRIORITIES = ["Baja", "Media", "Alta", "Crítica"] as const;

export const TASK_TYPES = ["Secuencial", "Paralelo", "Crítico", "Control", "Hito"] as const;

export const PROJECT_STATUSES = [
  "En diseño",
  "En producción",
  "En montaje",
  "Entregado",
  "Pausado",
  "Cancelado",
] as const;

export const PROJECT_PRIORITIES = ["Baja", "Media", "Alta", "Crítica"] as const;

export const MACRO_PHASES = [
  "Comercial / Viabilidad",
  "Diseño + Ingeniería",
  "Compras + Producción",
  "Obra + Logística",
  "Montaje + Entrega",
  "Cierre / Postventa",
] as const;

export const ROLES = [
  "Administrador",
  "Dirección",
  "Arquitectura",
  "Ingeniería",
  "BIM Manager",
  "Producción",
  "Compras",
  "Obra",
  "Comercial",
  "Cliente",
  "Equipo",
] as const;

export const STATUS_COLORS: Record<string, string> = {
  "No iniciada": "bg-gray-100 text-gray-600",
  "En curso":    "bg-blue-100 text-blue-700",
  "Bloqueada":   "bg-red-100 text-red-700",
  "En revisión": "bg-yellow-100 text-yellow-700",
  "Completada":  "bg-green-100 text-green-700",
  "Retrasada":   "bg-orange-100 text-orange-700",
  "Cancelada":   "bg-gray-200 text-gray-500",
};

export const STATUS_DOT: Record<string, string> = {
  "No iniciada": "bg-gray-400",
  "En curso":    "bg-blue-500",
  "Bloqueada":   "bg-red-500",
  "En revisión": "bg-yellow-400",
  "Completada":  "bg-green-500",
  "Retrasada":   "bg-orange-500",
  "Cancelada":   "bg-gray-400",
};

export const PRIORITY_COLORS: Record<string, string> = {
  "Baja":    "bg-gray-100 text-gray-600",
  "Media":   "bg-blue-100 text-blue-700",
  "Alta":    "bg-orange-100 text-orange-700",
  "Crítica": "bg-red-100 text-red-700",
};

export const MACRO_COLORS: Record<string, string> = {
  "Comercial / Viabilidad": "#6366f1",
  "Diseño + Ingeniería":    "#F5C400",
  "Compras + Producción":   "#f97316",
  "Obra + Logística":       "#10b981",
  "Montaje + Entrega":      "#3b82f6",
  "Cierre / Postventa":     "#8b5cf6",
};

export const TYPE_BADGE: Record<string, string> = {
  "Secuencial": "bg-gray-100 text-gray-700",
  "Paralelo":   "bg-purple-100 text-purple-700",
  "Crítico":    "bg-red-100 text-red-700",
  "Control":    "bg-yellow-100 text-yellow-700",
  "Hito":       "bg-[#F5C400]/20 text-yellow-800",
};
