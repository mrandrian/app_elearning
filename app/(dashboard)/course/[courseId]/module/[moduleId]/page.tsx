"use client";

import { useEffect, useState, use, useRef } from "react";
import { ArrowLeft, FileVideo, FileText, LayoutTemplate, HelpCircle, CheckCircle, ChevronRight, Menu, Grid, AlertTriangle, Clock, Lock, MapPin, RotateCw, Trophy, Award, Download } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import MatchingGame from "@/components/games/MatchingGame";
import BlanksGame from "@/components/games/BlanksGame";
import DragTheWordGame from "@/components/games/DragTheWordGame";
import WordSearchGame from "@/components/games/WordSearchGame";
import AnagramGame from "@/components/games/AnagramGame";
import CategorizeGame from "@/components/games/CategorizeGame";
import WordGridGame from "@/components/games/WordGridGame";
import InteractiveVideoGame from "@/components/games/InteractiveVideoGame";
import "react-quill-new/dist/quill.snow.css";
import toast from "react-hot-toast";

type CourseModule = {
  id: string;
  title: string;
  type: string;
  order: number;
  contentPath?: string | null;
};

type ModuleData = {
  id: string;
  title: string;
  type: string;
  contentPath: string | null;
  minPassingScore?: number | null;
  course: {
    title: string;
    hasCertificate?: boolean;
    enrollments?: { id: string }[];
    modules: CourseModule[];
  };
};

