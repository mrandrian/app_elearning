"use client";

import { useState, useEffect, useRef } from "react";

export default function WordGridGame({ data, onScoreUpdate }: { data: any[], onScoreUpdate?: (score: number) => void }) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const lastReportedScore = useRef<number | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Always report 100 for Word Grid since it's just an exploration activity
    if (onScoreUpdate && lastReportedScore.current !== 100) {
      lastReportedScore.current = 100;
      onScoreUpdate(100);
    }
  }, [data, onScoreUpdate]);

  const toggleFlip = (id: string) => {
    const newFlipped = new Set(flipped);
    if (newFlipped.has(id)) {
      newFlipped.delete(id);
    } else {
      newFlipped.add(id);
    }
    setFlipped(newFlipped);
  };

  if (!data || data.length === 0) {
    return <div className="text-center p-8 text-slate-500">Tidak ada kartu.</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
      <p className="text-center text-slate-500 mb-8 font-medium">Klik pada kartu untuk melihat baliknya.</p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.map((card) => {
          const isFlipped = flipped.has(card.id);
          return (
            <button
              key={card.id}
              onClick={() => toggleFlip(card.id)}
              className="relative w-full aspect-square text-left outline-none group [perspective:1000px]"
            >
              <div 
                className={`w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
              >
                {/* Front */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-4 flex items-center justify-center text-center shadow-sm group-hover:border-indigo-300">
                  <span className="font-bold text-indigo-900 line-clamp-4">{card.front}</span>
                </div>
                
                {/* Back */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-4 flex items-center justify-center text-center shadow-sm">
                  <span className="font-medium text-emerald-900 overflow-y-auto max-h-full scrollbar-hide">{card.back}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
