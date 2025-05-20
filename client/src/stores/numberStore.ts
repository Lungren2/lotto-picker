import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { persist, createJSONStorage } from "zustand/middleware"
import { generateSet, getAvailableNumbers } from "@/utils/numberUtils"
import { useHistoryStore } from "./historyStore"

// Define our own NumberArray type to avoid import issues
type NumberArray = number[]

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

// Create the store with Immer and persist middleware
export const useNumberStore = create<NumberState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      quantity: 6,
      maxValue: 52,
      numSets: 1,
      usedNumbers: [],
      currentSet: [],
      remainingCount: 52, // Default to maxValue
      hasEnoughNumbers: true,

      // Actions
      setQuantity: (quantity: number) => {
        set((state) => {
          state.quantity = quantity

          // Recalculate if we have enough numbers
          const available = getAvailableNumbers(
            state.maxValue,
            state.usedNumbers
          )
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
          // Increment numSets when a new set is generated
          state.numSets = state.numSets + 1

          // Update remaining count and check if enough numbers are available
          const newAvailable = getAvailableNumbers(
            state.maxValue,
            state.usedNumbers
          )
          state.remainingCount = newAvailable.length
          state.hasEnoughNumbers = newAvailable.length >= state.quantity
        })

        // Add to history
        useHistoryStore
          .getState()
          .addEntry(next, state.quantity, state.maxValue)
      },

      resetNumbers: () => {
        set((state) => {
          state.usedNumbers = []
          state.currentSet = []
          state.remainingCount = state.maxValue
          state.hasEnoughNumbers = true
          // Reset numSets to 1 when resetting numbers
          state.numSets = 1
        })
      },
    })),
    {
      name: "oddly-numbers-storage", // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        quantity: state.quantity,
        maxValue: state.maxValue,
        numSets: state.numSets,
        usedNumbers: state.usedNumbers,
      }),
      version: 1, // For future migrations
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recalculate derived state values
          const available = getAvailableNumbers(
            state.maxValue,
            state.usedNumbers
          )
          state.remainingCount = available.length
          state.hasEnoughNumbers = available.length >= state.quantity
        }
      },
    }
  )
)
