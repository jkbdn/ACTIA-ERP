import { format, addDays, differenceInCalendarDays, isAfter, isBefore, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy");
}

export function formatDateShort(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM", { locale: es });
}

export function formatDateISO(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "yyyy-MM-dd");
}

export function addWorkDays(date: Date, days: number): Date {
  return addDays(date, days);
}

export function daysDiff(start: Date | string, end: Date | string): number {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  return differenceInCalendarDays(e, s);
}

export function isOverdue(endDate: Date | string, status: string): boolean {
  if (status === "Completada" || status === "Cancelada") return false;
  const d = typeof endDate === "string" ? new Date(endDate) : endDate;
  return isBefore(d, new Date());
}

export function computeTaskDates(
  tasks: Array<{
    code: string;
    predecessorCode: string;
    durationDays: number;
    type: string;
    manuallyLocked?: boolean;
    startDate?: Date;
    endDate?: Date;
  }>,
  projectStart: Date
): Map<string, { startDate: Date; endDate: Date }> {
  const result = new Map<string, { startDate: Date; endDate: Date }>();
  const byCode = new Map(tasks.map((t) => [t.code, t]));

  function resolve(code: string): { startDate: Date; endDate: Date } {
    if (result.has(code)) return result.get(code)!;
    const t = byCode.get(code);
    if (!t) return { startDate: projectStart, endDate: projectStart };

    if (t.manuallyLocked && t.startDate && t.endDate) {
      result.set(code, { startDate: new Date(t.startDate), endDate: new Date(t.endDate) });
      return result.get(code)!;
    }

    let start = new Date(projectStart);
    if (t.predecessorCode && byCode.has(t.predecessorCode)) {
      const pred = resolve(t.predecessorCode);
      start = addDays(new Date(pred.endDate), t.type === "Paralelo" ? 0 : 1);
    }
    const end = addDays(start, Math.max((t.durationDays || 1) - 1, 0));
    result.set(code, { startDate: start, endDate: end });
    return result.get(code)!;
  }

  for (const t of tasks) resolve(t.code);
  return result;
}

export function projectProgress(tasks: Array<{ status: string; durationDays: number }>): number {
  if (!tasks.length) return 0;
  const totalDays = tasks.reduce((s, t) => s + (t.durationDays || 1), 0);
  const doneDays = tasks
    .filter((t) => t.status === "Completada")
    .reduce((s, t) => s + (t.durationDays || 1), 0);
  return totalDays ? Math.round((doneDays / totalDays) * 100) : 0;
}
