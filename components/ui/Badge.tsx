import { STATUS_COLORS, PRIORITY_COLORS, TYPE_BADGE } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600";
  return <span className={`badge ${cls}`}>{status}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const cls = PRIORITY_COLORS[priority] ?? "bg-gray-100 text-gray-600";
  return <span className={`badge ${cls}`}>{priority}</span>;
}

export function TypeBadge({ type }: { type: string }) {
  const cls = TYPE_BADGE[type] ?? "bg-gray-100 text-gray-600";
  return <span className={`badge ${cls}`}>{type}</span>;
}
