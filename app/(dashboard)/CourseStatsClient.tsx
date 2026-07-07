"use client";

import { useState } from "react";
import { X, TrendingUp, Users, Award } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

type CourseStatProps = {
  course: {
    id: string;
    title: string;
    enrollments: number;
    graduates: number;
  };
  onClose: () => void;
};

// Generate some mock historical data based on the real totals
const generateHistoricalData = (totalEnrollments: number, totalGraduates: number) => {
  const data = [];
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  
  let currentEnrolls = 0;
  let currentGrads = 0;
  
  for (let i = 0; i < 7; i++) {
    // Distribute the totals somewhat randomly across 7 days
    const isLast = i === 6;
    
    const enrollInc = isLast ? (totalEnrollments - currentEnrolls) : Math.floor(Math.random() * (totalEnrollments / 3));
    const gradInc = isLast ? (totalGraduates - currentGrads) : Math.floor(Math.random() * (totalGraduates / 3));
    
    currentEnrolls += enrollInc;
    currentGrads += gradInc;
    
    data.push({
      name: days[i],
      "Pendaftar Baru": enrollInc,
      "Lulus": gradInc,
      "Total Terdaftar": currentEnrolls,
      "Total Lulus": currentGrads
    });
  }
  
  return data;
};

export default function CourseStatsClient({ courses }: { courses: any[] }) {
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  const handleRowClick = (course: any) => {
    setSelectedCourse(course);
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4">Statistik Kursus (Terbaru)</h3>
        <p className="text-xs text-slate-500 mb-4 -mt-2">Klik judul kursus untuk melihat detail analitik.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Judul Kursus</th>
                <th className="px-4 py-3">Peserta Terdaftar</th>
                <th className="px-4 py-3 rounded-tr-lg">Lulus (Selesai)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((c) => (
                <tr 
                  key={c.id} 
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(c)}
                >
                  <td className="px-4 py-3 font-medium text-indigo-600 hover:text-indigo-800">{c.title}</td>
                  <td className="px-4 py-3 text-slate-600">{c._count.enrollments} Peserta</td>
                  <td className="px-4 py-3 text-emerald-600 font-medium">{c.enrollments.length} Lulus</td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-slate-500">Belum ada data kursus.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedCourse && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
            >
              <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedCourse.title}</h2>
                  <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                    <TrendingUp className="w-4 h-4" />
                    Laporan Analitik Kursus
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedCourse(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-6 space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">Total Peserta</p>
                      <h4 className="text-2xl font-bold text-blue-900">{selectedCourse._count.enrollments}</h4>
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-0.5">Tersertifikasi</p>
                      <h4 className="text-2xl font-bold text-emerald-900">{selectedCourse.enrollments.length}</h4>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Line Chart */}
                  <div className="border border-slate-200 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Tren Pertumbuhan Mingguan</h3>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={generateHistoricalData(selectedCourse._count.enrollments, selectedCourse.enrollments.length)}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                          <Line type="monotone" dataKey="Total Terdaftar" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="Total Lulus" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="border border-slate-200 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Aktivitas Harian</h3>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={generateHistoricalData(selectedCourse._count.enrollments, selectedCourse.enrollments.length)}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <Tooltip 
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="Pendaftar Baru" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Lulus" fill="#34d399" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
