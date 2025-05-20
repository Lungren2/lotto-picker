import React, { ComponentType, ReactNode } from "react"
import ErrorBoundary from "./ErrorBoundary"

/**
 * Higher-order component that wraps a component with an ErrorBoundary
 * 
 * @param Component - The component to wrap
 * @param boundary - The name of the boundary (used for logging)
 * @param fallback - Optional custom fallback UI
 * @param onReset - Optional callback to run when the error boundary is reset
 * @returns A new component wrapped with an ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  boundary: string,
  fallback?: ReactNode,
  onReset?: () => void
): ComponentType<P> {
  const displayName = Component.displayName || Component.name || "Component"

  const WrappedComponent = (props: P) => (
    <ErrorBoundary boundary={boundary} fallback={fallback} onReset={onReset}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${displayName})`

  return WrappedComponent
}

export default withErrorBoundary
