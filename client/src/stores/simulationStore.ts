/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { persist, createJSONStorage } from "zustand/middleware"
import { useHistoryStore } from "./historyStore"
import { generateSet } from "@/utils/numberUtils"
import { MersenneTwister, createRNG } from "@/utils/mersenneTwister"

// Define our own NumberArray type to avoid import issues
type NumberArray = number[]

// Define extended NotificationOptions interface to include actions
interface ExtendedNotificationOptions extends NotificationOptions {
  actions?: Array<{
    action: string
    title: string
  }>
}

// Define the simulation status type
export type SimulationStatus = "idle" | "running" | "paused" | "completed"

// Define the simulation settings type
export interface SimulationSettings {
  maxAttempts: number
  speed: "slow" | "medium" | "fast" | "max"
  autoStart: boolean
  enableBackgroundProcessing: boolean
  enableNotifications: boolean
  notificationFrequency: number // How often to show notifications (in attempts)

  // Progressive acceleration settings
  enableAcceleration: boolean
  minSpeed: number // Minimum delay in ms
  maxSpeed: number // Maximum delay in ms (lower = faster)
  accelerationFactor: number // How quickly to accelerate (1-10)
}

// Define the simulation result type
export interface SimulationResult {
  id: string
  timestamp: number
  winningSet: NumberArray
  quantity: number
  maxValue: number
  attempts: number
  bestMatch: {
    count: number
    set: NumberArray
  }
}

// Define the store state type
interface SimulationState {
  // Winning set
  winningSet: NumberArray

  // Current simulation state
  status: SimulationStatus
  currentAttempt: number
  bestMatch: {
    count: number
    set: NumberArray
  }

  // Background processing state
  isRunningInBackground: boolean
  lastNotificationAt: number

  // Settings
  settings: SimulationSettings

  // Results
  results: SimulationResult[]

  // RNG instance
  rng: MersenneTwister

  // Actions
  setWinningSet: (numbers: NumberArray) => void
  generateWinningSet: (quantity: number, maxValue: number) => void
  startSimulation: (quantity: number, maxValue: number) => void
  pauseSimulation: () => void
  resumeSimulation: () => void
  stopSimulation: () => void
  resetSimulation: () => void
  updateSettings: (settings: Partial<SimulationSettings>) => void
  incrementAttempt: (newSet: NumberArray, matchCount: number) => void
  completeSimulation: () => void

  // Background processing actions
  startBackgroundSimulation: (quantity: number, maxValue: number) => void
  stopBackgroundSimulation: () => void
  updateFromBackground: (
    currentAttempt: number,
    bestMatch: { count: number; set: NumberArray }
  ) => void
  checkNotificationNeeded: () => boolean
}

// Helper function to get the base delay based on speed setting
const getBaseSpeedDelay = (speed: SimulationSettings["speed"]): number => {
  switch (speed) {
    case "slow":
      return 400
    case "medium":
      return 200
    case "fast":
      return 100
    case "max":
      return 50
    default:
      return 200
  }
}

