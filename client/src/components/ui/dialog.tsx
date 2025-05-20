import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "motion/react"
import { useReducedMotion } from "@/hooks/useReducedMotion"

// Create a context for the dialog state
type DialogContextType = {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextType | undefined>(
  undefined
)

// Hook to use the dialog context
export const useDialog = () => {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider")
  }
  return context
}

function Dialog({
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  // Use the open state from props or create our own
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = props.open !== undefined ? props.open : internalOpen
  const onOpenChange = props.onOpenChange || setInternalOpen

  return (
    <DialogContext.Provider value={{ open, setOpen: onOpenChange }}>
      <DialogPrimitive.Root
        open={open}
        onOpenChange={onOpenChange}
        data-slot='dialog'
        {...props}
      >
        {children}
      </DialogPrimitive.Root>
    </DialogContext.Provider>
  )
}

const DialogTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>((props, ref) => {
  return (
    <DialogPrimitive.Trigger ref={ref} data-slot='dialog-trigger' {...props} />
  )
})
DialogTrigger.displayName = "DialogTrigger"

function DialogPortal(
  props: React.ComponentProps<typeof DialogPrimitive.Portal>
) {
  return <DialogPrimitive.Portal data-slot='dialog-portal' {...props} />
}

const DialogClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>((props, ref) => {
  return <DialogPrimitive.Close ref={ref} data-slot='dialog-close' {...props} />
})
DialogClose.displayName = "DialogClose"

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const prefersReducedMotion = useReducedMotion()

  return (
    <DialogPrimitive.Overlay
      ref={ref}
      data-slot='dialog-overlay'
      className={cn("fixed inset-0 z-50 bg-black/50", className)}
      asChild
      {...props}
    >
      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
          backdropFilter: prefersReducedMotion ? "none" : "blur(4px)",
        }}
        exit={{
          opacity: 0,
          backdropFilter: "blur(0px)",
        }}
        transition={{
          duration: prefersReducedMotion ? 0.1 : 0.2,
        }}
      />
    </DialogPrimitive.Overlay>
  )
})
DialogOverlay.displayName = "DialogOverlay"

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const { open } = useDialog()
  const prefersReducedMotion = useReducedMotion()

  return (
    <DialogPortal data-slot='dialog-portal'>
      <DialogOverlay />
      <AnimatePresence mode='wait'>
        {open && (
          <DialogPrimitive.Content
            ref={ref}
            data-slot='dialog-content'
            className={cn(
              "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg sm:max-w-lg",
              className
            )}
            asChild
            {...props}
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: prefersReducedMotion ? 0.95 : 0.5,
                y: prefersReducedMotion ? 10 : 40,
                rotateX: prefersReducedMotion ? 0 : 40,
                perspective: 800,
                transformStyle: "preserve-3d",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                rotateX: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                rotateX: prefersReducedMotion ? 0 : 10,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
            >
              {children}
              <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
                <XIcon />
                <span className='sr-only'>Close</span>
              </DialogPrimitive.Close>
            </motion.div>
          </DialogPrimitive.Content>
        )}
      </AnimatePresence>
    </DialogPortal>
  )
})
DialogContent.displayName = "DialogContent"

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot='dialog-header'
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot='dialog-footer'
      className={cn("flex gap-2 flex-row justify-end", className)}
      {...props}
    />
  )
}

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Title
      ref={ref}
      data-slot='dialog-title'
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
})
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Description
      ref={ref}
      data-slot='dialog-description'
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
})
DialogDescription.displayName = "DialogDescription"

// Export all dialog components
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}

// Export animated dialog components with aliases
export {
  Dialog as AnimatedDialog,
  DialogTrigger as AnimatedDialogTrigger,
  DialogContent as AnimatedDialogContent,
  DialogHeader as AnimatedDialogHeader,
  DialogFooter as AnimatedDialogFooter,
  DialogTitle as AnimatedDialogTitle,
  DialogDescription as AnimatedDialogDescription,
  DialogClose as AnimatedDialogClose,
}
