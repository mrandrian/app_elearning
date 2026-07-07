"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, FileVideo, FileText, LayoutTemplate, HelpCircle, MapPin, Copy, Gamepad2, Layers, Edit2, X, Save, Trash2, AlignLeft, AlignCenter, AlignRight, Users, Award, UserPlus, Search } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Module = {
  id: string;
  title: string;
  type: string;
  order: number;
  contentPath?: string | null;
  minPassingScore?: number | null;
};

type CategoryRef = {
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
  thumbnail?: string | null;
  categoryId: string | null;
  hasCertificate: boolean;
  certificateBg?: string | null;
  certificateConfig?: string | null;
  certificateTemplateId: string | null;
  category: CategoryRef | null;
  modules: Module[];
};

export default function AdminCourseDetailsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.courseId;
  const [course, setCourse] = useState<Course | null>(null);
  const [stats, setStats] = useState<{enrolled: number, completed: number} | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Course State
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [editCourseTitle, setEditCourseTitle] = useState("");
  const [editCourseDesc, setEditCourseDesc] = useState("");
  const [editCourseBanner, setEditCourseBanner] = useState<File | null>(null);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editHasCertificate, setEditHasCertificate] = useState(false);
  const [editCertTemplateId, setEditCertTemplateId] = useState("");
  const [certTemplates, setCertTemplates] = useState<any[]>([]);

  const [allCategories, setAllCategories] = useState<CategoryRef[]>([]);
  const [savingCourse, setSavingCourse] = useState(false);

  // Dialog State
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'alert', title: '', message: '' });

  const showAlert = (title: string, message: string) => {
    setDialogConfig({ isOpen: true, type: 'alert', title, message });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialogConfig({ isOpen: true, type: 'confirm', title, message, onConfirm });
  };
  const [showAddModule, setShowAddModule] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleType, setNewModuleType] = useState("VIDEO");
  const [gameSubType, setGameSubType] = useState("GAME_FLASHCARD");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [minPassingScore, setMinPassingScore] = useState<number | "">("");
  const [addingModule, setAddingModule] = useState(false);
  const [requirePrevious, setRequirePrevious] = useState(false);
  const [availableAt, setAvailableAt] = useState("");
  const [draggedModId, setDraggedModId] = useState<string | null>(null);

  // Participant Enrollment State
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollSearchQuery, setEnrollSearchQuery] = useState("");
  const [enrollSearchResults, setEnrollSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [enrollingParticipant, setEnrollingParticipant] = useState(false);

  useEffect(() => {
    if (!showEnrollModal) {
      setEnrollSearchQuery("");
      setEnrollSearchResults([]);
    }
  }, [showEnrollModal]);

  useEffect(() => {
    if (enrollSearchQuery.length >= 2) {
      const delaySearch = setTimeout(() => {
        searchUsers(enrollSearchQuery);
      }, 500);
      return () => clearTimeout(delaySearch);
    } else {
      setEnrollSearchResults([]);
    }
  }, [enrollSearchQuery]);

  const searchUsers = async (q: string) => {
    setIsSearchingUsers(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok && data.users) {
        setEnrollSearchResults(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleEnrollParticipant = async (nip: string) => {
    if (!nip) return;
    setEnrollingParticipant(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nip })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Peserta berhasil di-enrol!");
        setShowEnrollModal(false);
        fetchCourseDetails(); // Refresh stats
      } else {
        toast.error(data.error || "Gagal enrol peserta");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan.");
    } finally {
      setEnrollingParticipant(false);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => { if (data.categories) setAllCategories(data.categories); })
      .catch(console.error);
    fetch("/api/certificates/templates")
      .then((res) => res.json())
      .then((data) => { if (data.templates) setCertTemplates(data.templates); })
      .catch(console.error);
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      const data = await res.json();
      if (data.course) {
        setCourse(data.course);
        if (data.stats) setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch course:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingModule(true);
    try {
      let contentPath = editingModule?.contentPath || "";

      // Handle file upload first if a file is selected
      if (uploadFile) {
        const formData = new FormData();
        formData.append("file", uploadFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          contentPath = uploadData.fileUrl;
        } else {
          showAlert("Gagal", "Gagal mengunggah file");
          setAddingModule(false);
          return;
        }
      }

      let finalContentPath = contentPath;
      let existingObj: any = {};
      
      if (editingModule?.contentPath && editingModule.contentPath.startsWith('{')) {
        try { existingObj = JSON.parse(editingModule.contentPath); } catch (e) {}
      } else if (editingModule?.contentPath) {
        existingObj.url = editingModule.contentPath; // Legacy support
      }
      
      if (newModuleType !== 'QUIZ') {
        if (newModuleType === 'LINK') {
          existingObj.url = linkUrl;
        } else if (newModuleType === 'ASSIGNMENT') {
          existingObj.description = taskDescription;
          if (uploadFile && contentPath) {
             existingObj.url = contentPath; // Optional attachment for assignment
          }
        } else if (contentPath) {
          existingObj.url = contentPath;
        }
      }
      
      existingObj.requirePrevious = requirePrevious;
      if (availableAt) {
        existingObj.availableAt = availableAt;
      } else {
        delete existingObj.availableAt;
      }
      
      const finalType = newModuleType;

      if (editingModule) {
        // UPDATE existing module
        const res = await fetch(`/api/modules/${editingModule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newModuleTitle,
            type: finalType,
            contentPath: finalContentPath,
            minPassingScore: minPassingScore === "" ? null : Number(minPassingScore),
          }),
        });
        if (res.ok) {
          closeModuleForm();
          fetchCourseDetails();
        }
      } else {
        // CREATE new module
        const res = await fetch("/api/modules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            title: newModuleTitle,
            type: finalType,
            contentPath: finalContentPath,
            order: course?.modules.length || 0,
            minPassingScore: minPassingScore === "" ? null : Number(minPassingScore),
          }),
        });

        if (res.ok) {
          closeModuleForm();
          fetchCourseDetails(); // Refresh list
        } else {
          const errData = await res.json().catch(() => null);
          showAlert("Gagal", "Gagal menyimpan materi: " + (errData?.error || "Error tidak diketahui"));
        }
      }
    } catch (error: any) {
      console.error(error);
      showAlert("Kesalahan Sistem", "Terjadi kesalahan: " + error.message);
    } finally {
      setAddingModule(false);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCourse(true);
    try {
      let thumbnail = course?.thumbnail;
      if (editCourseBanner) {
        const formData = new FormData();
        formData.append("file", editCourseBanner);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          thumbnail = uploadData.fileUrl;
        } else {
          const errData = await uploadRes.json().catch(() => ({}));
          showAlert("Gagal", errData.error || "Gagal mengunggah banner");
          setSavingCourse(false);
          return;
        }
      }

      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: editCourseTitle, 
          description: editCourseDesc, 
          thumbnail, 
          categoryId: editCategoryId || null, 
          hasCertificate: editHasCertificate, 
          certificateTemplateId: editHasCertificate ? editCertTemplateId || null : null
        }),
      });
      if (res.ok) {
        setShowEditCourse(false);
        fetchCourseDetails();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingCourse(false);
    }
  };

  const executeDeleteModule = async (moduleIdToDel?: string) => {
    const id = moduleIdToDel || editingModule?.id;
    if (!id) return;
    try {
      const res = await fetch(`/api/modules/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (!moduleIdToDel) closeModuleForm(); // only close if it was from the form
        fetchCourseDetails();
      } else {
        showAlert("Gagal", "Gagal menghapus modul");
      }
    } catch (e) {
      console.error(e);
      showAlert("Kesalahan", "Terjadi kesalahan saat menghapus");
    }
  };

  const handleDeleteModule = (explicitMod?: any) => {
    // Ignore if explicitMod is an Event object
    const isValidMod = explicitMod && typeof explicitMod === 'object' && 'id' in explicitMod;
    const mod = isValidMod ? explicitMod : editingModule;
    if (!mod) return;
    
    const isCategory = mod.type === 'CATEGORY';
    showConfirm(
      isCategory ? "Hapus Kategori" : "Hapus Modul",
      isCategory 
        ? "Apakah Anda yakin ingin menghapus kategori ini? SEMUA materi di dalam kategori ini juga akan ikut terhapus secara permanen!" 
        : "Apakah Anda yakin ingin menghapus modul ini? Semua nilai kuis yang terkait juga akan terhapus.",
      () => {
        setDialogConfig(prev => ({ ...prev, isOpen: false }));
        executeDeleteModule(mod.id);
      }
    );
  };

  const [duplicating, setDuplicating] = useState<string | null>(null);

  const executeDuplicateModule = async (moduleId: string) => {
    setDuplicating(moduleId);
    try {
      const res = await fetch(`/api/modules/${moduleId}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        fetchCourseDetails();
      } else {
        showAlert("Gagal", "Gagal menduplikasi materi");
      }
    } catch (e) {
      console.error(e);
      showAlert("Kesalahan", "Terjadi kesalahan sistem.");
    } finally {
      setDuplicating(null);
    }
  };

  const handleDuplicateModule = (moduleId: string, isCategory: boolean) => {
    showConfirm(
      "Duplikasi Materi",
      isCategory 
        ? "Apakah Anda yakin ingin menduplikasi kategori ini beserta seluruh isinya?"
        : "Apakah Anda yakin ingin menduplikasi materi ini?",
      () => {
        setDialogConfig(prev => ({ ...prev, isOpen: false }));
        executeDuplicateModule(moduleId);
      }
    );
  };

  const closeModuleForm = () => {
    setNewModuleTitle("");
    setNewModuleType("VIDEO");
    setGameSubType("GAME_FLASHCARD");
    setUploadFile(null);
    setLinkUrl("");
    setTaskDescription("");
    setMinPassingScore("");
    setShowAddModule(false);
    setEditingModule(null);
    setRequirePrevious(false);
    setAvailableAt("");
  };

  const openEditModule = (mod: any) => {
    setEditingModule(mod);
    setNewModuleTitle(mod.title);
    setNewModuleType(mod.type);
    
    setUploadFile(null);
    setLinkUrl("");
    
    setRequirePrevious(false);
    setAvailableAt("");
    setMinPassingScore(mod.minPassingScore ?? "");
    
    if (mod.contentPath && mod.contentPath.startsWith('{')) {
      try {
        const config = JSON.parse(mod.contentPath);
        if (config.requirePrevious) setRequirePrevious(true);
        if (config.availableAt) setAvailableAt(config.availableAt);
        if (mod.type === 'LINK' && config.url) setLinkUrl(config.url);
        if (mod.type === 'ASSIGNMENT' && config.description) setTaskDescription(config.description);
      } catch (e) {}
    } else if (mod.type === 'LINK') {
      setLinkUrl(mod.contentPath || "");
    }
    
    setShowAddModule(true);
  };

  const getModuleIcon = (type: string) => {
    switch(type) {
      case 'VIDEO': return <FileVideo className="w-5 h-5 opacity-80" strokeWidth={1.5} />;
      case 'DOCUMENT': return <FileText className="w-5 h-5 opacity-80" strokeWidth={1.5} />;
      case 'H5P': return <LayoutTemplate className="w-5 h-5 opacity-80" strokeWidth={1.5} />;
      case 'QUIZ': return <HelpCircle className="w-5 h-5 opacity-80" strokeWidth={1.5} />;
      case 'LINK': return <MapPin className="w-5 h-5 opacity-80" strokeWidth={1.5} />;
      case 'ASSIGNMENT': return <FileText className="w-5 h-5 opacity-80" strokeWidth={1.5} />;
      case 'GAMIFICATION': return <Gamepad2 className="w-5 h-5 opacity-80" strokeWidth={1.5} />;
      case 'ARTICLE': return <FileText className="w-5 h-5 opacity-80" strokeWidth={1.5} />;
      default: return <FileText className="w-5 h-5 opacity-80" strokeWidth={1.5} />;
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedModId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedModId || draggedModId === targetId || !course) {
      setDraggedModId(null);
      return;
    }

    const newModules = [...course.modules];
    const draggedIdx = newModules.findIndex(m => m.id === draggedModId);
    const targetIdx = newModules.findIndex(m => m.id === targetId);

    const [draggedItem] = newModules.splice(draggedIdx, 1);
    newModules.splice(targetIdx, 0, draggedItem);
    
    // Update local state immediately
    setCourse({ ...course, modules: newModules });
    setDraggedModId(null);

    // Persist reorder to backend (we will create this endpoint)
    try {
      await fetch(`/api/courses/${courseId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleIds: newModules.map(m => m.id)
        })
      });
    } catch (e) {
      console.error("Failed to save order", e);
    }
  };

  if (loading) return <div className="p-8">Memuat detail kursus...</div>;
  if (!course) return <div className="p-8">Kursus tidak ditemukan.</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/courses" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{course.title}</h1>
            <button 
              onClick={() => {
                setEditCourseTitle(course.title);
                setEditCourseDesc(course.description || "");
                setEditCourseBanner(null);
                setEditCategoryId(course.categoryId || "");
                setEditHasCertificate(course.hasCertificate);
                setEditCertTemplateId(course.certificateTemplateId || "");
                setShowEditCourse(true);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Info
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {course.category && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: course.category.color || "#6366f1" }}
              >
                {course.category.icon} {course.category.name}
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-1 max-w-2xl">{course.description || "Tidak ada deskripsi"}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          course.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        }`}>
          {course.published ? "Published" : "Draft"}
        </span>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Peserta Terdaftar</p>
            <h4 className="text-2xl font-bold text-slate-900">{stats?.enrolled || 0}</h4>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Lulus & Tersertifikasi</p>
            <h4 className="text-2xl font-bold text-slate-900">{stats?.completed || 0}</h4>
          </div>
        </div>
      </div>

      {/* Participant Management Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Manajemen Peserta</h3>
              <p className="text-sm text-slate-500">Kelola dan tambahkan peserta ke kursus ini.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowEnrollModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Peserta (Enrol)
          </button>
        </div>
      </div>

      {/* Edit Course Modal */}
      <AnimatePresence>
        {showEditCourse && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 sticky top-0 bg-white z-20">
                <h3 className="font-bold text-lg text-slate-900">Edit Info Kursus</h3>
                <button onClick={() => setShowEditCourse(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <form id="editCourseForm" onSubmit={handleUpdateCourse} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Judul Kursus</label>
              <input type="text" required value={editCourseTitle} onChange={(e) => setEditCourseTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
              <textarea rows={3} value={editCourseDesc} onChange={(e) => setEditCourseDesc(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 bg-white"
              >
                <option value="">— Pilih Kategori —</option>
                {allCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ubah Banner (16:9)</label>
              {course.thumbnail && !editCourseBanner && (
                 <div className="mb-2">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={course.thumbnail} alt="Banner" className="h-20 rounded-lg border border-slate-200" />
                 </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => setEditCourseBanner(e.target.files ? e.target.files[0] : null)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            
            <div className="pt-4 border-t border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <div className="relative">
                  <input type="checkbox" checked={editHasCertificate} onChange={(e) => setEditHasCertificate(e.target.checked)} className="sr-only" />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${editHasCertificate ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${editHasCertificate ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
                <div className="text-sm font-medium text-slate-700">Aktifkan Sertifikat Kelulusan</div>
              </label>

              {editHasCertificate && (
                <div className="ml-0 md:ml-13 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Template Sertifikat</label>
                  <p className="text-xs text-slate-500 mb-3">Sertifikat akan diberikan secara otomatis ketika peserta menyelesaikan semua materi kursus ini.</p>
                  
                  {certTemplates.length === 0 ? (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex flex-col gap-2">
                      <p className="text-sm text-amber-800">Belum ada template sertifikat. Silakan buat template terlebih dahulu di menu Template Sertifikat.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <select
                        value={editCertTemplateId}
                        onChange={(e) => setEditCertTemplateId(e.target.value)}
                        required={editHasCertificate}
                        className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="">— Pilih Template —</option>
                        {certTemplates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      
                      {editCertTemplateId && certTemplates.find(t => t.id === editCertTemplateId)?.backgroundImage && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Pratinjau Background:</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={certTemplates.find(t => t.id === editCertTemplateId)?.backgroundImage} 
                            alt="Preview" 
                            className="w-full max-w-sm rounded-lg border border-slate-200 object-contain bg-slate-100" 
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
                </form>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowEditCourse(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  form="editCourseForm"
                  disabled={savingCourse}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {savingCourse ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900">Daftar Modul / Materi</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (showAddModule) {
                closeModuleForm();
              } else {
                setEditingModule(null);
                setNewModuleTitle("");
                setNewModuleType("CATEGORY");
                setShowAddModule(true);
              }
            }}
            className="flex items-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg transition-colors font-medium shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori
          </button>
          <button 
            onClick={() => {
              if (showAddModule) {
                closeModuleForm();
              } else {
                setEditingModule(null);
                setNewModuleTitle("");
                setNewModuleType("VIDEO");
                setShowAddModule(true);
              }
            }}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            {showAddModule ? "Batal" : "Tambah Modul"}
          </button>
        </div>
      </div>

      <AnimatePresence>
      {showAddModule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
          >
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 p-6 z-10 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                {editingModule ? <Edit2 className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-indigo-500" />}
                {editingModule 
                  ? (newModuleType === 'CATEGORY' ? "Edit Kategori" : "Edit Modul") 
                  : (newModuleType === 'CATEGORY' ? "Tambah Kategori Baru" : "Tambah Modul Baru")}
              </h3>
              <button onClick={closeModuleForm} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddModule} className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {newModuleType === 'CATEGORY' ? 'Nama Kategori / Bab' : 'Judul Modul'}
                  </label>
                  <input 
                    type="text" 
                    required
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder={newModuleType === 'CATEGORY' ? "Contoh: Minggu 1, Bagian 2..." : "Contoh: Pengenalan H5P"}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                {newModuleType !== 'CATEGORY' && (
                  <div className="w-full sm:w-56">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipe Materi</label>
                    <select 
                      value={newModuleType} 
                      onChange={(e) => setNewModuleType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    >
                      <option value="VIDEO">Video (.mp4)</option>
                      <option value="DOCUMENT">Dokumen (.pdf)</option>
                      <option value="ARTICLE">Artikel / Teks</option>
                      <option value="GAMIFICATION">Gamifikasi Interaktif</option>
                      <option value="QUIZ">Kuis / Ujian</option>
                      <option value="LINK">Tautan (Zoom/Meet)</option>
                      <option value="ASSIGNMENT">Tugas Terstruktur</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">Pengaturan Akses Modul</h4>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={requirePrevious}
                    onChange={(e) => setRequirePrevious(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span className="text-sm font-medium text-slate-700">Wajib menyelesaikan modul sebelumnya</span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tersedia Mulai Waktu (Opsional)</label>
                  <p className="text-xs text-slate-500 mb-2">Modul akan terkunci sebelum waktu ini tiba.</p>
                  <input 
                    type="datetime-local" 
                    value={availableAt}
                    onChange={(e) => setAvailableAt(e.target.value)}
                    className="w-full max-w-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {newModuleType === 'LINK' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tautan URL</label>
                    <input 
                      type="url" 
                      required
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                ) : newModuleType === 'ASSIGNMENT' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Deskripsi Tugas</label>
                      <textarea 
                        required
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        rows={4}
                        placeholder="Jelaskan apa yang harus dikerjakan oleh peserta..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Lampiran Soal (Opsional)</label>
                      <input 
                        type="file" 
                        onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white text-sm"
                      />
                    </div>
                  </div>
                ) : newModuleType === 'CATEGORY' ? (
                  <p className="text-sm text-slate-500 italic bg-blue-50 p-4 rounded-xl">Kategori hanya berfungsi sebagai judul bab pembatas.</p>
                ) : newModuleType === 'QUIZ' ? (
                  <p className="text-sm text-slate-500 italic bg-blue-50 p-4 rounded-xl">Konfigurasi batas skor, pengulangan, dan batas waktu kuis diatur setelah modul disimpan.</p>
                ) : newModuleType === 'ARTICLE' ? (
                  <p className="text-sm text-slate-500 italic bg-blue-50 p-4 rounded-xl">Konten artikel dapat ditulis dengan Rich Text Editor setelah modul disimpan.</p>
                ) : newModuleType === 'GAMIFICATION' ? (
                  <div className="space-y-4">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                      <p className="text-sm text-indigo-900 font-medium mb-3">⚙️ Pengaturan Gamifikasi</p>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Batas Minimum Skor Kelulusan (0-100)
                        </label>
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          step="0.01"
                          value={minPassingScore}
                          onChange={(e) => setMinPassingScore(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="Contoh: 70"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <p className="text-xs text-slate-500 mt-1.5">
                          Peserta harus mencapai skor minimal ini untuk dianggap lulus. Kosongkan jika tidak ada batas minimum.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (newModuleType !== 'GAMIFICATION') ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Unggah Berkas Aset (.mp4, .pdf)</label>
                    <input 
                      type="file" 
                      onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white text-sm"
                    />
                    {editingModule && <p className="text-xs text-indigo-500 mt-1">Biarkan kosong jika tidak ingin mengubah berkas lama.</p>}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                {editingModule && (
                  <button 
                    type="button"
                    onClick={() => handleDeleteModule()}
                    className="mr-auto text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus
                  </button>
                )}
                <button 
                  type="button"
                  onClick={closeModuleForm}
                  className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={addingModule}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl transition-colors font-medium flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> {addingModule ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      <div className="space-y-4">
        {course.modules.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center">
            <p className="text-slate-500">Belum ada modul di kursus ini. Silakan tambahkan materi baru.</p>
          </div>
        ) : (
          <AnimatePresence>
            {course.modules.map((mod, index) => {
              const isCategory = mod.type === 'CATEGORY';
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  key={mod.id} 
                  draggable
                  onDragStart={(e: any) => handleDragStart(e, mod.id)}
                  onDragOver={(e: any) => handleDragOver(e)}
                  onDrop={(e: any) => handleDrop(e, mod.id)}
                  className={`flex items-center gap-4 transition-all duration-200 cursor-grab active:cursor-grabbing ${
                    isCategory 
                      ? "bg-slate-100/50 border-2 border-indigo-100 rounded-xl p-5 mb-4 shadow-sm" 
                      : "bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md mb-2 ml-8"
                  } ${draggedModId === mod.id ? 'opacity-50 scale-95' : ''}`}
                >
                {!isCategory && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 font-medium text-xs shrink-0">
                    {index + 1}
                  </div>
                )}
                <div className={`flex items-center justify-center shrink-0 ${isCategory ? 'text-indigo-600' : 'text-slate-600'}`}>
                  {getModuleIcon(mod.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold truncate ${isCategory ? 'text-lg text-indigo-900' : 'text-slate-900'}`}>{mod.title}</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{mod.type}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {mod.type === 'QUIZ' && (
                    <Link 
                      href={`/admin/modules/${mod.id}/quiz`}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-md hover:bg-emerald-50 transition-colors"
                    >
                      Kelola Soal
                    </Link>
                  )}
                  {mod.type === 'GAMIFICATION' && (
                    <Link 
                      href={`/admin/modules/${mod.id}/game`}
                      className="text-sm font-medium text-orange-600 hover:text-orange-700 px-3 py-1.5 rounded-md hover:bg-orange-50 transition-colors"
                    >
                      Kelola Konten
                    </Link>
                  )}
                  {mod.type === 'ASSIGNMENT' && (
                    <Link 
                      href={`/admin/modules/${mod.id}/submissions`}
                      className="text-sm font-medium text-fuchsia-600 hover:text-fuchsia-700 px-3 py-1.5 rounded-md hover:bg-fuchsia-50 transition-colors"
                    >
                      Pengumpulan
                    </Link>
                  )}
                  {mod.type === 'ARTICLE' && (
                    <Link 
                      href={`/admin/modules/${mod.id}/article`}
                      className="text-sm font-medium text-sky-600 hover:text-sky-700 px-3 py-1.5 rounded-md hover:bg-sky-50 transition-colors"
                    >
                      Tulis Artikel
                    </Link>
                  )}
                  <button 
                    onClick={() => handleDuplicateModule(mod.id, isCategory)}
                    disabled={duplicating === mod.id}
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {duplicating === mod.id ? "Menyalin..." : "Salin"}
                  </button>
                  <button 
                    onClick={() => openEditModule(mod)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteModule(mod)}
                    className="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        )}
      </div>

      {/* Modal Dialog */}
      {dialogConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{dialogConfig.title}</h3>
              <p className="text-slate-600 leading-relaxed">{dialogConfig.message}</p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              {dialogConfig.type === 'confirm' && (
                <button 
                  onClick={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
                  className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Batal
                </button>
              )}
              <button 
                onClick={() => {
                  if (dialogConfig.type === 'confirm' && dialogConfig.onConfirm) {
                    dialogConfig.onConfirm();
                  } else {
                    setDialogConfig(prev => ({ ...prev, isOpen: false }));
                  }
                }}
                className={`px-5 py-2.5 font-medium rounded-xl transition-colors ${
                  dialogConfig.type === 'confirm' && dialogConfig.title.toLowerCase().includes('hapus')
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                }`}
              >
                {dialogConfig.type === 'confirm' ? (dialogConfig.title.toLowerCase().includes('hapus') ? 'Ya, Hapus' : 'Ya, Lanjutkan') : 'Mengerti'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Enroll Modal */}
      <AnimatePresence>
        {showEnrollModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-lg text-slate-900">Tambah Peserta ke Kursus</h3>
                <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan Nama atau NIP..."
                    value={enrollSearchQuery}
                    onChange={(e) => setEnrollSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>

                <div className="space-y-3">
                  {isSearchingUsers ? (
                    <div className="text-center py-8 text-slate-500">Mencari...</div>
                  ) : enrollSearchResults.length > 0 ? (
                    enrollSearchResults.map((user) => (
                      <div key={user.nip} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors">
                        <div>
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.nip} • {user.email}</p>
                        </div>
                        <button
                          onClick={() => handleEnrollParticipant(user.nip)}
                          disabled={enrollingParticipant}
                          className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
                        >
                          Enrol
                        </button>
                      </div>
                    ))
                  ) : enrollSearchQuery.length >= 2 ? (
                    <div className="text-center py-8 text-slate-500">Tidak ada peserta ditemukan.</div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      Ketikkan setidaknya 2 karakter untuk mulai mencari.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
