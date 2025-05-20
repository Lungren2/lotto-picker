import { Component } from "react"
import type { ErrorInfo, ReactNode } from "react"
import { motion } from "motion/react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fatal as logFatal } from "@/utils/debugLogger"

interface RootErrorBoundaryProps {
  children: ReactNode
}

interface RootErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Root-level error boundary that catches any unhandled errors in the application.
 * This provides a last line of defense against crashes.
 */
class RootErrorBoundary extends Component<
  RootErrorBoundaryProps,
  RootErrorBoundaryState
> {
  constructor(props: RootErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error as fatal since it's at the root level
    logFatal(
      "RootErrorBoundary",
      `Fatal application error: ${error.message}`,
      {
        componentStack: errorInfo.componentStack,
        errorName: error.name,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      error // Pass the actual error object for stack trace
    )

    // Update state with error details
    this.setState({
      errorInfo,
    })

    // You could also send to an error reporting service here

    // In development mode, we'll keep the detailed error info in state
    // for rendering in the UI, but we don't need additional console logging
    // since our logger already handles that
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    const { hasError, error } = this.state
    const { children } = this.props

    if (hasError) {
      return (
        <div className='min-h-screen bg-background flex items-center justify-center p-4'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className='max-w-md w-full'
          >
            <div className='bg-card border border-destructive/30 rounded-lg shadow-lg p-6 space-y-6'>
              <div className='flex items-center justify-center'>
                <div className='bg-destructive/10 p-3 rounded-full'>
                  <AlertTriangle className='h-10 w-10 text-destructive' />
                </div>
              </div>

              <div className='text-center space-y-2'>
                <h2 className='text-2xl font-bold text-foreground'>
                  Something went wrong
                </h2>
                <p className='text-muted-foreground'>
                  {error?.message ||
                    "An unexpected error occurred in the application"}
                </p>
              </div>

              <div className='pt-4 flex flex-col gap-2'>
                <Button
                  onClick={this.handleReset}
                  className='w-full gap-2'
                  variant='outline'
                >
                  <RefreshCw className='h-4 w-4' />
                  Try again
                </Button>
                <Button onClick={this.handleReload} className='w-full gap-2'>
                  <Home className='h-4 w-4' />
                  Reload application
                </Button>
              </div>

              {process.env.NODE_ENV === "development" &&
                this.state.errorInfo && (
                  <div className='mt-6 p-4 bg-muted rounded-md overflow-auto max-h-[200px] text-xs'>
                    <pre className='whitespace-pre-wrap'>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
            </div>
          </motion.div>
        </div>
      )
    }

    return children
  }
}

export default RootErrorBoundary
