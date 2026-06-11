import React, { useRef } from "react"
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion"
import { cn } from "../../lib/utils"
import { springs } from "../../lib/motion"

export function Card({ children, className, interactive = true, ...props }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Physical 3D rotational parameters
  const rotateX = useSpring(0, springs.stiff)
  const rotateY = useSpring(0, springs.stiff)

  const handleMouseMove = (e) => {
    if (!interactive) return
    const { currentTarget, clientX, clientY } = e
    const rect = currentTarget.getBoundingClientRect()
    
    const x = clientX - rect.left
    const y = clientY - rect.top
    
    mouseX.set(x)
    mouseY.set(y)

    // 3D tilt math
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    // Maximum tilt range of 6 degrees
    const rx = ((y - centerY) / centerY) * -3
    const ry = ((x - centerX) / centerX) * 3
    
    rotateX.set(rx)
    rotateY.set(ry)
  }

  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  // Dynamic radial gradient mapped to the cursor position
  const background = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.05), transparent 80%)`
  const borderBackground = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.15), transparent 80%)`

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: rotateX,
        rotateY: rotateY,
        perspective: 1000,
        transformStyle: "preserve-3d"
      }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "group relative rounded-2xl bg-[#0a0a0a]/80 border border-white/[0.04] text-zinc-100 overflow-hidden premium-glass transition-shadow shadow-lg",
        className
      )}
      {...props}
    >
      {/* Outer border shimmer (Absolute masked overlay) */}
      {interactive && (
        <motion.div
          className="pointer-events-none absolute -inset-[1px] rounded-[inherit] opacity-0 group-hover:opacity-100 transition duration-300 z-0"
          style={{
            background: borderBackground,
            maskImage: "linear-gradient(black, black)",
            WebkitMaskImage: "linear-gradient(black, black)"
          }}
        />
      )}

      {/* Spotlight glow background */}
      {interactive && (
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 group-hover:opacity-100 transition duration-300 z-0"
          style={{ background }}
        />
      )}

      <div className="relative z-10 h-full" style={{ transform: "translateZ(20px)" }}>
        {children}
      </div>
    </motion.div>
  )
}

export function CardHeader({ children, className, ...props }) {
  return <div className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)} {...props}>{children}</div>
}

export function CardTitle({ children, className, ...props }) {
  return <h3 className={cn("text-xl font-bold tracking-tight text-white font-sans", className)} {...props}>{children}</h3>
}

export function CardDescription({ children, className, ...props }) {
  return <p className={cn("text-sm text-zinc-400 font-sans leading-relaxed", className)} {...props}>{children}</p>
}

export function CardContent({ children, className, ...props }) {
  return <div className={cn("p-6 pt-0 font-sans", className)} {...props}>{children}</div>
}

export function CardFooter({ children, className, ...props }) {
  return <div className={cn("flex items-center p-6 pt-0 mt-auto", className)} {...props}>{children}</div>
}
