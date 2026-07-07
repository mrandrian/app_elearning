"use client";

import { useEffect, useState } from "react";
import { Activity, ShieldAlert, FileText, Search } from "lucide-react";

type AuditLog = {
  id: string;
  adminNip: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  admin: {
    name: string;
    nip: string;
  };
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes("CREATE")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (action.includes("EDIT") || action.includes("UPDATE")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (action.includes("DELETE")) return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.admin.name.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Log Aktivitas</h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">Pantau aktivitas yang dilakukan oleh admin di sistem.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 md:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari admin atau aktivitas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Menampilkan {filteredLogs.length} entri terbaru
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat data log...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Activity className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">Tidak ada log aktivitas</h3>
            <p className="text-slate-500 max-w-sm mb-6">Belum ada aktivitas admin yang dicatat atau sesuai dengan pencarian Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 text-sm">
                  <th className="px-6 py-4 font-medium">Waktu</th>
                  <th className="px-6 py-4 font-medium">Admin</th>
                  <th className="px-6 py-4 font-medium">Aktivitas</th>
                  <th className="px-6 py-4 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 text-sm">{log.admin.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{log.adminNip}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getActionBadge(log.action)}`}>
                        {log.action.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-md">
                      {log.details ? (
                        <div className="space-y-0.5">
                          {log.details.split('\n').map((line, i) => (
                            <div key={i} className={i === 0 ? "font-semibold text-slate-800" : "text-slate-500 text-xs font-mono"}>
                              {line}
                            </div>
                          ))}
                        </div>
                      ) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
