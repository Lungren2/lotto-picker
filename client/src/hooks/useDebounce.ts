import { useEffect, useRef } from "react"

/**
 * Custom hook for debouncing function calls
 * @param callback Function to debounce
 * @param delay Delay in milliseconds
 * @param dependencies Array of dependencies that should trigger the debounce
 */
export function useDebounce(
  callback: () => void,
  delay: number,
  dependencies: React.DependencyList = []
): void {
  // Store the callback in a ref to avoid recreating the timeout on every render
  const callbackRef = useRef(callback)

  // Update the callback ref when the callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Set up the debounce effect
  useEffect(() => {
    // Skip the initial render if dependencies are empty
    if (dependencies.length === 0) return

    // Create a timeout that will call the callback after the delay
    const timeout = setTimeout(() => {
      callbackRef.current()
    }, delay)

    // Clean up the timeout if the dependencies change before the delay
    return () => {
      clearTimeout(timeout)
    }
  }, [...dependencies, delay]) // Include delay in dependencies
}
