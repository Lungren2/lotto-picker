import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { NumberArray } from '@/utils/numberUtils'

// Define the type for a history entry
export interface HistoryEntry {
  id: string
  timestamp: number
  numbers: NumberArray
  quantity: number
  maxValue: number
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

// Create the store with Immer middleware
export const useHistoryStore = create<HistoryState>()(
  immer((set, get) => ({
    // Initial state
    entries: (() => {
      // Load from localStorage if exists
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem("numberHistory")
        return saved ? JSON.parse(saved) : []
      }
      return []
    })(),
    filter: '',
    filteredEntries: (() => {
      // Load from localStorage if exists
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem("numberHistory")
        return saved ? JSON.parse(saved) : []
      }
      return []
    })(),
    
    // Actions
    addEntry: (numbers: NumberArray, quantity: number, maxValue: number) => {
      set((state) => {
        // Create a new entry
        const newEntry: HistoryEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          numbers,
          quantity,
          maxValue
        }
        
        // Add to entries
        state.entries = [newEntry, ...state.entries]
        
        // Update filtered entries
        state.filteredEntries = state.filter 
          ? state.entries.filter(entry => 
              // Filter by numbers
              entry.numbers.some(num => num.toString().includes(state.filter)) ||
              // Filter by date
              new Date(entry.timestamp).toLocaleString().toLowerCase().includes(state.filter.toLowerCase())
            )
          : state.entries
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem("numberHistory", JSON.stringify(state.entries))
        }
      })
    },
    
    setFilter: (filter: string) => {
      set((state) => {
        state.filter = filter
        
        // Update filtered entries
        state.filteredEntries = filter 
          ? state.entries.filter(entry => 
              // Filter by numbers
              entry.numbers.some(num => num.toString().includes(filter)) ||
              // Filter by date
              new Date(entry.timestamp).toLocaleString().toLowerCase().includes(filter.toLowerCase())
            )
          : state.entries
      })
    },
    
    clearHistory: () => {
      set((state) => {
        state.entries = []
        state.filteredEntries = []
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem("numberHistory", JSON.stringify([]))
        }
      })
    },
  }))
)
