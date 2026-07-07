"use client";

import { Settings, Bell, Lock, Globe, HardDrive } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "STUDENT";
  
  const [activeTab, setActiveTab] = useState("general");
  const [maxUploadMb, setMaxUploadMb] = useState("50");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (role === "SUPER_ADMIN") {
      fetch("/api/settings")
        .then(res => res.json())
        .then(data => {
          if (data.settings && data.settings.MAX_UPLOAD_SIZE_MB) {
            setMaxUploadMb(data.settings.MAX_UPLOAD_SIZE_MB);
          }
        });
    }
  }, [role]);

  const handleSaveSystem = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "MAX_UPLOAD_SIZE_MB", value: maxUploadMb.toString() })
      });
      if (res.ok) {
        setMessage("Pengaturan berhasil disimpan.");
      } else {
        setMessage("Gagal menyimpan pengaturan.");
      }
    } catch (e) {
      setMessage("Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Pengaturan</h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">Atur preferensi aplikasi dan notifikasi Anda.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-2">
        <div className="flex flex-col md:flex-row min-h-[400px]">
          <div className="md:w-64 p-3 md:p-4 border-b md:border-b-0 md:border-r border-slate-100">
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
              <button 
                onClick={() => setActiveTab("general")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'general' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Settings className="w-4 h-4" /> Umum
              </button>
              <button 
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'security' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Lock className="w-4 h-4" /> Keamanan
              </button>
              {role === "SUPER_ADMIN" && (
                <button 
                  onClick={() => setActiveTab("system")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'system' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <HardDrive className="w-4 h-4" /> Sistem
                </button>
              )}
            </nav>
          </div>
          
          <div className="flex-1 p-4 md:p-8">
            {activeTab === "general" && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-6">Pengaturan Umum</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tema Aplikasi</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="theme" defaultChecked className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-sm text-slate-700">Terang (Sistem)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="theme" className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-sm text-slate-700">Gelap</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Zona Waktu</label>
                    <select className="w-full max-w-md px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white">
                      <option>(GMT+07:00) Waktu Indonesia Barat (Jakarta)</option>
                      <option>(GMT+08:00) Waktu Indonesia Tengah (Makassar)</option>
                      <option>(GMT+09:00) Waktu Indonesia Timur (Jayapura)</option>
                    </select>
                  </div>
                  
                  <div className="pt-4">
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-colors font-medium shadow-sm text-sm">
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-6">Keamanan</h2>
                <p className="text-slate-500 text-sm mb-4">Pengaturan keamanan akun Anda.</p>
                <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl transition-colors font-medium shadow-sm text-sm">
                  Ubah Kata Sandi
                </button>
              </div>
            )}

            {activeTab === "system" && role === "SUPER_ADMIN" && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-6">Pengaturan Sistem</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Batas Maksimal Ukuran Upload (MB)</label>
                    <p className="text-xs text-slate-500 mb-3">Mempengaruhi batas ukuran unggahan untuk video, dokumen PDF, berkas tugas, dll.</p>
                    <input 
                      type="number" 
                      min="1"
                      value={maxUploadMb}
                      onChange={(e) => setMaxUploadMb(e.target.value)}
                      className="w-full max-w-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  
                  {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.includes('berhasil') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {message}
                    </div>
                  )}

                  <div className="pt-4">
                    <button 
                      onClick={handleSaveSystem}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl transition-colors font-medium shadow-sm text-sm"
                    >
                      {saving ? "Menyimpan..." : "Simpan Pengaturan Sistem"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