// Helper function to calculate the current delay based on acceleration settings
export const calculateAcceleratedDelay = (
  currentAttempt: number,
  settings: SimulationSettings
): number => {
  // If acceleration is disabled or using max speed, return the base delay
  if (!settings.enableAcceleration || settings.speed === "max") {
    return getBaseSpeedDelay(settings.speed)
  }

  // Get the base delay as the starting point
  const baseDelay = getBaseSpeedDelay(settings.speed)

  // Define acceleration thresholds
  const thresholds = [
    10, // Very beginning
    100, // Early stage
    1000, // Getting going
    10000, // Mid-range
    100000, // Advanced
    1000000, // End-game
  ]

  // Find which threshold range we're in
  let thresholdIndex = 0
  for (let i = 0; i < thresholds.length; i++) {
    if (currentAttempt >= thresholds[i]) {
      thresholdIndex = i + 1
    }
  }

  // Calculate progress within the current threshold range
  const lowerThreshold = thresholdIndex > 0 ? thresholds[thresholdIndex - 1] : 0
  const upperThreshold =
    thresholdIndex < thresholds.length
      ? thresholds[thresholdIndex]
      : settings.maxAttempts

  // Calculate normalized progress (0-1) within the current range
  const rangeProgress =
    (currentAttempt - lowerThreshold) / (upperThreshold - lowerThreshold)

  // Apply acceleration factor (higher = faster acceleration)
  // Use a logarithmic or exponential curve based on the acceleration factor
  const accelerationPower =
    Math.min(10, Math.max(1, settings.accelerationFactor)) / 5 // Normalize to 0.2-2
  const accelerationCurve = Math.pow(rangeProgress, 1 / accelerationPower)

  // Calculate the current delay based on min/max speed and progress
  const minDelay = Math.min(settings.minSpeed, baseDelay)
  const maxDelay = Math.max(settings.maxSpeed, 1) // Ensure we don't go below 1ms

  // Interpolate between min and max delay based on the acceleration curve
  const currentDelay = minDelay - accelerationCurve * (minDelay - maxDelay)

  // Ensure we don't go below the minimum delay for the current speed setting
  return Math.max(Math.min(baseDelay, currentDelay), maxDelay)
}

