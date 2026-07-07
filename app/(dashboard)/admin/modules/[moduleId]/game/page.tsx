"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, Layers, Gamepad2, FileText, Info, GripVertical, Grid, LayoutTemplate, PlaySquare, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

type SlideType = 'MATCHING' | 'BLANKS' | 'INFO' | 'DRAG_WORD' | 'WORD_SEARCH' | 'ANAGRAM' | 'CATEGORIZE' | 'WORD_GRID' | 'INTERACTIVE_VIDEO';

type Slide = {
  id: string;
  type: SlideType;
  title: string;
  content: any;
};

export default function AdminGameEditorPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const resolvedParams = use(params);
  const moduleId = resolvedParams.moduleId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [module, setModule] = useState<any>(null);
  
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    fetchModule();
  }, []);

  const fetchModule = async () => {
    try {
      const res = await fetch(`/api/modules/${moduleId}`);
      const data = await res.json();
      if (data.module) {
        setModule(data.module);
        
        let config: Slide[] = [];
        try {
          if (data.module.contentPath && data.module.contentPath.startsWith('[')) {
            config = JSON.parse(data.module.contentPath);
          } else if (data.module.contentPath && data.module.contentPath.startsWith('{')) {
            // Legacy conversion
            const oldConfig = JSON.parse(data.module.contentPath);
            if (data.module.type === 'GAME_FLASHCARD') {
              config = [{ id: '1', type: 'WORD_GRID', title: 'Papan Kata', content: oldConfig }];
            } else if (data.module.type === 'GAME_MATCHING') {
              config = [{ id: '1', type: 'MATCHING', title: 'Mencocokkan', content: oldConfig }];
            } else if (data.module.type === 'GAME_BLANKS') {
              config = [{ id: '1', type: 'BLANKS', title: 'Isi Rumpang', content: oldConfig.text }];
            }
          }
        } catch (e) {}

        setSlides(config);
        if (config.length > 0) setActiveSlideId(config[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/modules/${moduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentPath: JSON.stringify(slides), type: 'GAMIFICATION' }),
      });
      if (res.ok) {
        toast.success("Berhasil disimpan!");
      } else {
        toast.error("Gagal menyimpan");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  const addSlide = (type: SlideType) => {
    const newId = Date.now().toString();
    const newSlide: Slide = {
      id: newId,
      type,
      title: type === 'MATCHING' ? 'Mencocokkan Baru' : type === 'BLANKS' ? 'Isi Rumpang Baru' : type === 'DRAG_WORD' ? 'Drag The Word Baru' : type === 'WORD_SEARCH' ? 'Cari Kata Baru' : type === 'ANAGRAM' ? 'Susun Kata Baru' : type === 'CATEGORIZE' ? 'Kategorisasi Baru' : type === 'WORD_GRID' ? 'Papan Kata Baru' : type === 'INTERACTIVE_VIDEO' ? 'Video Interaktif Baru' : 'Info Baru',
      content: type === 'MATCHING' || type === 'WORD_SEARCH' || type === 'ANAGRAM' || type === 'WORD_GRID' ? [] : type === 'CATEGORIZE' ? { categories: [], items: [] } : type === 'INTERACTIVE_VIDEO' ? { videoUrl: '', checkpoints: [] } : ''
    };
    setSlides([...slides, newSlide]);
    setActiveSlideId(newId);
  };

  const removeSlide = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSlides = slides.filter(s => s.id !== id);
    setSlides(newSlides);
    if (activeSlideId === id) {
      setActiveSlideId(newSlides.length > 0 ? newSlides[0].id : null);
    }
  };

  const updateActiveSlide = (updates: Partial<Slide>) => {
    setSlides(slides.map(s => s.id === activeSlideId ? { ...s, ...updates } : s));
  };

  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        updateActiveSlide({ content: { ...activeSlide?.content, videoUrl: data.url } });
      } else {
        toast.error(data.error || 'Gagal mengunggah video');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengunggah video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const activeSlide = slides.find(s => s.id === activeSlideId);

  if (loading) return <div className="p-8">Memuat...</div>;
  if (!module) return <div className="p-8">Modul tidak ditemukan</div>;

  return (
    <div className="max-w-6xl mx-auto pb-12 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/admin/courses/${module.courseId}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Gamifikasi (H5P-like)</h1>
            <p className="text-sm text-slate-500 mt-1">{module.title}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl transition-colors font-medium shadow-md flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Menyimpan...' : 'Simpan Konten'}
        </button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Sidebar Toggle Button (when closed) */}
        {!isSidebarOpen && (
          <div className="flex flex-col shrink-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Buka Sidebar"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Sidebar */}
        {isSidebarOpen && (
          <div className="w-80 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col shadow-sm shrink-0 transition-all duration-300">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-bold text-slate-900">Daftar Slide</h3>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                title="Tutup Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {slides.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Belum ada slide.</p>
            ) : (
              slides.map((slide, idx) => (
                <div 
                  key={slide.id}
                  onClick={() => setActiveSlideId(slide.id)}
                  className={`p-3 rounded-xl cursor-pointer border flex items-center gap-3 transition-colors ${
                    activeSlideId === slide.id 
                      ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-500' 
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-slate-400 shrink-0">
                    {slide.type === 'MATCHING' && <Gamepad2 className="w-5 h-5" />}
                    {slide.type === 'BLANKS' && <FileText className="w-5 h-5" />}
                    {slide.type === 'INFO' && <Info className="w-5 h-5" />}
                    {slide.type === 'DRAG_WORD' && <GripVertical className="w-5 h-5" />}
                    {slide.type === 'WORD_SEARCH' && <Grid className="w-5 h-5" />}
                    {slide.type === 'ANAGRAM' && <LayoutTemplate className="w-5 h-5" />}
                    {slide.type === 'CATEGORIZE' && <Layers className="w-5 h-5" />}
                    {slide.type === 'WORD_GRID' && <Grid className="w-5 h-5" />}
                    {slide.type === 'INTERACTIVE_VIDEO' && <PlaySquare className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-500 mb-0.5">Slide {idx + 1}</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{slide.title}</p>
                  </div>
                  <button onClick={(e) => removeSlide(slide.id, e)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 mb-2 px-2 uppercase tracking-wider flex items-center justify-between">
              Tambah Slide Baru
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
              <button onClick={() => addSlide('WORD_GRID')} className="px-2.5 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-indigo-300 flex items-center gap-2 text-xs font-medium text-slate-700 transition-colors text-left">
                <Grid className="w-4 h-4 text-indigo-500 shrink-0" /> Papan Kata
              </button>
              <button onClick={() => addSlide('ANAGRAM')} className="px-2.5 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-indigo-300 flex items-center gap-2 text-xs font-medium text-slate-700 transition-colors text-left">
                <LayoutTemplate className="w-4 h-4 text-fuchsia-500 shrink-0" /> Susun Kata
              </button>
              <button onClick={() => addSlide('CATEGORIZE')} className="px-2.5 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-indigo-300 flex items-center gap-2 text-xs font-medium text-slate-700 transition-colors text-left">
                <Layers className="w-4 h-4 text-cyan-500 shrink-0" /> Kategorisasi
              </button>
              <button onClick={() => addSlide('MATCHING')} className="px-2.5 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-indigo-300 flex items-center gap-2 text-xs font-medium text-slate-700 transition-colors text-left">
                <Gamepad2 className="w-4 h-4 text-pink-500 shrink-0" /> Mencocokkan
              </button>
              <button onClick={() => addSlide('BLANKS')} className="px-2.5 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-indigo-300 flex items-center gap-2 text-xs font-medium text-slate-700 transition-colors text-left">
                <FileText className="w-4 h-4 text-emerald-500 shrink-0" /> Isi Rumpang
              </button>
              <button onClick={() => addSlide('DRAG_WORD')} className="px-2.5 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-indigo-300 flex items-center gap-2 text-xs font-medium text-slate-700 transition-colors text-left">
                <GripVertical className="w-4 h-4 text-amber-500 shrink-0" /> Drag Word
              </button>
              <button onClick={() => addSlide('WORD_SEARCH')} className="px-2.5 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-indigo-300 flex items-center gap-2 text-xs font-medium text-slate-700 transition-colors text-left">
                <Grid className="w-4 h-4 text-rose-500 shrink-0" /> Cari Kata
              </button>
              <button onClick={() => addSlide('INFO')} className="px-2.5 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-indigo-300 flex items-center gap-2 text-xs font-medium text-slate-700 transition-colors text-left">
                <Info className="w-4 h-4 text-sky-500 shrink-0" /> Info Teks
              </button>
              <button onClick={() => addSlide('INTERACTIVE_VIDEO')} className="col-span-2 px-2.5 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-indigo-300 flex items-center justify-center gap-2 text-xs font-medium text-slate-700 transition-colors text-left">
                <PlaySquare className="w-4 h-4 text-blue-600 shrink-0" /> Video Interaktif
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-8 overflow-y-auto shadow-sm">
          {!activeSlide ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Gamepad2 className="w-16 h-16 mb-4 text-slate-200" />
              <p>Pilih atau tambah slide di sebelah kiri untuk mulai mengedit.</p>
            </div>
          ) : (
            <div className="space-y-8 max-w-2xl mx-auto">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Judul Slide</label>
                <input 
                  type="text" 
                  value={activeSlide.title}
                  onChange={(e) => updateActiveSlide({ title: e.target.value })}
                  className="w-full text-xl font-bold px-0 py-2 border-0 border-b-2 border-slate-200 focus:ring-0 focus:border-indigo-500 placeholder-slate-300 bg-transparent"
                  placeholder="Masukkan judul slide..."
                />
              </div>

              {/* EDITOR BLOCKS */}
              {activeSlide.type === 'INFO' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Konten Teks/HTML</label>
                  <textarea 
                    value={activeSlide.content || ""}
                    onChange={(e) => updateActiveSlide({ content: e.target.value })}
                    placeholder="Masukkan materi teks yang akan dibaca peserta sebelum game..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm leading-relaxed"
                    rows={12}
                  />
                </div>
              )}

              {activeSlide.type === 'WORD_GRID' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-bold text-slate-700">Papan Kata (Kartu Bolak-Balik)</label>
                    <button 
                      onClick={() => updateActiveSlide({ content: [...(activeSlide.content || []), { id: Date.now().toString(), front: '', back: '' }] })}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg"
                    >
                      + Tambah Kartu
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(activeSlide.content || []).map((card: any, idx: number) => (
                      <div key={card.id} className="flex gap-4 items-start p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="w-8 h-8 shrink-0 bg-white border border-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-500">{idx + 1}</div>
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <textarea 
                            placeholder="Teks Depan..."
                            value={card.front}
                            onChange={(e) => {
                              const newCards = [...activeSlide.content];
                              newCards[idx].front = e.target.value;
                              updateActiveSlide({ content: newCards });
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2}
                          />
                          <textarea 
                            placeholder="Teks Belakang..."
                            value={card.back}
                            onChange={(e) => {
                              const newCards = [...activeSlide.content];
                              newCards[idx].back = e.target.value;
                              updateActiveSlide({ content: newCards });
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2}
                          />
                        </div>
                        <button onClick={() => updateActiveSlide({ content: activeSlide.content.filter((_: any, i: number) => i !== idx) })} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSlide.type === 'MATCHING' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-bold text-slate-700">Pasangan Mencocokkan</label>
                    <button 
                      onClick={() => updateActiveSlide({ content: [...(activeSlide.content || []), { id: Date.now().toString(), pair1: '', pair2: '' }] })}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg"
                    >
                      + Tambah Pasangan
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(activeSlide.content || []).map((pair: any, idx: number) => (
                      <div key={pair.id} className="flex gap-4 items-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="w-8 h-8 shrink-0 bg-white border border-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-500">{idx + 1}</div>
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <input 
                            placeholder="Item A..."
                            value={pair.pair1}
                            onChange={(e) => {
                              const newPairs = [...activeSlide.content];
                              newPairs[idx].pair1 = e.target.value;
                              updateActiveSlide({ content: newPairs });
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                          <input 
                            placeholder="Item B..."
                            value={pair.pair2}
                            onChange={(e) => {
                              const newPairs = [...activeSlide.content];
                              newPairs[idx].pair2 = e.target.value;
                              updateActiveSlide({ content: newPairs });
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                        <button onClick={() => updateActiveSlide({ content: activeSlide.content.filter((_: any, i: number) => i !== idx) })} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSlide.type === 'BLANKS' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Teks dengan Kurung Siku</label>
                  <p className="text-slate-500 text-xs mb-4">Gunakan kurung siku <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">[kata jawaban]</code> pada kata yang dihilangkan.</p>
                  <textarea 
                    value={activeSlide.content || ""}
                    onChange={(e) => updateActiveSlide({ content: e.target.value })}
                    placeholder="Contoh: Indonesia merdeka pada tahun [1945]."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-mono text-sm leading-relaxed"
                    rows={8}
                  />
                </div>
              )}

              {activeSlide.type === 'DRAG_WORD' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Teks dengan Kurung Siku (Drag the Word)</label>
                  <p className="text-slate-500 text-xs mb-4">Gunakan kurung siku <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">[kata jawaban]</code> pada kata yang akan ditarik oleh peserta.</p>
                  <textarea 
                    value={activeSlide.content || ""}
                    onChange={(e) => updateActiveSlide({ content: e.target.value })}
                    placeholder="Contoh: Kemerdekaan Indonesia diproklamasikan oleh [Soekarno] pada tahun [1945]."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 font-mono text-sm leading-relaxed"
                    rows={8}
                  />
                </div>
              )}

              {activeSlide.type === 'WORD_SEARCH' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-bold text-slate-700">Daftar Kata (Word Search)</label>
                    <button 
                      onClick={() => updateActiveSlide({ content: [...(activeSlide.content || []), { id: Date.now().toString(), word: '' }] })}
                      className="text-sm font-medium text-rose-600 hover:text-rose-800 bg-rose-50 px-3 py-1.5 rounded-lg"
                    >
                      + Tambah Kata
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(activeSlide.content || []).map((item: any, idx: number) => (
                      <div key={item.id} className="flex gap-4 items-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="w-8 h-8 shrink-0 bg-white border border-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-500">{idx + 1}</div>
                        <input 
                          placeholder="Masukkan kata (tanpa spasi)..."
                          value={item.word}
                          onChange={(e) => {
                            const newWords = [...activeSlide.content];
                            newWords[idx].word = e.target.value.toUpperCase().replace(/\s/g, '');
                            updateActiveSlide({ content: newWords });
                          }}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase"
                        />
                        <button onClick={() => updateActiveSlide({ content: activeSlide.content.filter((_: any, i: number) => i !== idx) })} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSlide.type === 'ANAGRAM' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-bold text-slate-700">Daftar Susun Kata</label>
                    <button 
                      onClick={() => updateActiveSlide({ content: [...(activeSlide.content || []), { id: Date.now().toString(), word: '', hint: '' }] })}
                      className="text-sm font-medium text-fuchsia-600 hover:text-fuchsia-800 bg-fuchsia-50 px-3 py-1.5 rounded-lg"
                    >
                      + Tambah Kata
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(activeSlide.content || []).map((item: any, idx: number) => (
                      <div key={item.id} className="flex gap-4 items-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="w-8 h-8 shrink-0 bg-white border border-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-500">{idx + 1}</div>
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <input 
                            placeholder="Kata Jawaban (Tanpa Spasi)..."
                            value={item.word}
                            onChange={(e) => {
                              const newWords = [...activeSlide.content];
                              newWords[idx].word = e.target.value.toUpperCase().replace(/\s/g, '');
                              updateActiveSlide({ content: newWords });
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase"
                          />
                          <input 
                            placeholder="Petunjuk (Opsional)..."
                            value={item.hint}
                            onChange={(e) => {
                              const newWords = [...activeSlide.content];
                              newWords[idx].hint = e.target.value;
                              updateActiveSlide({ content: newWords });
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                        <button onClick={() => updateActiveSlide({ content: activeSlide.content.filter((_: any, i: number) => i !== idx) })} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSlide.type === 'CATEGORIZE' && (
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-bold text-slate-700">Daftar Kategori</label>
                      <button 
                        onClick={() => {
                          const content = activeSlide.content || { categories: [], items: [] };
                          updateActiveSlide({ content: { ...content, categories: [...content.categories, `Kategori ${content.categories.length + 1}`] } });
                        }}
                        className="text-sm font-medium text-cyan-600 hover:text-cyan-800 bg-cyan-50 px-3 py-1.5 rounded-lg"
                      >
                        + Tambah Kategori
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {((activeSlide.content?.categories as string[]) || []).map((cat: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input 
                            value={cat}
                            onChange={(e) => {
                              const content = { ...activeSlide.content };
                              content.categories[idx] = e.target.value;
                              // Also update any items that used the old category
                              content.items = content.items.map((it: any) => it.category === cat ? { ...it, category: e.target.value } : it);
                              updateActiveSlide({ content });
                            }}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold bg-slate-50"
                          />
                          <button 
                            onClick={() => {
                              const content = { ...activeSlide.content };
                              content.categories = content.categories.filter((_: any, i: number) => i !== idx);
                              // Remove items in this category
                              content.items = content.items.filter((it: any) => it.category !== cat);
                              updateActiveSlide({ content });
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-bold text-slate-700">Item untuk Disortir</label>
                      <button 
                        onClick={() => {
                          const content = activeSlide.content || { categories: [], items: [] };
                          if (content.categories.length === 0) return toast.error('Buat kategori terlebih dahulu!');
                          updateActiveSlide({ 
                            content: { 
                              ...content, 
                              items: [...content.items, { id: Date.now().toString(), text: '', category: content.categories[0] }] 
                            } 
                          });
                        }}
                        className="text-sm font-medium text-cyan-600 hover:text-cyan-800 bg-cyan-50 px-3 py-1.5 rounded-lg"
                      >
                        + Tambah Item
                      </button>
                    </div>
                    <div className="space-y-2">
                      {((activeSlide.content?.items as any[]) || []).map((item: any, idx: number) => (
                        <div key={item.id} className="flex gap-2 items-center bg-white border border-slate-200 p-2 rounded-lg">
                          <input 
                            placeholder="Nama Item..."
                            value={item.text}
                            onChange={(e) => {
                              const content = { ...activeSlide.content };
                              content.items[idx].text = e.target.value;
                              updateActiveSlide({ content });
                            }}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                          <select
                            value={item.category}
                            onChange={(e) => {
                              const content = { ...activeSlide.content };
                              content.items[idx].category = e.target.value;
                              updateActiveSlide({ content });
                            }}
                            className="w-1/3 px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold bg-slate-50"
                          >
                            {activeSlide.content.categories.map((cat: string, cIdx: number) => (
                              <option key={cIdx} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => {
                              const content = { ...activeSlide.content };
                              content.items = content.items.filter((_: any, i: number) => i !== idx);
                              updateActiveSlide({ content });
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(!activeSlide.content?.items || activeSlide.content.items.length === 0) && (
                        <p className="text-sm text-slate-500 italic">Belum ada item.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSlide.type === 'INTERACTIVE_VIDEO' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tautan Video (URL MP4 atau YouTube)</label>
                    <div className="flex gap-2">
                      <input 
                        type="url"
                        value={activeSlide.content?.videoUrl || ""}
                        onChange={(e) => updateActiveSlide({ content: { ...activeSlide.content, videoUrl: e.target.value } })}
                        placeholder="Contoh: https://www.w3schools.com/html/mov_bbb.mp4"
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm"
                      />
                      <label className="flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl cursor-pointer transition-colors text-sm font-medium shrink-0">
                        {uploadingVideo ? "Mengunggah..." : "Unggah Video"}
                        <input 
                          type="file" 
                          accept="video/mp4,video/webm" 
                          className="hidden" 
                          onChange={handleUploadVideo}
                          disabled={uploadingVideo}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-bold text-slate-700">Titik Kuis (Checkpoints)</label>
                      <button 
                        onClick={() => {
                          const content = activeSlide.content || { videoUrl: '', checkpoints: [] };
                          updateActiveSlide({ 
                            content: { 
                              ...content, 
                              checkpoints: [...(content.checkpoints || []), { id: Date.now().toString(), time: 0, question: '', options: ['', ''], correctOptionIndex: 0 }] 
                            } 
                          });
                        }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg"
                      >
                        + Tambah Titik Kuis
                      </button>
                    </div>

                    <div className="space-y-4">
                      {((activeSlide.content?.checkpoints as any[]) || []).map((cp: any, idx: number) => (
                        <div key={cp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-700 text-sm">Titik Kuis {idx + 1}</h4>
                            <button 
                              onClick={() => {
                                const content = { ...activeSlide.content };
                                content.checkpoints = content.checkpoints.filter((_: any, i: number) => i !== idx);
                                updateActiveSlide({ content });
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                              <label className="block text-xs font-bold text-slate-500 mb-1">Detik Kemunculan</label>
                              <input 
                                type="number"
                                min="0"
                                value={cp.time}
                                onChange={(e) => {
                                  const content = { ...activeSlide.content };
                                  content.checkpoints[idx].time = parseInt(e.target.value) || 0;
                                  updateActiveSlide({ content });
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-bold text-slate-500 mb-1">Pertanyaan</label>
                              <input 
                                type="text"
                                value={cp.question}
                                onChange={(e) => {
                                  const content = { ...activeSlide.content };
                                  content.checkpoints[idx].question = e.target.value;
                                  updateActiveSlide({ content });
                                }}
                                placeholder="Pertanyaan kuis..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200">
                            <label className="block text-xs font-bold text-slate-500 mb-2">Pilihan Jawaban</label>
                            <div className="space-y-2">
                              {(cp.options || []).map((opt: string, optIdx: number) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <input 
                                    type="radio" 
                                    name={`correct-${cp.id}`} 
                                    checked={cp.correctOptionIndex === optIdx}
                                    onChange={() => {
                                      const content = { ...activeSlide.content };
                                      content.checkpoints[idx].correctOptionIndex = optIdx;
                                      updateActiveSlide({ content });
                                    }}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <input 
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const content = { ...activeSlide.content };
                                      content.checkpoints[idx].options[optIdx] = e.target.value;
                                      updateActiveSlide({ content });
                                    }}
                                    placeholder={`Opsi ${optIdx + 1}`}
                                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                                  />
                                  {cp.options.length > 2 && (
                                    <button 
                                      onClick={() => {
                                        const content = { ...activeSlide.content };
                                        content.checkpoints[idx].options = content.checkpoints[idx].options.filter((_: any, i: number) => i !== optIdx);
                                        if (content.checkpoints[idx].correctOptionIndex >= content.checkpoints[idx].options.length) {
                                          content.checkpoints[idx].correctOptionIndex = 0;
                                        }
                                        updateActiveSlide({ content });
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-red-500 flex items-center justify-center bg-slate-100 rounded-md"
                                    >
                                      x
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button 
                                onClick={() => {
                                  const content = { ...activeSlide.content };
                                  content.checkpoints[idx].options.push('');
                                  updateActiveSlide({ content });
                                }}
                                className="text-xs font-medium text-indigo-600 mt-1"
                              >
                                + Tambah Opsi
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!activeSlide.content?.checkpoints || activeSlide.content.checkpoints.length === 0) && (
                        <p className="text-sm text-slate-500 italic">Belum ada titik kuis. Video akan diputar normal.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

