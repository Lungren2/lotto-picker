import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

// Import the number store to access shared state
import { useNumberStore } from "./numberStore"

// Import optimized calculation functions
import {
  combinations,
  hypergeometric,
  adjustedProbability,
  clearCaches,
} from "@/utils/oddsUtils"

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

  // Actions
  recalculateOdds: () => void
}

// Create the store with Immer middleware
export const useOddsStore = create<OddsState>()(
  immer((set, get) => ({
    // Initial state with default values
    odds: {
      totalCombos: 0,
      perMatchOdds: [],
    },

    // Actions
    recalculateOdds: () => {
      const { quantity, maxValue, numSets } = useNumberStore.getState()
      const currentOdds = get().odds

      // Calculate total combinations (this is now memoized)
      const totalCombos = combinations(maxValue, quantity)

      // Type-safe initialization of perMatchOdds array
      const perMatchOdds: OddsData["perMatchOdds"] = []

      // Calculate odds for each possible match count
      for (let k = 0; k <= quantity; k++) {
        // Calculate probability using memoized hypergeometric function
        const prob = hypergeometric(k, maxValue, quantity, quantity)

        // Calculate adjusted probability with multiple sets
        const adjusted = adjustedProbability(prob, numSets)

        // Get previous values for comparison
        const prevValues = currentOdds.perMatchOdds.find(
          (item) => item.matchCount === k
        )

        // Add to results array
        perMatchOdds.push({
          matchCount: k,
          singleChance: prob,
          adjustedChance: adjusted,
          prevSingleChance: prevValues?.singleChance,
          prevAdjustedChance: prevValues?.adjustedChance,
        })
      }

      // Update the store with new odds
      set((state) => {
        state.odds = { totalCombos, perMatchOdds }

        // Clear caches if we have a large number of calculations
        // This prevents memory leaks while maintaining performance
        if (maxValue > 100 || quantity > 20) {
          clearCaches()
        }
      })
    },
  }))
)
