import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "motion/react"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { useAdaptiveDebounce } from "@/hooks/useAdaptiveDebounce"
import { cn } from "@/lib/utils"

// Import stores
import { useNumberStore } from "@/stores/numberStore"
import { useOddsStore } from "@/stores/oddsStore"

// Import icons
import { ArrowUpIcon, ArrowDownIcon, LoaderIcon } from "lucide-react"

export default function OddsVisualizer() {
  // Get state from stores (only what we need)
  const { quantity, maxValue, numSets } = useNumberStore()
  const { odds } = useOddsStore()

  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion()

  // Calculate complexity factor based on input values
  const complexityFactor = Math.min(
    Math.max(1, Math.floor(maxValue / 20) + Math.floor(quantity / 5)),
    10
  )

  // Update odds calculation with adaptive debouncing based on complexity
  const { isDebouncing } = useAdaptiveDebounce(
    () => {
      // This will trigger a recalculation in the store with adaptive debouncing
      useOddsStore.getState().recalculateOdds()
    },
    200, // Base delay in milliseconds
    complexityFactor, // Complexity factor (1-10)
    [quantity, maxValue, numSets]
  )

  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.5,
        staggerChildren: prefersReducedMotion ? 0.05 : 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 5 : 20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.4,
        type: prefersReducedMotion ? "tween" : "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  }

  const numberVariants = {
    initial: { opacity: 0, scale: 0.8, y: -5 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.4,
        type: prefersReducedMotion ? "tween" : "spring",
        stiffness: 200,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 5,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.2,
      },
    },
  }

  // Animation variants for odds items
  const oddsItemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: prefersReducedMotion ? 0 : i * 0.05,
        duration: prefersReducedMotion ? 0.2 : 0.3,
        type: prefersReducedMotion ? "tween" : "spring",
        stiffness: 100,
        damping: 15,
      },
    }),
    hover: {
      y: -5,
      scale: 1.03,
      boxShadow:
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.3,
      },
    },
  }

  return (
    <motion.div variants={containerVariants} initial='hidden' animate='visible'>
      <motion.div variants={cardVariants}>
        <Card interactive>
          <CardContent className='p-4 space-y-4'>
            <motion.div
              className='flex items-center justify-between'
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <h2 className='text-xl font-semibold'>Odds Summary</h2>

              {isDebouncing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className='text-muted-foreground flex items-center gap-1 text-sm'
                >
                  <LoaderIcon className='h-3 w-3 animate-spin' />
                  <span>Calculating</span>
                </motion.div>
              )}
            </motion.div>

            <AnimatePresence mode='wait'>
              <motion.div
                key={odds.totalCombos}
                variants={numberVariants}
                initial='initial'
                animate='animate'
                exit='exit'
                className='bg-primary/5 p-3 rounded-lg border border-primary/20'
              >
                <span className='font-medium'>Total unique combinations:</span>{" "}
                <span className='text-lg font-bold'>
                  {odds.totalCombos.toLocaleString()}
                </span>
              </motion.div>
            </AnimatePresence>

            <div className='gap-3 grid grid-cols-1 md:grid-cols-2'>
              {odds.perMatchOdds
                .filter(({ matchCount }) => matchCount > 0) // Filter out 0 matches
                .map(
                  (
                    {
                      matchCount,
                      singleChance,
                      adjustedChance,
                      prevSingleChance,
                      prevAdjustedChance,
                    },
                    index
                  ) => {
                    // Determine if values have increased or decreased
                    const singleChanceIncreased =
                      prevSingleChance !== undefined &&
                      singleChance > prevSingleChance
                    const singleChanceDecreased =
                      prevSingleChance !== undefined &&
                      singleChance < prevSingleChance
                    const adjustedChanceIncreased =
                      prevAdjustedChance !== undefined &&
                      adjustedChance > prevAdjustedChance
                    const adjustedChanceDecreased =
                      prevAdjustedChance !== undefined &&
                      adjustedChance < prevAdjustedChance

                    return (
                      <motion.div
                        key={matchCount}
                        className='border p-3 rounded-lg shadow-sm bg-card hover:bg-accent/5'
                        variants={oddsItemVariants}
                        initial='hidden'
                        animate='visible'
                        whileHover='hover'
                        custom={index}
                      >
                        <div className='flex items-center justify-between mb-1'>
                          <p className='font-semibold text-lg'>
                            {matchCount} matches
                          </p>
                          {(singleChanceIncreased ||
                            adjustedChanceIncreased) && (
                            <ArrowUpIcon className='h-4 w-4 text-emerald-500' />
                          )}
                          {(singleChanceDecreased ||
                            adjustedChanceDecreased) && (
                            <ArrowDownIcon className='h-4 w-4 text-amber-500' />
                          )}
                        </div>

                        <AnimatePresence mode='wait'>
                          <motion.div
                            key={`single-${singleChance}`}
                            initial='initial'
                            animate='animate'
                            exit='exit'
                            variants={numberVariants}
                            className={cn(
                              "flex justify-between items-center text-sm",
                              singleChanceIncreased
                                ? "text-emerald-500"
                                : singleChanceDecreased
                                ? "text-amber-500"
                                : "text-muted-foreground"
                            )}
                          >
                            <span>
                              1 in{" "}
                              {(1 / singleChance).toFixed(0).toLocaleString()}
                            </span>
                            <span>🪻{(singleChance * 100).toFixed(5)}%</span>
                          </motion.div>
                        </AnimatePresence>

                        <AnimatePresence mode='wait'>
                          <motion.div
                            key={`adjusted-${adjustedChance}-${numSets}`}
                            initial='initial'
                            animate='animate'
                            exit='exit'
                            variants={numberVariants}
                            className={cn(
                              "mt-1 text-sm font-medium",
                              adjustedChanceIncreased
                                ? "text-emerald-500"
                                : adjustedChanceDecreased
                                ? "text-amber-500"
                                : ""
                            )}
                          >
                            {(adjustedChance * 100).toFixed(5)}% with {numSets}{" "}
                            sets
                          </motion.div>
                        </AnimatePresence>
                      </motion.div>
                    )
                  }
                )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
