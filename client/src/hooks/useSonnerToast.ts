/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "@/components/ui/sonner"

// Define the types for the toast function
type ToastVariant = "default" | "destructive" | "success" | "info" | "warning"

interface ToastProps {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Create a hook that provides a consistent interface for toast notifications
export function useSonnerToast() {
  const showToast = ({
    title,
    description,
    variant = "default",
    duration,
    action,
  }: ToastProps) => {
    // Map the variant to Sonner's variant
    const sonnerVariant =
      variant === "destructive"
        ? "error"
        : variant === "default"
        ? undefined
        : variant

    // Create the toast options
    const options: any = {
      duration,
    }

    // Add action if provided
    if (action) {
      options.action = {
        label: action.label,
        onClick: action.onClick,
      }
    }

    // Show the toast with Sonner
    if (title && description) {
      if (sonnerVariant === "error") {
        toast.error(title, {
          description,
          ...options,
        })
      } else if (sonnerVariant === "success") {
        toast.success(title, {
          description,
          ...options,
        })
      } else if (sonnerVariant === "info") {
        toast.info(title, {
          description,
          ...options,
        })
      } else if (sonnerVariant === "warning") {
        toast.warning(title, {
          description,
          ...options,
        })
      } else {
        toast(title, {
          description,
          ...options,
        })
      }
    } else if (title) {
      if (sonnerVariant === "error") {
        toast.error(title, options)
      } else if (sonnerVariant === "success") {
        toast.success(title, options)
      } else if (sonnerVariant === "info") {
        toast.info(title, options)
      } else if (sonnerVariant === "warning") {
        toast.warning(title, options)
      } else {
        toast(title, options)
      }
    }

    // Return an object with methods for compatibility with the old API
    return {
      id: Date.now().toString(),
      dismiss: () => {}, // No-op as Sonner handles dismissal
      update: () => {}, // No-op as Sonner handles updates differently
    }
  }

  return {
    toast: showToast,
    dismiss: (id?: string) => {
      // Dismiss all toasts if no ID is provided
      if (!id || id === "all") {
        toast.dismiss()
      } else {
        toast.dismiss(id)
      }
    },
  }
}
