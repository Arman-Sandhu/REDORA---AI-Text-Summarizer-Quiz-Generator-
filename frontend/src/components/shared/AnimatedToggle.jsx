import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedToggle({ checked, onChange, label, activeLabel = "Yes", inactiveLabel = "No" }) {
  return (
    <div className="bg-[#0f1117]/60 border border-white/[0.04] p-4 rounded-2xl flex items-center justify-between gap-4 w-full select-none">
      <div className="space-y-0.5">
        {label && <h4 className="text-xs font-bold text-white tracking-tight">{label}</h4>}
        <p className="text-[10px] text-slate-500 font-medium font-sans">
          {checked ? activeLabel : inactiveLabel}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-all duration-300 flex items-center ${
          checked ? 'bg-cyan-500 shadow-md shadow-cyan-500/20' : 'bg-slate-800'
        }`}
      >
        <motion.div
          layout
          className="w-5 h-5 rounded-full bg-white shadow"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
