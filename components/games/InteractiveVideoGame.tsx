"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Play, Pause } from "lucide-react";

type Checkpoint = {
  id: string;
  time: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
};

type VideoData = {
  videoUrl: string;
  checkpoints: Checkpoint[];
};

export default function InteractiveVideoGame({
  data,
  onScoreUpdate,
}: {
  data: VideoData;
  onScoreUpdate: (score: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [answeredCheckpoints, setAnsweredCheckpoints] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-pause when reaching a checkpoint
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = Math.floor(videoRef.current.currentTime);
    
    const cp = data.checkpoints?.find(
      (c) => c.time === currentTime && !answeredCheckpoints[c.id]
    );

    if (cp && !activeCheckpoint) {
      videoRef.current.pause();
      setIsPlaying(false);
      setActiveCheckpoint(cp);
    }
  };

  const handleAnswer = (optIdx: number) => {
    if (!activeCheckpoint) return;

    const isCorrect = optIdx === activeCheckpoint.correctOptionIndex;
    const newAnswered = { ...answeredCheckpoints, [activeCheckpoint.id]: isCorrect };
    setAnsweredCheckpoints(newAnswered);
    
    let correctCount = 0;
    Object.values(newAnswered).forEach(v => { if(v) correctCount++ });

    const totalCheckpoints = data.checkpoints?.length || 1;
    const newScore = Math.round((correctCount / totalCheckpoints) * 100);
    setScore(newScore);
    onScoreUpdate(newScore);

    // Hide question after 2 seconds
    setTimeout(() => {
      setActiveCheckpoint(null);
      if (videoRef.current) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }, 1500);
  };

  const togglePlay = () => {
    if (activeCheckpoint) return; // Can't play while question is active
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  if (!data?.videoUrl) {
    return <div className="text-center p-8 text-slate-500">Video belum dikonfigurasi.</div>;
  }

  // Handle YouTube or direct MP4
  const isYouTube = data.videoUrl.includes("youtube.com") || data.videoUrl.includes("youtu.be");
  
  if (isYouTube) {
    // Advanced YouTube interactive video requires YouTube IFrame API to get currentTime.
    // For simplicity, we just show a message.
    return (
      <div className="text-center p-8 text-red-500 font-medium">
        Fitur interaktif YouTube belum didukung secara native. Harap gunakan URL .mp4 langsung.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg group">
        <video
          ref={videoRef}
          src={data.videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          controls={!activeCheckpoint} // Hide controls during questions to prevent skipping
        />

        {/* Custom Play/Pause Overlay for UX */}
        {!isPlaying && !activeCheckpoint && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity"
            onClick={togglePlay}
          >
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Question Overlay */}
        {activeCheckpoint && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 z-20">
            <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-slate-800 mb-6 text-center leading-relaxed">
                {activeCheckpoint.question}
              </h3>
              
              <div className="space-y-3">
                {activeCheckpoint.options.map((opt, idx) => {
                  const hasAnswered = answeredCheckpoints[activeCheckpoint.id] !== undefined;
                  const isCorrect = idx === activeCheckpoint.correctOptionIndex;
                  const wasSelected = false; // We just flash the answer immediately
                  
                  let btnColor = "bg-white border-slate-200 hover:bg-slate-50 hover:border-indigo-300";
                  if (hasAnswered) {
                    if (isCorrect) {
                      btnColor = "bg-emerald-50 border-emerald-500 text-emerald-700";
                    } else {
                      btnColor = "bg-slate-50 border-slate-200 text-slate-400 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={hasAnswered}
                      onClick={() => handleAnswer(idx)}
                      className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all ${btnColor} flex justify-between items-center`}
                    >
                      <span>{opt}</span>
                      {hasAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>

              {answeredCheckpoints[activeCheckpoint.id] !== undefined && (
                <div className="mt-6 text-center animate-in fade-in">
                  {answeredCheckpoints[activeCheckpoint.id] ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Jawaban Benar!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full text-sm">
                      <XCircle className="w-4 h-4" /> Jawaban Salah
                    </span>
                  )}
                  <p className="text-xs text-slate-500 mt-2 font-medium">Video akan dilanjutkan...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-sm font-medium">Titik Kuis Selesai:</span>
          <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-sm font-bold">
            {Object.keys(answeredCheckpoints).length} / {data.checkpoints?.length || 0}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-sm font-medium">Skor Sementara:</span>
          <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-sm font-bold">
            {score}
          </span>
        </div>
      </div>
    </div>
  );
}
