import { useState, useRef, useCallback, useEffect } from "react"

interface UseLongPressOptions {
  /**
   * Duration in milliseconds for the long press
   */
  duration?: number
  /**
   * Callback for short press (normal click)
   */
  onShortPress?: () => void
  /**
   * Callback for long press
   */
  onLongPress?: () => void
  /**
   * Whether to disable the long press functionality
   */
  disabled?: boolean
}

interface UseLongPressReturn {
  /**
   * Props to spread on the element
   */
  props: {
    onMouseDown: (e: React.MouseEvent) => void
    onMouseUp: () => void
    onMouseLeave: () => void
    onTouchStart: (e: React.TouchEvent) => void
    onTouchEnd: () => void
    onKeyDown: (e: React.KeyboardEvent) => void
    onKeyUp: (e: React.KeyboardEvent) => void
    tabIndex: number
    role: string
    "aria-pressed": boolean
  }
  /**
   * Whether the element is currently being pressed
   */
  isPressed: boolean
  /**
   * Whether the long press has been triggered
   */
  isLongPressed: boolean
}

/**
 * Custom hook for handling both short and long press events
 */
export function useLongPress({
  duration = 1000,
  onShortPress,
  onLongPress,
  disabled = false,
}: UseLongPressOptions): UseLongPressReturn {
  // Track if the element is currently being pressed
  const [isPressed, setIsPressed] = useState(false)
  
  // Track if the long press has been triggered
  const [isLongPressed, setIsLongPressed] = useState(false)
  
  // Use a ref to store the timeout ID
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Use a ref to track if the press started
  const isLongPressTriggeredRef = useRef(false)

  // Clear the timeout and reset state
  const endTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    
    // If the long press wasn't triggered and the element was pressed, trigger the short press
    if (!isLongPressTriggeredRef.current && isPressed && onShortPress) {
      onShortPress()
    }
    
    // Reset state
    isLongPressTriggeredRef.current = false
    setIsPressed(false)
    setIsLongPressed(false)
  }, [isPressed, onShortPress])

  // Start the timer for long press
  const startTimer = useCallback(() => {
    if (disabled) return
    
    // Set pressed state
    setIsPressed(true)
    setIsLongPressed(false)
    
    // Start the timer
    timerRef.current = setTimeout(() => {
      if (onLongPress) {
        onLongPress()
        isLongPressTriggeredRef.current = true
        setIsLongPressed(true)
      }
    }, duration)
  }, [disabled, duration, onLongPress])

  // Handle key events for accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Only handle Space and Enter keys
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault()
        startTimer()
      }
    },
    [startTimer]
  )

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent) => {
      // Only handle Space and Enter keys
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault()
        endTimer()
      }
    },
    [endTimer]
  )

  // Clean up the timeout when the component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  // Return the props to spread on the element
  return {
    props: {
      onMouseDown: startTimer,
      onMouseUp: endTimer,
      onMouseLeave: endTimer,
      onTouchStart: startTimer,
      onTouchEnd: endTimer,
      onKeyDown: handleKeyDown,
      onKeyUp: handleKeyUp,
      tabIndex: disabled ? -1 : 0,
      role: "button",
      "aria-pressed": isPressed,
    },
    isPressed,
    isLongPressed,
  }
}
