import { useTheme } from "next-themes"
import { Toaster as Sonner, toast as sonnerToast } from "sonner"

// Define our own ToasterProps interface to avoid import issues
export interface ToasterProps {
  theme?: "light" | "dark" | "system"
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "bottom-center"
  hotkey?: string[]
  richColors?: boolean
  expand?: boolean
  duration?: number
  visibleToasts?: number
  closeButton?: boolean
  offset?: string | number
  dir?: "rtl" | "ltr" | "auto"
  className?: string
  style?: React.CSSProperties
  toastOptions?: Record<string, unknown>
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className='toaster group'
      position='bottom-right'
      expand={false}
      richColors
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

// Re-export the toast function from sonner
export { sonnerToast as toast, Toaster }
