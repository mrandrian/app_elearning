"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

export default function NewCoursePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let thumbnail = null;

      if (thumbnailFile) {
        const formData = new FormData();
        formData.append("file", thumbnailFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          thumbnail = uploadData.fileUrl;
        } else {
          toast.error("Gagal mengunggah banner.");
          setSaving(false);
          return;
        }
      }

      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, published, thumbnail, categoryId: categoryId || null })
      });
      
      if (res.ok) {
        router.push("/admin/courses");
        router.refresh();
      } else {
        toast.error("Gagal menambahkan kursus");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/courses" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Buat Kursus Baru</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Lengkapi informasi dasar kursus yang akan dibuat.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Judul Kursus</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              placeholder="Contoh: Pengantar Kebijakan Publik"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Kategori Kursus</label>
            {categories.length === 0 ? (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-sm text-amber-700 flex-1">Belum ada kategori. Buat kategori terlebih dahulu.</p>
                <Link href="/admin/categories" className="text-sm text-amber-800 font-semibold hover:underline whitespace-nowrap">
                  Buat Kategori →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-white"
                >
                  <option value="">— Pilih Kategori —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                {categoryId && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Terpilih:</span>
                    {(() => {
                      const selected = categories.find(c => c.id === categoryId);
                      if (!selected) return null;
                      return (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: selected.color || "#6366f1" }}
                        >
                          {selected.icon} {selected.name}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Deskripsi Lengkap</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              placeholder="Jelaskan secara singkat materi yang akan dipelajari..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Banner Kursus (Rasio 16:9)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files ? e.target.files[0] : null)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors bg-slate-50"
            />
            <p className="text-xs text-slate-500 mt-2">Format gambar yang disarankan: JPG, PNG, WEBP. Ukuran ideal 1280x720px.</p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <input
              type="checkbox"
              id="published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="published" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
              Langsung publikasikan kursus ini (Dapat dilihat oleh pegawai)
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl transition-colors font-medium shadow-sm"
            >
              {saving ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Simpan Kursus
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
