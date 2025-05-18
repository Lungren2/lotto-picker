import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import {
  NumberArray,
  generateSet,
  getAvailableNumbers,
} from "@/utils/numberUtils"
import { useHistoryStore } from "./historyStore"

// Define the store state type
interface NumberState {
  // Settings
  quantity: number
  maxValue: number
  numSets: number

  // Generated numbers
  usedNumbers: NumberArray
  currentSet: NumberArray
  remainingCount: number
  hasEnoughNumbers: boolean

  // Actions
  setQuantity: (quantity: number) => void
  setMaxValue: (maxValue: number) => void
  setNumSets: (numSets: number) => void
  generateNumbers: () => void
  resetNumbers: () => void
}

// Create the store with Immer middleware
export const useNumberStore = create<NumberState>()(
  immer((set, get) => ({
    // Initial state
    quantity: 6,
    maxValue: 52,
    numSets: 1,
    usedNumbers: (() => {
      // Load from localStorage if exists
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("usedNumbers")
        return saved ? JSON.parse(saved) : []
      }
      return []
    })(),
    currentSet: [],
    remainingCount: 52, // Default to maxValue
    hasEnoughNumbers: true,

    // Actions
    setQuantity: (quantity: number) => {
      set((state) => {
        state.quantity = quantity

        // Recalculate if we have enough numbers
        const available = getAvailableNumbers(state.maxValue, state.usedNumbers)
        state.remainingCount = available.length
        state.hasEnoughNumbers = available.length >= quantity
      })
    },

    setMaxValue: (maxValue: number) => {
      set((state) => {
        state.maxValue = maxValue

        // Recalculate if we have enough numbers
        const available = getAvailableNumbers(maxValue, state.usedNumbers)
        state.remainingCount = available.length
        state.hasEnoughNumbers = available.length >= state.quantity
      })
    },

    setNumSets: (numSets: number) => {
      set((state) => {
        state.numSets = numSets
      })
    },

    generateNumbers: () => {
      const state = get()
      if (!state.hasEnoughNumbers) return

      const available = getAvailableNumbers(state.maxValue, state.usedNumbers)
      const next = generateSet(available, state.quantity)

      set((state) => {
        state.currentSet = next
        state.usedNumbers = [...state.usedNumbers, ...next]

        // Update remaining count and check if enough numbers are available
        const newAvailable = getAvailableNumbers(
          state.maxValue,
          state.usedNumbers
        )
        state.remainingCount = newAvailable.length
        state.hasEnoughNumbers = newAvailable.length >= state.quantity

        // Save to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("usedNumbers", JSON.stringify(state.usedNumbers))
        }
      })

      // Add to history
      useHistoryStore.getState().addEntry(next, state.quantity, state.maxValue)
    },

    resetNumbers: () => {
      set((state) => {
        state.usedNumbers = []
        state.currentSet = []
        state.remainingCount = state.maxValue
        state.hasEnoughNumbers = true

        // Save to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("usedNumbers", JSON.stringify([]))
        }
      })
    },
  }))
)
