import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { persist, createJSONStorage } from "zustand/middleware"
import { NumberArray } from "@/utils/numberUtils"
import { useHistoryStore } from "./historyStore"
import { generateSet, getAvailableNumbers } from "@/utils/numberUtils"
import { MersenneTwister, createRNG } from "@/utils/mersenneTwister"

// Define the simulation status type
export type SimulationStatus = "idle" | "running" | "paused" | "completed"

// Define the simulation settings type
export interface SimulationSettings {
  maxAttempts: number
  speed: "slow" | "medium" | "fast" | "max"
  autoStart: boolean
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
}

// Helper function to get the delay based on speed setting
const getSpeedDelay = (speed: SimulationSettings["speed"]): number => {
  switch (speed) {
    case "slow": return 500
    case "medium": return 200
    case "fast": return 50
    case "max": return 0
    default: return 200
  }
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
      settings: {
        maxAttempts: 1000000,
        speed: "medium",
        autoStart: false,
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
      
      startSimulation: (quantity: number, maxValue: number) => {
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
        })
        
        // Add to history
        useHistoryStore.getState().addEntry(
          winningSet,
          winningSet.length,
          Math.max(...winningSet),
          {
            type: "simulation",
            attempts: currentAttempt,
            matched: bestMatch.count === winningSet.length,
          }
        )
      },
    })),
    {
      name: "oddly-simulation-storage", // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        results: state.results,
      }),
      version: 1, // For future migrations
    }
  )
)
