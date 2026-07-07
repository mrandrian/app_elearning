"use client";

import { useEffect, useState } from "react";
import { Plus, Tag, Trash2, Edit2, X, Save, Palette, Book, GraduationCap, Lightbulb, Monitor, Target, Zap, BookOpen, Gamepad2, Globe, Wrench, ClipboardList, Award, Briefcase, Compass, FileText, Layout, PieChart, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  _count: { courses: number };
};

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#64748b", // Slate
  "#78716c", // Stone
];

const PRESET_ICONS = [
  "Book", "GraduationCap", "Lightbulb", "Monitor", "Target", "Zap", 
  "BookOpen", "Gamepad2", "Globe", "Wrench", "ClipboardList", "Award",
  "Briefcase", "Compass", "FileText", "Layout", "PieChart", "Star"
];

const renderIcon = (iconName: string | null, className = "w-5 h-5") => {
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

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formIcon, setFormIcon] = useState("Book");
  const [formColor, setFormColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormDesc("");
    setFormIcon("Book");
    setFormColor("#6366f1");
    setEditingId(null);
    setShowForm(false);
  };

  const openEditForm = (cat: Category) => {
    setFormName(cat.name);
    setFormDesc(cat.description || "");
    setFormIcon(cat.icon || "Book");
    setFormColor(cat.color || "#6366f1");
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: formName,
        description: formDesc,
        icon: formIcon,
        color: formColor,
      };

      const url = editingId ? `/api/categories/${editingId}` : "/api/categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        fetchCategories();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal menyimpan kategori");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShowDeleteConfirm(null);
        fetchCategories();
      } else {
        toast.error("Gagal menghapus kategori");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Jenis Kursus</h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">Kelola jenis kursus untuk mengelompokkan kursus pembelajaran.</p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-colors font-medium shadow-sm w-full sm:w-auto"
        >
          {showForm ? (
            <>
              <X className="w-5 h-5" />
              Batal
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Tambah Kategori
            </>
          )}
        </button>
      </div>

      {/* Create / Edit Form */}
      <AnimatePresence>
      {showForm && (
        <motion.div 
          initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
          animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
          exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            {editingId ? <Edit2 className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-indigo-500" />}
            {editingId ? "Edit Kategori" : "Tambah Kategori Baru"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Kategori</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  placeholder="Contoh: Microlearning"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Deskripsi (Opsional)</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  placeholder="Deskripsi singkat kategori..."
                />
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ikon</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormIcon(icon)}
                    className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all duration-150 ${
                      formIcon === icon
                        ? "bg-indigo-100 ring-2 ring-indigo-500 scale-110"
                        : "bg-slate-50 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {renderIcon(icon, "w-5 h-5")}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Warna Badge
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormColor(color)}
                    className={`w-9 h-9 rounded-xl transition-all duration-150 ${
                      formColor === color ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-2">Preview</p>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-white shadow-sm"
                style={{ backgroundColor: formColor }}
              >
                <span className="flex items-center justify-center bg-white/20 rounded-full p-1">{renderIcon(formIcon, "w-4 h-4")}</span>
                {formName || "Nama Kategori"}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl transition-colors font-medium shadow-sm"
              >
                <Save className="w-4 h-4" />
                {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan Kategori"}
              </button>
            </div>
          </form>
        </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Categories Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
          Memuat data kategori...
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <Tag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">Belum ada kategori</h3>
          <p className="text-slate-500 max-w-sm mb-6">
            Buat kategori untuk mengelompokkan kursus, seperti &quot;Microlearning&quot;, &quot;Belajar Mandiri&quot;, atau &quot;Pelatihan Fungsional&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
          {categories.map((cat, index) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: (cat.color || "#6366f1") + "18" }}
                >
                  {renderIcon(cat.icon, "w-6 h-6")}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">{cat.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: cat.color || "#6366f1" }}
                    >
                      {cat._count.courses} kursus
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openEditForm(cat)}
                  className="flex-1 flex items-center justify-center gap-1.5 p-2 text-sm text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(cat.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 p-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </button>
              </div>

              {/* Delete Confirmation */}
              {showDeleteConfirm === cat.id && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 z-10">
                  <p className="text-sm font-medium text-slate-900 text-center mb-1">Hapus kategori &quot;{cat.name}&quot;?</p>
                  <p className="text-xs text-slate-500 text-center mb-4">
                    {cat._count.courses > 0
                      ? `${cat._count.courses} kursus akan kehilangan kategori ini.`
                      : "Kategori ini tidak memiliki kursus."}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Ya, Hapus
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
