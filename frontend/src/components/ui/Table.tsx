"use client";

type TableRow = {
  id: string;
  service: string;
  applicant: string;
  status: "Approved" | "Pending" | "Under Review" | "Rejected";
  updatedAt: string;
};

type TableProps = {
  rows: TableRow[];
};

export function Table({ rows }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300">
            <th className="px-3 py-2 font-semibold">Service</th>
            <th className="px-3 py-2 font-semibold">Applicant</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="px-3 py-2 font-semibold">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
              <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{row.service}</td>
              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{row.applicant}</td>
              <td className="px-3 py-2">
                <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs dark:border-slate-600">
                  {row.status}
                </span>
              </td>
              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
