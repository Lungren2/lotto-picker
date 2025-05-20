import React, { Component, ErrorInfo, ReactNode } from "react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { motion } from "motion/react"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

// Import the enhanced debug logger
import { error as logError } from "@/utils/debugLogger"

// Define props for the ErrorBoundary component
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
  boundary: string // Identifies which part of the app this boundary is wrapping
  className?: string
}

// Define state for the ErrorBoundary component
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary component that catches JavaScript errors in its child component tree.
 * It logs the errors and displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  // This lifecycle method runs when an error occurs in a child component
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  // This lifecycle method is called after an error has been thrown by a descendant component
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our enhanced logging service
    logError(
      this.props.boundary,
      `Error caught by ErrorBoundary: ${error.message}`,
      {
        componentStack: errorInfo.componentStack,
        errorName: error.name,
        timestamp: new Date().toISOString(),
        boundary: this.props.boundary,
      },
      error // Pass the actual error object for stack trace
    )

    // Update state with error details
    this.setState({
      errorInfo,
    })

    // Show a toast notification
    toast.error("An error occurred", {
      description: `There was a problem in the ${this.props.boundary} section.`,
      duration: 5000, // Show for longer
    })

    // You could also send to an error reporting service here
    // Example: errorReportingService.captureException(error, { extra: errorInfo });
  }

  // Reset the error state
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })

    // Call the onReset prop if provided
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render(): ReactNode {
    const { hasError, error } = this.state
    const { children, fallback, className } = this.props

    // If there's an error, show the fallback UI
    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback
      }

      // Otherwise, show the default fallback UI
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("w-full", className)}
        >
          <Card className='border-destructive/50 bg-destructive/5'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-destructive'>
                <AlertTriangle className='h-5 w-5' />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                {error?.message || "An unexpected error occurred"}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant='outline'
                size='sm'
                onClick={this.handleReset}
                className='gap-1'
              >
                <RefreshCw className='h-4 w-4' />
                Try again
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )
    }

    // If there's no error, render the children
    return children
  }
}

export default ErrorBoundary
