"use client";

import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function SiasnLoginPage() {
  useEffect(() => {
    // Otomatis arahkan ke SSO SIASN saat halaman dimuat
    signIn("siasn", { callbackUrl: "/" });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-600 font-medium">Menghubungkan ke SSO SIASN...</p>
        <p className="text-slate-400 text-sm">Anda akan dialihkan ke halaman login instansi.</p>
      </div>
    </div>
  );
}
