import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Check } from 'lucide-react';

export default function SelectableCard({ title, pageCount, selected, onClick, loading = false }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`relative p-5 rounded-3xl cursor-pointer border transition-all duration-300 select-none overflow-hidden ${
        selected
          ? 'bg-[#0f1117]/80 border-cyan-500 shadow-lg shadow-cyan-500/10'
          : 'bg-[#0f1117]/30 border-white/[0.04] hover:border-cyan-500/30'
      }`}
    >
      {/* Decorative active glow background */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-cyan-400 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="flex items-start gap-4">
        {/* Document Icon Box */}
        <div
          className={`p-3 rounded-2xl border transition-colors shrink-0 ${
            selected
              ? 'bg-slate-900 border-cyan-500/30 text-cyan-400'
              : 'bg-slate-900 border-white/[0.02] text-slate-400'
          }`}
        >
          <FileText size={18} />
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <h4
            className={`text-xs font-bold truncate leading-snug transition-colors ${
              selected ? 'text-white' : 'text-slate-300'
            }`}
            title={title}
          >
            {title}
          </h4>
          <span className="text-[10px] font-medium font-sans text-slate-500 block mt-1">
            {loading ? "Reading..." : `${pageCount} pages`}
          </span>
        </div>

        {/* Selected Check Indicator */}
        <div className="shrink-0 mt-0.5">
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
              selected
                ? 'bg-cyan-500 border-cyan-500 text-white'
                : 'border-white/[0.08]'
            }`}
          >
            <AnimatePresence>
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  <Check size={10} strokeWidth={3} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
