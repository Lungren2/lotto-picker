/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "motion/react"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { NumberBubble } from "./NumberBubble"

// Import store
import { useHistoryStore } from "@/stores/historyStore"

export function HistoryAnalysis() {
  // Get state from store
  const { entries } = useHistoryStore()

  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion()

  // State for active tab
  const [activeTab, setActiveTab] = useState("frequency")

  // Calculate frequency of each number
  const frequencyData = useMemo(() => {
    if (entries.length === 0) return []

    // Find the highest maxValue across all entries
    const highestMaxValue = Math.max(...entries.map((entry) => entry.maxValue))

    // Initialize frequency array with zeros
    const frequencies: { number: number; count: number; percentage: number }[] =
      Array.from({ length: highestMaxValue }, (_, i) => ({
        number: i + 1,
        count: 0,
        percentage: 0,
      }))

    // Count occurrences of each number
    entries.forEach((entry) => {
      entry.numbers.forEach((num) => {
        frequencies[num - 1].count++
      })
    })

    // Calculate total numbers generated
    const totalNumbers = entries.reduce(
      (sum, entry) => sum + entry.numbers.length,
      0
    )

    // Calculate percentages
    frequencies.forEach((item) => {
      item.percentage = totalNumbers > 0 ? (item.count / totalNumbers) * 100 : 0
    })

    return frequencies
  }, [entries])

  // Find most and least frequent numbers
  const { mostFrequent, leastFrequent } = useMemo(() => {
    if (frequencyData.length === 0) {
      return { mostFrequent: [], leastFrequent: [] }
    }

    // Sort by frequency (descending)
    const sorted = [...frequencyData].sort((a, b) => b.count - a.count)

    // Get numbers with at least one occurrence
    const nonZero = sorted.filter((item) => item.count > 0)

    // Get top 5 most frequent
    const mostFrequent = nonZero.slice(0, 5)

    // Get bottom 5 least frequent (but with at least one occurrence)
    const leastFrequent = nonZero.length > 5 ? nonZero.slice(-5).reverse() : []

    return { mostFrequent, leastFrequent }
  }, [frequencyData])

  // Calculate patterns (pairs that appear together)
  const patterns = useMemo(() => {
    if (entries.length < 2) return []

    const pairCounts: Record<
      string,
      { pair: [number, number]; count: number }
    > = {}

    // Count occurrences of each pair
    entries.forEach((entry) => {
      const numbers = entry.numbers

      // Generate all possible pairs in this entry
      for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          // Sort the pair to ensure consistent keys
          const pair: [number, number] = [numbers[i], numbers[j]].sort(
            (a, b) => a - b
          ) as [number, number]
          const key = `${pair[0]}-${pair[1]}`

          if (!pairCounts[key]) {
            pairCounts[key] = { pair, count: 0 }
          }

          pairCounts[key].count++
        }
      }
    })

    // Convert to array and sort by count (descending)
    return Object.values(pairCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Get top 5 pairs
  }, [entries])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.4,
        staggerChildren: prefersReducedMotion ? 0.03 : 0.06,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.3,
      },
    },
  }

  // If no entries, show a message
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className='p-4 text-center text-muted-foreground'>
          No history entries yet. Generate some numbers to see analysis.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Number Analysis</CardTitle>
      </CardHeader>
      <CardContent className='p-4'>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='w-full mb-4'>
            <TabsTrigger value='frequency'>Frequency</TabsTrigger>
            <TabsTrigger value='patterns'>Patterns</TabsTrigger>
            <TabsTrigger value='heatmap'>Heatmap</TabsTrigger>
          </TabsList>

          <TabsContent value='frequency' className='space-y-4'>
            <AnimatePresence mode='wait'>
              <motion.div
                key='frequency-tab'
                variants={containerVariants}
                initial='hidden'
                animate='visible'
                className='space-y-4'
              >
                {/* Most frequent numbers */}
                {mostFrequent.length > 0 && (
                  <motion.div variants={itemVariants} className='space-y-2'>
                    <h3 className='text-sm font-medium'>
                      Most Frequent Numbers
                    </h3>
                    <div className='flex flex-wrap gap-2'>
                      {mostFrequent.map(({ number, count, percentage }) => (
                        <div
                          key={number}
                          className='flex flex-col items-center'
                        >
                          <NumberBubble
                            number={number}
                            variant='highlight'
                            size='sm'
                          />
                          <div className='text-xs mt-1 text-muted-foreground'>
                            {count}x ({percentage.toFixed(1)}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Least frequent numbers */}
                {leastFrequent.length > 0 && (
                  <motion.div variants={itemVariants} className='space-y-2'>
                    <h3 className='text-sm font-medium'>
                      Least Frequent Numbers
                    </h3>
                    <div className='flex flex-wrap gap-2'>
                      {leastFrequent.map(({ number, count, percentage }) => (
                        <div
                          key={number}
                          className='flex flex-col items-center'
                        >
                          <NumberBubble
                            number={number}
                            variant='muted'
                            size='sm'
                          />
                          <div className='text-xs mt-1 text-muted-foreground'>
                            {count}x ({percentage.toFixed(1)}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value='patterns' className='space-y-4'>
            <AnimatePresence mode='wait'>
              <motion.div
                key='patterns-tab'
                variants={containerVariants}
                initial='hidden'
                animate='visible'
                className='space-y-4'
              >
                {/* Common pairs */}
                {patterns.length > 0 ? (
                  <motion.div variants={itemVariants} className='space-y-2'>
                    <h3 className='text-sm font-medium'>Common Pairs</h3>
                    <div className='space-y-2'>
                      {patterns.map(({ pair, count }) => (
                        <div
                          key={`${pair[0]}-${pair[1]}`}
                          className='flex items-center gap-2'
                        >
                          <div className='flex gap-1'>
                            <NumberBubble number={pair[0]} size='xs' />
                            <NumberBubble number={pair[1]} size='xs' />
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            appeared together {count} times
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className='text-center text-muted-foreground'>
                    Not enough data to analyze patterns
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value='heatmap' className='space-y-4'>
            <AnimatePresence mode='wait'>
              <motion.div
                key='heatmap-tab'
                variants={containerVariants}
                initial='hidden'
                animate='visible'
              >
                <motion.div variants={itemVariants} className='space-y-2'>
                  <h3 className='text-sm font-medium'>
                    Number Frequency Heatmap
                  </h3>
                  <div className='grid grid-cols-10 gap-1'>
                    {frequencyData.map(({ number, count, percentage }) => {
                      // Calculate color intensity based on frequency
                      const intensity = Math.min(
                        100,
                        Math.max(0, percentage * 5)
                      )
                      const bgColor = `hsl(220, 70%, ${100 - intensity}%)`
                      const textColor = intensity > 50 ? "white" : "black"

                      return (
                        <div
                          key={number}
                          className='aspect-square flex items-center justify-center text-xs font-medium rounded-md'
                          style={{
                            backgroundColor: bgColor,
                            color: textColor,
                          }}
                        >
                          {number}
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
