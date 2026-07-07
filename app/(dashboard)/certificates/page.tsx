"use client";

import { useEffect, useState } from "react";
import { Award, BookOpen, Download } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Certificate = {
  id: string;
  courseId: string;
  course: {
    title: string;
    description: string;
    thumbnail: string | null;
    category: { name: string } | null;
  };
  user: { name: string };
};

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const res = await fetch("/api/certificates");
      const data = await res.json();
      if (data.certificates) {
        setCertificates(data.certificates);
      }
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Sertifikat Saya</h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">Daftar sertifikat yang Anda dapatkan setelah menyelesaikan kursus.</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center text-slate-500">
          Memuat sertifikat...
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mb-6">
            <Award className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Belum ada sertifikat</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Selesaikan kursus Anda untuk mendapatkan sertifikat kelulusan. Terus semangat belajar!
          </p>
          <Link href="/courses" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
            Cari Kursus Baru
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div key={cert.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="w-full aspect-[4/3] bg-indigo-600 relative overflow-hidden flex flex-col items-center justify-center p-6 text-center shrink-0 border-b-4 border-indigo-500">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                <Award className="w-16 h-16 text-indigo-200 mb-4" />
                <h3 className="font-serif text-white font-bold text-xl tracking-wide line-clamp-2 leading-tight">
                  {cert.course.title}
                </h3>
                <p className="text-indigo-200 text-sm mt-3 uppercase tracking-widest font-medium">Sertifikat Kelulusan</p>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">
                  Diberikan kepada <span className="font-bold text-slate-900">{cert.user.name}</span> atas penyelesaian kursus ini.
                </p>
                <Link 
                  href={`/certificate/generate/${cert.id}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-medium transition-colors"
                >
                  <Download className="w-4 h-4" /> Unduh Sertifikat
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
