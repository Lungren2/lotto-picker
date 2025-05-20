import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"

// Import utilities
import { getAvailableNumbers } from "@/utils/numberUtils"

// Import store
import { useNumberStore } from "@/stores/numberStore"

// Import custom components
import { NumberBubble } from "./NumberBubble"
import { ShareButton } from "./ShareButton"

export function NumberDisplay() {
  // Get state from store
  const {
    currentSet: numbers,
    hasEnoughNumbers,
    usedNumbers,
    maxValue,
    quantity,
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

  return (
    <AnimatePresence mode='wait'>
      {isMounted && (
        <Card className='w-full h-full mb-4'>
          <CardHeader>
            <CardTitle>Your Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap justify-center gap-2'>
              {numbers
                ? numbers.map((num, index) => (
                    <NumberBubble
                      key={num}
                      number={num}
                      index={index}
                      variant={
                        index === numbers.length - 1 ? "highlight" : "default"
                      }
                    />
                  ))
                : Array.from({ length: 5 }, (_, index) => (
                    <div
                      key={`placeholder-${index}`}
                      className='w-10 h-10 flex items-center justify-center bg-card/30 border border-dashed rounded-full'
                    />
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
                      <NumberBubble
                        key={`remaining-${num}`}
                        number={num}
                        size='sm'
                        variant='muted'
                        index={index}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          {numbers && numbers.length > 0 && (
            <CardFooter className='flex justify-center pb-4 pt-0'>
              <ShareButton
                numbers={numbers}
                quantity={quantity}
                maxValue={maxValue}
              />
            </CardFooter>
          )}
        </Card>
      )}
    </AnimatePresence>
  )
}
