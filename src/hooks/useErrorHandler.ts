import { useState, useCallback } from "react"
import { toast } from "@/components/ui/sonner"
import { debugLogger } from "@/utils/debugLogger"

interface ErrorHandlerOptions {
  component: string
  showToast?: boolean
  logError?: boolean
}

/**
 * Custom hook for handling errors in functional components
 * 
 * @param options Configuration options for the error handler
 * @returns Object with error state and handler functions
 */
export function useErrorHandler(options: ErrorHandlerOptions) {
  const { component, showToast = true, logError = true } = options
  const [error, setError] = useState<Error | null>(null)
  const [isError, setIsError] = useState(false)

  /**
   * Handle an error by updating state, logging, and showing a toast notification
   */
  const handleError = useCallback((error: unknown, context?: string) => {
    // Convert to Error object if it's not already
    const errorObj = error instanceof Error ? error : new Error(String(error))
    
    // Update state
    setError(errorObj)
    setIsError(true)
    
    // Log the error
    if (logError) {
      debugLogger.error(
        component,
        `Error in ${context || component}: ${errorObj.message}`,
        { error: errorObj.stack || errorObj.toString() }
      )
    }
    
    // Show toast notification
    if (showToast) {
      toast.error("An error occurred", {
        description: errorObj.message || "Something went wrong",
      })
    }
    
    return errorObj
  }, [component, showToast, logError])
  
  /**
   * Reset the error state
   */
  const resetError = useCallback(() => {
    setError(null)
    setIsError(false)
  }, [])
  
  /**
   * Wrap an async function with error handling
   */
  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      try {
        return await fn(...args)
      } catch (error) {
        handleError(error, context)
        return undefined
      }
    }
  }, [handleError])
  
  /**
   * Try to execute a function and handle any errors
   */
  const tryExecute = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    context?: string
  ) => {
    return (...args: T): R | undefined => {
      try {
        return fn(...args)
      } catch (error) {
        handleError(error, context)
        return undefined
      }
    }
  }, [handleError])

  return {
    error,
    isError,
    handleError,
    resetError,
    withErrorHandling,
    tryExecute
  }
}

export default useErrorHandler
