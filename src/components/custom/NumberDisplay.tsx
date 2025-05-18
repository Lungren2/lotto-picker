import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"

// Import utilities
import { getAvailableNumbers } from "@/utils/numberUtils"

// Import store
import { useNumberStore } from "@/stores/numberStore"

export function NumberDisplay() {
  // Get state from store
  const {
    currentSet: numbers,
    hasEnoughNumbers,
    usedNumbers,
    maxValue,
  } = useNumberStore()

  // Track whether the component has mounted
  const [isMounted, setIsMounted] = useState(false)

  // Calculate available numbers when we don't have enough
  const availableNumbers = useMemo(() => {
    if (hasEnoughNumbers) return []
    return getAvailableNumbers(maxValue, usedNumbers)
  }, [hasEnoughNumbers, maxValue, usedNumbers])

  // Set mounted state after initial render
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Animation variants for the number bubbles
  // Will be used with Framer Motion
  const numberVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.05, // Stagger the animations
        duration: 0.3,
        type: "spring",
        stiffness: 200,
      },
    }),
  }

  // Animation variants for the remaining numbers section
  const remainingVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        staggerChildren: 0.02,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2,
      },
    },
  }

  // Animation variants for the remaining number bubbles
  const remainingNumberVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.02, // Faster stagger for potentially more numbers
        duration: 0.2,
        type: "spring",
        stiffness: 200,
      },
    }),
  }

  return (
    <AnimatePresence mode='wait'>
      {isMounted && (
        <Card className='w-full max-w-md mb-4'>
          <CardHeader>
            <CardTitle>Your Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap justify-center gap-2'>
              {numbers
                ? numbers.map((num, index) => (
                    <motion.div
                      key={num}
                      className='w-10 h-10 flex items-center justify-center bg-card border rounded-full shadow-sm'
                      variants={numberVariants}
                      initial='hidden'
                      animate='visible'
                      custom={index} // For staggered animations
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {num}
                    </motion.div>
                  ))
                : Array.from({ length: 5 }, (_, index) => (
                    <motion.div
                      key={`placeholder-${index}`}
                      className='w-10 h-10 flex items-center justify-center bg-card border rounded-full shadow-sm'
                      variants={numberVariants}
                      initial='hidden'
                      animate='visible'
                      custom={index}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    ></motion.div>
                  ))}
            </div>

            {/* Display remaining numbers when not enough are available */}
            <AnimatePresence>
              {!hasEnoughNumbers && availableNumbers.length > 0 && (
                <motion.div
                  className='mt-6'
                  variants={remainingVariants}
                  initial='hidden'
                  animate='visible'
                  exit='exit'
                >
                  <h3 className='text-sm font-medium mb-2 text-center'>
                    Remaining Available Numbers ({availableNumbers.length})
                  </h3>
                  <div className='flex flex-wrap justify-center gap-1.5'>
                    {availableNumbers.map((num, index) => (
                      <motion.div
                        key={`remaining-${num}`}
                        className='w-8 h-8 flex items-center justify-center bg-muted/50 border border-dashed rounded-full text-sm text-muted-foreground'
                        variants={remainingNumberVariants}
                        initial='hidden'
                        animate='visible'
                        custom={index}
                        whileHover={{
                          scale: 1.1,
                          backgroundColor: "var(--muted)",
                        }}
                      >
                        {num}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}
    </AnimatePresence>
  )
}