export default function ModulePlayerPage({ params }: { params: Promise<{ courseId: string; moduleId: string }> }) {
  const resolvedParams = use(params);
  const { courseId, moduleId } = resolvedParams;
  
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [showNavGrid, setShowNavGrid] = useState(false);
  const [quizRecap, setQuizRecap] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [lockedReason, setLockedReason] = useState<string | null>(null);
  const [parsedContentUrl, setParsedContentUrl] = useState<string>("");
  const [parsedDescription, setParsedDescription] = useState<string>("");
  const [parsedArticle, setParsedArticle] = useState<string>("");
  const [gameConfig, setGameConfig] = useState<any>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [gamificationScores, setGamificationScores] = useState<{[slideIdx: number]: number}>({});
  const [attemptScore, setAttemptScore] = useState<number | null>(null);
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [uploadingAssignment, setUploadingAssignment] = useState(false);
  const answersRef = useRef(answers);

  // Quiz Retry States
  const [currentAttempts, setCurrentAttempts] = useState(1);
  const [quizPassingScore, setQuizPassingScore] = useState(0);
  const [quizMaxRetries, setQuizMaxRetries] = useState(0);
  const [quizPassed, setQuizPassed] = useState(false);

  // Video & PDF constraints
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  const [pdfReadTime, setPdfReadTime] = useState(0);
  const PDF_MIN_TIME = 15; // 15 detik sebagai simulasi wajib baca

  useEffect(() => {
    if (moduleData?.type === 'DOCUMENT' && !quizSubmitted) {
      const timer = setInterval(() => {
        setPdfReadTime(p => p + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [moduleData, quizSubmitted]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Anti Cheat Feature
  useEffect(() => {
    if (!moduleData || moduleData.type !== 'QUIZ' || quizSubmitted) return;

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error("Menyalin teks tidak diizinkan selama kuis.");
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCheatWarnings(prev => {
          const newWarnings = prev + 1;
          toast.error(`🚨 PERINGATAN KECURANGAN! 🚨\nAnda terdeteksi meninggalkan halaman kuis atau membuka tab lain.\n(Peringatan ${newWarnings}/3)\n\nKuis akan otomatis dikumpulkan jika melanggar hingga 3 kali.`);
          
          if (newWarnings >= 3) {
            // Auto submit
            let correct = 0;
            questions.forEach(q => {
              const selectedId = answersRef.current[q.id];
              const selectedOpt = q.options.find((o: any) => o.id === selectedId);
              if (selectedOpt && selectedOpt.isCorrect) correct++;
            });
            const finalScore = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
            
            // Replicate the API call manually here to avoid dependencies loop with handleSimulateScore
            fetch("/api/score/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ answers: answersRef.current, moduleId, status: "FINISHED" }),
            })
            .then(res => res.json())
            .then((data) => {
              if (data.recap) setQuizRecap(data.recap);
              setSaveStatus(`Kuis dikumpulkan otomatis karena pelanggaran. Skor: ${data.score?.value || 0}`);
              setQuizSubmitted(true);
            });
          }
          return newWarnings;
        });
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [moduleData, quizSubmitted, questions, moduleId]);

  const syncProgress = async (currentAnswers: Record<string, string>) => {
    if (questions.length === 0) return;
    
    fetch("/api/score/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: currentAnswers, moduleId, status: "IN_PROGRESS" }),
    }).catch(() => {});
  };

  const handleAnswer = (qId: string, optId: string) => {
    if (quizSubmitted) return;
    const newAnswers = { ...answers, [qId]: optId };
    setAnswers(newAnswers);
    localStorage.setItem(`quiz_answers_${moduleId}`, JSON.stringify(newAnswers));
    syncProgress(newAnswers);
  };

  useEffect(() => {
    if (moduleId) {
      const saved = localStorage.getItem(`quiz_answers_${moduleId}`);
      if (saved) {
        try { setAnswers(JSON.parse(saved)); } catch (e) {}
      }
    }
  }, [moduleId]);


  useEffect(() => {
    if (timeLeft === null || quizSubmitted) return;
    
    if (timeLeft <= 0) {
      handleQuizSubmit();
      return;
    }
    
    const timer = setInterval(() => {
      // Pause timer if offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return;
      }
      
      setTimeLeft(prev => {
        const next = prev !== null && prev > 0 ? prev - 1 : 0;
        localStorage.setItem(`quiz_timeleft_${moduleId}`, next.toString());
        return next;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, quizSubmitted]);

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const res = await fetch(`/api/modules/${moduleId}`);
        const data = await res.json();
        if (data.module) {
          setModuleData(data.module);
          if (data.completedModules) setCompletedModules(data.completedModules);

          let config: any = {};
          let parsedUrl = data.module.contentPath || "";
          
          if (data.module.contentPath && data.module.contentPath.startsWith('{') && data.module.type !== 'GAMIFICATION') {
            try { 
              config = JSON.parse(data.module.contentPath); 
              parsedUrl = config.url || "";
              if (config.description) setParsedDescription(config.description);
              if (config.articleContent) setParsedArticle(config.articleContent);
            } catch (e) {}
          } else if (data.module.type === 'GAMIFICATION') {
            try { 
              config = JSON.parse(data.module.contentPath || "[]"); 
              if (config && !Array.isArray(config) && config.url) {
                // Legacy support for older h5p config shape
                parsedUrl = config.url;
              }
            } catch (e) { config = []; }
          }
          setParsedContentUrl(parsedUrl);
          setGameConfig(config);

          // Restore video progress
          if (data.module.type === 'VIDEO') {
            const savedVideoProg = localStorage.getItem(`video_progress_${moduleId}`);
            if (savedVideoProg) {
              setMaxWatchedTime(parseFloat(savedVideoProg));
            }
          }

          const currentIdx = data.module.course.modules.findIndex((m: any) => m.id === moduleId);
          const prevMod = currentIdx > 0 ? data.module.course.modules[currentIdx - 1] : null;
          
          let currentLocked = false;
          let currentLockedReason = "";

          // Check for active category lock
          let activeCategoryLockDate: Date | null = null;
          for (let i = 0; i <= currentIdx; i++) {
             const m = data.module.course.modules[i];
             if (m.type === 'CATEGORY') {
               try {
                 const catConfig = JSON.parse(m.contentPath || "{}");
                 if (catConfig.availableAt && new Date() < new Date(catConfig.availableAt)) {
                    activeCategoryLockDate = new Date(catConfig.availableAt);
                 } else {
                    activeCategoryLockDate = null;
                 }
               } catch (e) {
                 activeCategoryLockDate = null;
               }
             }
          }

          if (config.requirePrevious && prevMod && data.completedModules && !data.completedModules.includes(prevMod.id)) {
            currentLocked = true;
            currentLockedReason = "Anda harus menyelesaikan materi sebelumnya terlebih dahulu untuk mengakses materi ini.";
          }
          
          if (activeCategoryLockDate) {
            currentLocked = true;
            currentLockedReason = `Kategori materi ini baru akan tersedia pada ${activeCategoryLockDate.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}`;
          } else if (config.availableAt && new Date() < new Date(config.availableAt)) {
            currentLocked = true;
            currentLockedReason = `Materi ini baru akan tersedia pada ${new Date(config.availableAt).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}`;
          }

          if (currentLocked) {
             setLockedReason(currentLockedReason);
             setLoading(false);
             return;
          }

          let fbAttempts = 1;

          if (data.score && data.score.feedback) {
            try {
              const fb = JSON.parse(data.score.feedback);
              if (fb.fileUrl) {
                setAnswers(fb);
              } else if (data.module.type === 'GAMIFICATION') {
                setGamificationScores(fb);
              } else if (data.module.type === 'QUIZ') {
                if (fb.answers) setAnswers(fb.answers);
                else setAnswers(fb);
                if (fb.attempts) fbAttempts = fb.attempts;
              } else if (data.module.type === 'ARTICLE') {
                // If there's feedback for article, might be completion
              }
            } catch (e) {}
          }
          
          setCurrentAttempts(fbAttempts);

          if (data.score && data.score.status === 'FINISHED') {
            setQuizSubmitted(true);
            setSaveStatus(`Skor Anda: ${data.score.value}`);
            
            const saved = localStorage.getItem(`quiz_answers_${moduleId}`);
            if (saved) {
              try {
                const parsedAnswers = JSON.parse(saved);
                fetch("/api/score/save", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ answers: parsedAnswers, moduleId, status: "FINISHED" }),
                }).then(r => r.json()).then(d => {
                   if (d.recap) setQuizRecap(d.recap);
                });
              } catch (e) {}
            }
          }
          if (data.module.type === 'QUIZ') {
            fetchQuestions(data.module.contentPath);
            
            // Check time limit
            if (data.module.contentPath) {
              try {
                const config = JSON.parse(data.module.contentPath);
                if (config.passingScore !== undefined) setQuizPassingScore(config.passingScore);
                if (config.maxRetries !== undefined) setQuizMaxRetries(config.maxRetries);
                
                if (data.score && data.score.status === 'FINISHED') {
                  if (data.score.value >= (config.passingScore || 0)) {
                    setQuizPassed(true);
                  }
                }

                if (config.timeLimit && config.timeLimit > 0 && !(data.score && data.score.status === 'FINISHED')) {
                  const savedTime = localStorage.getItem(`quiz_timeleft_${moduleId}`);
                  if (savedTime) {
                    setTimeLeft(parseInt(savedTime));
                  } else {
                    const limitSeconds = config.timeLimit * 60;
                    setTimeLeft(limitSeconds);
                    localStorage.setItem(`quiz_timeleft_${moduleId}`, limitSeconds.toString());
                  }
                }
              } catch (e) {}
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch module:", error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchQuestions = async (contentPath?: string) => {
      try {
        const res = await fetch(`/api/modules/${moduleId}/questions`);
        const data = await res.json();
        if (data.questions) {
          let qs = data.questions;
          
          if (contentPath) {
             try {
               const config = JSON.parse(contentPath);
               if (config.shuffleO) {
                  qs = qs.map((q: any) => ({
                     ...q,
                     options: q.options.sort(() => Math.random() - 0.5)
                  }));
               }
               if (config.shuffleQ) {
                  qs = qs.sort(() => Math.random() - 0.5);
               }
             } catch (e) {}
          }
          setQuestions(qs);
        }
      } catch (error) {
        console.error("Failed to fetch questions", error);
      }
    };

    fetchModule();
  }, [moduleId]);

  const handleSimulateScore = async (scoreOrAnswers: number | Record<string, string>, feedbackStr?: string) => {
    setSaveStatus("Menyimpan...");
    try {
      const payload = typeof scoreOrAnswers === 'number' 
        ? { score: scoreOrAnswers, moduleId, status: "FINISHED", feedback: feedbackStr }
        : { answers: scoreOrAnswers, moduleId, status: "FINISHED", feedback: feedbackStr };
        
      const response = await fetch("/api/score/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.recap) setQuizRecap(data.recap);
        setSaveStatus(`Skor Anda: ${data.score?.value || 0}`);
        
        // Update quiz retry states
        if (moduleData?.type === 'QUIZ') {
           setCurrentAttempts(prev => prev + 1);
           if ((data.score?.value || 0) >= quizPassingScore) {
             setQuizPassed(true);
           }
        }
        
        // Update local states so UI reflects completion immediately
        setQuizSubmitted(true);
        setCompletedModules(prev => prev.includes(moduleId) ? prev : [...prev, moduleId]);
      } else {
        // Handle minPassingScore validation error
        if (data.error && data.minPassingScore !== undefined) {
          toast.error(data.error);
          setSaveStatus(`Skor: ${data.score || 0} (Minimum: ${data.minPassingScore})`);
        } else {
          toast.error(data.error || "Gagal menyimpan skor.");
          setSaveStatus("Gagal menyimpan skor.");
        }
      }
    } catch (error) {
      toast.error("Terjadi kesalahan.");
      setSaveStatus("Terjadi kesalahan.");
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    
    // Prevent skipping: if current time jumps more than 1 second ahead of max watched time
    if (current > maxWatchedTime + 1) {
      videoRef.current.currentTime = maxWatchedTime;
    } else if (current > maxWatchedTime) {
      setMaxWatchedTime(current);
      localStorage.setItem(`video_progress_${moduleId}`, current.toString());
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && maxWatchedTime > 0) {
      videoRef.current.currentTime = maxWatchedTime;
    }
  };

  const handleVideoEnded = () => {
    setIsVideoFinished(true);
  };

  const handleQuizSubmit = () => {
    handleSimulateScore(answers);
    setQuizSubmitted(true);
  };

  const handleUploadAssignment = async () => {
    if (!assignmentFile) return;
    setUploadingAssignment(true);
    try {
      const formData = new FormData();
      formData.append("file", assignmentFile);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        const fileUrl = data.fileUrl;
        const newAnswers = { fileUrl };
        setAnswers(newAnswers);
        await handleSimulateScore(newAnswers);
        setQuizSubmitted(true);
      } else {
        toast.error("Gagal mengunggah tugas.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan.");
    } finally {
      setUploadingAssignment(false);
    }
  };

  const getModuleIcon = (type: string, className = "w-4 h-4") => {
    switch(type) {
      case 'VIDEO': return <FileVideo className={className} />;
      case 'DOCUMENT': return <FileText className={className} />;
      case 'H5P': return <LayoutTemplate className={className} />;
      case 'QUIZ': return <HelpCircle className={className} />;
      case 'LINK': return <MapPin className={className} />;
      case 'ARTICLE': return <FileText className={className} />;
      default: return <FileText className={className} />;
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="p-8">Memuat materi...</div>;
  if (!moduleData) return <div className="p-8">Materi tidak ditemukan.</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-4 md:p-6 flex flex-col min-h-[400px] md:min-h-[600px]">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-6">
          <Link href={`/courses`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 line-clamp-1">{moduleData.title}</h1>
            <p className="text-sm text-slate-500 line-clamp-1">{moduleData.course.title}</p>
          </div>
          <div className="ml-auto hidden md:flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium">
            {getModuleIcon(moduleData.type)}
            {moduleData.type}
          </div>
        </div>

        <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
          
          {lockedReason ? (
            <div className="text-center p-6 md:p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Materi Terkunci</h3>
              <p className="text-slate-600 font-medium leading-relaxed">{lockedReason}</p>
              <Link href={`/courses`} className="mt-8 inline-flex px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors">
                Kembali ke Beranda
              </Link>
            </div>
          ) : (
            <>
              {moduleData.type === 'VIDEO' && parsedContentUrl && (
                <div className="w-full h-full max-h-[600px] relative bg-black rounded-2xl overflow-hidden">
                  <video 
                    ref={videoRef}
                    src={parsedContentUrl} 
                    controls 
                    controlsList="nodownload"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleVideoEnded}
                    className="w-full h-full"
                  >
                    Browser Anda tidak mendukung tag video.
                  </video>
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-medium">
                    {isVideoFinished ? '✅ Video Selesai' : '👀 Menonton... (Tidak bisa dipercepat)'}
                  </div>
                </div>
              )}

              {moduleData.type === 'DOCUMENT' && parsedContentUrl && (
                <iframe 
                  src={parsedContentUrl} 
                  className="w-full h-full min-h-[600px]"
                  title="Dokumen PDF"
                />
              )}

              {moduleData.type === 'ARTICLE' && (
                <div className="w-full h-full min-h-[600px] bg-white rounded-2xl p-4 md:p-8 overflow-y-auto ql-snow">
                  <div 
                    className="ql-editor"
                    dangerouslySetInnerHTML={{ __html: parsedArticle || '<p class="text-slate-500 italic">Artikel kosong.</p>' }}
                  />
                </div>
              )}

              {moduleData.type === 'H5P' && (
                <div className="text-center p-6 w-full max-w-lg">
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LayoutTemplate className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Area Pemutar H5P</h3>
                  
                  {parsedContentUrl ? (
                    <p className="text-sm text-slate-500 mt-1 mb-6">
                      Berkas termuat dari: <span className="font-mono bg-slate-200 px-1 rounded break-all">{parsedContentUrl}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-6">
                      Guru belum mengunggah file untuk modul ini.
                    </p>
                  )}
                </div>
              )}

              {moduleData.type === 'LINK' && (
                <div className="text-center p-8 w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-200">
                  <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Tatap Muka Virtual</h3>
                  <p className="text-sm text-slate-500 mb-8">
                    Silakan bergabung melalui tautan konferensi video di bawah ini.
                  </p>
                  
                  {parsedContentUrl ? (
                    <a 
                      href={parsedContentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors w-full justify-center shadow-sm"
                    >
                      Bergabung Sekarang
                    </a>
                  ) : (
                    <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                      Tautan belum tersedia.
                    </p>
                  )}
                </div>
              )}

              {moduleData.type === 'ASSIGNMENT' && (
                <div className="p-8 w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-slate-200 text-left">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div className="w-16 h-16 bg-fuchsia-50 text-fuchsia-600 rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Tugas Terstruktur</h3>
                      <p className="text-sm text-slate-500">Baca instruksi dengan teliti dan unggah hasil pekerjaan Anda.</p>
                    </div>
                  </div>

                  <div className="mb-8 space-y-4">
                    <h4 className="font-semibold text-slate-900">Instruksi Tugas:</h4>
                    <div className="bg-slate-50 p-6 rounded-xl text-slate-700 whitespace-pre-wrap border border-slate-100 leading-relaxed text-sm">
                      {parsedDescription || "Tidak ada deskripsi."}
                    </div>
                    
                    {parsedContentUrl && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-slate-900 mb-2">Lampiran Soal:</h4>
                        <a href={parsedContentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          <FileText className="w-4 h-4" /> Buka Lampiran
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-4">Pengumpulan Tugas</h4>
                    <div className="space-y-6">
                      {answers.fileUrl && (
                        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-3 font-medium border border-emerald-100">
                          <CheckCircle className="w-6 h-6 shrink-0" />
                          <div>
                            Tugas berhasil dikumpulkan. 
                            <a href={answers.fileUrl} target="_blank" rel="noopener noreferrer" className="block text-sm underline mt-1 text-emerald-800">Lihat file yang dikumpulkan</a>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-3 pt-2">
                        <p className="text-sm text-slate-600 font-medium">
                          {answers.fileUrl ? "Unggah berkas baru untuk menimpa tugas sebelumnya:" : "Pilih berkas tugas untuk diunggah:"}
                        </p>
                        <input 
                          type="file" 
                          onChange={(e) => setAssignmentFile(e.target.files ? e.target.files[0] : null)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                        />
                        <button 
                          onClick={handleUploadAssignment}
                          disabled={!assignmentFile || uploadingAssignment}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {uploadingAssignment ? "Mengunggah..." : (answers.fileUrl ? "Unggah Ulang Tugas" : "Kumpulkan Tugas")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {moduleData.type === 'CATEGORY' && (
                <div className="p-12 w-full max-w-2xl bg-gradient-to-br from-indigo-50 to-white rounded-3xl shadow-sm border border-indigo-100 text-center">
                  <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LayoutTemplate className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-bold text-indigo-900 mb-4">{moduleData.title}</h2>
                  <p className="text-indigo-600/80 mb-8 max-w-md mx-auto">
                    Anda telah memasuki topik / bagian baru. Silakan lanjutkan ke materi berikutnya di daftar samping.
                  </p>
                  <button 
                    onClick={() => {
                      // Mark complete automatically
                      handleSimulateScore(100);
                      // Go to next module
                      const idx = moduleData.course.modules.findIndex((m: any) => m.id === moduleId);
                      if (idx < moduleData.course.modules.length - 1) {
                        window.location.href = `/course/${courseId}/module/${moduleData.course.modules[idx+1].id}`;
                      }
                    }}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    Lanjutkan ke Materi <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {moduleData.type === 'GAMIFICATION' && Array.isArray(gameConfig) && (
                <div className="flex flex-col items-center justify-center p-8 w-full max-w-4xl mx-auto h-full">
                  {quizSubmitted ? (
                    <div className="w-full bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center">
                      <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
                      <h3 className="text-3xl font-bold text-slate-900 mb-2">Gamifikasi Selesai!</h3>
                      <p className="text-slate-500 mb-8 text-lg">Anda telah menyelesaikan semua tantangan dalam modul ini.</p>
                      
                      <div className="bg-slate-50 rounded-2xl p-8 mb-6 border border-slate-100 max-w-sm mx-auto">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Skor Percobaan Ini</p>
                        <p className="text-6xl font-black text-indigo-600">{attemptScore !== null ? attemptScore : (saveStatus ? saveStatus.replace(/[^0-9]/g, '') : "100")}</p>
                        {attemptScore !== null && saveStatus && parseInt(saveStatus.replace(/[^0-9]/g, '') || "0") > attemptScore && (
                           <p className="text-xs text-emerald-600 font-bold mt-3 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">Skor Terbaik Anda ({saveStatus.replace(/[^0-9]/g, '')}) Dipertahankan!</p>
                        )}
                      </div>

                      <div className="space-y-3 mb-10 text-left max-w-md mx-auto">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Rincian per Slide</h4>
                        {gameConfig.map((s: any, idx: number) => {
                          if (!['MATCHING', 'BLANKS', 'DRAG_WORD', 'WORD_SEARCH', 'ANAGRAM', 'CATEGORIZE', 'WORD_GRID'].includes(s.type)) return null;
                          const score = gamificationScores[idx] || 0;
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                              <div>
                                <p className="text-xs font-bold text-slate-500 mb-0.5">Slide {idx + 1} - <span className="text-indigo-600">{s.type.replace('_', ' ')}</span></p>
                                <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">{s.title}</p>
                              </div>
                              <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${score >= 80 ? 'bg-emerald-100 text-emerald-700' : score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                {score}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                          onClick={() => {
                            setQuizSubmitted(false);
                            setCurrentSlideIndex(0);
                            setSaveStatus("");
                            setGamificationScores({});
                            setAttemptScore(null);
                          }}
                          className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                          <RotateCw className="w-5 h-5" /> Ulangi Permainan
                        </button>

                        <button
                          onClick={() => {
                            const idx = moduleData.course.modules.findIndex((m: any) => m.id === moduleId);
                            if (idx < moduleData.course.modules.length - 1) {
                              window.location.href = `/course/${courseId}/module/${moduleData.course.modules[idx+1].id}`;
                            } else {
                              window.location.href = `/course/${courseId}`;
                            }
                          }}
                          className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                          Lanjut ke Modul Berikutnya <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Minimum Passing Score Info */}
                      {moduleData.minPassingScore !== null && moduleData.minPassingScore !== undefined && (
                        <div className="w-full mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                          <Award className="w-6 h-6 text-amber-600 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-amber-900">Batas Minimum Kelulusan</p>
                            <p className="text-xs text-amber-700">Anda harus mencapai skor minimal <span className="font-bold">{moduleData.minPassingScore}</span> untuk lulus modul ini.</p>
                          </div>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="w-full mb-8">
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                          <span>Bagian {currentSlideIndex + 1} dari {gameConfig.length}</span>
                          <span>{Math.round(((currentSlideIndex) / gameConfig.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${((currentSlideIndex) / gameConfig.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Slide Content */}
                      <div className="w-full flex-1 flex flex-col justify-center min-h-[400px]">
                        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">{gameConfig[currentSlideIndex]?.title}</h2>
                        
                        {gameConfig[currentSlideIndex]?.type === 'INFO' && (
                          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                            <div className="prose max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {gameConfig[currentSlideIndex]?.content}
                            </div>
                          </div>
                        )}

                        {gameConfig[currentSlideIndex]?.type === 'WORD_GRID' && (
                          <WordGridGame 
                            data={gameConfig[currentSlideIndex]?.content} 
                            onScoreUpdate={(s) => setGamificationScores(prev => ({...prev, [currentSlideIndex]: s}))}
                          />
                        )}

                        {gameConfig[currentSlideIndex]?.type === 'MATCHING' && (
                          <MatchingGame 
                            data={gameConfig[currentSlideIndex]?.content} 
                            onComplete={() => {}}
                            onScoreUpdate={(s) => setGamificationScores(prev => ({...prev, [currentSlideIndex]: s}))}
                          />
                        )}

                        {gameConfig[currentSlideIndex]?.type === 'BLANKS' && (
                          <BlanksGame 
                            data={gameConfig[currentSlideIndex]?.content} 
                            onScoreUpdate={(s) => setGamificationScores(prev => ({...prev, [currentSlideIndex]: s}))}
                          />
                        )}

                        {gameConfig[currentSlideIndex]?.type === 'DRAG_WORD' && (
                          <DragTheWordGame 
                            data={gameConfig[currentSlideIndex]?.content} 
                            onScoreUpdate={(s) => setGamificationScores(prev => ({...prev, [currentSlideIndex]: s}))}
                          />
                        )}

                        {gameConfig[currentSlideIndex]?.type === 'WORD_SEARCH' && (
                          <WordSearchGame 
                            data={gameConfig[currentSlideIndex]?.content} 
                            onScoreUpdate={(s) => setGamificationScores(prev => ({...prev, [currentSlideIndex]: s}))}
                          />
                        )}

                        {gameConfig[currentSlideIndex]?.type === 'ANAGRAM' && (
                          <AnagramGame 
                            data={gameConfig[currentSlideIndex]?.content} 
                            onScoreUpdate={(s) => setGamificationScores(prev => ({...prev, [currentSlideIndex]: s}))}
                          />
                        )}

                        {gameConfig[currentSlideIndex]?.type === 'CATEGORIZE' && (
                          <CategorizeGame 
                            data={gameConfig[currentSlideIndex]?.content} 
                            onScoreUpdate={(s) => setGamificationScores(prev => ({...prev, [currentSlideIndex]: s}))}
                          />
                        )}

                        {gameConfig[currentSlideIndex]?.type === 'INTERACTIVE_VIDEO' && (
                          <InteractiveVideoGame 
                            data={gameConfig[currentSlideIndex]?.content} 
                            onScoreUpdate={(s) => setGamificationScores(prev => ({...prev, [currentSlideIndex]: s}))}
                          />
                        )}
                      </div>

                      {/* Navigation */}
                      <div className="mt-8 flex justify-between w-full border-t border-slate-100 pt-6">
                        <button
                          onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentSlideIndex === 0}
                          className="px-6 py-2 rounded-xl text-slate-600 font-bold disabled:opacity-30 hover:bg-slate-100 transition-colors"
                        >
                          Slide Sebelumnya
                        </button>
                        
                        {currentSlideIndex < gameConfig.length - 1 ? (
                          <button
                            onClick={() => setCurrentSlideIndex(prev => prev + 1)}
                            className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                          >
                            Slide Selanjutnya
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const scorableTypes = ['MATCHING', 'BLANKS', 'DRAG_WORD', 'WORD_SEARCH', 'ANAGRAM', 'CATEGORIZE', 'WORD_GRID'];
                              const scorableSlides = gameConfig.filter((s: any) => scorableTypes.includes(s.type)).length;
                              let finalScore = 100;
                              if (scorableSlides > 0) {
                                let total = 0;
                                gameConfig.forEach((s: any, idx: number) => {
                                  if (scorableTypes.includes(s.type)) {
                                    total += (gamificationScores[idx] || 0);
                                  }
                                });
                                finalScore = Math.round(total / scorableSlides);
                              }
                              setAttemptScore(finalScore);
                              handleSimulateScore(finalScore, JSON.stringify(gamificationScores));
                            }}
                            disabled={saveStatus === "Menyimpan..."}
                            className="px-6 py-2 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                          >
                            {saveStatus === "Menyimpan..." ? "Menyimpan..." : <><CheckCircle className="w-5 h-5" /> Selesaikan Modul</>}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

          {moduleData.type === 'QUIZ' && (
            <div className="w-full h-full overflow-y-auto p-8 flex flex-col">
              
              {timeLeft !== null && !quizSubmitted && (
                <div className="w-full max-w-3xl mx-auto bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex justify-between items-center">
                  <span className="font-medium text-slate-600 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" /> Sisa Waktu
                  </span>
                  <span className={`text-xl font-bold font-mono px-3 py-1 rounded-lg ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-900'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}

              {questions.length === 0 ? (
                <div className="text-center p-12">
                  <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Guru belum menambahkan soal untuk kuis ini.</p>
                </div>
              ) : quizSubmitted ? (
                <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col mt-4">
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center mb-6">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${quizPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {quizPassed ? <CheckCircle className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Kuis Selesai!</h3>
                    <p className="text-slate-500 mb-6">
                      {quizPassed 
                        ? "Selamat! Anda telah mencapai batas kelulusan kuis ini." 
                        : "Maaf, Anda belum mencapai batas kelulusan untuk kuis ini."}
                      <br/>
                      Batas Nilai: {quizPassingScore} | Percobaan: {currentAttempts} {quizMaxRetries > 0 ? `/ ${quizMaxRetries}` : ""}
                    </p>
                    {saveStatus && (
                      <div className={`p-4 rounded-xl font-bold text-2xl border mb-6 inline-block px-12 ${quizPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                        {saveStatus.replace("Skor Anda:", "")}
                      </div>
                    )}
                    
                    {!quizPassed && (quizMaxRetries === 0 || currentAttempts < quizMaxRetries) ? (
                      <div>
                        <button 
                          onClick={() => {
                            setQuizSubmitted(false);
                            setCurrentQuestionIndex(0);
                            setAnswers({});
                            setSaveStatus("");
                            setQuizRecap([]);
                            
                            // Restore original time
                            try {
                              const config = JSON.parse(moduleData.contentPath || "{}");
                              if (config.timeLimit && config.timeLimit > 0) {
                                const limitSeconds = config.timeLimit * 60;
                                setTimeLeft(limitSeconds);
                                localStorage.setItem(`quiz_timeleft_${moduleId}`, limitSeconds.toString());
                              }
                            } catch (e) {}
                          }}
                          className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm inline-flex items-center gap-2"
                        >
                          <RotateCw className="w-5 h-5" /> Ulangi Kuis
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-slate-400">Anda tidak dapat mengulang kuis ini lagi.</p>
                    )}
                  </div>

                  {quizRecap && quizRecap.length > 0 && (
                    <div className="space-y-6">
                      <h4 className="font-bold text-slate-900 text-xl border-b border-slate-200 pb-3">Rekapitulasi Jawaban</h4>
                      {questions.map((q, idx) => {
                        const correctOId = quizRecap.find(r => r.qId === q.id)?.correctOId;
                        const userOId = answers[q.id];
                        const isCorrect = userOId === correctOId;

                        return (
                          <div key={q.id} className={`bg-white p-6 rounded-2xl border ${isCorrect ? 'border-emerald-200 shadow-sm' : 'border-red-200 shadow-sm'}`}>
                            <div className="flex gap-4 mb-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {idx + 1}
                              </div>
                              <h3 className="text-lg font-medium text-slate-900 leading-relaxed">
                                {q.text}
                              </h3>
                            </div>
                            
                            <div className="space-y-2 pl-12">
                              {q.options.map((opt: any) => {
                                const isUserChoice = opt.id === userOId;
                                const isUserCorrect = isUserChoice && opt.id === correctOId;
                                const isUserIncorrect = isUserChoice && opt.id !== correctOId;
                                
                                return (
                                  <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                                    isUserCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium' : 
                                    isUserIncorrect ? 'bg-red-50 border-red-200 text-red-900 font-medium' : 
                                    'bg-slate-50 border-slate-100 text-slate-500'
                                  }`}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                      isUserCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : 
                                      isUserIncorrect ? 'border-red-500 bg-red-500 text-white' : 
                                      'border-slate-300'
                                    }`}>
                                      {isUserCorrect && <CheckCircle className="w-3 h-3" />}
                                    </div>
                                    <span className="text-sm">{opt.text}</span>
                                    {isUserCorrect && <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">Jawaban Benar</span>}
                                    {isUserIncorrect && <span className="ml-auto text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">Jawaban Anda Salah</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
                  {/* Progress Header & Anti-cheat warning */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900 text-lg">Soal {currentQuestionIndex + 1} <span className="text-slate-400 font-medium text-sm">dari {questions.length}</span></h3>
                    
                    <div className="flex items-center gap-4">
                      {cheatWarnings > 0 && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                          <AlertTriangle className="w-4 h-4" />
                          Pelanggaran: {cheatWarnings}/3
                        </div>
                      )}
                      
                      <button 
                        onClick={() => setShowNavGrid(!showNavGrid)}
                        className="flex items-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <Grid className="w-4 h-4" /> Navigasi Soal
                      </button>
                    </div>
                  </div>

                  {/* Nav Grid Popup */}
                  {showNavGrid && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 flex gap-2.5 flex-wrap max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                      {questions.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setCurrentQuestionIndex(idx); setShowNavGrid(false); }}
                          className={`w-11 h-11 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${
                            idx === currentQuestionIndex 
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105' 
                              : answers[questions[idx].id] 
                                ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-200 hover:bg-indigo-100' 
                                : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Question Card */}
                  <div className="bg-white p-4 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex-1 select-none">
                    <h3 className="text-lg md:text-xl font-medium text-slate-900 mb-6 md:mb-8 leading-relaxed">
                      {questions[currentQuestionIndex].text}
                    </h3>
                    <div className="space-y-3">
                      {questions[currentQuestionIndex].options.map((opt: any) => {
                        const qId = questions[currentQuestionIndex].id;
                        const isSelected = answers[qId] === opt.id;
                        return (
                          <label key={opt.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                          }`}>
                            <input 
                              type="radio" 
                              name={`question-${qId}`}
                              value={opt.id}
                              checked={isSelected}
                              onChange={() => handleAnswer(qId, opt.id)}
                              className="hidden"
                            />
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-indigo-600' : 'border-slate-300'
                            }`}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                            </div>
                            <span className="text-base font-medium text-slate-700">{opt.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between mt-8">
                    <button 
                      onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Sebelumnya
                    </button>
                    
                    {currentQuestionIndex === questions.length - 1 ? (
                      <button 
                        onClick={handleQuizSubmit}
                        disabled={Object.keys(answers).length < questions.length}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" /> Kumpulkan
                      </button>
                    ) : (
                      <button 
                        onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-medium transition-colors"
                      >
                        Selanjutnya
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fallback if no content path and it's video/document */}
          {(!parsedContentUrl && (moduleData.type === 'VIDEO' || moduleData.type === 'DOCUMENT')) && (
            <div className="text-center p-12">
              <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                {getModuleIcon(moduleData.type, "w-8 h-8")}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Materi Belum Tersedia</h3>
              <p className="text-slate-500">Guru belum melampirkan berkas untuk modul ini.</p>
            </div>
          )}
            </>
          )}

        </div>

        {moduleData.type !== 'QUIZ' && moduleData.type !== 'CATEGORY' && moduleData.type !== 'GAMIFICATION' && !lockedReason && (
          <div className="mt-6 flex justify-end border-t border-slate-100 pt-6">
            {quizSubmitted ? (
              <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-xl font-bold shadow-sm border border-emerald-200 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Selesai
              </div>
            ) : (
              <button 
                onClick={() => handleSimulateScore(100)}
                disabled={
                  saveStatus === 'Menyimpan...' || 
                  (moduleData.type === 'VIDEO' && !isVideoFinished) ||
                  (moduleData.type === 'DOCUMENT' && pdfReadTime < PDF_MIN_TIME)
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 disabled:bg-slate-400"
              >
                {moduleData.type === 'VIDEO' && !isVideoFinished ? 'Selesaikan Video Dahulu' :
                 moduleData.type === 'DOCUMENT' && pdfReadTime < PDF_MIN_TIME ? `Wajib Baca (${PDF_MIN_TIME - pdfReadTime}s)` :
                 <><CheckCircle className="w-5 h-5" /> Tandai Selesai</>}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="w-full lg:w-80 shrink-0 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[50vh] lg:max-h-[800px]">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-2">
            <Menu className="w-5 h-5" />
            Daftar Materi
          </div>
          <h2 className="font-bold text-slate-900 leading-tight">{moduleData.course.title}</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {(() => {
            let activeCatLockDate: Date | null = null;
            
            return moduleData.course.modules.map((mod, index) => {
              const isActive = mod.id === moduleId;
            const isCompleted = completedModules.includes(mod.id);
            const prevMod = index > 0 ? moduleData.course.modules[index - 1] : null;
            
            let isLocked = false;
            let lockedMsg = "";
            let config: any = {};
            
            if (mod.contentPath && mod.contentPath.startsWith('{')) {
              try { config = JSON.parse(mod.contentPath); } catch (e) {}
            }

            if (mod.type === 'CATEGORY') {
               if (config.availableAt && new Date() < new Date(config.availableAt)) {
                 activeCatLockDate = new Date(config.availableAt);
               } else {
                 activeCatLockDate = null;
               }
            }

            if (config.requirePrevious && prevMod && !completedModules.includes(prevMod.id)) {
              isLocked = true;
              lockedMsg = "Selesaikan materi sebelumnya";
            }
            
            if (activeCatLockDate) {
              isLocked = true;
              lockedMsg = `Tersedia: ${activeCatLockDate.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}`;
            } else if (config.availableAt && new Date() < new Date(config.availableAt)) {
              isLocked = true;
              lockedMsg = `Tersedia: ${new Date(config.availableAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}`;
            }

            const itemContent = (
              <>
                <div className={clsx(
                  "mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                  isActive ? "bg-indigo-600 text-white" : 
                  isLocked ? "bg-slate-100 text-slate-400" :
                  isCompleted ? "bg-emerald-500 text-white" :
                  "bg-slate-200 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                )}>
                  {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : isLocked ? <Lock className="w-3.5 h-3.5" /> : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={clsx(
                    "text-sm font-medium line-clamp-2",
                    isActive ? "text-indigo-900" : 
                    isLocked ? "text-slate-400" : "text-slate-700"
                  )}>
                    {mod.title}
                  </h4>
                  {isLocked && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-red-500 font-bold truncate max-w-[120px]">{lockedMsg}</span>
                    </div>
                  )}
                </div>
              </>
            );
            if (mod.type === 'CATEGORY') {
              return (
                <div key={mod.id} className="mt-8 mb-3 px-3">
                  <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{mod.title}</h3>
                </div>
              );
            }

            const renderedItem = isLocked && !isActive ? (
                <div key={mod.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 border border-transparent opacity-60 cursor-not-allowed">
                  {itemContent}
                </div>
            ) : (
              <Link 
                key={mod.id} 
                href={`/course/${courseId}/module/${mod.id}`}
                className={clsx(
                  "flex items-start gap-3 p-3 rounded-xl transition-all group",
                  isActive ? "bg-indigo-50 border border-indigo-100 shadow-sm" : 
                  "hover:bg-slate-50 border border-transparent"
                )}
              >
                {itemContent}
              </Link>
            );

            return renderedItem;
            });
          })()}

          {/* Certificate Download Button */}
          {(() => {
            if (!moduleData?.course?.hasCertificate) return null;
            
            const courseModules = moduleData.course.modules.filter((m: any) => m.type !== 'CATEGORY');
            const allCompleted = courseModules.length > 0 && courseModules.every((m: any) => completedModules.includes(m.id));
            
            if (!allCompleted) return null;

            const enrollmentId = moduleData.course.enrollments && moduleData.course.enrollments.length > 0 
              ? moduleData.course.enrollments[0].id 
              : null;

            if (!enrollmentId) return null;

            return (
              <div className="mt-6 p-4 border border-emerald-100 bg-emerald-50/50 rounded-2xl flex flex-col items-center justify-center text-center mx-3 mb-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Kursus Selesai!</h3>
                <p className="text-xs text-slate-500 mb-4">Selamat, Anda telah menyelesaikan semua materi.</p>
                <Link 
                  href={`/certificate/generate/${enrollmentId}`}
                  target="_blank"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Unduh Sertifikat
                </Link>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
