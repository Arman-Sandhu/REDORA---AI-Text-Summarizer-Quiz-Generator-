import React from 'react';
import { HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmptyState({ title, description, suggestions = [], onSuggestionClick }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto space-y-6">
      {/* Dynamic Floating Document Graphic */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 bg-gradient-to-tr from-cyan-500/10 to-violet-500/10 rounded-3xl border border-white/[0.04] flex items-center justify-center relative shadow-inner"
      >
        <HelpCircle size={32} className="text-cyan-400/80" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-white/[0.04] flex items-center justify-center text-[10px] text-violet-400">
          📄
        </div>
      </motion.div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed max-w-sm">{description}</p>
      </div>

      {suggestions.length > 0 && (
        <div className="w-full space-y-3 pt-4">
          <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block">
            Suggested topics
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {suggestions.map((text, idx) => (
              <motion.button
                key={idx}
                onClick={() => onSuggestionClick && onSuggestionClick(text)}
                whileHover={{ scale: 1.02, borderColor: 'rgba(0, 212, 255, 0.25)' }}
                whileTap={{ scale: 0.98 }}
                className="py-2 px-4 text-xs font-semibold rounded-2xl bg-slate-900 border border-white/[0.04] text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                {text}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
