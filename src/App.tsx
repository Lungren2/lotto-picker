import "./App.css"

// Import custom components
import { NumberSettings } from "@/components/custom/NumberSettings"
import { NumberDisplay } from "@/components/custom/NumberDisplay"
import { StatusBar } from "@/components/custom/StatusBar"
import { ThemeToggle } from "@/components/custom/ThemeToggle"
import { HistoryButton } from "@/components/custom/HistoryButton"
import OddsVisualizer from "./components/custom/OddsVisualizer"
import { TryYourLuck } from "@/components/custom/TryYourLuck"
import ErrorBoundary from "@/components/custom/ErrorBoundary"
import SimulationErrorBoundary from "@/components/custom/SimulationErrorBoundary"

// Import theme provider
import { ThemeProvider } from "@/components/theme-provider"

// Import Framer Motion
import { motion } from "motion/react"

// Import Toaster
import { Toaster } from "@/components/ui/sonner"

// Import hooks
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { useAdaptiveDebounce } from "@/hooks/useAdaptiveDebounce"
import { useErrorHandler } from "@/hooks/useErrorHandler"

// Import stores
import { useOddsStore } from "@/stores/oddsStore"
import { useNumberStore } from "@/stores/numberStore"
import ScrollFade from "./components/custom/FadingScrollArea"

function App() {
  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion()

  // Get default values for complexity calculation
  const { quantity, maxValue } = useNumberStore()

  // Calculate complexity factor for initial calculation
  const initialComplexity = Math.min(
    Math.max(1, Math.floor(maxValue / 20) + Math.floor(quantity / 5)),
    5 // Lower max complexity for initial load
  )

  // Initialize odds calculation on app start with adaptive debouncing
  useAdaptiveDebounce(
    () => {
      useOddsStore.getState().recalculateOdds()
    },
    100, // Base delay for initial calculation
    initialComplexity, // Complexity factor
    [] // Empty dependency array for initial load only
  )

  // Animation variants for the container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.5,
        staggerChildren: prefersReducedMotion ? 0.05 : 0.1,
      },
    },
  }

  // Animation variants for the title
  const titleVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? -10 : -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.3 : 0.5,
        type: prefersReducedMotion ? "tween" : "spring",
        stiffness: 200,
      },
    },
  }

  // Animation variants for the columns
  const columnVariants = {
    hidden: { opacity: 0, x: prefersReducedMotion ? 0 : -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: prefersReducedMotion ? 0.3 : 0.5,
        type: prefersReducedMotion ? "tween" : "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  }

  // Use error handler for global app errors if needed
  useErrorHandler({ component: "App" })

  return (
    <ThemeProvider defaultTheme='light'>
      <motion.div
        className='min-h-screen bg-background text-foreground p-4 transition-colors duration-300'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        <Toaster />
        <div className='fixed top-4 right-4 flex gap-2'>
          <HistoryButton />
          <ErrorBoundary boundary='ThemeToggle'>
            <ThemeToggle />
          </ErrorBoundary>
        </div>
        luck's
        <motion.div
          className='lg:text-5xl md:text-4xl text-3xl font-bold mb-6 text-center'
          variants={titleVariants}
        >
          🎲 Oddly 🎲
        </motion.div>
        {/* Two-column layout */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto w-full overflow-hidden'>
          {/* Left column - Number Generator */}
          <motion.div
            className='flex flex-col items-center h-full w-full overflow-y-auto'
            variants={columnVariants}
            custom={0}
          >
            <ErrorBoundary boundary='NumberGenerator'>
              <NumberSettings />
              <NumberDisplay />
              <StatusBar />
            </ErrorBoundary>
          </motion.div>

          {/* Right column - Odds Visualizer and Try Your Luck */}
          <ScrollFade className='h-[65vh] w-full max-w-full'>
            <motion.div
              className='flex flex-col items-center w-full'
              variants={columnVariants}
              custom={1}
            >
              <div className='w-full max-w-full overflow-x-hidden gap-2 flex flex-col'>
                <ErrorBoundary boundary='OddsVisualizer'>
                  <OddsVisualizer />
                </ErrorBoundary>
              </div>
            </motion.div>
          </ScrollFade>
          <SimulationErrorBoundary>
            <TryYourLuck />
          </SimulationErrorBoundary>
        </div>
      </motion.div>
    </ThemeProvider>
  )
}

export default App
