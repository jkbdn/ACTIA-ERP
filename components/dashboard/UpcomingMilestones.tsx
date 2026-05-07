import { formatDate } from "@/lib/date-utils";

interface Milestone {
  id: string;
  name: string;
  date: string;
  projectName: string;
  projectCode: string;
  status: string;
}

export function UpcomingMilestones({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-full">
      <h3 className="text-sm font-semibold text-[#1F1F1F] mb-4">Próximos hitos</h3>
      {milestones.length === 0 ? (
        <p className="text-[#5F6368] text-sm">Sin hitos próximos.</p>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => (
            <div key={m.id} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-sm bg-[#F5C400] rotate-45 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1F1F1F] truncate">{m.name}</p>
                <p className="text-xs text-[#5F6368] truncate">{m.projectCode} · {m.projectName}</p>
              </div>
              <span className="text-xs text-[#5F6368] shrink-0">{formatDate(m.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
