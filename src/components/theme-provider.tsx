import { createContext, useContext, useEffect, useState } from "react"

// Define the theme options
type Theme = "dark" | "light" | "system"

// Create a context for the theme
type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

// Create the theme context
const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

// Theme provider component
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  // Initialize theme state
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  // Update the theme when it changes
  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove all theme classes
    root.classList.remove("light", "dark")

    // Add the appropriate theme class
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  // Save the theme to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey])

  // Create the context value
  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme)
    },
  }

  // Provide the theme context to children
  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

// Hook to use the theme
export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")
  
  return context
}
