export function ProgressBar({ value, showLabel = true }: { value: number; showLabel?: boolean }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 75 ? "bg-green-500" : pct >= 40 ? "bg-[#F5C400]" : "bg-[#D72638]";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="text-xs text-[#5F6368] w-8 text-right">{pct}%</span>}
    </div>
  );
}
