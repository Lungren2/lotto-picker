import { useState } from "react"
import { Button } from "@/components/ui/button"
import { HistoryDialog } from "./HistoryDialog"
import HistoryErrorBoundary from "./HistoryErrorBoundary"
import { useErrorHandler } from "@/hooks/useErrorHandler"

// Import Framer Motion
import { motion } from "motion/react"

// Import Lucide icons
import { History } from "lucide-react"

export function HistoryButton() {
  const [isOpen, setIsOpen] = useState(false)

  // Initialize error handler for the History component
  const { handleError } = useErrorHandler({
    component: "HistoryButton",
    showToast: true,
  })

  const handleOpenHistory = () => {
    try {
      setIsOpen(true)
    } catch (error) {
      handleError(error, "opening history dialog")
    }
  }

  return (
    <>
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant='ghost'
          size='icon'
          onClick={handleOpenHistory}
          className='rounded-full'
          aria-label='View History'
        >
          <History className='h-5 w-5' />
        </Button>
      </motion.div>

      <HistoryErrorBoundary>
        <HistoryDialog open={isOpen} onOpenChange={setIsOpen} />
      </HistoryErrorBoundary>
    </>
  )
}
