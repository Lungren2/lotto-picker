import React, {
  type ReactNode,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react"
import { cn } from "@/lib/utils"

export interface ScrollFadeProps {
  children: ReactNode
  className?: string
  direction?: "y" | "x" | "y-both" | "x-both"
  size?: "sm" | "md" | "lg"
  hideScrollbar?: boolean
}

const sizeMap = {
  sm: 20,
  md: 40,
  lg: 60,
}

export function ScrollFade({
  children,
  className,
  direction = "y-both",
  size = "md",
  hideScrollbar = true,
}: ScrollFadeProps) {
  const [isAtTop, setIsAtTop] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(false)
  const [isAtLeft, setIsAtLeft] = useState(false)
  const [isAtRight, setIsAtRight] = useState(false)
  const scrollableRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      let newIsAtTop = false
      let newIsAtBottom = false
      let newIsAtLeft = false
      let newIsAtRight = false

      if (direction.includes("y")) {
        const { scrollTop, scrollHeight, clientHeight } = target
        newIsAtTop = scrollTop <= 1 // Allow 1px threshold
        newIsAtBottom = scrollTop + clientHeight >= scrollHeight - 1
      }

      if (direction.includes("x")) {
        const { scrollLeft, scrollWidth, clientWidth } = target
        newIsAtLeft = scrollLeft <= 1
        newIsAtRight = scrollLeft + clientWidth >= scrollWidth - 1
      }

      setIsAtTop(newIsAtTop)
      setIsAtBottom(newIsAtBottom)
      setIsAtLeft(newIsAtLeft)
      setIsAtRight(newIsAtRight)
    },
    [direction, setIsAtTop, setIsAtBottom, setIsAtLeft, setIsAtRight]
  )

  useEffect(() => {
    const checkInitialPosition = () => {
      if (scrollableRef.current) {
        handleScroll({
          currentTarget: scrollableRef.current,
        } as React.UIEvent<HTMLDivElement>)
      }
    }

    checkInitialPosition()
    const resizeObserver = new ResizeObserver(checkInitialPosition)

    if (scrollableRef.current) {
      resizeObserver.observe(scrollableRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [direction, handleScroll])

  const fadeVars = {
    "--top-opacity": isAtTop ? 0 : 1,
    "--bottom-opacity": isAtBottom ? 0 : 1,
    "--left-opacity": isAtLeft ? 0 : 1,
    "--right-opacity": isAtRight ? 0 : 1,
    "--fade-size": `${sizeMap[size]}px`,
  } as React.CSSProperties

  return (
    <div className={cn("scroll-fade-container", className)}>
      <div
        ref={scrollableRef}
        className={cn(
          `scroll-fade-${direction}`,
          {
            "invis-scroll": hideScrollbar,
            "overflow-y-auto": direction.includes("y"),
            "overflow-x-auto": direction.includes("x"),
          },
          "h-full w-full"
        )}
        onScroll={handleScroll}
        style={fadeVars}
      >
        {children}
      </div>
    </div>
  )
}

export default ScrollFade
