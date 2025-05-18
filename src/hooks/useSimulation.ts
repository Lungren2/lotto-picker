import { useState, useEffect, useCallback } from "react"
import { useSimulationStore } from "@/stores/simulationStore"
import { generateSet } from "@/utils/numberUtils"
import { countMatches } from "@/utils/numberUtils"
import { toast } from "@/components/ui/sonner"
import { useAdaptiveSimulation } from "./useAdaptiveSimulation"

interface UseSimulationProps {
  quantity: number
  maxValue: number
}

interface UseSimulationReturn {
  isRunning: boolean
  isPaused: boolean
  isCompleted: boolean
  currentAttempt: number
  bestMatch: {
    count: number
    set: number[]
  }
  winningSet: number[]
  currentSpeed: number
  startSimulation: () => void
  pauseSimulation: () => void
  resumeSimulation: () => void
  stopSimulation: () => void
  resetSimulation: () => void
  generateWinningSet: () => void
  setWinningSet: (numbers: number[]) => void
}

export function useSimulation({
  quantity,
  maxValue,
}: UseSimulationProps): UseSimulationReturn {
  // Get state and actions from the simulation store
  const {
    winningSet,
    status,
    currentAttempt,
    bestMatch,
    settings,
    setWinningSet: storeSetWinningSet,
    generateWinningSet: storeGenerateWinningSet,
    startSimulation: storeStartSimulation,
    pauseSimulation: storePauseSimulation,
    resumeSimulation: storeResumeSimulation,
    stopSimulation: storeStopSimulation,
    resetSimulation: storeResetSimulation,
    incrementAttempt,
    completeSimulation,
    rng,
  } = useSimulationStore()

  // State to force re-renders when simulation state changes
  const [, setForceUpdate] = useState(0)

  // Function to run a single simulation step
  const runSimulationStep = useCallback(() => {
    // Get the latest state from the store to ensure we have current values
    const { status, winningSet, currentAttempt, settings } =
      useSimulationStore.getState()

    if (status !== "running" || !winningSet.length) return false

    // Generate a random set
    const available = Array.from({ length: maxValue }, (_, i) => i + 1)
    const newSet = generateSet(available, quantity, rng)

    // Count matches
    const matches = countMatches(newSet, winningSet)

    // Update attempt count and best match
    incrementAttempt(newSet, matches)

    // Force a re-render to update the UI
    setForceUpdate((prev) => prev + 1)

    // Check if we found a match
    if (matches === quantity) {
      completeSimulation()
      toast.success("Match found! 🎉", {
        description: `Found a matching set after ${
          currentAttempt + 1
        } attempts.`,
        duration: 5000,
      })
      return true
    }

    // Check if we've reached the max attempts
    if (currentAttempt + 1 >= settings.maxAttempts) {
      completeSimulation()
      toast.info("Simulation completed", {
        description: `Reached maximum attempts (${settings.maxAttempts}) without finding a match.`,
        duration: 5000,
      })
      return true
    }

    return false
  }, [
    maxValue,
    quantity,
    rng,
    incrementAttempt,
    completeSimulation,
    setForceUpdate,
  ])

  // Use the adaptive simulation hook to handle the simulation loop
  const { isProcessing, currentSpeed } = useAdaptiveSimulation({
    onSimulationStep: runSimulationStep,
    isRunning: status === "running",
    speed: settings.speed,
    currentAttempt,
    settings,
  })

  // Start the simulation
  const startSimulation = useCallback(() => {
    if (!winningSet.length) {
      toast.error("No winning set defined", {
        description: "Please generate or set a winning set of numbers first.",
      })
      return
    }

    storeStartSimulation(quantity, maxValue)
  }, [winningSet, storeStartSimulation, quantity, maxValue])

  // Pause the simulation
  const pauseSimulation = useCallback(() => {
    storePauseSimulation()
  }, [storePauseSimulation])

  // Resume the simulation
  const resumeSimulation = useCallback(() => {
    storeResumeSimulation()
  }, [storeResumeSimulation])

  // Stop the simulation
  const stopSimulation = useCallback(() => {
    storeStopSimulation()
  }, [storeStopSimulation])

  // Reset the simulation
  const resetSimulation = useCallback(() => {
    storeResetSimulation()
  }, [storeResetSimulation])

  // Generate a winning set
  const generateWinningSet = useCallback(() => {
    storeGenerateWinningSet(quantity, maxValue)
  }, [storeGenerateWinningSet, quantity, maxValue])

  // Set a winning set
  const setWinningSet = useCallback(
    (numbers: number[]) => {
      storeSetWinningSet(numbers)
    },
    [storeSetWinningSet]
  )

  // Subscribe to store changes to force re-renders
  useEffect(() => {
    // This effect will run whenever the simulation state changes
    const unsubscribe = useSimulationStore.subscribe(
      (state) => [state.currentAttempt, state.bestMatch, state.status],
      () => {
        // Force a re-render when these values change
        setForceUpdate((prev) => prev + 1)
      }
    )

    return unsubscribe
  }, [])

  return {
    isRunning: status === "running",
    isPaused: status === "paused",
    isCompleted: status === "completed",
    currentAttempt,
    bestMatch,
    winningSet,
    currentSpeed,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
    resetSimulation,
    generateWinningSet,
    setWinningSet,
  }
}
