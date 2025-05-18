import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Import Framer Motion
import { motion, AnimatePresence } from "motion/react"

// Import store
import { useHistoryStore } from "@/stores/historyStore"

// Import hooks
import { useReducedMotion } from "@/hooks/useReducedMotion"

interface HistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HistoryDialog({ open, onOpenChange }: HistoryDialogProps) {
  // Get state from store
  const { entries, filteredEntries, filter, setFilter, clearHistory } = useHistoryStore()
  
  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion()

  // Animation variants for the number bubbles
  const numberVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: prefersReducedMotion ? 0 : i * 0.05,
        duration: prefersReducedMotion ? 0.2 : 0.3,
        type: prefersReducedMotion ? "tween" : "spring",
        stiffness: 100,
      },
    }),
  }

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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Number History</DialogTitle>
          <DialogDescription>
            View your previously generated number sets.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Input
            placeholder="Filter by number or date..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mb-4"
          />

          <ScrollArea className="h-[50vh] rounded-md border p-4">
            {filteredEntries.length > 0 ? (
              <AnimatePresence>
                {filteredEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    className="mb-4 last:mb-0"
                  >
                    <Card className="p-4">
                      <div className="flex flex-col space-y-2">
                        <div className="text-sm text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {entry.numbers.map((num, idx) => (
                            <motion.div
                              key={`${entry.id}-${num}-${idx}`}
                              className="w-8 h-8 flex items-center justify-center bg-card border rounded-full shadow-sm"
                              variants={numberVariants}
                              initial="hidden"
                              animate="visible"
                              custom={idx}
                            >
                              {num}
                            </motion.div>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.quantity} numbers from 1-{entry.maxValue}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {entries.length > 0
                  ? "No matching entries found."
                  : "No history entries yet."}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="flex justify-between">
          {entries.length > 0 && (
            <Button
              variant="destructive"
              onClick={clearHistory}
              className="mr-auto"
            >
              Clear History
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
