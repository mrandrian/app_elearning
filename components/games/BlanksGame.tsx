"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";

export default function BlanksGame({ data, onComplete, onScoreUpdate }: { data: any, onComplete?: () => void, onScoreUpdate?: (score: number) => void }) {
  const [parts, setParts] = useState<{type: 'text' | 'blank', content: string, index?: number}[]>([]);
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  const [isChecking, setIsChecking] = useState(false);
  const [completed, setCompleted] = useState(false);
  const lastReportedScore = useRef<number | null>(null);
  useEffect(() => {
    let correct = 0;
    let total = 0;
    
    parts.forEach(p => {
      if (p.type === 'blank') {
        total++;
        const userAns = answers[p.index!]?.trim().toLowerCase() || "";
        if (userAns === p.content.toLowerCase()) {
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

  useEffect(() => {
    const textData = typeof data === 'string' ? data : data?.text;
    if (!textData) return;
    
    const textParts = textData.split(/(\[.*?\])/g);
    let blankIdx = 0;
    
    const parsed = textParts.map((part: string) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const val = part.slice(1, -1);
        return { type: 'blank', content: val, index: blankIdx++ };
      }
      return { type: 'text', content: part };
    });
    
    setParts(parsed);
  }, [data]);

  // The user inputs will just be green/red if we want, or neutral until the end?
  // User asked to "hilangkan opsi untuk periksa jawaban", which usually implies it's a test.
  // We can just keep the inputs neutral.

  const textData = typeof data === 'string' ? data : data?.text;
  if (!textData) {
    return <div className="text-center p-8 text-slate-500">Konten kosong.</div>;
  }



  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
      <div className="mb-8">
        <p className="text-slate-500 font-medium">Isi bagian yang kosong dengan kata yang tepat.</p>
      </div>

      <div className="text-lg leading-loose text-slate-800">
        {parts.map((p, idx) => {
          if (p.type === 'blank') {
            const isCorrect = answers[p.index!]?.trim().toLowerCase() === p.content.toLowerCase();
            return (
              <input 
                key={idx}
                type="text"
                value={answers[p.index!] || ""}
                onChange={(e) => setAnswers({...answers, [p.index!]: e.target.value})}
                className="inline-block mx-1 w-32 px-2 py-1 text-center font-bold border-b-2 outline-none transition-colors border-indigo-300 text-indigo-700 bg-indigo-50/50 focus:border-indigo-600 focus:bg-indigo-50"
              />
            );
          }
          return <span key={idx}>{p.content}</span>;
        })}
      </div>

    </div>
  );
}
