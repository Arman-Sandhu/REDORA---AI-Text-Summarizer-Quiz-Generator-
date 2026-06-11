import React, { useRef } from "react"
import { motion, useMotionTemplate, useMotionValue } from "framer-motion"
import { cn } from "../../lib/utils"

export const Input = React.forwardRef(({ className, type, icon: Icon, ...props }, ref) => {
  const radius = 150 // dynamic radius range for input spotlight
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const rect = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - rect.left)
    mouseY.set(clientY - rect.top)
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      className="group relative w-full overflow-hidden rounded-xl p-[1px] transition duration-300 bg-white/[0.04]"
      style={{
        background: useMotionTemplate`
          radial-gradient(
            ${radius}px circle at ${mouseX}px ${mouseY}px,
            rgba(99, 102, 241, 0.25),
            transparent 80%
          )
        `
      }}
    >
      <div className="relative flex items-center w-full rounded-[11px] bg-[#060606] py-1 px-1">
        {Icon && (
          <div className="absolute left-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-lg border-0 bg-transparent px-4 text-sm text-white ring-offset-black placeholder:text-zinc-600 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 font-sans",
            Icon ? "pl-10" : "",
            className
          )}
          {...props}
        />
      </div>
    </motion.div>
  )
})

Input.displayName = "Input"
