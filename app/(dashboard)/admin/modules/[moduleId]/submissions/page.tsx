import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, CheckCircle, FileText, Download } from "lucide-react";
import { notFound } from "next/navigation";

export default async function AssignmentSubmissionsPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const resolvedParams = await params;
  const moduleId = resolvedParams.moduleId;

  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { course: true }
  });

  if (!module || module.type !== 'ASSIGNMENT') {
    return notFound();
  }

  const scores = await prisma.score.findMany({
    where: { moduleId },
    include: {
      user: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Filter only those who submitted a file
  const submissions = scores.filter(score => {
    if (!score.feedback) return false;
    try {
      const ans = typeof score.feedback === 'string' ? JSON.parse(score.feedback) : score.feedback;
      return !!ans.fileUrl;
    } catch (e) {
      return false;
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/admin/courses/${module.courseId}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pengumpulan Tugas</h1>
          <p className="text-slate-500 mt-1">Materi: {module.title} — {module.course.title}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-fuchsia-100 flex items-center justify-center text-fuchsia-600">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900">Daftar Hasil Pekerjaan Peserta</h3>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center">
            <p className="text-slate-500">Belum ada peserta yang mengumpulkan tugas ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-sm">
                  <th className="py-3 px-4 font-semibold w-12">No</th>
                  <th className="py-3 px-4 font-semibold">Nama Peserta</th>
                  <th className="py-3 px-4 font-semibold">NIP</th>
                  <th className="py-3 px-4 font-semibold">Waktu Pengumpulan</th>
                  <th className="py-3 px-4 font-semibold text-right">Berkas Tugas</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, idx) => {
                  let fileUrl = "";
                  try {
                    const ans: any = typeof sub.feedback === 'string' ? JSON.parse(sub.feedback) : sub.feedback;
                    fileUrl = ans.fileUrl || "";
                  } catch (e) {}

                  return (
                    <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                      <td className="py-4 px-4 text-slate-500 font-medium">{idx + 1}</td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{sub.user.name || "Tanpa Nama"}</div>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600 font-mono">
                        {sub.user.nip || "-"}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-500">
                        {sub.createdAt.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {fileUrl ? (
                          <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" /> Unduh
                          </a>
                        ) : (
                          <span className="text-slate-400 text-sm italic">Tidak ada berkas</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
