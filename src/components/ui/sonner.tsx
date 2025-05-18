import { useTheme } from "next-themes"
import { Toaster as Sonner, toast as sonnerToast, ToasterProps } from "sonner"

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
