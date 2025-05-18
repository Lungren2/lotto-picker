import { useEffect, useRef, useState } from "react"

/**
 * Custom hook for adaptive debouncing based on complexity
 * @param callback Function to debounce
 * @param delay Base delay in milliseconds
 * @param complexity Complexity factor (1-10) to adjust delay
 * @param dependencies Array of dependencies that should trigger the debounce
 */
export function useAdaptiveDebounce(
  callback: () => void,
  delay: number,
  complexity: number = 1,
  dependencies: React.DependencyList = []
): { isDebouncing: boolean } {
  // Store the callback in a ref to avoid recreating the timeout on every render
  const callbackRef = useRef(callback)
  
  // Track debouncing state
  const [isDebouncing, setIsDebouncing] = useState(false)
  
  // Calculate adaptive delay based on complexity
  const adaptiveDelay = Math.min(delay * Math.max(1, complexity), 1000)

  // Update the callback ref when the callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Set up the debounce effect
  useEffect(() => {
    // Skip the initial render if dependencies are empty
    if (dependencies.length === 0) return

    // Set debouncing state to true
    setIsDebouncing(true)
    
    // Create a timeout that will call the callback after the delay
    const timeout = setTimeout(() => {
      callbackRef.current()
      setIsDebouncing(false)
    }, adaptiveDelay)

    // Clean up the timeout if the dependencies change before the delay
    return () => {
      clearTimeout(timeout)
    }
  }, [...dependencies, adaptiveDelay]) // Include adaptiveDelay in dependencies
  
  return { isDebouncing }
}
