"use client";

import { useEffect, useState } from "react";
import { Plus, BookOpen, Trash2, Edit2, Tag, Book, GraduationCap, Lightbulb, Monitor, Target, Zap, Gamepad2, Globe, Wrench, ClipboardList, Award, Briefcase, Compass, FileText, Layout, PieChart, Star } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

type Course = {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
  categoryId: string | null;
  category: Category | null;
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

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      if (data.courses) {
        setCourses(data.courses);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const filteredCourses = filterCategory === "all"
    ? courses
    : filterCategory === "uncategorized"
      ? courses.filter((c) => !c.categoryId)
      : courses.filter((c) => c.categoryId === filterCategory);

  const handleDelete = async (courseId: string, courseTitle: string) => {
    if (!confirm(`Hapus kursus "${courseTitle}"? Ini akan menghapus semua modul di dalamnya.`)) return;
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
      if (res.ok) {
        fetchCourses();
      } else {
        toast.error("Gagal menghapus kursus.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Manajemen Kursus</h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">Kelola kursus, modul, dan materi pembelajaran di sini.</p>
        </div>
        <Link href="/admin/courses/new" className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-colors font-medium shadow-sm shrink-0 w-full sm:w-auto">
          <Plus className="w-5 h-5" />
          Tambah Kursus
        </Link>
      </div>

      {/* Category Filter Tabs */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-500 mr-1">
            <Tag className="w-4 h-4 inline-block mr-1" />
            Filter:
          </span>
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              filterCategory === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua ({courses.length})
          </button>
          {categories.map((cat) => {
            const count = courses.filter((c) => c.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  filterCategory === cat.id
                    ? "text-white shadow-sm"
                    : "text-slate-600 hover:opacity-80"
                }`}
                style={
                  filterCategory === cat.id
                    ? { backgroundColor: cat.color || "#6366f1" }
                    : { backgroundColor: (cat.color || "#6366f1") + "20", color: cat.color || "#6366f1" }
                }
              >
                <span className="flex items-center justify-center bg-white/20 rounded-full p-1">{renderIcon(cat.icon, "w-3.5 h-3.5")}</span>
                {cat.name} ({count})
              </button>
            );
          })}
          <button
            onClick={() => setFilterCategory("uncategorized")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              filterCategory === "uncategorized"
                ? "bg-slate-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            Tanpa Kategori ({courses.filter((c) => !c.categoryId).length})
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat data kursus...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              {filterCategory !== "all" ? "Tidak ada kursus di kategori ini" : "Belum ada kursus"}
            </h3>
            <p className="text-slate-500 max-w-sm mb-6">
              {filterCategory !== "all"
                ? "Coba pilih kategori lain atau tambah kursus baru."
                : "Mulai buat kursus pembelajaran untuk para pegawai dengan menekan tombol di atas."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 text-sm">
                  <th className="px-6 py-4 font-medium">Nama Kursus</th>
                  <th className="px-6 py-4 font-medium">Kategori</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <motion.tbody 
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.05 } },
                  hidden: {}
                }}
                className="divide-y divide-slate-100"
              >
                <AnimatePresence>
                {filteredCourses.map((course) => (
                  <motion.tr 
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={course.id} 
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <Link href={`/admin/courses/${course.id}`} className="font-medium text-slate-900 hover:text-indigo-600 transition-colors">
                            {course.title}
                          </Link>
                          <div className="text-sm text-slate-500 truncate max-w-xs">{course.description || "Tidak ada deskripsi"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {course.category ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: course.category.color || "#6366f1" }}
                        >
                          {renderIcon(course.category.icon, "w-3.5 h-3.5")} {course.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Tanpa kategori</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        course.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {course.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/courses/${course.id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(course.id, course.title)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                </AnimatePresence>
              </motion.tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
