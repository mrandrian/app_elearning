"use client";

import { useSession } from "next-auth/react";
import { User, Mail, Shield, BookOpen } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Profil Pengguna</h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">Kelola informasi pribadi dan pengaturan akun Anda.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-32 bg-indigo-600 w-full relative">
          <div className="absolute -bottom-12 left-4 md:left-8 w-20 h-20 md:w-24 md:h-24 bg-white rounded-full p-1 shadow-md">
            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <User className="w-10 h-10" />
            </div>
          </div>
        </div>
        
        <div className="pt-16 p-4 md:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">{user?.name || "Nama Pegawai"}</h2>
            <p className="text-slate-500">NIP: {user?.id || "Memuat..."}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Informasi Kontak</h3>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{user?.email || "Belum ada email"}</p>
                  <p className="text-xs text-slate-500">Email Utama</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Detail Akun</h3>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{user?.role === 'STUDENT' ? 'PESERTA' : (user?.role || "PESERTA")}</p>
                  <p className="text-xs text-slate-500">Peran Akses Sistem</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-100">
            <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-sm text-sm">
              Edit Profil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
