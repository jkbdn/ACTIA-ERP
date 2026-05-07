interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "yellow" | "red" | "green" | "blue" | "default";
  icon?: React.ReactNode;
}

export function KpiCard({ label, value, sub, accent = "default", icon }: KpiCardProps) {
  const accentBar: Record<string, string> = {
    yellow: "bg-[#F5C400]",
    red:    "bg-[#D72638]",
    green:  "bg-green-500",
    blue:   "bg-blue-500",
    default:"bg-gray-300",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3 shadow-sm">
      <div className={`h-1 w-10 rounded-full ${accentBar[accent]}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#5F6368] text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-[#1F1F1F] mt-1">{value}</p>
          {sub && <p className="text-[#5F6368] text-xs mt-0.5">{sub}</p>}
        </div>
        {icon && <div className="text-2xl opacity-50">{icon}</div>}
      </div>
    </div>
  );
}
