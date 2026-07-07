"use client";

import { useEffect } from "react";

export default function WordwallEmbed({ data, onScoreUpdate }: { data: string, onScoreUpdate?: (score: number) => void }) {
  
  useEffect(() => {
    // Wordwall embed doesn't easily expose scores via postMessage unless configured
    // So we just give 100% simply because they interacted with the slide.
    if (onScoreUpdate) {
      onScoreUpdate(100);
    }
  }, [onScoreUpdate]);

  if (!data) {
    return <div className="text-center p-8 text-slate-500">URL Embed Kosong.</div>;
  }

  // Ensure it's an embed URL or just use the raw string if it's already an iframe
  // Wordwall URLs typically look like: https://wordwall.net/embed/play/123/456/789
  let embedUrl = data;
  if (data.includes('<iframe')) {
    const srcMatch = data.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) {
      embedUrl = srcMatch[1];
    }
  } else if (!data.includes('embed') && data.includes('wordwall.net/play/')) {
    embedUrl = data.replace('/play/', '/embed/play/');
  }

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <iframe 
        src={embedUrl} 
        className="w-full h-full min-h-[500px] border-0"
        allowFullScreen
        title="Wordwall Game"
      />
    </div>
  );
}
