"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const DIRS = [
  [0, 1],   // Right
  [1, 0],   // Down
  [1, 1],   // Diagonal Down-Right
  [-1, 1],  // Diagonal Up-Right
  [0, -1],  // Left
  [-1, 0],  // Up
  [-1, -1], // Diagonal Up-Left
  [1, -1],  // Diagonal Down-Left
];

export default function WordSearchGame({ data, onScoreUpdate }: { data: any[], onScoreUpdate?: (score: number) => void }) {
  const [grid, setGrid] = useState<string[][]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  
  const [selectionStart, setSelectionStart] = useState<{r: number, c: number} | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{r: number, c: number} | null>(null);
  const lastReportedScore = useRef<number | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;
    const wordList = data.map(d => d.word.toUpperCase());
    setWords(wordList);
    
    // Generate grid
    const size = Math.max(10, Math.max(...wordList.map(w => w.length)) + 2);
    const newGrid: string[][] = Array(size).fill(null).map(() => Array(size).fill(''));
    
    wordList.forEach(word => {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        const d = DIRS[Math.floor(Math.random() * DIRS.length)];
        const r = Math.floor(Math.random() * size);
        const c = Math.floor(Math.random() * size);
        
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          const nr = r + d[0] * i;
          const nc = c + d[1] * i;
          if (nr < 0 || nr >= size || nc < 0 || nc >= size) {
            canPlace = false;
            break;
          }
          if (newGrid[nr][nc] !== '' && newGrid[nr][nc] !== word[i]) {
            canPlace = false;
            break;
          }
        }
        
        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            newGrid[r + d[0] * i][c + d[1] * i] = word[i];
          }
          placed = true;
        }
        attempts++;
      }
    });

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (newGrid[r][c] === '') {
          newGrid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }
    
    setGrid(newGrid);
    setFoundWords([]);
    setFoundCells(new Set());
  }, [data]);

  useEffect(() => {
    if (words.length > 0 && onScoreUpdate) {
      const score = Math.round((foundWords.length / words.length) * 100);
      if (score !== lastReportedScore.current) {
        lastReportedScore.current = score;
        onScoreUpdate(score);
      }
    }
  }, [foundWords, words, onScoreUpdate]);

  const handleCellClick = (r: number, c: number) => {
    if (!selectionStart) {
      setSelectionStart({r, c});
      setSelectionEnd({r, c});
    } else if (!selectionEnd || (selectionStart.r === r && selectionStart.c === c)) {
      setSelectionStart(null);
      setSelectionEnd(null);
    } else {
      // Check word
      let dr = r - selectionStart.r;
      let dc = c - selectionStart.c;
      const steps = Math.max(Math.abs(dr), Math.abs(dc));
      
      // Must be a straight line
      if (Math.abs(dr) !== Math.abs(dc) && dr !== 0 && dc !== 0) {
        setSelectionStart({r, c});
        setSelectionEnd({r, c});
        return;
      }
      
      dr = dr === 0 ? 0 : dr / steps;
      dc = dc === 0 ? 0 : dc / steps;
      
      let selectedWord = "";
      const path: string[] = [];
      for (let i = 0; i <= steps; i++) {
        const cr = selectionStart.r + dr * i;
        const cc = selectionStart.c + dc * i;
        selectedWord += grid[cr][cc];
        path.push(`${cr},${cc}`);
      }

      const reverseWord = selectedWord.split('').reverse().join('');
      
      let matchedWord = "";
      if (words.includes(selectedWord) && !foundWords.includes(selectedWord)) {
        matchedWord = selectedWord;
      } else if (words.includes(reverseWord) && !foundWords.includes(reverseWord)) {
        matchedWord = reverseWord;
      }

      if (matchedWord) {
        setFoundWords([...foundWords, matchedWord]);
        const newFound = new Set(foundCells);
        path.forEach(p => newFound.add(p));
        setFoundCells(newFound);
      }
      
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  };

  const isSelected = (r: number, c: number) => {
    if (!selectionStart || !selectionEnd) return false;
    let dr = selectionEnd.r - selectionStart.r;
    let dc = selectionEnd.c - selectionStart.c;
    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    
    if (Math.abs(dr) !== Math.abs(dc) && dr !== 0 && dc !== 0) {
      return r === selectionStart.r && c === selectionStart.c;
    }
    
    dr = dr === 0 ? 0 : dr / Math.abs(dr); // Normalize manually instead of dr/steps to avoid -0
    dc = dc === 0 ? 0 : dc / Math.abs(dc);
    
    for (let i = 0; i <= steps; i++) {
      if (selectionStart.r + dr * i === r && selectionStart.c + dc * i === c) {
        return true;
      }
    }
    return false;
  };

  if (!data || data.length === 0) {
    return <div className="text-center p-8 text-slate-500">Daftar kata kosong.</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
      
      {/* Grid */}
      <div className="flex-1 flex justify-center items-center">
        <div className="inline-grid gap-1 bg-slate-100 p-2 rounded-2xl border border-slate-200">
          {grid.map((row, r) => (
            <div key={r} className="flex gap-1">
              {row.map((letter, c) => {
                const found = foundCells.has(`${r},${c}`);
                const selected = isSelected(r, c);
                const startNode = selectionStart?.r === r && selectionStart?.c === c;
                
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    onMouseEnter={() => {
                      if (selectionStart && !selected) {
                        setSelectionEnd({r, c});
                      }
                    }}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-lg sm:text-xl transition-colors select-none ${
                      startNode ? 'bg-indigo-600 text-white shadow-md scale-110 z-10' :
                      selected ? 'bg-indigo-400 text-white' :
                      found ? 'bg-emerald-400 text-white shadow-sm' : 
                      'bg-white text-slate-600 hover:bg-slate-200 hover:scale-105'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Word List */}
      <div className="w-full md:w-64 shrink-0 bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <h4 className="font-bold text-slate-800 mb-4">Kata yang dicari:</h4>
        <div className="flex flex-wrap md:flex-col gap-2">
          {words.map(w => {
            const isFound = foundWords.includes(w);
            return (
              <div 
                key={w} 
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                  isFound ? 'bg-emerald-100 border-emerald-200 text-emerald-700 line-through opacity-70' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {w}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 mt-6 leading-relaxed">
          <strong>Cara main:</strong> Klik huruf pertama dari kata, lalu geser (hover/klik) ke huruf terakhir. Kata bisa mendatar, menurun, atau diagonal.
        </p>
      </div>

    </div>
  );
}
