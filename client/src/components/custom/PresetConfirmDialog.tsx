import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "motion/react"
import { useReducedMotion } from "@/hooks/useReducedMotion"

// Define our own Preset interface to avoid import issues
interface Preset {
  name: string
  quantity: number
  maxValue: number
  isSaved: boolean
}

interface PresetConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preset: Preset | null
  index: number
  onConfirm: (name: string) => void
  mode: "save" | "overwrite"
  currentSettings: {
    quantity: number
    maxValue: number
  }
}

export function PresetConfirmDialog({
  open,
  onOpenChange,
  preset,
  index,
  onConfirm,
  mode,
  currentSettings,
}: PresetConfirmDialogProps) {
  const prefersReducedMotion = useReducedMotion()
  const [presetName, setPresetName] = useState("")

  // Initialize preset name when dialog opens
  useEffect(() => {
    if (open) {
      setPresetName(preset?.name || `Preset ${index + 1}`)
    }
  }, [open, preset, index])

  // Handle confirm action
  const handleConfirm = () => {
    // Validate name (use default if empty)
    const name = presetName.trim() || `Preset ${index + 1}`
    onConfirm(name)
    onOpenChange(false)
  }

  // Animation variants
  const contentVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.3,
        type: prefersReducedMotion ? "tween" : "spring",
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : -10,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence mode='wait'>
        {open && (
          <DialogContent className='sm:max-w-[425px]'>
            <motion.div
              variants={contentVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
            >
              <DialogHeader>
                <DialogTitle>
                  {mode === "save" ? "Save Preset" : "Overwrite Preset"}
                </DialogTitle>
                <DialogDescription>
                  {mode === "save"
                    ? "Save your current settings as a preset."
                    : "This will overwrite the existing preset with your current settings."}
                </DialogDescription>
              </DialogHeader>

              <div className='py-4 space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='preset-name'>Preset Name</Label>
                  <Input
                    id='preset-name'
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder={`Preset ${index + 1}`}
                    className='w-full'
                    autoFocus
                  />
                </div>

                <div className='space-y-2'>
                  <h4 className='text-sm font-medium'>Current Settings</h4>
                  <div className='bg-muted/50 p-3 rounded-md text-sm'>
                    <div className='flex justify-between'>
                      <span>Quantity:</span>
                      <span className='font-medium'>
                        {currentSettings.quantity}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Maximum Value:</span>
                      <span className='font-medium'>
                        {currentSettings.maxValue}
                      </span>
                    </div>
                  </div>
                </div>

                {mode === "overwrite" && preset && (
                  <div className='space-y-2'>
                    <h4 className='text-sm font-medium'>Existing Preset</h4>
                    <div className='bg-muted/50 p-3 rounded-md text-sm'>
                      <div className='flex justify-between'>
                        <span>Name:</span>
                        <span className='font-medium'>{preset.name}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Quantity:</span>
                        <span className='font-medium'>{preset.quantity}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Maximum Value:</span>
                        <span className='font-medium'>{preset.maxValue}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className='flex space-x-2 justify-end'>
                <Button variant='outline' onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirm}>
                  {mode === "save" ? "Save" : "Overwrite"}
                </Button>
              </DialogFooter>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
