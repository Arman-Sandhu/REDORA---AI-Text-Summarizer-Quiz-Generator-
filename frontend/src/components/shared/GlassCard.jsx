import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({ children, className = "", onClick, hover = true }) {
  const isClickable = !!onClick;
  
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { y: -4, borderColor: 'rgba(0, 212, 255, 0.25)', boxShadow: '0 12px 40px rgba(0, 212, 255, 0.05)' } : {}}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`premium-glass rounded-3xl p-6 transition-colors duration-300 ${
        isClickable ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}
