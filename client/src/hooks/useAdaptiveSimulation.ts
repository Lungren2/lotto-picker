import { useState, useEffect, useRef, useCallback } from "react"
import { calculateAcceleratedDelay } from "@/stores/simulationStore"

// Define our own SimulationSettings interface to avoid import issues
interface SimulationSettings {
  maxAttempts?: number
  speed: "slow" | "medium" | "fast" | "max"
  autoStart?: boolean
  enableBackgroundProcessing?: boolean
  enableNotifications?: boolean
  notificationFrequency?: number
  enableAcceleration: boolean
  minSpeed: number
  maxSpeed: number
  accelerationFactor: number
}

interface UseAdaptiveSimulationProps {
  onSimulationStep: () => boolean // Return true when simulation should stop
  isRunning: boolean
  speed: "slow" | "medium" | "fast" | "max"
  currentAttempt: number
  settings: SimulationSettings
}

interface UseAdaptiveSimulationReturn {
  isProcessing: boolean
  currentSpeed: number // Current speed in ms delay (lower = faster)
}

/**
 * Custom hook for running simulations with adaptive performance
 */
export function useAdaptiveSimulation({
  onSimulationStep,
  isRunning,
  speed,
  currentAttempt = 0,
  settings = {
    enableAcceleration: false,
    minSpeed: 500,
    maxSpeed: 10,
    accelerationFactor: 5,
    speed: "medium",
  } as SimulationSettings,
}: UseAdaptiveSimulationProps): UseAdaptiveSimulationReturn {
  // State to track if simulation is currently processing
  const [isProcessing, setIsProcessing] = useState(false)

  // State to track current simulation speed
  const [currentSpeed, setCurrentSpeed] = useState(500)

  // Refs for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Calculate the current delay based on acceleration settings
  const getCurrentDelay = useCallback(() => {
    const delay = calculateAcceleratedDelay(currentAttempt, settings)
    setCurrentSpeed(delay)
    return delay
  }, [currentAttempt, settings])

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
        await new Promise((resolve) => setTimeout(resolve, 0))
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

    // Function to run a single step and adjust the interval
    const runStep = () => {
      const completed = onSimulationStep()

      if (completed) {
        // If simulation is complete, clean up
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setIsProcessing(false)
        return
      }

      // If acceleration is enabled, adjust the interval based on the current attempt count
      if (settings.enableAcceleration) {
        // Clear the current interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }

        // Calculate the new delay
        const newDelay = getCurrentDelay()

        // Set up a new interval with the updated delay
        intervalRef.current = setInterval(runStep, newDelay)
      }
    }

    // Initial interval setup
    const initialDelay = getCurrentDelay()
    intervalRef.current = setInterval(runStep, initialDelay)
  }, [
    isRunning,
    onSimulationStep,
    getCurrentDelay,
    settings.enableAcceleration,
  ])

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

  return { isProcessing, currentSpeed }
}
