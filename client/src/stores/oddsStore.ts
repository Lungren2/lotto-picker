import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { toast } from "@/components/ui/sonner"

// Import the number store to access shared state
import { useNumberStore } from "./numberStore"

// Type definitions
export type OddsData = {
  totalCombos: number
  perMatchOdds: Array<{
    matchCount: number
    singleChance: number
    adjustedChance: number
    prevSingleChance?: number
    prevAdjustedChance?: number
  }>
}

// Define the store state type
interface OddsState {
  // Current odds data
  odds: OddsData

  // Worker state
  isCalculating: boolean

  // Actions
  recalculateOdds: () => void
}

// Create a singleton worker instance
let worker: Worker | null = null
let isWorkerInitialized = false

// Function to initialize the worker
const initWorker = () => {
  if (isWorkerInitialized) return

  try {
    worker = new Worker("/odds-worker.js")
    isWorkerInitialized = true
  } catch (error) {
    console.error("Failed to initialize odds worker:", error)
    toast.error("Performance optimization unavailable", {
      description:
        "Your browser does not support background calculations. The app will still work but may be slower with large numbers.",
    })
  }
}

// Create the store with Immer middleware
export const useOddsStore = create<OddsState>()(
  immer((set, get) => ({
    // Initial state with default values
    odds: {
      totalCombos: 0,
      perMatchOdds: [],
    },

    // Worker state
    isCalculating: false,

    // Actions
    recalculateOdds: () => {
      const { quantity, maxValue, numSets } = useNumberStore.getState()
      const currentOdds = get().odds

      // Initialize the worker if not already done
      if (!isWorkerInitialized) {
        initWorker()
      }

      // Set calculating state
      set((state) => {
        state.isCalculating = true
      })

      // If worker is available, use it for calculation
      if (worker) {
        // Set up message handler if not already set
        if (!worker.onmessage) {
          worker.onmessage = (e) => {
            const data = e.data

            if (data.type === "result") {
              // Process the result from the worker
              const newOdds = data.odds

              // Add previous values for comparison
              const perMatchOdds = newOdds.perMatchOdds.map(
                (item: {
                  matchCount: number
                  singleChance: number
                  adjustedChance: number
                }) => {
                  const prevValues = currentOdds.perMatchOdds.find(
                    (prev) => prev.matchCount === item.matchCount
                  )

                  return {
                    ...item,
                    prevSingleChance: prevValues?.singleChance,
                    prevAdjustedChance: prevValues?.adjustedChance,
                  }
                }
              )

              // Update the store with new odds
              set((state) => {
                state.odds = {
                  totalCombos: newOdds.totalCombos,
                  perMatchOdds,
                }
                state.isCalculating = false
              })
            } else if (data.type === "error") {
              console.error("Odds calculation error:", data.message)
              toast.error("Calculation error", {
                description:
                  "There was an error calculating odds. Please try again with different numbers.",
              })

              set((state) => {
                state.isCalculating = false
              })
            }
          }

          worker.onerror = (error) => {
            console.error("Worker error:", error)
            toast.error("Calculation error", {
              description:
                "There was an error in the background calculation. Falling back to main thread.",
            })

            set((state) => {
              state.isCalculating = false
            })

            // Reset worker
            if (worker) {
              worker.terminate()
              worker = null
              isWorkerInitialized = false
            }
          }
        }

        // Send calculation request to worker
        worker.postMessage({
          command: "calculate",
          quantity,
          maxValue,
          numSets,
        })
      } else {
        // Fallback to main thread calculation if worker is not available
        // This will be implemented in a separate function to avoid code duplication
        import("@/utils/oddsUtils").then(
          ({
            combinations,
            hypergeometric,
            adjustedProbability,
            clearCaches,
          }) => {
            // Calculate on main thread (same logic as before)
            const totalCombos = combinations(maxValue, quantity)
            const perMatchOdds: OddsData["perMatchOdds"] = []

            for (let k = 0; k <= quantity; k++) {
              const prob = hypergeometric(k, maxValue, quantity, quantity)
              const adjusted = adjustedProbability(prob, numSets)

              const prevValues = currentOdds.perMatchOdds.find(
                (item: { matchCount: number }) => item.matchCount === k
              )

              perMatchOdds.push({
                matchCount: k,
                singleChance: prob,
                adjustedChance: adjusted,
                prevSingleChance: prevValues?.singleChance,
                prevAdjustedChance: prevValues?.adjustedChance,
              })
            }

            set((state) => {
              state.odds = { totalCombos, perMatchOdds }
              state.isCalculating = false

              if (maxValue > 100 || quantity > 20) {
                clearCaches()
              }
            })
          }
        )
      }
    },
  }))
)
