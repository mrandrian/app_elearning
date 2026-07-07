"use client";

import { useState } from "react";
import { BookOpen, ChevronRight, Tag, Book, GraduationCap, Lightbulb, Monitor, Target, Zap, Gamepad2, Globe, Wrench, ClipboardList, Award, Briefcase, Compass, FileText, Layout, PieChart, Star } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

type Module = {
  id: string;
};

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  categoryId: string | null;
  category: Category | null;
  modules: Module[];
};

const renderIcon = (iconName: string | null, className = "w-4 h-4") => {
  const props = { className, strokeWidth: 1.5 };
  switch(iconName) {
    case "Book": return <Book {...props} />;
    case "GraduationCap": return <GraduationCap {...props} />;
    case "Lightbulb": return <Lightbulb {...props} />;
    case "Monitor": return <Monitor {...props} />;
    case "Target": return <Target {...props} />;
    case "Zap": return <Zap {...props} />;
    case "BookOpen": return <BookOpen {...props} />;
    case "Gamepad2": return <Gamepad2 {...props} />;
    case "Globe": return <Globe {...props} />;
    case "Wrench": return <Wrench {...props} />;
    case "ClipboardList": return <ClipboardList {...props} />;
    case "Award": return <Award {...props} />;
    case "Briefcase": return <Briefcase {...props} />;
    case "Compass": return <Compass {...props} />;
    case "FileText": return <FileText {...props} />;
    case "Layout": return <Layout {...props} />;
    case "PieChart": return <PieChart {...props} />;
    case "Star": return <Star {...props} />;
    default: return <Book {...props} />;
  }
};

export default function StudentCoursesClient({
  courses,
  categories,
  enrolledCourseIds,
}: {
  courses: Course[];
  categories: Category[];
  enrolledCourseIds: string[];
}) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrollingId(courseId);
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Gagal mendaftar kursus.");
        setEnrollingId(null);
      }
    } catch (e) {
      setEnrollingId(null);
    }
  };

  const filteredCourses =
    activeCategory === "all"
      ? courses
      : courses.filter((c) => c.categoryId === activeCategory);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Katalog Kursus</h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">Temukan kursus yang relevan untuk meningkatkan kompetensi Anda.</p>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0 ${
              activeCategory === "all"
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            Semua Kursus
          </button>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0 ${
                  isActive
                    ? "text-white shadow-md"
                    : "bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
                style={
                  isActive
                    ? { backgroundColor: cat.color || "#6366f1", boxShadow: `0 4px 14px -3px ${cat.color || "#6366f1"}40` }
                    : { color: cat.color || "#6366f1" }
                }
              >
                <span className="flex items-center justify-center bg-white/20 rounded-full p-1">{renderIcon(cat.icon, "w-3.5 h-3.5")}</span>
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">
            {activeCategory !== "all" ? "Belum ada kursus di kategori ini" : "Belum ada kursus yang tersedia"}
          </h3>
          <p className="text-slate-500 max-w-sm mb-6">
            {activeCategory !== "all"
              ? "Coba pilih kategori lain untuk menemukan kursus."
              : "Silakan cek kembali nanti atau hubungi admin Anda."}
          </p>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
          {filteredCourses.map((course, index) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              key={course.id} 
              className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
            >
              {course.thumbnail ? (
                <div className="w-full aspect-video relative bg-slate-100 border-b border-slate-100 overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                      {course.modules.length} Modul
                    </span>
                  </div>
                  {course.category && (
                    <div className="absolute top-4 left-4 z-10">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-sm backdrop-blur-sm"
                        style={{ backgroundColor: (course.category.color || "#6366f1") + "dd" }}
                      >
                        {renderIcon(course.category.icon, "w-3.5 h-3.5")} {course.category.name}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-5 pt-5 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    {course.category && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white mb-3"
                        style={{ backgroundColor: course.category.color || "#6366f1" }}
                      >
                        {renderIcon(course.category.icon, "w-3.5 h-3.5")} {course.category.name}
                      </span>
                    )}
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {course.modules.length} Modul
                  </span>
                </div>
              )}
              
              <div className="flex-1 p-5 pt-4">
                <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight">{course.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-3">
                  {course.description || "Tidak ada deskripsi"}
                </p>
              </div>
              
              <div className="px-5 pb-5 pt-4 border-t border-slate-100 mt-auto">
                {course.modules.length > 0 ? (
                  enrolledCourseIds.includes(course.id) ? (
                    <Link 
                      href={`/course/${course.id}/module/${course.modules[0].id}`}
                      className="flex items-center justify-between text-indigo-600 font-medium hover:text-indigo-700 group/link"
                    >
                      Lanjutkan Belajar
                      <ChevronRight className="w-5 h-5 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <button 
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollingId === course.id}
                      className="flex w-full items-center justify-center gap-2 bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
                    >
                      {enrollingId === course.id ? "Mendaftar..." : "Daftar Kursus"}
                    </button>
                  )
                ) : (
                  <span className="text-slate-400 font-medium italic text-sm">Belum ada modul</span>
                )}
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
