"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"

interface FadingScrollAreaProps
  extends React.ComponentProps<typeof ScrollArea> {
  /**
   * Whether to show the top fade gradient
   * @default true
   */
  showTopFade?: boolean

  /**
   * Whether to show the bottom fade gradient
   * @default true
   */
  showBottomFade?: boolean

  /**
   * Whether to show the left fade gradient
   * @default true
   */
  showLeftFade?: boolean

  /**
   * Whether to show the right fade gradient
   * @default true
   */
  showRightFade?: boolean

  /**
   * The size of the fade gradient in pixels or CSS value
   * @default "60px"
   */
  fadeSize?: string

  /**
   * The opacity of the fade gradient (0-1)
   * @default 0.95
   */
  fadeOpacity?: number

  /**
   * Custom class for the top fade gradient
   */
  topFadeClassName?: string

  /**
   * Custom class for the bottom fade gradient
   */
  bottomFadeClassName?: string

  /**
   * Custom class for the left fade gradient
   */
  leftFadeClassName?: string

  /**
   * Custom class for the right fade gradient
   */
  rightFadeClassName?: string
}

export function FadingScrollArea({
  children,
  className,
  showTopFade = true,
  showBottomFade = true,
  showLeftFade = false, // Disabled by default
  showRightFade = false, // Disabled by default
  fadeSize = "60px",
  fadeOpacity = 0.95,
  topFadeClassName,
  bottomFadeClassName,
  leftFadeClassName,
  rightFadeClassName,
  ...props
}: FadingScrollAreaProps) {
  // Initialize gradients - all start hidden and will be updated after scroll check
  const [showTopGradient, setShowTopGradient] = useState(false) // Hidden at top position
  const [showBottomGradient, setShowBottomGradient] = useState(false) // Will be set after initial check
  const [showLeftGradient, setShowLeftGradient] = useState(false) // Horizontal fades disabled by default
  const [showRightGradient, setShowRightGradient] = useState(false) // Horizontal fades disabled by default
  const scrollRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  // Function to check scroll position and update gradient visibility
  // Using useCallback to memoize the function
  const handleScroll = React.useCallback(() => {
    if (!scrollRef.current) return

    const {
      scrollTop,
      scrollHeight,
      clientHeight,
      scrollLeft,
      scrollWidth,
      clientWidth,
    } = scrollRef.current

    // Calculate scroll percentages
    const verticalScrollPercent =
      scrollHeight <= clientHeight
        ? 100
        : (scrollTop / (scrollHeight - clientHeight)) * 100

    const horizontalScrollPercent =
      scrollWidth <= clientWidth
        ? 100
        : (scrollLeft / (scrollWidth - clientWidth)) * 100

    // Vertical scrolling - show gradients only when there's content to scroll to
    const hasVerticalScroll = scrollHeight > clientHeight

    // Show top gradient when scrolled down (with a small threshold)
    // Only show if we're not at the top and there's content to scroll
    // Top fade should disappear when scrolled all the way to the top
    setShowTopGradient(hasVerticalScroll && scrollTop > 2)

    // Show bottom gradient when not at the bottom (with a small threshold)
    // Only show if there's content to scroll, and we're not at the bottom
    // Bottom fade should disappear when scrolled all the way to the bottom
    setShowBottomGradient(
      hasVerticalScroll && verticalScrollPercent < 99.5 // Only show when not at bottom
    )

    // Horizontal scrolling
    const hasHorizontalScroll = scrollWidth > clientWidth

    // Show left gradient when scrolled right (with a small threshold)
    // Only show if we're not at the leftmost edge and there's content to scroll
    setShowLeftGradient(hasHorizontalScroll && scrollLeft > 2)

    // Show right gradient when not at the rightmost edge (with a small threshold)
    // Only show if there's content to scroll, and we're not at the rightmost edge
    setShowRightGradient(
      hasHorizontalScroll &&
        (horizontalScrollPercent < 99.5 || scrollLeft === 0) // Show when at leftmost or not at rightmost
    )
  }, [])

  // Add scroll event listener and perform initial check
  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    // Add scroll event listener
    scrollElement.addEventListener("scroll", handleScroll)

    // Initial check - use a small timeout to ensure the component is fully rendered
    // This helps with detecting initial scroll state correctly
    const initialCheckTimer = setTimeout(() => {
      // Run the normal scroll handler
      handleScroll()

      // Additional check specifically for bottom gradient when at top position
      if (scrollElement) {
        const { scrollHeight, clientHeight } = scrollElement
        const hasVerticalScroll = scrollHeight > clientHeight

        // If there's scrollable content and we're at the top, show bottom gradient
        if (hasVerticalScroll && scrollElement.scrollTop === 0) {
          setShowBottomGradient(true)
        }
      }
    }, 50)

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll)
      clearTimeout(initialCheckTimer)
    }
  }, [handleScroll])

  // Re-check scroll position when children change
  useEffect(() => {
    // Small delay to allow content to render
    const timer = setTimeout(() => {
      // Run the normal scroll handler
      handleScroll()

      // Additional check for bottom gradient when at top position
      const scrollElement = scrollRef.current
      if (scrollElement) {
        const { scrollHeight, clientHeight } = scrollElement
        const hasVerticalScroll = scrollHeight > clientHeight

        // If there's scrollable content and we're at the top, show bottom gradient
        if (hasVerticalScroll && scrollElement.scrollTop === 0) {
          setShowBottomGradient(true)
        }
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [children, handleScroll])

  // Animation variants for the gradients
  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: fadeOpacity,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.2,
        ease: "easeOut",
      },
    },
  }

  return (
    <div className={cn("relative", className)}>
      {/* Top fade gradient */}
      {showTopFade && (
        <AnimatePresence>
          {showTopGradient && (
            <motion.div
              className={cn(
                "absolute top-0 left-0 right-0 z-20 pointer-events-none",
                "bg-gradient-to-b from-background from-30% via-background/90 via-60% to-transparent",
                topFadeClassName
              )}
              style={{ height: fadeSize }}
              variants={fadeVariants}
              initial='hidden'
              animate='visible'
              exit='hidden'
            />
          )}
        </AnimatePresence>
      )}

      {/* Left fade gradient */}
      {showLeftFade && (
        <AnimatePresence>
          {showLeftGradient && (
            <motion.div
              className={cn(
                "absolute top-0 left-0 bottom-0 z-20 pointer-events-none",
                "bg-gradient-to-r from-background from-30% via-background/90 via-60% to-transparent",
                leftFadeClassName
              )}
              style={{ width: fadeSize }}
              variants={fadeVariants}
              initial='hidden'
              animate='visible'
              exit='hidden'
            />
          )}
        </AnimatePresence>
      )}

      {/* ScrollArea with ref for tracking scroll position */}
      <ScrollArea
        {...props}
        className={cn("w-full", className)}
        ref={(el) => {
          // Find the actual scrollable element and set the ref
          if (el) {
            // Try to find the viewport element using data-slot attribute first
            let viewport = el.querySelector(
              '[data-slot="scroll-area-viewport"]'
            )

            // If not found, try alternative selectors that might be used by Radix UI
            if (!viewport) {
              viewport = el.querySelector("[data-radix-scroll-area-viewport]")
            }

            // If still not found, try a more generic approach
            if (!viewport) {
              viewport = el.querySelector('div[style*="overflow"]')
            }

            if (viewport) {
              scrollRef.current = viewport as HTMLDivElement

              // Trigger an initial check after a short delay
              setTimeout(() => {
                // Run the normal scroll handler
                handleScroll()

                // Additional check for bottom gradient when at top position
                const { scrollHeight, clientHeight } = viewport
                const hasVerticalScroll = scrollHeight > clientHeight

                // If there's scrollable content and we're at the top, show bottom gradient
                if (hasVerticalScroll && viewport.scrollTop === 0) {
                  setShowBottomGradient(true)
                }
              }, 50)
            }
          }
        }}
      >
        {children}
      </ScrollArea>

      {/* Right fade gradient */}
      {showRightFade && (
        <AnimatePresence>
          {showRightGradient && (
            <motion.div
              className={cn(
                "absolute top-0 right-0 bottom-0 z-20 pointer-events-none",
                "bg-gradient-to-l from-background from-30% via-background/90 via-60% to-transparent",
                rightFadeClassName
              )}
              style={{ width: fadeSize }}
              variants={fadeVariants}
              initial='hidden'
              animate='visible'
              exit='hidden'
            />
          )}
        </AnimatePresence>
      )}

      {/* Bottom fade gradient */}
      {showBottomFade && (
        <AnimatePresence>
          {showBottomGradient && (
            <motion.div
              className={cn(
                "absolute bottom-0 left-0 right-0 z-20 pointer-events-none",
                "bg-gradient-to-t from-background from-30% via-background/90 via-60% to-transparent",
                bottomFadeClassName
              )}
              style={{ height: fadeSize }}
              variants={fadeVariants}
              initial='hidden'
              animate='visible'
              exit='hidden'
            />
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
