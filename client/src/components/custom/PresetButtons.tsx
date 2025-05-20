import { useState } from "react"
import { useNumberStore } from "@/stores/numberStore"
import { usePresetStore } from "@/stores/presetStore"
import { PresetButton } from "./PresetButton"
import { PresetConfirmDialog } from "./PresetConfirmDialog"
import { motion } from "motion/react"
import { useReducedMotion } from "@/hooks/useReducedMotion"

// Define our own Preset interface to avoid import issues
interface Preset {
  name: string
  quantity: number
  maxValue: number
  isSaved: boolean
}

export function PresetButtons() {
  // Get state and actions from stores
  const { quantity, maxValue, setQuantity, setMaxValue } = useNumberStore()
  const { savePreset, loadPreset, isPresetSaved, getPreset } = usePresetStore()

  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion()

  // State for confirmation dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0)
  const [dialogMode, setDialogMode] = useState<"save" | "overwrite">("save")
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null)

  // Handle saving a preset
  const handleSavePreset = (index: number) => {
    const preset = getPreset(index)
    setSelectedPresetIndex(index)

    if (preset && preset.isSaved) {
      // If preset exists, show confirmation dialog for overwrite
      setDialogMode("overwrite")
      setSelectedPreset(preset)
      setDialogOpen(true)
    } else {
      // If preset doesn't exist, show dialog for new preset
      setDialogMode("save")
      setSelectedPreset(null)
      setDialogOpen(true)
    }
  }

  // Handle confirming preset save/overwrite
  const handleConfirmSave = (name: string) => {
    savePreset(selectedPresetIndex, name, quantity, maxValue)
  }

  // Handle loading a preset
  const handleLoadPreset = (index: number) => {
    const preset = loadPreset(index)
    if (preset) {
      setQuantity(preset.quantity)
      setMaxValue(preset.maxValue)
    }
  }

  // Animation variants for the container
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.3 : 0.5,
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  }

  // Animation variants for each button
  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.3,
      },
    },
  }

  return (
    <>
      <motion.div
        className='w-full mt-2'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        <div className='text-xs text-center text-muted-foreground mb-2'>
          Click to load, long-press to save
        </div>
        <div className='grid grid-cols-3 gap-2'>
          {[0, 1, 2].map((index) => (
            <motion.div key={index} variants={buttonVariants}>
              <PresetButton
                index={index}
                isSaved={isPresetSaved(index)}
                onSave={() => handleSavePreset(index)}
                onLoad={() => handleLoadPreset(index)}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Confirmation Dialog */}
      <PresetConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        preset={selectedPreset}
        index={selectedPresetIndex}
        onConfirm={handleConfirmSave}
        mode={dialogMode}
        currentSettings={{ quantity, maxValue }}
      />
    </>
  )
}
