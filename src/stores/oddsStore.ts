import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

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

/**
 * Calculate factorial of a number
 * @param n Number to calculate factorial for
 * @returns Factorial of n
 */
function factorial(n: number): number {
  return n <= 1 ? 1 : n * factorial(n - 1)
}

/**
 * Calculate combinations (n choose r)
 * @param n Total number of items
 * @param r Number of items to choose
 * @returns Number of possible combinations
 */
function combinations(n: number, r: number): number {
  return factorial(n) / (factorial(r) * factorial(n - r))
}

/**
 * Calculate hypergeometric probability
 * @param k Number of successes in the sample
 * @param N Population size
 * @param K Number of successes in the population
 * @param n Sample size
 * @returns Probability
 */
function hypergeometric(k: number, N: number, K: number, n: number): number {
  return (combinations(K, k) * combinations(N - K, n - k)) / combinations(N, n)
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

      const totalCombos = combinations(maxValue, quantity)
      const perMatchOdds = []

      for (let k = 0; k <= quantity; k++) {
        const prob = hypergeometric(k, maxValue, quantity, quantity)
        const adjusted = 1 - Math.pow(1 - prob, numSets)

        // Get previous values for comparison
        const prevValues = currentOdds.perMatchOdds.find(
          (item) => item.matchCount === k
        )

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
      })
    },
  }))
)
