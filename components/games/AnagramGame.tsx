"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle, XCircle } from "lucide-react";

export default function AnagramGame({ data, onScoreUpdate }: { data: any[], onScoreUpdate?: (score: number) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [jumbled, setJumbled] = useState<{id: string, char: string, used: boolean}[]>([]);
  const [answer, setAnswer] = useState<{id: string, char: string}[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  const lastReportedScore = useRef<number | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;
    loadWord(0);
  }, [data]);

  const loadWord = (idx: number) => {
    if (!data[idx]) return;
    const word = data[idx].word.toUpperCase();
    let chars = word.split('').map((char: string) => ({ id: Math.random().toString(), char, used: false }));
    // Shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    setJumbled(chars);
    setAnswer([]);
  };

  const handleSelectChar = (item: {id: string, char: string, used: boolean}, idx: number) => {
    if (item.used) return;
    setJumbled(prev => {
      const next = [...prev];
      next[idx].used = true;
      return next;
    });
    setAnswer([...answer, { id: item.id, char: item.char }]);
  };

  const handleDeselectChar = (item: {id: string, char: string}, idx: number) => {
    setAnswer(prev => prev.filter((_, i) => i !== idx));
    setJumbled(prev => {
      const next = [...prev];
      const jIdx = next.findIndex(j => j.id === item.id);
      if (jIdx !== -1) next[jIdx].used = false;
      return next;
    });
  };

  const handleCheck = () => {
    const currentWord = data[currentIndex].word.toUpperCase();
    const isCorrect = answer.map(a => a.char).join('') === currentWord;
    
    const newResults = [...results, isCorrect];
    setResults(newResults);

    if (currentIndex < data.length - 1) {
      setCurrentIndex(prev => prev + 1);
      loadWord(currentIndex + 1);
    }
  };

  useEffect(() => {
    if (jumbled.length > 0 && answer.length === jumbled.length) {
      const timer = setTimeout(() => {
        handleCheck();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [answer, jumbled]);

  useEffect(() => {
    if (data && data.length > 0 && onScoreUpdate && results.length === data.length) {
      const correct = results.filter(r => r).length;
      const score = Math.round((correct / data.length) * 100);
      if (score !== lastReportedScore.current) {
        lastReportedScore.current = score;
        onScoreUpdate(score);
      }
    }
  }, [results, data, onScoreUpdate]);

  if (!data || data.length === 0) {
    return <div className="text-center p-8 text-slate-500">Daftar kata kosong.</div>;
  }

  if (results.length === data.length) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
        <h3 className="text-2xl font-bold text-slate-800 mb-6">Permainan Selesai!</h3>
        <div className="space-y-3">
          {data.map((d, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-700">{d.word}</span>
              {results[idx] ? <CheckCircle className="text-emerald-500 w-6 h-6" /> : <XCircle className="text-rose-500 w-6 h-6" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentItem = data[currentIndex];
  const isComplete = answer.length === jumbled.length;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
      <div className="text-sm font-bold text-slate-400 mb-6">Kata {currentIndex + 1} dari {data.length}</div>
      
      {currentItem.hint && (
        <p className="text-lg text-slate-600 mb-8 italic">"{currentItem.hint}"</p>
      )}

      {/* Answer Area */}
      <div className="flex flex-wrap justify-center gap-2 mb-12 min-h-[60px] p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        {answer.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => handleDeselectChar(item, idx)}
            className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-indigo-500 text-white text-2xl font-black rounded-xl shadow-sm hover:bg-indigo-600 transition-colors"
          >
            {item.char}
          </button>
        ))}
        {answer.length === 0 && <span className="text-slate-400 my-auto">Klik huruf di bawah untuk menyusun kata</span>}
      </div>

      {/* Jumbled Letters */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {jumbled.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => handleSelectChar(item, idx)}
            disabled={item.used}
            className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-2xl font-black rounded-xl transition-all border-b-4 ${
              item.used 
                ? 'bg-slate-100 text-slate-300 border-slate-200 opacity-50 cursor-not-allowed' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm active:border-b-0 active:translate-y-1'
            }`}
          >
            {item.char}
          </button>
        ))}
      </div>

    </div>
  );
}
