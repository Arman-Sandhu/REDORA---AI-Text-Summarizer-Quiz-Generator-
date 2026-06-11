import React from "react"
import { motion } from "framer-motion"
import { scaleInReveal } from "../../lib/motion"
import { cn } from "../../lib/utils"

export function PageWrapper({ children, className, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -4 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      className={cn("w-full h-full py-6 max-w-6xl mx-auto", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
