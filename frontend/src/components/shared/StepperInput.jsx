import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StepperInput({ value, onChange, min = 1, max = 20, label }) {
  const handleDecrement = (e) => {
    e.stopPropagation();
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (value < max) onChange(value + 1);
  };

  return (
    <div className="flex flex-col gap-2 bg-[#0f1117]/60 border border-white/[0.04] p-4 rounded-2xl w-full">
      {label && (
        <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider select-none">
          {label}
        </span>
      )}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-10 h-10 rounded-xl bg-slate-900 border border-white/[0.04] flex items-center justify-center text-lg font-bold text-slate-400 hover:text-white hover:border-cyan-500/30 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          −
        </button>

        {/* Number Box with flip-X transition */}
        <div className="relative overflow-hidden h-10 flex items-center justify-center flex-1 font-display text-xl font-extrabold text-white">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={value}
              initial={{ rotateX: -90, opacity: 0, y: 15 }}
              animate={{ rotateX: 0, opacity: 1, y: 0 }}
              exit={{ rotateX: 90, opacity: 0, y: -15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="inline-block"
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-10 h-10 rounded-xl bg-slate-900 border border-white/[0.04] flex items-center justify-center text-lg font-bold text-slate-400 hover:text-white hover:border-cyan-500/30 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          +
        </button>
      </div>
    </div>
  );
}
