import React from 'react';
import { motion } from 'framer-motion';

export default function GlowButton({ children, onClick, disabled = false, className = "", type = "button" }) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.025 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={`relative overflow-hidden py-3.5 px-6 font-bold text-xs rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none select-none ${
        !disabled ? 'hover:shadow-cyan-400/20 hover:border-cyan-400' : ''
      } ${className}`}
    >
      {/* Sweeping Shimmer Animation */}
      {!disabled && (
        <span className="absolute inset-0 block w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-[shimmer-slide_2.5s_infinite_linear]" />
      )}
      {children}
    </motion.button>
  );
}
