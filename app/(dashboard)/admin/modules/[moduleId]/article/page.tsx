"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Import Quill dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-50 border border-slate-200 rounded-lg animate-pulse flex items-center justify-center text-slate-400">Memuat Editor...</div>
});
import "react-quill-new/dist/quill.snow.css";

export default function EditArticleModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const resolvedParams = use(params);
  const moduleId = resolvedParams.moduleId;
  const router = useRouter();

  const [moduleData, setModuleData] = useState<any>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  const DRAFT_KEY = `article_draft_${moduleId}`;

  useEffect(() => {
    fetchModuleData();
  }, [moduleId]);

  // Load from draft if available
  useEffect(() => {
    if (!loading && moduleData) {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        // Only set if draft is different from DB content
        const currentContent = parseContentPath(moduleData.contentPath);
        if (savedDraft !== currentContent) {
          setContent(savedDraft);
          setIsDraft(true);
        }
      }
    }
  }, [loading, moduleData]);

  // Auto-save draft
  useEffect(() => {
    if (loading || !moduleData) return;
    const timer = setTimeout(() => {
      const currentContent = parseContentPath(moduleData.contentPath);
      if (content && content !== currentContent) {
        localStorage.setItem(DRAFT_KEY, content);
        setIsDraft(true);
      } else {
        localStorage.removeItem(DRAFT_KEY);
        setIsDraft(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, loading, moduleData]);

  const parseContentPath = (path: string | null) => {
    if (!path) return "";
    try {
      if (path.startsWith("{")) {
        const parsed = JSON.parse(path);
        return parsed.articleContent || "";
      }
    } catch (e) {
      // Ignore
    }
    return path; // Fallback to raw text
  };

  const fetchModuleData = async () => {
    try {
      const res = await fetch(`/api/modules/${moduleId}`);
      const data = await res.json();
      
      if (data.module) {
        if (data.module.type !== "ARTICLE") {
          setError("Modul ini bukan modul tipe Artikel.");
          return;
        }
        setModuleData(data.module);
        setContent(parseContentPath(data.module.contentPath));
      } else {
        setError("Modul tidak ditemukan.");
      }
    } catch (error) {
      console.error(error);
      setError("Gagal mengambil data modul.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      let existingObj: any = {};
      if (moduleData.contentPath && moduleData.contentPath.startsWith("{")) {
        try { existingObj = JSON.parse(moduleData.contentPath); } catch (e) {}
      }

      const finalContent = JSON.stringify({
        ...existingObj,
        articleContent: content,
      });

      const res = await fetch(`/api/modules/${moduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentPath: finalContent,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setIsDraft(false);
        localStorage.removeItem(DRAFT_KEY);
        setModuleData({ ...moduleData, contentPath: finalContent });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menyimpan artikel.");
      }
    } catch (error) {
      console.error(error);
      setError("Kesalahan sistem saat menyimpan artikel.");
    } finally {
      setSaving(false);
    }
  };

  // Quill Modules Configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link", "image"],
      ["clean"],
    ],
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat editor artikel...</div>;
  }

  if (error || !moduleData) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">{error || "Terjadi kesalahan"}</p>
        </div>
        <Link href={`/admin/courses`} className="text-indigo-600 hover:underline mt-4 inline-block">
          Kembali ke Kursus
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/courses/${moduleData.courseId}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tulis Artikel</h1>
            <p className="text-slate-500 text-sm">{moduleData.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isDraft && (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
              Ada draf belum tersimpan
            </span>
          )}
          {success && (
            <span className="text-sm font-medium text-emerald-600">Tersimpan!</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Menyimpan..." : "Simpan Artikel"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <ReactQuill 
          theme="snow" 
          value={content} 
          onChange={setContent} 
          modules={modules}
          className="h-[600px] mb-12 bg-white"
        />
      </div>
      
      <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm leading-relaxed">
        <strong>Tips:</strong> Anda dapat melampirkan gambar, mengatur ukuran teks, memberikan penomoran, hingga warna latar. Pekerjaan Anda akan disimpan sementara ke browser secara otomatis sehingga tidak akan hilang meskipun halaman tidak sengaja termuat ulang (refresh). Jangan lupa klik "Simpan Artikel" untuk menerbitkannya.
      </div>
    </div>
  );
}
