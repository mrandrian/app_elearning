"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, Plus, Save, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Option = { text: string; isCorrect: boolean };
type Question = { text: string; options: Option[] };

export default function QuizManagementPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const resolvedParams = use(params);
  const { moduleId } = resolvedParams;
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  
  const [activeTab, setActiveTabState] = useState<"QUESTIONS" | "RESULTS" | "SETTINGS">("QUESTIONS");
  const [scores, setScores] = useState<any[]>([]);
  const [shuffleQ, setShuffleQ] = useState(false);
  const [shuffleO, setShuffleO] = useState(false);
  const [timeLimit, setTimeLimit] = useState(0);
  const [passingScore, setPassingScore] = useState(60);
  const [maxRetries, setMaxRetries] = useState(0);
  const [hasDraft, setHasDraft] = useState(false);

  const setActiveTab = (tab: "QUESTIONS" | "RESULTS" | "SETTINGS") => {
    setActiveTabState(tab);
    sessionStorage.setItem(`quiz_admin_tab_${moduleId}`, tab);
  };

  useEffect(() => {
    const savedTab = sessionStorage.getItem(`quiz_admin_tab_${moduleId}`) as any;
    if (savedTab) setActiveTabState(savedTab);
  }, [moduleId]);

  useEffect(() => {
    fetchModuleSettings();
    fetchQuestions();
    fetchScores();
    
    // Polling for real-time score updates every 5 seconds
    const interval = setInterval(fetchScores, 5000);
    return () => clearInterval(interval);
  }, [moduleId]);

  const fetchModuleSettings = async () => {
    try {
      const res = await fetch(`/api/modules/${moduleId}`);
      const data = await res.json();
      if (data.module && data.module.contentPath) {
        try {
          const config = JSON.parse(data.module.contentPath);
          if (config.shuffleQ !== undefined) setShuffleQ(config.shuffleQ);
          if (config.shuffleO !== undefined) setShuffleO(config.shuffleO);
          if (config.timeLimit !== undefined) setTimeLimit(config.timeLimit);
          if (config.passingScore !== undefined) setPassingScore(config.passingScore);
          if (config.maxRetries !== undefined) setMaxRetries(config.maxRetries);
        } catch (e) {}
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const draft = localStorage.getItem(`quiz_draft_${moduleId}`);
      if (draft) {
        setQuestions(JSON.parse(draft));
        setHasDraft(true);
        return;
      }

      const res = await fetch(`/api/modules/${moduleId}/questions`);
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScores = async () => {
    try {
      const res = await fetch(`/api/modules/${moduleId}/scores?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await res.json();
      if (data.scores) {
        setScores(data.scores);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleResetScore = async (scoreId: string) => {
    if (!confirm("Hapus nilai peserta ini? Peserta akan bisa mengulang kuis dari awal.")) return;
    try {
      const res = await fetch(`/api/scores/${scoreId}`, { method: "DELETE" });
      if (res.ok) {
        fetchScores();
      }
    } catch (e) {
      console.error("Failed to delete score");
    }
  };

  const updateQuestions = (newQ: Question[]) => {
    setQuestions(newQ);
    localStorage.setItem(`quiz_draft_${moduleId}`, JSON.stringify(newQ));
    setHasDraft(true);
  };

  const handleAddQuestion = () => {
    updateQuestions([
      ...questions,
      { text: "", options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }] }
    ]);
  };

  const handleQuestionChange = (index: number, text: string) => {
    const newQ = [...questions];
    newQ[index].text = text;
    updateQuestions(newQ);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, text: string) => {
    const newQ = [...questions];
    newQ[qIndex].options[optIndex].text = text;
    updateQuestions(newQ);
  };

  const handleSetCorrect = (qIndex: number, optIndex: number) => {
    const newQ = [...questions];
    newQ[qIndex].options.forEach((opt, i) => {
      opt.isCorrect = i === optIndex;
    });
    updateQuestions(newQ);
  };

  const handleAddOption = (qIndex: number) => {
    const newQ = [...questions];
    newQ[qIndex].options.push({ text: "", isCorrect: false });
    updateQuestions(newQ);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    const newQ = [...questions];
    newQ.splice(qIndex, 1);
    updateQuestions(newQ);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const configObj = { shuffleQ, shuffleO, timeLimit, passingScore, maxRetries };
      const res = await fetch(`/api/modules/${moduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentPath: JSON.stringify(configObj) }),
      });
      if (res.ok) {
        toast.success("Pengaturan kuis berhasil disimpan!");
      } else {
        toast.error("Gagal menyimpan pengaturan.");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/modules/${moduleId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions })
      });
      if (res.ok) {
        toast.success("Soal berhasil disimpan!");
        localStorage.removeItem(`quiz_draft_${moduleId}`);
        setHasDraft(false);
      } else {
        const errorData = await res.json();
        toast.error(`Gagal menyimpan soal: ${errorData.error}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem saat menyimpan soal");
    } finally {
      setSaving(false);
    }
  };

  const handleImport = () => {
    try {
      const lines = importText.split("\n");
      const imported: Question[] = [];
      let currentQ: Question | null = null;

      for (const line of lines) {
        const t = line.trim();
        if (!t) continue;

        if (t.startsWith("Q:")) {
          if (currentQ) imported.push(currentQ);
          currentQ = { text: t.replace("Q:", "").trim(), options: [] };
        } else if (t.startsWith("*")) {
          if (currentQ) currentQ.options.push({ text: t.replace("*", "").trim(), isCorrect: true });
        } else if (t.startsWith("-")) {
          if (currentQ) currentQ.options.push({ text: t.replace("-", "").trim(), isCorrect: false });
        }
      }
      if (currentQ) imported.push(currentQ);

      updateQuestions([...questions, ...imported]);
      setShowImport(false);
      setImportText("");
    } catch (error) {
      toast.error("Format import tidak sesuai");
    }
  };

  if (loading) return <div className="p-8">Memuat data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manajemen Kuis</h1>
          <p className="text-slate-500 mt-1">Kelola soal atau pantau progres peserta secara real-time.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab("QUESTIONS")}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'QUESTIONS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Kelola Soal
        </button>
        <button 
          onClick={() => setActiveTab("SETTINGS")}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'SETTINGS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Pengaturan Kuis
        </button>
        <button 
          onClick={() => setActiveTab("RESULTS")}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'RESULTS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Hasil & Progres Peserta
        </button>
      </div>

      {activeTab === "QUESTIONS" && (
        <>
          <div className="flex gap-4 pb-2">
            <button 
              onClick={handleAddQuestion}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" /> Tambah Soal
            </button>
            <button 
              onClick={() => setShowImport(!showImport)}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
            >
              <Upload className="w-4 h-4" /> Import Teks
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors font-medium text-sm"
            >
              <Save className="w-4 h-4" /> {saving ? "Menyimpan..." : "Simpan Semua"}
            </button>
            {hasDraft && (
              <button 
                onClick={() => {
                  if (confirm("Buang perubahan yang belum disimpan?")) {
                    localStorage.removeItem(`quiz_draft_${moduleId}`);
                    setHasDraft(false);
                    setLoading(true);
                    fetch(`/api/modules/${moduleId}/questions`)
                      .then(r => r.json())
                      .then(d => {
                        if (d.questions) setQuestions(d.questions);
                        setLoading(false);
                      });
                  }
                }}
                className="flex items-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
              >
                Buang Draf
              </button>
            )}
          </div>

          {showImport && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2">Import Soal via Teks</h3>
              <p className="text-xs text-slate-500 mb-4">
                Format penulisan:<br/>
                Q: Apa ibukota Indonesia?<br/>
                * Jakarta<br/>
                - Bandung<br/>
                - Surabaya
              </p>
              <textarea 
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full h-48 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-sm mb-4"
                placeholder="Ketik soal di sini..."
              />
              <button onClick={handleImport} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Proses Import</button>
            </div>
          )}

          <div className="space-y-6">
            {questions.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-500">
                Belum ada soal. Silakan tambah atau import soal.
              </div>
            ) : (
              questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-slate-900">Soal #{qIndex + 1}</h3>
                    <button onClick={() => handleRemoveQuestion(qIndex)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <textarea 
                    value={q.text}
                    onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                    placeholder="Pertanyaan..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    rows={2}
                  />
                  
                  <div className="space-y-2">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-3">
                        <input 
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={opt.isCorrect}
                          onChange={() => handleSetCorrect(qIndex, optIndex)}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <input 
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                          placeholder={`Opsi ${optIndex + 1}`}
                          className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none ${opt.isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}
                        />
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => handleAddOption(qIndex)}
                    className="mt-4 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    + Tambah Pilihan
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === "SETTINGS" && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Pengaturan Eksekusi Kuis</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-slate-900">Acak Posisi Soal</h4>
                <p className="text-sm text-slate-500">Urutan soal akan berbeda untuk setiap peserta</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={shuffleQ} onChange={(e) => setShuffleQ(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-slate-900">Acak Posisi Jawaban (Opsi)</h4>
                <p className="text-sm text-slate-500">Posisi pilihan A, B, C, D akan diacak</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={shuffleO} onChange={(e) => setShuffleO(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block font-medium text-slate-900 mb-2">Batas Waktu Pengerjaan (Menit)</label>
              <p className="text-sm text-slate-500 mb-3">Biarkan 0 jika tidak ada batas waktu. Kuis akan otomatis dikumpulkan saat waktu habis.</p>
              <input 
                type="number" 
                min="0"
                value={timeLimit} 
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full max-w-xs px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-6">
              <div>
                <label className="block font-medium text-slate-900 mb-2">Batas Minimum Kelulusan (0-100)</label>
                <p className="text-sm text-slate-500 mb-3">Skor minimal yang harus dicapai peserta untuk lulus kuis ini.</p>
                <input 
                  type="number" 
                  min="0" max="100"
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-900 mb-2">Maksimal Pengulangan</label>
                <p className="text-sm text-slate-500 mb-3">Biarkan 0 untuk pengulangan tanpa batas jika peserta gagal.</p>
                <input 
                  type="number" 
                  min="0"
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>
            
            <div className="pt-6">
              <button 
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {saving ? "Menyimpan..." : "Simpan Pengaturan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "RESULTS" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Progres Penilaian Real-time</h3>
            <span className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Updates
            </span>
          </div>
          
          {scores.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              Belum ada peserta yang mengerjakan kuis ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-sm">
                    <th className="px-6 py-4 font-medium">Nama Peserta</th>
                    <th className="px-6 py-4 font-medium">NIP</th>
                    <th className="px-6 py-4 font-medium">Waktu Selesai</th>
                    <th className="px-6 py-4 font-medium text-right">Skor</th>
                    <th className="px-6 py-4 font-medium text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scores.map((score) => (
                    <tr key={score.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-900">{score.user.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{score.user.nip}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(score.createdAt).toLocaleString("id-ID", {
                          hour: "2-digit", minute: "2-digit",
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {score.status === 'IN_PROGRESS' && (
                            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Live
                            </span>
                          )}
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg border font-bold ${
                            score.value >= 85 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                            score.value >= 70 ? 'text-blue-600 bg-blue-50 border-blue-100' :
                            score.value >= 50 ? 'text-amber-600 bg-amber-50 border-amber-100' :
                            'text-red-600 bg-red-50 border-red-100'
                          }`}>
                            {score.value}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleResetScore(score.id)}
                          className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"
                        >
                          Reset Kuis
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
