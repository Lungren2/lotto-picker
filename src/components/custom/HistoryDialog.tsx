import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs"

// Import Framer Motion
import { motion, AnimatePresence } from "motion/react"

// Import store
import { useHistoryStore } from "@/stores/historyStore"

// Import hooks
import { useReducedMotion } from "@/hooks/useReducedMotion"

// Import custom components
import { NumberBubble } from "./NumberBubble"
import { HistoryAnalysis } from "./HistoryAnalysis"
import { FadingScrollArea } from "./FadingScrollArea"

interface HistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HistoryDialog({ open, onOpenChange }: HistoryDialogProps) {
  // Get state from store
  const { entries, filteredEntries, filter, setFilter, clearHistory } =
    useHistoryStore()

  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion()

  // State for active tab
  const [activeTab, setActiveTab] = useState("history")

  // Animation variants for the history items
  // We don't need numberVariants anymore since we're using NumberBubble component

  // Animation variants for the history items
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: prefersReducedMotion ? 0 : i * 0.05,
        duration: prefersReducedMotion ? 0.2 : 0.3,
      },
    }),
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[700px] max-h-[85vh]'>
        <DialogHeader>
          <DialogTitle>Number History</DialogTitle>
          <DialogDescription>
            View and analyze your previously generated number sets.
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='w-full'
          >
            <TabsList className='w-full mb-4'>
              <TabsTrigger value='history'>History</TabsTrigger>
              <TabsTrigger value='analysis'>Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value='history' className='space-y-4'>
              <Input
                placeholder='Filter by number or date...'
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className='mb-4'
              />

              <FadingScrollArea className='h-[45vh]' fadeSize='30px'>
                {filteredEntries.length > 0 ? (
                  <AnimatePresence>
                    {filteredEntries.map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        variants={itemVariants}
                        initial='hidden'
                        animate='visible'
                        custom={index}
                        className='mb-4 last:mb-0'
                      >
                        <Card className='p-4'>
                          <div className='flex flex-col space-y-2'>
                            <div className='text-sm text-muted-foreground'>
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>
                            <div className='flex flex-wrap gap-2'>
                              {entry.numbers.map((num, idx) => (
                                <NumberBubble
                                  key={`${entry.id}-${num}-${idx}`}
                                  number={num}
                                  size='sm'
                                  variant='default'
                                  index={idx}
                                />
                              ))}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              {entry.quantity} numbers from 1-{entry.maxValue}
                              {entry.metadata?.type === "simulation" && (
                                <span className='ml-2 inline-flex items-center'>
                                  • Simulation:{" "}
                                  {entry.metadata.attempts.toLocaleString()}{" "}
                                  attempts
                                  {entry.metadata.matched && (
                                    <span className='ml-1 text-emerald-500'>
                                      • Match found!
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className='flex items-center justify-center h-full text-muted-foreground'>
                    {entries.length > 0
                      ? "No matching entries found."
                      : "No history entries yet."}
                  </div>
                )}
              </FadingScrollArea>
            </TabsContent>

            <TabsContent value='analysis'>
              <FadingScrollArea className='h-[50vh] rounded-md'>
                <HistoryAnalysis />
              </FadingScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className='flex justify-between'>
          {entries.length > 0 && (
            <Button
              variant='destructive'
              onClick={clearHistory}
              className='mr-auto'
            >
              Clear History
            </Button>
          )}
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
