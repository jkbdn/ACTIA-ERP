interface Risk {
  id: string;
  description: string;
  severity: string;
  probability: string;
  taskCode: string;
  projectName: string;
  projectCode: string;
  status: string;
  mitigation: string;
}

const severityColor: Record<string, string> = {
  Alta:  "text-red-600 bg-red-50",
  Media: "text-yellow-700 bg-yellow-50",
  Baja:  "text-green-700 bg-green-50",
};

export function RisksTable({ risks }: { risks: Risk[] }) {
  if (risks.length === 0) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-[#1F1F1F] mb-4">Riesgos activos</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-3 text-xs text-[#5F6368] font-medium">Proyecto</th>
              <th className="text-left py-2 px-3 text-xs text-[#5F6368] font-medium">Tarea</th>
              <th className="text-left py-2 px-3 text-xs text-[#5F6368] font-medium">Descripción</th>
              <th className="text-left py-2 px-3 text-xs text-[#5F6368] font-medium">Severidad</th>
              <th className="text-left py-2 px-3 text-xs text-[#5F6368] font-medium">Mitigación</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((r) => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-2 px-3 text-xs font-medium text-[#5F6368]">{r.projectCode}</td>
                <td className="py-2 px-3 text-xs text-[#5F6368]">{r.taskCode || "—"}</td>
                <td className="py-2 px-3">{r.description}</td>
                <td className="py-2 px-3">
                  <span className={`badge text-xs ${severityColor[r.severity] ?? "bg-gray-100 text-gray-600"}`}>
                    {r.severity}
                  </span>
                </td>
                <td className="py-2 px-3 text-xs text-[#5F6368]">{r.mitigation || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
