"use client";

import { useState, useEffect, useRef } from "react";
import { GripVertical } from "lucide-react";

export default function DragTheWordGame({ data, onScoreUpdate }: { data: any, onScoreUpdate?: (score: number) => void }) {
  const [parts, setParts] = useState<{type: 'text' | 'blank', content: string, index?: number}[]>([]);
  const [wordBank, setWordBank] = useState<{id: string, word: string, used: boolean}[]>([]);
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const lastReportedScore = useRef<number | null>(null);

  useEffect(() => {
    const textData = typeof data === 'string' ? data : data?.text;
    if (!textData) return;
    
    const textParts = textData.split(/(\[.*?\])/g);
    let blankIdx = 0;
    const words: {id: string, word: string, used: boolean}[] = [];
    
    const parsed = textParts.map((part: string) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const val = part.slice(1, -1);
        words.push({ id: Math.random().toString(), word: val, used: false });
        return { type: 'blank', content: val, index: blankIdx++ };
      }
      return { type: 'text', content: part };
    });
    
    setParts(parsed);
    setWordBank(words.sort(() => Math.random() - 0.5));
  }, [data]);

  useEffect(() => {
    let correct = 0;
    let total = 0;
    
    parts.forEach(p => {
      if (p.type === 'blank') {
        total++;
        if (answers[p.index!] === p.content) {
          correct++;
        }
      }
    });

    if (total > 0 && onScoreUpdate) {
      const score = Math.round((correct / total) * 100);
      if (score !== lastReportedScore.current) {
        lastReportedScore.current = score;
        onScoreUpdate(score);
      }
    }
  }, [answers, parts, onScoreUpdate]);

  const handleBankClick = (id: string) => {
    const word = wordBank.find(w => w.id === id);
    if (word && !word.used) {
      setSelectedBankId(selectedBankId === id ? null : id);
    }
  };

  const handleSlotClick = (index: number) => {
    if (selectedBankId) {
      // Place the selected word into the slot
      const wordObj = wordBank.find(w => w.id === selectedBankId);
      if (wordObj) {
        // If the slot already has a word, return it to the bank
        const existingAns = answers[index];
        setWordBank(prev => prev.map(w => {
          if (w.id === selectedBankId) return { ...w, used: true };
          if (existingAns && w.word === existingAns && w.used) {
            // we just return one instance to the bank
            // To be precise, we should track which bank ID is in which slot.
            // But string matching is easier for now.
            return { ...w }; 
          }
          return w;
        }));
        
        setAnswers({ ...answers, [index]: wordObj.word });
        setSelectedBankId(null);
      }
    } else if (answers[index]) {
      // Remove the word from the slot and return to bank
      const wordToRemove = answers[index];
      setWordBank(prev => {
        const newBank = [...prev];
        const bankIdx = newBank.findIndex(w => w.word === wordToRemove && w.used);
        if (bankIdx !== -1) {
          newBank[bankIdx].used = false;
        }
        return newBank;
      });
      const newAnswers = { ...answers };
      delete newAnswers[index];
      setAnswers(newAnswers);
    }
  };

  const textData = typeof data === 'string' ? data : data?.text;
  if (!textData) {
    return <div className="text-center p-8 text-slate-500">Konten kosong.</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
      <div className="mb-8 text-center">
        <p className="text-slate-500 font-medium">Klik kata di kotak bawah, lalu klik bagian rumpang untuk memindahkannya.</p>
      </div>

      <div className="text-lg leading-loose text-slate-800 mb-12">
        {parts.map((p, idx) => {
          if (p.type === 'blank') {
            const hasAnswer = !!answers[p.index!];
            return (
              <button 
                key={idx}
                onClick={() => handleSlotClick(p.index!)}
                className={`inline-flex items-center justify-center mx-1 min-w-[100px] h-10 px-4 rounded-xl font-bold border-2 transition-all cursor-pointer ${
                  hasAnswer 
                    ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm'
                    : selectedBankId ? 'border-amber-400 border-dashed bg-amber-50 animate-pulse' : 'border-slate-300 border-dashed bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {hasAnswer ? answers[p.index!] : ''}
              </button>
            );
          }
          return <span key={idx}>{p.content}</span>;
        })}
      </div>

      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <GripVertical className="w-4 h-4" /> Kumpulan Kata
        </h4>
        <div className="flex flex-wrap gap-3">
          {wordBank.map(item => (
            <button
              key={item.id}
              onClick={() => handleBankClick(item.id)}
              disabled={item.used}
              className={`px-4 py-2 rounded-xl font-bold transition-all shadow-sm border-2 ${
                item.used 
                  ? 'bg-slate-100 border-slate-200 text-slate-300 opacity-50 cursor-not-allowed'
                  : selectedBankId === item.id
                    ? 'bg-amber-500 border-amber-600 text-white scale-105 ring-4 ring-amber-500/20'
                    : 'bg-white border-amber-200 text-amber-700 hover:border-amber-400 hover:bg-amber-50 cursor-pointer'
              }`}
            >
              {item.word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
