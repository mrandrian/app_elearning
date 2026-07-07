"use client";

import { useState } from "react";
import { CheckCircle, RotateCw, ArrowRight, ArrowLeft } from "lucide-react";

export default function FlashcardGame({ data, onComplete }: { data: any[], onComplete: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!data || data.length === 0) {
    return <div className="text-center p-8 text-slate-500">Konten kartu kosong.</div>;
  }

  const card = data[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < data.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCompleted(true);
      onComplete();
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (completed) {
    return (
      <div className="text-center p-12 bg-emerald-50 rounded-3xl border border-emerald-100">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-emerald-900 mb-2">Selesai!</h3>
        <p className="text-emerald-700 mb-6">Anda telah mempelajari semua kartu.</p>
        <button 
          onClick={() => { setCompleted(false); setCurrentIndex(0); setIsFlipped(false); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-medium transition-colors"
        >
          Mulai Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-4 flex items-center justify-between text-sm font-medium text-slate-500">
        <span>Kartu {currentIndex + 1} dari {data.length}</span>
      </div>
      
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full aspect-[4/3] sm:aspect-video relative perspective-1000 cursor-pointer group"
      >
        <div className={`w-full h-full absolute top-0 left-0 transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden bg-white border-2 border-indigo-100 rounded-3xl shadow-sm flex flex-col items-center justify-center p-8 text-center group-hover:border-indigo-300 transition-colors">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{card.front}</h2>
            <p className="absolute bottom-6 text-indigo-400 flex items-center gap-2 text-sm font-medium">
              <RotateCw className="w-4 h-4" /> Klik untuk membalik
            </p>
          </div>
          
          {/* Back */}
          <div className="absolute w-full h-full backface-hidden bg-indigo-600 border-2 border-indigo-600 rounded-3xl shadow-lg flex flex-col items-center justify-center p-8 text-center rotate-y-180">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">{card.back}</h2>
            <p className="absolute bottom-6 text-indigo-200 flex items-center gap-2 text-sm font-medium">
              <RotateCw className="w-4 h-4" /> Klik untuk membalik
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-8">
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-4 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={handleNext}
          className="flex items-center gap-2 px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          {currentIndex === data.length - 1 ? "Selesai" : "Kartu Berikutnya"}
          {currentIndex !== data.length - 1 && <ArrowRight className="w-5 h-5" />}
        </button>
      </div>

      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
