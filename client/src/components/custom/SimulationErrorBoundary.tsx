import React from "react"
import ErrorBoundary from "./ErrorBoundary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, StopCircle } from "lucide-react"
import { motion } from "motion/react"
import { useSimulationStore } from "@/stores/simulationStore"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

interface SimulationErrorBoundaryProps {
  children: React.ReactNode
  className?: string
}

/**
 * Specialized error boundary for the Simulation/TryYourLuck feature with a custom fallback UI
 * that includes options to reset the simulation state
 */
const SimulationErrorBoundary: React.FC<SimulationErrorBoundaryProps> = ({ 
  children,
  className
}) => {
  // Get the reset function from the simulation store
  const resetSimulation = useSimulationStore(state => state.resetSimulation)
  const stopSimulation = useSimulationStore(state => state.stopSimulation)
  
  // Custom fallback UI for simulation errors
  const SimulationErrorFallback = () => {
    const handleResetSimulation = () => {
      // Stop any running simulation
      stopSimulation()
      
      // Reset the simulation state
      resetSimulation()
      
      // Show a toast notification
      toast.success("Simulation reset", {
        description: "The simulation has been reset to its initial state."
      })
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
              Simulation Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              There was a problem with the simulation. This could be due to an unexpected state or calculation error.
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
              onClick={handleResetSimulation}
              className="gap-1"
            >
              <StopCircle className="h-4 w-4" />
              Reset Simulation
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }
  
  return (
    <ErrorBoundary 
      boundary="Simulation" 
      fallback={<SimulationErrorFallback />}
      className={className}
    >
      {children}
    </ErrorBoundary>
  )
}

export default SimulationErrorBoundary
