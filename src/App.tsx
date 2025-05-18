import "./App.css"

// Import custom components
import { NumberSettings } from "@/components/custom/NumberSettings"
import { NumberDisplay } from "@/components/custom/NumberDisplay"
import { StatusBar } from "@/components/custom/StatusBar"
import { ThemeToggle } from "@/components/custom/ThemeToggle"
import OddsVisualizer from "./components/custom/OddsVisualizer"

// Import theme provider
import { ThemeProvider } from "@/components/theme-provider"

// Import Framer Motion
import { motion } from "motion/react"

// Import hooks
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { useDebounce } from "@/hooks/useDebounce"

// Import stores
import { useOddsStore } from "@/stores/oddsStore"

function App() {
  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion()

  // Initialize odds calculation on app start with debouncing
  // We use an empty dependency array but still get the debounce benefit on initial load
  useDebounce(
    () => {
      useOddsStore.getState().recalculateOdds()
    },
    100, // Shorter delay for initial calculation
    []
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

  return (
    <ThemeProvider defaultTheme='light'>
      <motion.div
        className='min-h-screen bg-background text-foreground p-4 transition-colors duration-300'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        <ThemeToggle />

        <motion.div
          className='lg:text-5xl md:text-4xl text-3xl font-bold mb-6 text-center'
          variants={titleVariants}
        >
          🎲 Random Number Generator
        </motion.div>

        {/* Two-column layout */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto'>
          {/* Left column - Number Generator */}
          <motion.div
            className='flex flex-col items-center'
            variants={columnVariants}
            custom={0}
          >
            <NumberSettings />
            <NumberDisplay />
            <StatusBar />
          </motion.div>

          {/* Right column - Odds Visualizer */}
          <motion.div
            className='flex flex-col items-center'
            variants={columnVariants}
            custom={1}
          >
            <OddsVisualizer />
          </motion.div>
        </div>
      </motion.div>
    </ThemeProvider>
  )
}

export default App
