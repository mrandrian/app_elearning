"use client";

import { useEffect, useState } from "react";
import { FileText, Download, Award } from "lucide-react";

type ScoreData = {
  id: string;
  userNip: string;
  value: number;
  feedback: string | null;
  createdAt: string;
  user: { name: string; nip: string };
  module: { title: string; course: { title: string } };
};

export default function AdminGradesPage() {
  const [scores, setScores] = useState<ScoreData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      const res = await fetch("/api/grades");
      const data = await res.json();
      if (data.scores) {
        setScores(data.scores);
      }
    } catch (error) {
      console.error("Failed to fetch grades:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Rekap Nilai</h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">Daftar nilai evaluasi dan H5P pegawai pada kursus Anda.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-5 py-2.5 rounded-xl transition-colors font-medium shadow-sm w-full sm:w-auto">
          <Download className="w-5 h-5" />
          Export Data (CSV)
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat data nilai...</div>
        ) : scores.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">Belum ada nilai terekam</h3>
            <p className="text-slate-500 max-w-sm mb-6">Nilai akan otomatis muncul di sini setelah pegawai menyelesaikan materi evaluasi atau kuis H5P.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 text-sm">
                  <th className="px-6 py-4 font-medium">Pegawai</th>
                  <th className="px-6 py-4 font-medium">Kursus & Modul</th>
                  <th className="px-6 py-4 font-medium text-center">Skor</th>
                  <th className="px-6 py-4 font-medium text-right">Waktu Penyelesaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scores.map((score) => (
                  <tr key={score.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{score.user.name}</div>
                      <div className="text-sm text-slate-500">NIP: {score.user.nip}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{score.module.course.title}</div>
                      <div className="text-sm text-slate-500 truncate max-w-xs">{score.module.title}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm bg-indigo-50 text-indigo-700">
                        <Award className="w-4 h-4" />
                        {score.value}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-500">
                      {formatDate(score.createdAt)}
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
