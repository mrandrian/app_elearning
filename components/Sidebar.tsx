"use client";

import { useState, useEffect, useCallback } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Calendar, Home, LayoutDashboard, Settings, User, FileText, Users, Tag, PanelLeftClose, PanelLeftOpen, Award, Menu, X } from "lucide-react";
import { clsx } from "clsx";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

const studentNavigation = [
  { name: "Beranda", href: "/", icon: Home },
  { name: "Kursus", href: "/courses", icon: BookOpen },
  { name: "Kalender", href: "/calendar", icon: Calendar },
  { name: "Sertifikat", href: "/certificates", icon: Award },
];

const adminNavigation = [
  { name: "Dashboard Admin", href: "/", icon: Home },
  { name: "Jenis Kursus", href: "/admin/categories", icon: Tag },
  { name: "Manajemen Kursus", href: "/admin/courses", icon: BookOpen },
  { name: "Template Sertifikat", href: "/admin/certificates", icon: Award },
];

const superAdminNavigation = [
  { name: "Dashboard Super", href: "/", icon: Home },
  { name: "Manajemen Pengguna", href: "/admin/users", icon: Users },
  { name: "Jenis Kursus", href: "/admin/categories", icon: Tag },
  { name: "Manajemen Kursus", href: "/admin/courses", icon: BookOpen },
  { name: "Template Sertifikat", href: "/admin/certificates", icon: Award },
  { name: "Log Aktivitas", href: "/admin/logs", icon: FileText }, // using FileText for now, maybe Activity if available, but FileText is safe
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const user = session?.user as any;
  const role = user?.role || "STUDENT";
  
  let navigation = studentNavigation;
  if (role === "SUPER_ADMIN") navigation = superAdminNavigation;
  else if (role === "ADMIN") navigation = adminNavigation;

  // Detect mobile screen
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (e.matches) {
        setMobileOpen(false);
      }
    };
    handleChange(mql);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div className={clsx("flex items-center gap-3 mb-8 w-full", isMobile ? "justify-between" : isCollapsed ? "justify-center" : "justify-between")}>
        <Link href="/" className="flex items-center gap-3 overflow-hidden hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 relative shrink-0">
            <Image 
              src="/logo_bknpedia.png" 
              alt="Logo BKN Pedia" 
              fill 
              className="object-contain"
            />
          </div>
          {(isMobile || !isCollapsed) && (
            <span className="text-xl font-bold tracking-tight text-slate-900 leading-tight whitespace-nowrap">BKN Pedia</span>
          )}
        </Link>
        {isMobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={clsx(
              "p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors shrink-0",
              isCollapsed && "absolute -right-4 top-8 bg-white border border-slate-200 shadow-sm"
            )}
            title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        )}
      </div>

      {user && (
        <div className={clsx("mb-8 flex items-center gap-3 px-2 w-full", !isMobile && isCollapsed && "justify-center px-0")}>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden border border-indigo-200 shrink-0" title={user.name}>
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name || "Profile"} className="w-full h-full object-cover" />
            ) : (
              (user.name || "U").charAt(0).toUpperCase()
            )}
          </div>
          {(isMobile || !isCollapsed) && (
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span className="text-sm font-bold text-slate-900 truncate whitespace-nowrap">{user.name || "Pegawai"}</span>
              <span className="text-xs text-slate-500 font-mono truncate whitespace-nowrap">{user.id || "NIP tidak tersedia"}</span>
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 space-y-2 w-full">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              title={!isMobile && isCollapsed ? item.name : undefined}
              className={clsx(
                "flex items-center gap-3 rounded-xl transition-all duration-200 overflow-hidden",
                !isMobile && isCollapsed ? "justify-center p-3" : "px-4 py-3",
                isActive 
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-100 font-medium" 
                  : "text-slate-500 hover:bg-slate-100/50 hover:text-slate-900"
              )}
            >
              <item.icon className={clsx("w-5 h-5 shrink-0", isActive ? "text-indigo-600" : "text-slate-400")} />
              {(isMobile || !isCollapsed) && <span className="whitespace-nowrap">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 w-full">
        <div className={clsx(
          "mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider overflow-hidden whitespace-nowrap",
          !isMobile && isCollapsed ? "text-center px-0 text-[10px]" : "px-4 py-2"
        )}>
          {!isMobile && isCollapsed ? role.slice(0,3) : (role === 'STUDENT' ? 'PESERTA' : role)}
        </div>
        {role !== "STUDENT" && (
          <>
            <Link href="/profile" title={!isMobile && isCollapsed ? "Profil" : undefined} className={clsx(
              "flex items-center gap-3 rounded-xl text-slate-500 hover:bg-slate-100/50 hover:text-slate-900 transition-all duration-200",
              !isMobile && isCollapsed ? "justify-center p-3" : "px-4 py-3"
            )}>
              <User className="w-5 h-5 text-slate-400 shrink-0" />
              {(isMobile || !isCollapsed) && <span>Profil</span>}
            </Link>
            <Link href="/settings" title={!isMobile && isCollapsed ? "Pengaturan" : undefined} className={clsx(
              "flex items-center gap-3 rounded-xl text-slate-500 hover:bg-slate-100/50 hover:text-slate-900 transition-all duration-200",
              !isMobile && isCollapsed ? "justify-center p-3" : "px-4 py-3"
            )}>
              <Settings className="w-5 h-5 text-slate-400 shrink-0" />
              {(isMobile || !isCollapsed) && <span>Pengaturan</span>}
            </Link>
          </>
        )}
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={!isMobile && isCollapsed ? "Keluar" : undefined}
          className={clsx(
            "w-full flex items-center gap-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200",
            !isMobile && isCollapsed ? "justify-center p-3" : "px-4 py-3"
          )}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {(isMobile || !isCollapsed) && <span>Keluar</span>}
        </button>
      </div>
    </>
  );

  // ── Mobile: hamburger button + overlay drawer ──
  if (isMobile) {
    return (
      <>
        {/* Floating hamburger button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-40 p-2.5 bg-white border border-slate-200 rounded-xl shadow-lg text-slate-700 hover:bg-slate-50 transition-colors active:scale-95"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Overlay backdrop */}
        <div
          className={clsx(
            "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300",
            mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setMobileOpen(false)}
        />

        {/* Slide-in drawer */}
        <div
          className={clsx(
            "fixed top-0 left-0 z-50 h-full w-72 bg-slate-50 border-r border-slate-200 flex flex-col p-6 transition-transform duration-300 ease-in-out overflow-y-auto",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  // ── Desktop: original collapsible sidebar ──
  return (
    <div className={clsx(
      "flex flex-col bg-slate-50 border-r border-slate-200 h-screen sticky top-0 transition-all duration-300 z-20 shrink-0",
      isCollapsed ? "w-20 items-center px-4 py-6" : "w-64 p-6"
    )}>
      {sidebarContent}
    </div>
  );
}
