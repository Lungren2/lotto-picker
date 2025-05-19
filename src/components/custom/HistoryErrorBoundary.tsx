import React from "react"
import ErrorBoundary from "./ErrorBoundary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react"
import { motion } from "motion/react"
import { useHistoryStore } from "@/stores/historyStore"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

interface HistoryErrorBoundaryProps {
  children: React.ReactNode
  className?: string
}

/**
 * Specialized error boundary for the History feature with a custom fallback UI
 * that includes options to clear history data
 */
const HistoryErrorBoundary: React.FC<HistoryErrorBoundaryProps> = ({ 
  children,
  className
}) => {
  // Get the reset function from the history store
  const resetHistory = useHistoryStore(state => state.resetHistory)
  
  // Custom fallback UI for history errors
  const HistoryErrorFallback = () => {
    const handleClearHistory = () => {
      // Reset the history store
      resetHistory()
      
      // Show a toast notification
      toast.success("History cleared", {
        description: "All history data has been reset."
      })
      
      // Force a page reload to ensure clean state
      window.location.reload()
    }
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("w-full", className)}
      >
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              History Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              There was a problem loading your history data. This could be due to corrupted data.
            </p>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Reload
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearHistory}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Clear History
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }
  
  return (
    <ErrorBoundary 
      boundary="History" 
      fallback={<HistoryErrorFallback />}
      className={className}
    >
      {children}
    </ErrorBoundary>
  )
}

export default HistoryErrorBoundary
