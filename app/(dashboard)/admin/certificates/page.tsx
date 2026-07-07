"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, AlignLeft, AlignCenter, AlignRight, Save, X, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

type CertificateTemplate = {
  id: string;
  name: string;
  backgroundImage: string;
  config: string;
};

export default function CertificateTemplatesPage() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  
  const [config, setConfig] = useState<{name: {x:number, y:number, align?: string}, course: {x:number, y:number, align?: string}, qrCode?: {x:number, y:number, align?: string}}>({
    name: {x: 50, y: 50, align: 'center'}, course: {x: 50, y: 65, align: 'center'}, qrCode: {x: 10, y: 90, align: 'left'}
  });

  const [saving, setSaving] = useState(false);

  // Editor state
  const certRef = useRef<HTMLDivElement>(null);
  const [draggingEl, setDraggingEl] = useState<'name' | 'course' | 'qrCode' | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/certificates/templates");
      const data = await res.json();
      if (data.templates) setTemplates(data.templates);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat template");
    } finally {
      setLoading(false);
    }
  };

  const handleCertMouseMove = (e: React.MouseEvent) => {
    if (!draggingEl || !certRef.current) return;
    const rect = certRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setConfig(prev => ({
      ...prev,
      [draggingEl]: { 
        ...prev[draggingEl],
        x: Math.max(0, Math.min(100, x)), 
        y: Math.max(0, Math.min(100, y)) 
      }
    }));
  };

  const handleCertMouseUp = () => setDraggingEl(null);

  const handleEdit = (t: CertificateTemplate) => {
    setEditingId(t.id);
    setName(t.name);
    setBgPreview(t.backgroundImage);
    setBgFile(null);
    try {
      setConfig(JSON.parse(t.config));
    } catch (e) {
      setConfig({name: {x: 50, y: 50, align: 'center'}, course: {x: 50, y: 65, align: 'center'}, qrCode: {x: 10, y: 90, align: 'left'}});
    }
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus template ini?")) return;
    try {
      const res = await fetch(`/api/certificates/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Template dihapus");
        fetchTemplates();
      } else {
        toast.error("Gagal menghapus");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let finalBg = bgPreview;
      if (bgFile) {
        const formData = new FormData();
        formData.append("file", bgFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalBg = uploadData.fileUrl;
        } else {
          toast.error("Gagal mengunggah background");
          setSaving(false);
          return;
        }
      }

      if (!finalBg) {
        toast.error("Background wajib diisi");
        setSaving(false);
        return;
      }

      const payload = {
        name,
        backgroundImage: finalBg,
        config: JSON.stringify(config)
      };

      const url = editingId ? `/api/certificates/templates/${editingId}` : "/api/certificates/templates";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingId ? "Template diperbarui" : "Template ditambahkan");
        setShowForm(false);
        fetchTemplates();
      } else {
        toast.error("Gagal menyimpan template");
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Template Sertifikat</h1>
          <p className="text-sm text-slate-500">Kelola desain sertifikat yang dapat digunakan pada kursus.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => {
              setEditingId(null);
              setName("");
              setBgFile(null);
              setBgPreview(null);
              setConfig({name: {x: 50, y: 50, align: 'center'}, course: {x: 50, y: 65, align: 'center'}, qrCode: {x: 10, y: 90, align: 'left'}});
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Tambah Template
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">{editingId ? "Edit Template" : "Buat Template Baru"}</h2>
            <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Template</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Misal: Sertifikat Kelulusan Standar"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gambar Latar Belakang (A4 Landscape)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setBgFile(e.target.files[0]);
                    setBgPreview(URL.createObjectURL(e.target.files[0]));
                  }
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm mb-2"
              />
            </div>

            {bgPreview && (
              <div className="border border-indigo-200 rounded-xl p-4 bg-slate-50">
                <p className="text-sm font-medium text-slate-700 mb-3">Atur Posisi Teks (Drag & Drop)</p>
                <div className="flex flex-wrap gap-4 mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Teks Aktif:</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setDraggingEl('name')} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${draggingEl === 'name' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Nama Peserta</button>
                      <button type="button" onClick={() => setDraggingEl('course')} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${draggingEl === 'course' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Judul Kursus</button>
                      <button type="button" onClick={() => setDraggingEl('qrCode')} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${draggingEl === 'qrCode' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>QR Code</button>
                    </div>
                  </div>
                  
                  <div className="w-px bg-slate-200 mx-1"></div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Perataan Teks (Align):</span>
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded-md">
                      <button 
                        type="button" 
                        disabled={!draggingEl}
                        onClick={() => draggingEl && setConfig(p => ({...p, [draggingEl]: {...p[draggingEl], align: 'left'}}))}
                        className={`p-1.5 rounded flex items-center justify-center transition-colors disabled:opacity-30 ${draggingEl && config[draggingEl]?.align === 'left' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        <AlignLeft className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        disabled={!draggingEl}
                        onClick={() => draggingEl && setConfig(p => ({...p, [draggingEl]: {...p[draggingEl], align: 'center'}}))}
                        className={`p-1.5 rounded flex items-center justify-center transition-colors disabled:opacity-30 ${draggingEl && (config[draggingEl]?.align === 'center' || !config[draggingEl]?.align) ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        <AlignCenter className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        disabled={!draggingEl}
                        onClick={() => draggingEl && setConfig(p => ({...p, [draggingEl]: {...p[draggingEl], align: 'right'}}))}
                        className={`p-1.5 rounded flex items-center justify-center transition-colors disabled:opacity-30 ${draggingEl && config[draggingEl]?.align === 'right' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        <AlignRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div 
                  ref={certRef}
                  className="relative w-full aspect-[1.414] bg-white bg-cover bg-center shadow-inner cursor-crosshair border border-slate-300 mx-auto max-w-4xl"
                  style={{ backgroundImage: `url(${bgPreview})` }}
                  onMouseMove={handleCertMouseMove}
                  onMouseUp={handleCertMouseUp}
                  onMouseLeave={handleCertMouseUp}
                >
                  <div 
                    className={`absolute px-2 py-1 bg-white/80 border-2 ${draggingEl === 'name' ? 'border-indigo-600 shadow-lg' : 'border-indigo-300'} text-indigo-900 font-bold text-xs whitespace-nowrap rounded cursor-move`}
                    style={{ 
                      left: `${config.name.x}%`, 
                      top: `${config.name.y}%`,
                      transform: config.name.align === 'left' ? 'translateY(-50%)' : config.name.align === 'right' ? 'translate(-100%, -50%)' : 'translate(-50%, -50%)',
                      zIndex: draggingEl === 'name' ? 10 : 1
                    }}
                    onMouseDown={() => setDraggingEl('name')}
                  >
                    [NAMA PESERTA]
                  </div>
                  <div 
                    className={`absolute px-2 py-1 bg-white/80 border-2 ${draggingEl === 'course' ? 'border-amber-600 shadow-lg' : 'border-amber-300'} text-amber-900 font-bold text-xs whitespace-nowrap rounded cursor-move`}
                    style={{ 
                      left: `${config.course.x}%`, 
                      top: `${config.course.y}%`,
                      transform: config.course.align === 'left' ? 'translateY(-50%)' : config.course.align === 'right' ? 'translate(-100%, -50%)' : 'translate(-50%, -50%)',
                      zIndex: draggingEl === 'course' ? 10 : 1
                    }}
                    onMouseDown={() => setDraggingEl('course')}
                  >
                    [JUDUL KURSUS]
                  </div>
                  {config.qrCode && (
                    <div 
                      className={`absolute px-2 py-1 bg-white/80 border-2 ${draggingEl === 'qrCode' ? 'border-emerald-600 shadow-lg' : 'border-emerald-300'} text-emerald-900 font-bold text-xs whitespace-nowrap rounded cursor-move`}
                      style={{ 
                        left: `${config.qrCode.x}%`, 
                        top: `${config.qrCode.y}%`,
                        transform: config.qrCode.align === 'left' ? 'translateY(-50%)' : config.qrCode.align === 'right' ? 'translate(-100%, -50%)' : 'translate(-50%, -50%)',
                        zIndex: draggingEl === 'qrCode' ? 10 : 1
                      }}
                      onMouseDown={() => setDraggingEl('qrCode')}
                    >
                      [QR CODE VALIDASI]
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> {saving ? "Menyimpan..." : "Simpan Template"}
              </button>
            </div>
          </form>
        </div>
      ) : loading ? (
        <div className="p-8 text-center text-slate-500">Memuat template...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Belum Ada Template</h3>
          <p className="text-sm text-slate-500 mb-6">Buat template sertifikat pertama Anda untuk digunakan pada kursus.</p>
          <button 
            onClick={() => {
              setEditingId(null);
              setName("");
              setBgFile(null);
              setBgPreview(null);
              setConfig({name: {x: 50, y: 50, align: 'center'}, course: {x: 50, y: 65, align: 'center'}, qrCode: {x: 10, y: 90, align: 'left'}});
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" /> Buat Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div 
                className="w-full aspect-[1.414] bg-slate-100 bg-cover bg-center border-b border-slate-200"
                style={{ backgroundImage: `url(${t.backgroundImage})` }}
              ></div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-slate-900 mb-1">{t.name}</h3>
                <div className="mt-auto pt-4 flex items-center justify-end gap-2">
                  <button 
                    onClick={() => handleEdit(t)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(t.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
