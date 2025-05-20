import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { persist, createJSONStorage } from "zustand/middleware"

// Define our own NumberArray type to avoid import issues
type NumberArray = number[]

// Define the type for a history entry metadata
export interface SimulationMetadata {
  type: "simulation"
  attempts: number
  matched: boolean
}

// Define the type for a history entry
export interface HistoryEntry {
  id: string
  timestamp: number
  numbers: NumberArray
  quantity: number
  maxValue: number
  synced?: boolean // Track if entry has been synced (for future server sync)
  metadata?: SimulationMetadata // Optional metadata for simulation results
}

// Define the store state type
interface HistoryState {
  // History entries
  entries: HistoryEntry[]

  // Filter state
  filter: string

  // Computed filtered entries
  filteredEntries: HistoryEntry[]

  // Actions
  addEntry: (numbers: NumberArray, quantity: number, maxValue: number) => void
  setFilter: (filter: string) => void
  clearHistory: () => void
}

// Create the store with Immer and persist middleware
export const useHistoryStore = create<HistoryState>()(
  persist(
    immer((set) => ({
      // Initial state
      entries: [],
      filter: "",
      filteredEntries: [],

      // Actions
      addEntry: (
        numbers: NumberArray,
        quantity: number,
        maxValue: number,
        metadata?: SimulationMetadata
      ) => {
        set((state) => {
          // Create a new entry
          const newEntry: HistoryEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            numbers,
            quantity,
            maxValue,
            synced: navigator.onLine, // Mark as synced if online
            metadata, // Add optional metadata
          }

          // Add to entries
          state.entries = [newEntry, ...state.entries]

          // Update filtered entries
          state.filteredEntries = state.filter
            ? state.entries.filter(
                (entry) =>
                  // Filter by numbers
                  entry.numbers.some((num) =>
                    num.toString().includes(state.filter)
                  ) ||
                  // Filter by date
                  new Date(entry.timestamp)
                    .toLocaleString()
                    .toLowerCase()
                    .includes(state.filter.toLowerCase())
              )
            : state.entries

          // Register for background sync if offline
          if (
            typeof window !== "undefined" &&
            !navigator.onLine &&
            "serviceWorker" in navigator
          ) {
            // Try to register for background sync
            navigator.serviceWorker.ready
              .then((registration) => {
                registration.sync
                  .register("sync-history")
                  .catch((err) =>
                    console.error("Background sync registration failed:", err)
                  )
              })
              .catch((err) => console.error("Service worker not ready:", err))
          }
        })
      },

      setFilter: (filter: string) => {
        set((state) => {
          state.filter = filter

          // Update filtered entries
          state.filteredEntries = filter
            ? state.entries.filter(
                (entry) =>
                  // Filter by numbers
                  entry.numbers.some((num) =>
                    num.toString().includes(filter)
                  ) ||
                  // Filter by date
                  new Date(entry.timestamp)
                    .toLocaleString()
                    .toLowerCase()
                    .includes(filter.toLowerCase())
              )
            : state.entries
        })
      },

      clearHistory: () => {
        set((state) => {
          state.entries = []
          state.filteredEntries = []
        })
      },
    })),
    {
      name: "oddly-history-storage", // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ entries: state.entries }), // Only persist entries
      version: 1, // For future migrations
      onRehydrateStorage: () => (state) => {
        // When state is rehydrated from storage, update filteredEntries
        if (state) {
          state.filteredEntries = state.filter
            ? state.entries.filter(
                (entry) =>
                  entry.numbers.some((num) =>
                    num.toString().includes(state.filter)
                  ) ||
                  new Date(entry.timestamp)
                    .toLocaleString()
                    .toLowerCase()
                    .includes(state.filter.toLowerCase())
              )
            : state.entries
        }
      },
    }
  )
)
