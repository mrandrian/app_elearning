import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { CheckCircle, XCircle, Calendar, BookOpen, User, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default async function VerifyCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let enrollment = null;
  try {
    enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, nip: true }
        },
        course: {
          include: {
            category: true
          }
        }
      }
    });
  } catch (error) {
    // invalid ID format or DB error
  }

  const isValid = enrollment && enrollment.completed && enrollment.course.hasCertificate;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative">
            <Image 
              src="/logo_bknpedia.png" 
              alt="Logo BKN Pedia" 
              fill 
              className="object-contain"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">BKN Pedia</span>
        </div>
        <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          Ke Beranda
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Validasi Sertifikat</h1>
            <p className="text-slate-500">Sistem verifikasi sertifikat elektronik BKN Pedia</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Status Header */}
            <div className={`p-6 text-center border-b ${isValid ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <div className="flex justify-center mb-4">
                {isValid ? (
                  <div className="relative">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-10 h-10 text-emerald-600" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                  </div>
                )}
              </div>
              <h2 className={`text-2xl font-black tracking-tight ${isValid ? 'text-emerald-800' : 'text-red-800'}`}>
                {isValid ? "Sertifikat Valid" : "Sertifikat Tidak Valid"}
              </h2>
              <p className={`text-sm mt-1 font-medium ${isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                {isValid ? "Sertifikat terdaftar resmi di sistem kami" : "Sertifikat tidak ditemukan atau belum selesai"}
              </p>
            </div>

            {/* Details */}
            {isValid && enrollment && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Informasi Peserta</h3>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-lg">{enrollment.user.name}</p>
                      <p className="text-slate-500 text-sm font-mono mt-0.5">NIP: {enrollment.user.nip}</p>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100"></div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Informasi Kursus</h3>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-snug">{enrollment.course.title}</p>
                      {enrollment.course.category && (
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded mt-2">
                          {enrollment.course.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100"></div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">ID Sertifikat</h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <p className="font-mono text-sm font-medium text-slate-700 break-all">{enrollment.id}</p>
                  </div>
                </div>
              </div>
            )}
            
            {!isValid && (
              <div className="p-8 text-center text-slate-600 text-sm leading-relaxed">
                Maaf, kode validasi sertifikat ini tidak dapat kami temukan di dalam sistem BKN Pedia, atau kursus belum diselesaikan secara penuh oleh peserta.
              </div>
            )}
            
            <div className="p-4 bg-slate-50 text-center text-xs text-slate-400 border-t border-slate-100">
              Verifikasi secara online di <span className="font-semibold text-slate-500">elearning.bkn.go.id</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
