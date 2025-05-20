import {
  motion,
  useAnimationControls,
  useMotionValue,
  useTransform,
} from "motion/react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { useEffect, useState } from "react"

export interface NumberBubbleProps {
  number: number
  size?: "xs" | "sm" | "md" | "lg"
  variant?: "default" | "highlight" | "muted" | "used" | "available"
  index?: number // For staggered animations
  className?: string
  onClick?: () => void
  pulseOnRender?: boolean // Whether to pulse when first rendered
  interactive?: boolean // Whether to show hover effects even without onClick
}

export function NumberBubble({
  number,
  size = "md",
  variant = "default",
  index = 0,
  className,
  onClick,
  pulseOnRender = false,
  interactive = true,
}: NumberBubbleProps) {
  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion()

  // Animation controls for programmatic animations
  const controls = useAnimationControls()

  // Motion values for interactive effects
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Transform mouse position to rotation
  const rotateX = useTransform(mouseY, [-20, 20], [5, -5])
  const rotateY = useTransform(mouseX, [-20, 20], [-5, 5])

  // State for tracking if the bubble is being hovered
  const [isHovered, setIsHovered] = useState(false)

  // Pulse animation on initial render if specified
  useEffect(() => {
    if (pulseOnRender && !prefersReducedMotion) {
      controls.start({
        scale: [1, 1.15, 1],
        transition: { duration: 0.5, times: [0, 0.5, 1] },
      })
    }
  }, [pulseOnRender, controls, prefersReducedMotion])

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
    highlight:
      "bg-primary text-primary-foreground border border-primary shadow-md",
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
      },
    },
    hover: {
      scale: 1.1,
      boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
      backgroundColor: variant === "default" ? "var(--accent)" : undefined,
      color: variant === "default" ? "var(--accent-foreground)" : undefined,
      borderColor: variant === "default" ? "var(--accent)" : undefined,
      transition: {
        scale: {
          type: "spring",
          stiffness: 400,
          damping: 10,
          duration: prefersReducedMotion ? 0.1 : 0.3,
        },
        backgroundColor: { duration: 0.2 },
        color: { duration: 0.2 },
        borderColor: { duration: 0.2 },
      },
    },
    tap: {
      scale: 0.92,
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
        duration: 0.1,
      },
    },
  }

  // Handle mouse move for 3D effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !interactive) return

    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    mouseX.set(e.clientX - centerX)
    mouseY.set(e.clientY - centerY)
  }

  // Reset position when mouse leaves
  const handleMouseLeave = () => {
    if (prefersReducedMotion || !interactive) return

    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }

  return (
    <motion.div
      className={cn(
        "flex items-center justify-center rounded-full font-medium relative",
        sizeClasses[size],
        variantClasses[variant],
        className,
        (interactive || onClick) && "cursor-pointer"
      )}
      variants={bubbleVariants}
      initial='hidden'
      animate={controls}
      whileInView='visible'
      whileHover={interactive || onClick ? "hover" : undefined}
      whileTap={interactive || onClick ? "tap" : undefined}
      onClick={onClick}
      custom={index}
      aria-label={`Number ${number}`}
      aria-selected={variant === "highlight"}
      aria-disabled={variant === "muted"}
      aria-description={
        variant === "highlight"
          ? "Highlighted number"
          : variant === "muted"
          ? "Unavailable number"
          : variant === "used"
          ? "Previously used number"
          : variant === "available"
          ? "Available number"
          : "Number"
      }
      style={{
        rotateX: interactive && !prefersReducedMotion ? rotateX : 0,
        rotateY: interactive && !prefersReducedMotion ? rotateY : 0,
        transformStyle: "preserve-3d",
        perspective: 800,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : "status"}
      aria-live={variant === "highlight" ? "polite" : "off"}
    >
      {/* Number with subtle text shadow for depth */}
      <span
        className={cn(
          "relative z-10",
          isHovered && !prefersReducedMotion && "text-shadow-sm"
        )}
      >
        {number}
      </span>

      {/* Subtle glow effect on hover */}
      {isHovered && !prefersReducedMotion && variant !== "muted" && (
        <motion.div
          className='absolute inset-0 rounded-full opacity-0 z-0'
          initial={{ opacity: 0 }}
          animate={{
            opacity: 0.15,
            boxShadow:
              variant === "highlight"
                ? "0 0 12px 2px var(--primary)"
                : "0 0 12px 2px var(--accent)",
          }}
          style={{ backgroundColor: "transparent" }}
        />
      )}
    </motion.div>
  )
}
