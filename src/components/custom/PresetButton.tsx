import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "motion/react"
import { useLongPress } from "@/hooks/useLongPress"
import { useSonnerToast } from "@/hooks/useSonnerToast"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { Save, Download, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePresetStore } from "@/stores/presetStore"

interface PresetButtonProps {
  index: number
  isSaved: boolean
  onSave: () => void
  onLoad: () => void
  disabled?: boolean
  className?: string
}

export function PresetButton({
  index,
  isSaved,
  onSave,
  onLoad,
  disabled = false,
  className,
}: PresetButtonProps) {
  const { toast } = useSonnerToast()
  const prefersReducedMotion = useReducedMotion()
  const { getPresetName } = usePresetStore()

  // Get the preset name
  const presetName = isSaved ? getPresetName(index) : `Empty ${index + 1}`

  // Set up long press handlers
  const { props, isPressed, isLongPressed } = useLongPress({
    duration: 1000, // 1 second for long press
    onShortPress: () => {
      if (isSaved) {
        onLoad()
        toast({
          title: "Preset Loaded",
          description: `"${getPresetName(index)}" has been loaded.`,
          variant: "success",
          duration: 2000,
        })
      } else {
        toast({
          title: "Empty Preset",
          description: `This preset is empty. Long press to save current settings.`,
          variant: "info",
          duration: 3000,
        })
      }
    },
    onLongPress: () => {
      onSave()
      // Note: We don't show a toast here because the dialog will appear instead
    },
    disabled,
  })

  // Animation variants
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    pressed: { scale: 0.9 },
    longPressed: { scale: 0.85 },
    transition: {
      type: prefersReducedMotion ? "tween" : "spring",
      stiffness: 300,
      damping: 15,
      duration: prefersReducedMotion ? 0.2 : undefined,
    },
  }

  // Get the current animation state
  const animationState = isLongPressed
    ? "longPressed"
    : isPressed
    ? "pressed"
    : "initial"

  return (
    <motion.div
      className={cn("relative", className)}
      variants={buttonVariants}
      initial='initial'
      animate={animationState}
      whileHover='hover'
      whileTap='tap'
      transition={buttonVariants.transition}
    >
      <Button
        {...props}
        className={cn(
          "w-full h-16 flex flex-col items-center justify-center gap-1 relative overflow-hidden",
          isSaved ? "bg-primary/90" : "bg-muted"
        )}
        variant={isSaved ? "default" : "outline"}
        disabled={disabled}
      >
        <AnimatePresence mode='wait'>
          <motion.div
            key={`preset-${index}-${isSaved ? "saved" : "empty"}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className='flex flex-col items-center'
          >
            {isSaved ? (
              <>
                <Download className='h-4 w-4 mb-1' />
                <span className='text-xs font-medium truncate max-w-[80px]'>
                  {presetName}
                </span>
              </>
            ) : (
              <>
                <Save className='h-4 w-4 mb-1' />
                <span className='text-xs'>Empty {index + 1}</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress indicator for long press */}
        {isPressed && (
          <motion.div
            className='absolute bottom-0 left-0 h-1 bg-primary'
            initial={{ width: "0%" }}
            animate={{ width: isLongPressed ? "100%" : "0%" }}
            transition={{ duration: 1 }}
          />
        )}

        {/* Star indicator for saved preset */}
        {isSaved && (
          <motion.div
            className='absolute top-1 right-1'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Star className='h-3 w-3 fill-primary-foreground' />
          </motion.div>
        )}
      </Button>
    </motion.div>
  )
}
