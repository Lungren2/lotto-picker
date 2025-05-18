import { useState, useEffect, useRef, useCallback } from "react"

interface UseAdaptiveSimulationProps {
  onSimulationStep: () => boolean // Return true when simulation should stop
  isRunning: boolean
  speed: "slow" | "medium" | "fast" | "max"
}

interface UseAdaptiveSimulationReturn {
  isProcessing: boolean
}

/**
 * Custom hook for running simulations with adaptive performance
 */
export function useAdaptiveSimulation({
  onSimulationStep,
  isRunning,
  speed,
}: UseAdaptiveSimulationProps): UseAdaptiveSimulationReturn {
  // State to track if simulation is currently processing
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Refs for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Helper to get delay based on speed
  const getSpeedDelay = useCallback(() => {
    switch (speed) {
      case "slow": return 500
      case "medium": return 200
      case "fast": return 50
      case "max": return 0
      default: return 200
    }
  }, [speed])
  
  // Function to run max speed simulation
  const runMaxSpeedSimulation = useCallback(async () => {
    if (!isRunning) return
    
    setIsProcessing(true)
    
    // Create a new abort controller
    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current
    
    try {
      // Run in batches to avoid blocking the UI
      const batchSize = 1000
      let completed = false
      
      while (!completed && !signal.aborted) {
        // Run a batch of simulations
        for (let i = 0; i < batchSize; i++) {
          completed = onSimulationStep()
          if (completed || signal.aborted) break
        }
        
        // Yield to the main thread
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    } catch (error) {
      console.error("Simulation error:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [isRunning, onSimulationStep])
  
  // Function to run controlled speed simulation
  const runControlledSpeedSimulation = useCallback(() => {
    if (!isRunning) return
    
    setIsProcessing(true)
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    // Set up a new interval
    intervalRef.current = setInterval(() => {
      const completed = onSimulationStep()
      if (completed && intervalRef.current) {
        clearInterval(intervalRef.current)
        setIsProcessing(false)
      }
    }, getSpeedDelay())
  }, [isRunning, onSimulationStep, getSpeedDelay])
  
  // Start or stop simulation based on isRunning
  useEffect(() => {
    if (isRunning) {
      // Use the appropriate simulation method based on speed
      if (speed === "max") {
        runMaxSpeedSimulation()
      } else {
        runControlledSpeedSimulation()
      }
    } else {
      // Clean up when not running
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      
      setIsProcessing(false)
    }
    
    // Clean up on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [isRunning, speed, runMaxSpeedSimulation, runControlledSpeedSimulation])
  
  return { isProcessing }
}
