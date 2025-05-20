import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { persist, createJSONStorage } from "zustand/middleware"

// Define the preset type
export interface Preset {
  name: string
  quantity: number
  maxValue: number
  isSaved: boolean
}

// Define the store state type
interface PresetState {
  // Presets
  presets: [Preset, Preset, Preset]

  // Actions
  savePreset: (
    index: number,
    name: string,
    quantity: number,
    maxValue: number
  ) => void
  loadPreset: (
    index: number
  ) => { name: string; quantity: number; maxValue: number } | null
  isPresetSaved: (index: number) => boolean
  getPreset: (index: number) => Preset | null
  clearPreset: (index: number) => void
  getPresetName: (index: number) => string
}

// Create the store with Immer and persist middleware
export const usePresetStore = create<PresetState>()(
  persist(
    immer((set, get) => ({
      // Initial state with default presets
      presets: [
        { name: "Lotto", quantity: 6, maxValue: 52, isSaved: true },
        { name: "Daily", quantity: 5, maxValue: 36, isSaved: true },
        { name: "Powerball", quantity: 6, maxValue: 70, isSaved: true },
      ],

      // Actions
      savePreset: (
        index: number,
        name: string,
        quantity: number,
        maxValue: number
      ) => {
        set((state) => {
          // Ensure index is valid
          if (index >= 0 && index < state.presets.length) {
            // Use provided name or default to "Preset X" if empty
            const presetName = name.trim() || `Preset ${index + 1}`

            state.presets[index] = {
              name: presetName,
              quantity,
              maxValue,
              isSaved: true,
            }
          }
        })
      },

      loadPreset: (index: number) => {
        const state = get()
        // Ensure index is valid and preset is saved
        if (
          index >= 0 &&
          index < state.presets.length &&
          state.presets[index].isSaved
        ) {
          const preset = state.presets[index]
          return {
            name: preset.name,
            quantity: preset.quantity,
            maxValue: preset.maxValue,
          }
        }
        return null
      },

      getPreset: (index: number) => {
        const state = get()
        // Ensure index is valid
        if (index >= 0 && index < state.presets.length) {
          return state.presets[index]
        }
        return null
      },

      isPresetSaved: (index: number) => {
        const state = get()
        // Ensure index is valid
        if (index >= 0 && index < state.presets.length) {
          return state.presets[index].isSaved
        }
        return false
      },

      getPresetName: (index: number) => {
        const state = get()
        // Ensure index is valid
        if (index >= 0 && index < state.presets.length) {
          return state.presets[index].name
        }
        return `Preset ${index + 1}`
      },

      clearPreset: (index: number) => {
        set((state) => {
          // Ensure index is valid
          if (index >= 0 && index < state.presets.length) {
            state.presets[index] = {
              name: `Preset ${index + 1}`,
              quantity: 0,
              maxValue: 0,
              isSaved: false,
            }
          }
        })
      },
    })),
    {
      name: "oddly-presets-storage", // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      version: 1, // For future migrations
    }
  )
)
