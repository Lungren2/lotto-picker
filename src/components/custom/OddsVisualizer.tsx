import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "motion/react"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { useDebounce } from "@/hooks/useDebounce"

// Import stores
import { useNumberStore } from "@/stores/numberStore"
import { useOddsStore } from "@/stores/oddsStore"

export default function OddsVisualizer() {
  // Get state from stores (only what we need)
  const { quantity, maxValue, numSets } = useNumberStore()
  const { odds } = useOddsStore()

  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion()

  // Update odds calculation when inputs change with debouncing
  useDebounce(
    () => {
      // This will trigger a recalculation in the store with debouncing to prevent excessive calculations
      useOddsStore.getState().recalculateOdds()
    },
    300, // 300ms debounce delay
    [quantity, maxValue, numSets]
  )

  // Animation variants
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
    hidden: { opacity: 0, y: prefersReducedMotion ? 5 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.4,
        type: prefersReducedMotion ? "tween" : "spring",
        stiffness: 100,
      },
    },
  }

  const numberVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.4,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.2,
      },
    },
  }

  return (
    <motion.div variants={containerVariants} initial='hidden' animate='visible'>
      <motion.div variants={cardVariants}>
        <Card>
          <CardContent className='p-4 space-y-2'>
            <h2 className='text-xl font-semibold'>Odds Summary</h2>
            <AnimatePresence mode='wait'>
              <motion.p
                key={odds.totalCombos}
                variants={numberVariants}
                initial='initial'
                animate='animate'
                exit='exit'
              >
                Total unique combinations: {odds.totalCombos.toLocaleString()}
              </motion.p>
            </AnimatePresence>
            <div className='gap-2 grid grid-cols-1 md:grid-cols-2'>
              {odds.perMatchOdds
                .filter(({ matchCount }) => matchCount > 0) // Filter out 0 matches
                .map(
                  ({
                    matchCount,
                    singleChance,
                    adjustedChance,
                    prevSingleChance,
                    prevAdjustedChance,
                  }) => {
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
                        className='border p-2 rounded-md'
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay:
                            matchCount * (prefersReducedMotion ? 0.03 : 0.05),
                          duration: prefersReducedMotion ? 0.2 : 0.3,
                        }}
                        whileHover={{
                          scale: prefersReducedMotion ? 1.01 : 1.02,
                        }}
                      >
                        <p className='font-medium'>{matchCount} matches</p>
                        <AnimatePresence mode='wait'>
                          <motion.p
                            key={`single-${singleChance}`}
                            initial='initial'
                            animate='animate'
                            exit='exit'
                            variants={numberVariants}
                            className={
                              singleChanceIncreased
                                ? "text-emerald-500"
                                : singleChanceDecreased
                                ? "text-amber-500"
                                : ""
                            }
                          >
                            1 in{" "}
                            {(1 / singleChance).toFixed(0).toLocaleString()}{" "}
                            chance (per set)
                          </motion.p>
                        </AnimatePresence>
                        <AnimatePresence mode='wait'>
                          <motion.p
                            key={`percent-${singleChance}`}
                            initial='initial'
                            animate='animate'
                            exit='exit'
                            variants={numberVariants}
                          >
                            {(singleChance * 100).toFixed(5)}% per set
                          </motion.p>
                        </AnimatePresence>
                        <AnimatePresence mode='wait'>
                          <motion.p
                            key={`adjusted-${adjustedChance}-${numSets}`}
                            initial='initial'
                            animate='animate'
                            exit='exit'
                            variants={numberVariants}
                            className={
                              adjustedChanceIncreased
                                ? "text-emerald-500"
                                : adjustedChanceDecreased
                                ? "text-amber-500"
                                : ""
                            }
                          >
                            {(adjustedChance * 100).toFixed(5)}% chance with{" "}
                            {numSets} sets
                          </motion.p>
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
