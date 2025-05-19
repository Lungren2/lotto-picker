import * as React from "react"
import { motion, type HTMLMotionProps } from "motion/react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"

// Enhanced card animation variants
const getCardVariants = (prefersReducedMotion: boolean) => ({
  hidden: {
    opacity: 0,
    y: prefersReducedMotion ? 10 : 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: prefersReducedMotion ? 0.2 : 0.4,
      type: prefersReducedMotion ? "tween" : "spring",
      stiffness: 100,
      damping: 15,
    },
  },
  hover: {
    y: prefersReducedMotion ? -2 : -5,
    boxShadow:
      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    transition: {
      duration: prefersReducedMotion ? 0.2 : 0.3,
    },
  },
  exit: {
    opacity: 0,
    y: prefersReducedMotion ? -10 : -20,
    scale: 0.98,
    transition: {
      duration: prefersReducedMotion ? 0.15 : 0.25,
    },
  },
})

function Card({
  className,
  interactive = false,
  ...props
}: HTMLMotionProps<"div"> & { interactive?: boolean }) {
  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion()

  // Get animation variants based on reduced motion preference
  const cardVariants = getCardVariants(prefersReducedMotion)

  return (
    <motion.div
      data-slot='card'
      variants={cardVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
      whileHover={interactive ? "hover" : undefined}
      layout
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm transition-shadow",
        interactive && "cursor-pointer",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot='card-header'
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot='card-title'
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot='card-description'
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot='card-action'
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot='card-content'
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot='card-footer'
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
