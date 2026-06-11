import React from 'react';
import { FileText } from 'lucide-react';

export default function SourceBadge({ filename }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-white/[0.04] text-[10px] font-medium text-slate-400 hover:text-white transition-colors select-none font-sans"
      title={filename}
    >
      <FileText size={11} className="text-cyan-400 shrink-0" />
      <span className="truncate max-w-[150px]">{filename}</span>
    </div>
  );
}
