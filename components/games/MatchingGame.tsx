"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";

export default function MatchingGame({ data, onComplete, onScoreUpdate }: { data: any[], onComplete?: () => void, onScoreUpdate?: (score: number) => void }) {
  const [leftItems, setLeftItems] = useState<{id: string, text: string}[]>([]);
  const [rightItems, setRightItems] = useState<{id: string, text: string}[]>([]);
  
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  
  const [completed, setCompleted] = useState(false);
  const lastReportedScore = useRef<number | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Shuffle the items
    const lefts = data.map(d => ({ id: d.id, text: d.pair1 })).sort(() => Math.random() - 0.5);
    const rights = data.map(d => ({ id: d.id, text: d.pair2 })).sort(() => Math.random() - 0.5);
    
    setLeftItems(lefts);
    setRightItems(rights);
  }, [data]);

  useEffect(() => {
    if (selectedLeft && selectedRight) {
      if (selectedLeft === selectedRight) {
        // Match!
        setMatchedPairs([...matchedPairs, selectedLeft]);
        setSelectedLeft(null);
        setSelectedRight(null);
        
        if (matchedPairs.length + 1 === data.length) {
          setTimeout(() => {
            setCompleted(true);
            if (onComplete) onComplete();
          }, 500);
        }
      } else {
        // Mismatch
        setMistakes(m => m + 1);
        setTimeout(() => {
          setSelectedLeft(null);
          setSelectedRight(null);
        }, 800);
      }
    }
  }, [selectedLeft, selectedRight, matchedPairs, data, onComplete]);

  useEffect(() => {
    if (data && data.length > 0 && onScoreUpdate) {
      const maxMistakes = data.length;
      let score = ((data.length - Math.min(mistakes, maxMistakes)) / data.length) * 100;
      score = Math.max(0, Math.round(score));
      if (score !== lastReportedScore.current) {
        lastReportedScore.current = score;
        onScoreUpdate(score);
      }
    }
  }, [matchedPairs, mistakes, data, onScoreUpdate]);

  if (!data || data.length === 0) {
    return <div className="text-center p-8 text-slate-500">Konten kosong.</div>;
  }



  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
      <div className="mb-8 text-center">
        <p className="text-slate-500 font-medium">Klik untuk mencocokkan item di kiri dengan pasangannya di kanan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          {leftItems.map(item => {
            const isMatched = matchedPairs.includes(item.id);
            const isSelected = selectedLeft === item.id;
            const isError = selectedLeft === item.id && selectedRight !== null && selectedRight !== item.id;

            return (
              <button
                key={`l-${item.id}`}
                onClick={() => !isMatched && !selectedRight && setSelectedLeft(item.id === selectedLeft ? null : item.id)}
                disabled={isMatched || (selectedLeft !== null && selectedRight !== null)}
                className={`w-full p-4 rounded-xl text-left font-medium transition-all duration-200 border-2 ${
                  isMatched ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed' :
                  isError ? 'bg-red-50 border-red-400 text-red-700 animate-pulse' :
                  isSelected ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm scale-[1.02]' :
                  'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                {item.text}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          {rightItems.map(item => {
            const isMatched = matchedPairs.includes(item.id);
            const isSelected = selectedRight === item.id;
            const isError = selectedRight === item.id && selectedLeft !== null && selectedLeft !== item.id;

            return (
              <button
                key={`r-${item.id}`}
                onClick={() => !isMatched && selectedLeft && setSelectedRight(item.id)}
                disabled={isMatched || (selectedLeft !== null && selectedRight !== null) || !selectedLeft}
                className={`w-full p-4 rounded-xl text-left font-medium transition-all duration-200 border-2 ${
                  isMatched ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed' :
                  isError ? 'bg-red-50 border-red-400 text-red-700 animate-pulse' :
                  isSelected ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm scale-[1.02]' :
                  'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                } ${!selectedLeft && !isMatched ? 'cursor-not-allowed opacity-80' : ''}`}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
