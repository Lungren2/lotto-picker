import { useState, useRef, useEffect } from "react"
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

// Import react-window for virtualization
import { FixedSizeList as List } from "react-window"

// Import store
import { useHistoryStore } from "@/stores/historyStore"
import type { HistoryEntry } from "@/stores/historyStore"

// Import hooks
import { useReducedMotion } from "@/hooks/useReducedMotion"

// Import custom components
import { NumberBubble } from "./NumberBubble"
import { HistoryAnalysis } from "./HistoryAnalysis"
import ScrollFade from "./FadingScrollArea"

interface HistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// History entry item component for virtualized list
interface HistoryItemProps {
  entry: HistoryEntry
  index: number
  style: React.CSSProperties
}

const HistoryItem = ({ entry, index, style }: HistoryItemProps) => {
  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion()

  // Animation variants for the history items
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: prefersReducedMotion ? 0 : Math.min(index * 0.03, 0.3),
        duration: prefersReducedMotion ? 0.2 : 0.3,
      },
    },
  }

  return (
    <div style={style} className='px-1 py-2'>
      <motion.div
        variants={itemVariants}
        initial='hidden'
        animate='visible'
        className='h-full'
      >
        <Card className='p-4 h-full'>
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
                  • Simulation: {entry.metadata.attempts.toLocaleString()}{" "}
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
    </div>
  )
}

export function HistoryDialog({ open, onOpenChange }: HistoryDialogProps) {
  // Get state from store
  const { entries, filteredEntries, filter, setFilter, clearHistory } =
    useHistoryStore()

  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion()

  // State for active tab
  const [activeTab, setActiveTab] = useState("history")

  // Ref for the list container to measure its dimensions
  const listContainerRef = useRef<HTMLDivElement>(null)

  // State for list dimensions
  const [listDimensions, setListDimensions] = useState({ width: 0, height: 0 })

  // Update dimensions when the dialog opens or window resizes
  useEffect(() => {
    if (!open) return

    const updateDimensions = () => {
      if (listContainerRef.current) {
        setListDimensions({
          width: listContainerRef.current.offsetWidth,
          height: listContainerRef.current.offsetHeight,
        })
      }
    }

    // Initial update
    updateDimensions()

    // Add resize listener
    window.addEventListener("resize", updateDimensions)

    // Cleanup
    return () => {
      window.removeEventListener("resize", updateDimensions)
    }
  }, [open, activeTab])

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

              <div ref={listContainerRef} className='h-[45vh] relative'>
                {filteredEntries.length > 0 ? (
                  listDimensions.height > 0 && (
                    <List
                      height={listDimensions.height}
                      width={listDimensions.width}
                      itemCount={filteredEntries.length}
                      itemSize={150} // Approximate height of each item
                      overscanCount={3} // Number of items to render outside of the visible area
                      className='scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent'
                    >
                      {({ index, style }) => (
                        <HistoryItem
                          entry={filteredEntries[index]}
                          index={index}
                          style={style}
                        />
                      )}
                    </List>
                  )
                ) : (
                  <div className='flex items-center justify-center h-full text-muted-foreground'>
                    {entries.length > 0
                      ? "No matching entries found."
                      : "No history entries yet."}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value='analysis'>
              <ScrollFade className='h-[50vh] rounded-md'>
                <HistoryAnalysis />
              </ScrollFade>
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
