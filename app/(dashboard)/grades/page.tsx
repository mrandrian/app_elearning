"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Award, CheckCircle } from "lucide-react";

type Score = {
  id: string;
  value: number;
  createdAt: string;
  module: {
    title: string;
    type: string;
    course: {
      title: string;
    };
  };
};

export default function StudentGradesPage() {
  const [scores, setScores] = useState<Score[]>([]);
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

  const getScoreColor = (value: number) => {
    if (value >= 85) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (value >= 70) return "text-blue-600 bg-blue-50 border-blue-100";
    if (value >= 50) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-red-600 bg-red-50 border-red-100";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Rekap Nilai</h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">Pantau pencapaian Anda dari berbagai modul pelatihan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Kuis/Modul</p>
            <p className="text-2xl font-bold text-slate-900">{scores.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Nilai Rata-rata</p>
            <p className="text-2xl font-bold text-slate-900">
              {scores.length > 0 ? Math.round(scores.reduce((acc, curr) => acc + curr.value, 0) / scores.length) : 0}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Predikat</p>
            <p className="text-xl font-bold text-slate-900">
              {scores.length > 0 ? (
                Math.round(scores.reduce((acc, curr) => acc + curr.value, 0) / scores.length) >= 85 ? "Sangat Baik" :
                Math.round(scores.reduce((acc, curr) => acc + curr.value, 0) / scores.length) >= 70 ? "Baik" : "Cukup"
              ) : "-"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat data nilai...</div>
        ) : scores.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">Belum ada nilai yang direkam</h3>
            <p className="text-slate-500 max-w-sm mb-6">Selesaikan modul interaktif atau kuis untuk mendapatkan nilai.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 text-sm">
                  <th className="px-6 py-4 font-medium">Modul / Materi</th>
                  <th className="px-6 py-4 font-medium">Kursus</th>
                  <th className="px-6 py-4 font-medium">Tanggal</th>
                  <th className="px-6 py-4 font-medium text-right">Skor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scores.map((score) => (
                  <tr key={score.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{score.module.title}</div>
                      <div className="text-xs text-slate-500">{score.module.type}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {score.module.course.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(score.createdAt).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg border font-bold ${getScoreColor(score.value)}`}>
                        {score.value}
                      </span>
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
