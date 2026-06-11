import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

export default function Toast({ message, type = "error", onClose, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!message) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -15, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="fixed top-6 right-6 z-50 max-w-sm w-full"
      >
        <div className="premium-glass rounded-2xl p-4 overflow-hidden relative shadow-2xl flex items-start gap-3 bg-[#0f1117]/90">
          
          {/* Accent Success vs Danger icons */}
          {type === "success" ? (
            <CheckCircle className="text-emerald-400 shrink-0 mt-0.5" size={16} />
          ) : (
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
          )}

          <div className="flex-1 min-w-0 pr-4">
            <span className="text-xs font-semibold text-white tracking-wide leading-relaxed block">
              {message}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X size={12} />
          </button>

          {/* Shrinking Countdown Progress Bar */}
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            className={`absolute bottom-0 left-0 h-[2px] ${
              type === "success" ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
