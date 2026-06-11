export const springs = {
  stiff: { type: "spring", stiffness: 300, damping: 30 },
  medium: { type: "spring", stiffness: 200, damping: 25 },
  bouncy: { type: "spring", stiffness: 400, damping: 15 },
  soft: { type: "spring", stiffness: 100, damping: 20 }
}

export const transitions = {
  fast: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }, // cubic-bezier style
  smooth: { duration: 0.4, ease: [0.32, 0.72, 0, 1] }
}

// Shared layouts
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: transitions.smooth
}

export const scaleInReveal = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: -5 },
  transition: springs.medium
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
}

export const listItemReveal = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: springs.medium }
}
