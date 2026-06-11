import React, { useRef, useState } from "react"
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion"
import { cn } from "../../lib/utils"
import { springs } from "../../lib/motion"

export const Button = React.forwardRef(({ 
  children, 
  className, 
  variant = "primary", 
  size = "default", 
  magnetic = false,
  isLoading = false,
  ...props 
}, ref) => {
  
  // Magnetic effect mechanics
  const localRef = useRef(null)
  const combinedRef = ref || localRef
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  // Apply spring configuration to mouse movements
  const springX = useSpring(x, springs.stiff)
  const springY = useSpring(y, springs.stiff)

  const handleMouseMove = (e) => {
    if (!magnetic) return
    const rect = combinedRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const mouseX = e.clientX - rect.left - rect.width / 2
    const mouseY = e.clientY - rect.top - rect.height / 2
    
    // Pull strength limit
    x.set(mouseX * 0.25)
    y.set(mouseY * 0.25)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const variants = {
    primary: "bg-white text-black hover:bg-[#f4f4f5] border border-transparent shadow-[0_1px_10px_rgba(255,255,255,0.15)] hover:shadow-[0_1px_20px_rgba(255,255,255,0.25)]",
    secondary: "bg-[#121212] text-zinc-300 border border-[#262626] hover:bg-[#1a1a1a] hover:text-white hover:border-[#3a3a3a]",
    ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent",
    accent: "bg-gradient-to-r from-accent-blue to-accent-violet text-white border-transparent shadow-[0_0_25px_rgba(99,102,241,0.3)] hover:shadow-[0_0_35px_rgba(99,102,241,0.5)]"
  }

  const sizes = {
    sm: "px-4 py-2 text-xs font-medium rounded-lg gap-1.5",
    default: "px-6 py-3 text-sm font-semibold rounded-xl gap-2",
    lg: "px-8 py-4 text-base font-semibold rounded-2xl gap-2.5"
  }

  return (
    <motion.button
      ref={combinedRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={magnetic ? { x: springX, y: springY } : {}}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden whitespace-nowrap transition-all active:outline-none select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none font-sans font-medium",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {/* Internal shimmer layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.8),transparent)]" />
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </div>
      ) : children}
    </motion.button>
  )
})

Button.displayName = "Button"