// Create the store with Immer and persist middleware
export const useSimulationStore = create<SimulationState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      winningSet: [],
      status: "idle",
      currentAttempt: 0,
      bestMatch: {
        count: 0,
        set: [],
      },
      isRunningInBackground: false,
      lastNotificationAt: 0,
      settings: {
        maxAttempts: 1000000,
        speed: "medium",
        autoStart: false,
        enableBackgroundProcessing: false,
        enableNotifications: false,
        notificationFrequency: 1000,

        // Default acceleration settings
        enableAcceleration: true,
        minSpeed: 500, // Start slow (500ms delay)
        maxSpeed: 10, // End fast (10ms delay)
        accelerationFactor: 5, // Medium acceleration curve (1-10)
      },
      results: [],
      rng: createRNG(),

      // Actions
      setWinningSet: (numbers: NumberArray) => {
        set((state) => {
          state.winningSet = numbers
        })
      },

      generateWinningSet: (quantity: number, maxValue: number) => {
        const available = Array.from({ length: maxValue }, (_, i) => i + 1)
        const winningSet = generateSet(available, quantity, get().rng)

        set((state) => {
          state.winningSet = winningSet
        })
      },

      startSimulation: (_quantity: number, _maxValue: number) => {
        // Reset current attempt and best match
        set((state) => {
          state.currentAttempt = 0
          state.bestMatch = {
            count: 0,
            set: [],
          }
          state.status = "running"
        })
      },

      pauseSimulation: () => {
        set((state) => {
          state.status = "paused"
        })
      },

      resumeSimulation: () => {
        set((state) => {
          state.status = "running"
        })
      },

      stopSimulation: () => {
        set((state) => {
          state.status = "idle"
        })
      },

      resetSimulation: () => {
        set((state) => {
          state.currentAttempt = 0
          state.bestMatch = {
            count: 0,
            set: [],
          }
          state.status = "idle"
        })
      },

      updateSettings: (settings: Partial<SimulationSettings>) => {
        set((state) => {
          state.settings = {
            ...state.settings,
            ...settings,
          }
        })
      },

      incrementAttempt: (newSet: NumberArray, matchCount: number) => {
        set((state) => {
          state.currentAttempt += 1

          // Update best match if this is better
          if (matchCount > state.bestMatch.count) {
            state.bestMatch = {
              count: matchCount,
              set: newSet,
            }
          }

          // Check if we've reached the max attempts
          if (state.currentAttempt >= state.settings.maxAttempts) {
            state.status = "completed"
          }
        })
      },

      completeSimulation: () => {
        const { winningSet, currentAttempt, bestMatch } = get()

        // Create a result object
        const result: SimulationResult = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          winningSet,
          quantity: winningSet.length,
          maxValue: Math.max(...winningSet),
          attempts: currentAttempt,
          bestMatch,
        }

        // Add to results
        set((state) => {
          state.results = [result, ...state.results]
          state.status = "completed"
          state.isRunningInBackground = false
        })

        // Add to history
        useHistoryStore
          .getState()
          .addEntry(winningSet, winningSet.length, Math.max(...winningSet), {
            type: "simulation",
            attempts: currentAttempt,
            matched: bestMatch.count === winningSet.length,
          })

        // Send completion notification if enabled and running in background
        const { settings, isRunningInBackground } = get()
        if (settings.enableNotifications && isRunningInBackground) {
          // Check if we have permission to send notifications
          if (Notification.permission === "granted") {
            // Send a notification
            navigator.serviceWorker.ready.then((registration) => {
              registration.showNotification("Simulation Complete", {
                body: `Completed after ${currentAttempt.toLocaleString()} attempts. Best match: ${
                  bestMatch.count
                }/${winningSet.length}`,
                icon: "/pwa-192x192.png",
                badge: "/pwa-64x64.png",
                tag: "simulation-complete",
                data: {
                  url: window.location.href,
                  attempts: currentAttempt,
                  bestMatch: bestMatch.count,
                  total: winningSet.length,
                  matched: bestMatch.count === winningSet.length,
                },
                actions: [
                  {
                    action: "open",
                    title: "Open App",
                  },
                ],
              } as ExtendedNotificationOptions)
            })
          }
        }
      },

      // Background processing actions
      startBackgroundSimulation: (quantity: number, maxValue: number) => {
        // First start the simulation normally
        get().startSimulation(quantity, maxValue)

        // Then mark it as running in background
        set((state) => {
          state.isRunningInBackground = true
          state.lastNotificationAt = state.currentAttempt
        })

        // Send a notification that background processing has started
        const { settings } = get()
        if (settings.enableNotifications) {
          if (Notification.permission === "granted") {
            navigator.serviceWorker.ready.then((registration) => {
              registration.showNotification("Background Simulation Started", {
                body: "You'll be notified of progress periodically.",
                icon: "/pwa-192x192.png",
                badge: "/pwa-64x64.png",
                tag: "simulation-background",
                data: {
                  url: window.location.href,
                },
              } as ExtendedNotificationOptions)
            })
          }
        }
      },

      stopBackgroundSimulation: () => {
        set((state) => {
          state.isRunningInBackground = false
          state.status = "idle"
        })
      },

      updateFromBackground: (currentAttempt, bestMatch) => {
        set((state) => {
          state.currentAttempt = currentAttempt
          state.bestMatch = bestMatch

          // Check if we've reached the max attempts
          if (state.currentAttempt >= state.settings.maxAttempts) {
            state.status = "completed"
            state.isRunningInBackground = false
          }

          // Check if we've found a match
          if (bestMatch.count === state.winningSet.length) {
            state.status = "completed"
            state.isRunningInBackground = false
          }
        })
      },

      checkNotificationNeeded: () => {
        const {
          currentAttempt,
          lastNotificationAt,
          settings,
          isRunningInBackground,
        } = get()

        // Only send notifications if enabled and running in background
        if (!settings.enableNotifications || !isRunningInBackground) {
          return false
        }

        // Check if we've reached the notification frequency
        const shouldNotify =
          currentAttempt - lastNotificationAt >= settings.notificationFrequency

        // If we should notify, update the last notification timestamp
        if (shouldNotify) {
          set((state) => {
            state.lastNotificationAt = currentAttempt
          })
        }

        return shouldNotify
      },
    })),
    {
      name: "oddly-simulation-storage", // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        results: state.results,
        winningSet: state.winningSet,
        currentAttempt: state.currentAttempt,
        bestMatch: state.bestMatch,
        status: state.status,
        isRunningInBackground: state.isRunningInBackground,
        lastNotificationAt: state.lastNotificationAt,
      }),
      version: 1, // For future migrations
    }
  )
)
