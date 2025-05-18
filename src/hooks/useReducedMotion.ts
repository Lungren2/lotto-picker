import { useState, useEffect } from "react"

/**
 * Custom hook to detect if the user prefers reduced motion
 * @returns Boolean indicating if reduced motion is preferred
 */
export function useReducedMotion(): boolean {
  // Initialize with the current system preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    // Check if window is defined (for SSR)
    if (typeof window === "undefined") return false
    
    // Check the initial preference
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  })

  useEffect(() => {
    // Skip if window is undefined (for SSR)
    if (typeof window === "undefined") return

    // Create the media query
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    
    // Define the handler for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    // Add the event listener
    mediaQuery.addEventListener("change", handleChange)
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [])

  return prefersReducedMotion
}
