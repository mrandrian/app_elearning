"use client";

import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, ChevronDown, Zap, UserCircle } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [showOtherOptions, setShowOtherOptions] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 relative mb-6">
            <Image 
              src="/logo_bknpedia.png" 
              alt="Logo BKN Pedia" 
              fill 
              className="object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 text-center">E-learning BKN Pedia</h2>
          <p className="text-slate-500 text-sm mt-2 text-center">Pusat Pembelajaran Digital Terintegrasi</p>
        </div>

        <div className="space-y-6">
          {/* Main SIASN Login Button */}
          <Link 
            href="/login/siasn"
            className="group flex items-center justify-center gap-3 p-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-lg shadow-indigo-200 text-lg font-bold"
          >
            <ShieldCheck className="w-6 h-6" />
            Login menggunakan akun SIASN
          </Link>

          {/* Secondary / Hidden Options */}
          <div className="pt-4 flex flex-col items-center">
            <button 
              onClick={() => setShowOtherOptions(!showOtherOptions)}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
            >
              Opsi login lainnya <ChevronDown className={`w-3 h-3 transition-transform ${showOtherOptions ? 'rotate-180' : ''}`} />
            </button>

            {showOtherOptions && (
              <div className="mt-4 w-full grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Link 
                  href="/login/plasma"
                  className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 transition-all text-center"
                >
                  <Zap className="w-5 h-5 text-indigo-500" />
                  <span className="text-xs font-medium">SSO Plasma</span>
                </Link>
                <Link 
                  href="/login/local"
                  className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 transition-all text-center"
                >
                  <UserCircle className="w-5 h-5 text-slate-400" />
                  <span className="text-xs font-medium">Login Lokal</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            BKN Pedia &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
