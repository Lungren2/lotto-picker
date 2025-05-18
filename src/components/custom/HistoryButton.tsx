import { useState } from "react"
import { Button } from "@/components/ui/button"
import { HistoryDialog } from "./HistoryDialog"

// Import Framer Motion
import { motion } from "motion/react"

// Import Lucide icons
import { History } from "lucide-react"

export function HistoryButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="rounded-full"
          aria-label="View History"
        >
          <History className="h-5 w-5" />
        </Button>
      </motion.div>
      
      <HistoryDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}
