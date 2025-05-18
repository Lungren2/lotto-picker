import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"

// Import store
import { useNumberStore } from "@/stores/numberStore"

export function NumberSettings() {
  // Get state and actions from store
  const {
    quantity,
    maxValue,
    hasEnoughNumbers,
    remainingCount,
    setQuantity,
    setMaxValue,
    generateNumbers,
    resetNumbers,
  } = useNumberStore()

  // Track previous state to animate transitions
  const [prevHasEnoughNumbers, setPrevHasEnoughNumbers] =
    useState(hasEnoughNumbers)

  // Update previous state when current state changes
  useEffect(() => {
    setPrevHasEnoughNumbers(hasEnoughNumbers)
  }, [hasEnoughNumbers])

  // Handle the action button click (either generate or reset)
  const handleActionClick = () => {
    if (hasEnoughNumbers) {
      generateNumbers()
    } else {
      resetNumbers()
    }
  }

  // Animation variants for the button
  // Will be used with Framer Motion
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.03 },
    tap: { scale: 0.97 },
    // Special transition for changing state
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 15,
    },
  }

  // Animation for text change
  // Will be used with Framer Motion
  const textChangeVariants = {
    exit: {
      y: 20,
      opacity: 0,
      transition: { duration: 0.2 },
    },
    enter: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 },
    },
  }

  return (
    <Card className='w-full max-w-md mb-6'>
      <CardHeader>
        <CardTitle>Number Settings</CardTitle>
        <CardDescription>
          Configure your random number generation
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-6'>
        <div className='space-y-4'>
          <div>
            <div className='flex justify-between mb-2'>
              <label htmlFor='quantity' className='text-sm font-medium'>
                Quantity of Numbers
              </label>
              <motion.span
                className='text-sm text-muted-foreground'
                key={quantity} // Force re-render on change
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {quantity}
              </motion.span>
            </div>
            <Slider
              id='quantity'
              min={1}
              max={maxValue}
              value={[quantity]}
              onValueChange={(value) => setQuantity(value[0])}
              className='w-full'
            />
            <div className='flex justify-between text-xs text-muted-foreground mt-1'>
              <span>1</span>
              <span>{maxValue}</span>
            </div>
          </div>

          <div>
            <div className='flex justify-between mb-2'>
              <label htmlFor='maxValue' className='text-sm font-medium'>
                Maximum Value
              </label>
              <motion.span
                className='text-sm text-muted-foreground'
                key={maxValue} // Force re-render on change
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {maxValue}
              </motion.span>
            </div>
            <Slider
              id='maxValue'
              min={quantity}
              max={100}
              value={[maxValue]}
              onValueChange={(value) => {
                if (value[0] >= quantity) {
                  setMaxValue(value[0])
                }
              }}
              className='w-full'
            />
            <div className='flex justify-between text-xs text-muted-foreground mt-1'>
              <span>{quantity}</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        {/* AnimatePresence will be used with Framer Motion */}
        <AnimatePresence mode='wait'>
          <motion.div
            className='w-full'
            variants={buttonVariants}
            whileHover='hover'
            whileTap='tap'
            transition={buttonVariants.transition}
            layout
          >
            <Button
              onClick={handleActionClick}
              className='w-full'
              variant={hasEnoughNumbers ? "default" : "destructive"}
            >
              {/* AnimatePresence for text change will be used with Framer Motion */}
              <AnimatePresence mode='wait'>
                <motion.span
                  key={hasEnoughNumbers ? "generate" : "reset"}
                  variants={textChangeVariants}
                  initial='exit'
                  animate='enter'
                  exit='exit'
                >
                  {hasEnoughNumbers ? "Generate Set" : "Reset Pool"}
                </motion.span>
              </AnimatePresence>
            </Button>
          </motion.div>
        </AnimatePresence>
      </CardFooter>
    </Card>
  )
}
