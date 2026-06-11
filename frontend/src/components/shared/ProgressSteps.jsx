import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function ProgressSteps({ steps = [], currentStepIndex = 0 }) {
  return (
    <div className="flex flex-col gap-4 bg-[#0f1117]/60 border border-white/[0.04] p-6 rounded-3xl w-full max-w-lg mx-auto shadow-2xl relative overflow-hidden">
      {/* Spotlight neon glow inside loader */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      <h3 className="text-xs font-mono font-bold tracking-[0.2em] text-cyan-400 uppercase border-b border-white/[0.03] pb-3 mb-1">
        Working on it...
      </h3>

      <div className="space-y-4">
        {steps.map((stepText, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;
          
          return (
            <div key={idx} className="flex items-center gap-3.5 transition-all duration-300">
              {/* Checkbox badge circle */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-bold transition-all duration-500 shrink-0 ${
                  isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : isActive
                    ? 'border-cyan-400 text-cyan-400 animate-pulse'
                    : 'border-white/[0.04] text-slate-600'
                }`}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    <Check size={10} strokeWidth={3} />
                  </motion.div>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              <span
                className={`text-xs font-medium tracking-wide transition-colors duration-300 ${
                  isCompleted
                    ? 'text-slate-400 line-through decoration-slate-600'
                    : isActive
                    ? 'text-white'
                    : 'text-slate-600'
                }`}
              >
                {stepText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
