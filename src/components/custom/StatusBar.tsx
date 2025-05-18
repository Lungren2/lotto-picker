import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useRef } from "react"
import { motion } from "motion/react"

// Import store
import { useNumberStore } from "@/stores/numberStore"

export function StatusBar() {
  // Get state from store
  const { usedNumbers, remainingCount, maxValue, hasEnoughNumbers, quantity } =
    useNumberStore()

  // Calculate used count
  const usedCount = usedNumbers.length

  // Reference to track previous values for animations
  const prevRemainingCountRef = useRef(remainingCount)

  // Update ref when remainingCount changes
  useEffect(() => {
    prevRemainingCountRef.current = remainingCount
  }, [remainingCount])

  // Calculate the percentage of remaining numbers to determine color
  const remainingPercentage = (remainingCount / maxValue) * 100

  // Determine text color based on remaining percentage
  const getTextColorClass = () => {
    if (!hasEnoughNumbers) return "text-destructive"
    if (remainingPercentage < 25) return "text-amber-500"
    if (remainingPercentage < 50) return "text-emerald-500"
    return "text-muted-foreground"
  }

  // Animation variants for the text that changes
  // Will be used with Framer Motion
  const textVariants = {
    initial: { opacity: 0, y: -10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      y: 10,
      transition: { duration: 0.2 },
    },
  }

  return (
    <Card className='w-full h-full max-w-md'>
      <CardContent className='text-center py-4'>
        <div className='flex justify-between items-center'>
          <motion.p
            className='text-sm text-muted-foreground'
            animate={{ opacity: [0.7, 1] }}
            transition={{ duration: 0.5 }}
          >
            Used: {usedCount}/{maxValue}
          </motion.p>
          <motion.p
            className={`text-sm ${getTextColorClass()}`}
            key={remainingCount} // Force re-render on change
            initial='initial'
            animate='animate'
            exit='exit'
            variants={textVariants}
          >
            Available: {remainingCount}/{maxValue}
          </motion.p>
        </div>

        {!hasEnoughNumbers && (
          <motion.p
            className='text-xs text-muted-foreground mt-2'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            Need {quantity - remainingCount} more to generate a set of{" "}
            {quantity}
          </motion.p>
        )}
      </CardContent>
    </Card>
  )
}
