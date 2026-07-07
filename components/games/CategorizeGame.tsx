"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle, Inbox } from "lucide-react";

export default function CategorizeGame({ data, onScoreUpdate }: { data: any, onScoreUpdate?: (score: number) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [placed, setPlaced] = useState<{[itemId: string]: string}>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const lastReportedScore = useRef<number | null>(null);

  useEffect(() => {
    if (!data || !data.items || !data.categories) return;
    setItems([...data.items].sort(() => Math.random() - 0.5));
    setPlaced({});
  }, [data]);

  useEffect(() => {
    if (!data || !data.items) return;
    const total = data.items.length;
    if (total === 0) return;

    let correct = 0;
    data.items.forEach((item: any) => {
      if (placed[item.id] === item.category) {
        correct++;
      }
    });

    const score = Math.round((correct / total) * 100);
    if (onScoreUpdate && score !== lastReportedScore.current) {
      lastReportedScore.current = score;
      onScoreUpdate(score);
    }
  }, [placed, data, onScoreUpdate]);

  const handleItemClick = (id: string) => {
    if (placed[id]) {
      // Remove from bucket
      const newPlaced = { ...placed };
      delete newPlaced[id];
      setPlaced(newPlaced);
    } else {
      setSelectedItemId(selectedItemId === id ? null : id);
    }
  };

  const handleCategoryClick = (category: string) => {
    if (selectedItemId) {
      setPlaced({ ...placed, [selectedItemId]: category });
      setSelectedItemId(null);
    }
  };

  if (!data || !data.categories || data.categories.length === 0) {
    return <div className="text-center p-8 text-slate-500">Kategori kosong.</div>;
  }

  const unplacedItems = items.filter(i => !placed[i.id]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
      
      {/* Unplaced Items Bank */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 min-h-[120px]">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Inbox className="w-4 h-4" /> Item yang Belum Disortir
        </h4>
        <div className="flex flex-wrap gap-3">
          {unplacedItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm border-2 ${
                selectedItemId === item.id
                  ? 'bg-indigo-500 border-indigo-600 text-white scale-105 ring-4 ring-indigo-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              {item.text}
            </button>
          ))}
          {unplacedItems.length === 0 && (
            <p className="text-slate-400 italic text-sm my-auto">Semua item telah disortir!</p>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.categories.map((cat: string, idx: number) => {
          const categoryItems = items.filter(i => placed[i.id] === cat);
          const isTargeted = selectedItemId !== null;

          return (
            <div 
              key={idx}
              onClick={() => handleCategoryClick(cat)}
              className={`border-2 rounded-2xl p-4 min-h-[200px] flex flex-col transition-colors ${
                isTargeted 
                  ? 'border-indigo-300 bg-indigo-50/50 cursor-pointer hover:bg-indigo-100 hover:border-indigo-400' 
                  : 'border-slate-200 bg-white'
              }`}
            >
              <h3 className="font-black text-slate-800 mb-4 border-b-2 border-slate-100 pb-2 text-center">{cat}</h3>
              <div className="flex-1 flex flex-col gap-2">
                {categoryItems.map(item => (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemClick(item.id);
                    }}
                    className="w-full text-left px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-colors group relative"
                  >
                    {item.text}
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-rose-500 text-xs">Hapus</span>
                  </button>
                ))}
                {isTargeted && categoryItems.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-indigo-300 border-2 border-dashed border-indigo-200 rounded-xl">
                    Klik untuk letakkan
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
