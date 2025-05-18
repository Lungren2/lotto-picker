import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"

export interface NumberBubbleProps {
  number: number
  size?: "xs" | "sm" | "md" | "lg"
  variant?: "default" | "highlight" | "muted" | "used" | "available"
  index?: number // For staggered animations
  className?: string
  onClick?: () => void
}

export function NumberBubble({
  number,
  size = "md",
  variant = "default",
  index = 0,
  className,
  onClick,
}: NumberBubbleProps) {
  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion()

  // Size classes
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  }

  // Variant classes
  const variantClasses = {
    default: "bg-card border shadow-sm",
    highlight: "bg-primary text-primary-foreground border border-primary shadow-md",
    muted: "bg-muted/50 border border-dashed text-muted-foreground",
    used: "bg-secondary/20 border text-secondary-foreground",
    available: "bg-card/80 border border-accent text-accent-foreground",
  }

  // Animation variants
  const bubbleVariants = {
    hidden: { 
      scale: 0, 
      opacity: 0,
      rotate: prefersReducedMotion ? 0 : -10,
    },
    visible: { 
      scale: 1, 
      opacity: 1,
      rotate: 0,
      transition: {
        type: prefersReducedMotion ? "tween" : "spring",
        stiffness: 200,
        damping: 15,
        delay: prefersReducedMotion ? 0 : index * 0.05,
        duration: prefersReducedMotion ? 0.2 : 0.4,
      }
    },
    hover: { 
      scale: 1.1, 
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      backgroundColor: variant === "default" ? "var(--accent)" : undefined,
      transition: { 
        duration: prefersReducedMotion ? 0.1 : 0.2 
      }
    },
    tap: { 
      scale: 0.95,
      transition: { 
        duration: 0.1 
      }
    },
  }

  return (
    <motion.div
      className={cn(
        "flex items-center justify-center rounded-full font-medium",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      whileHover={onClick ? "hover" : undefined}
      whileTap={onClick ? "tap" : undefined}
      onClick={onClick}
      custom={index}
      aria-label={`Number ${number}`}
    >
      {number}
    </motion.div>
  )
}
