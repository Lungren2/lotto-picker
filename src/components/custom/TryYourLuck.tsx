import { useState, useEffect } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "motion/react"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { useSimulation } from "@/hooks/useSimulation"
import { useNumberStore } from "@/stores/numberStore"
import { useSimulationStore } from "@/stores/simulationStore"
import { NumberBubble } from "./NumberBubble"
import { toast } from "@/components/ui/sonner"
import { 
  Play, 
  Pause, 
  RotateCcw, 
  StopCircle, 
  Zap, 
  Trophy, 
  Dices, 
  Settings,
  Clock,
  Target,
  CheckCircle2,
  XCircle
} from "lucide-react"

export function TryYourLuck() {
  // Get state from number store
  const { quantity, maxValue } = useNumberStore()
  
  // Get simulation settings
  const { settings, updateSettings } = useSimulationStore()
  
  // Use the simulation hook
  const {
    isRunning,
    isPaused,
    isCompleted,
    currentAttempt,
    bestMatch,
    winningSet,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
    resetSimulation,
    generateWinningSet,
    setWinningSet,
  } = useSimulation({ quantity, maxValue })
  
  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion()
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<"winning" | "settings">("winning")
  
  // State for max attempts input
  const [maxAttemptsInput, setMaxAttemptsInput] = useState(settings.maxAttempts.toString())
  
  // Update max attempts when input changes
  useEffect(() => {
    setMaxAttemptsInput(settings.maxAttempts.toString())
  }, [settings.maxAttempts])
  
  // Handle max attempts input change
  const handleMaxAttemptsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxAttemptsInput(e.target.value)
  }
  
  // Handle max attempts input blur
  const handleMaxAttemptsBlur = () => {
    const value = parseInt(maxAttemptsInput)
    if (isNaN(value) || value < 1) {
      setMaxAttemptsInput(settings.maxAttempts.toString())
      return
    }
    
    updateSettings({ maxAttempts: value })
  }
  
  // Handle speed change
  const handleSpeedChange = (value: number) => {
    const speedMap: Record<number, "slow" | "medium" | "fast" | "max"> = {
      0: "slow",
      1: "medium",
      2: "fast",
      3: "max",
    }
    
    updateSettings({ speed: speedMap[value] })
  }
  
  // Get current speed value for slider
  const getSpeedValue = () => {
    const speedMap: Record<string, number> = {
      slow: 0,
      medium: 1,
      fast: 2,
      max: 3,
    }
    
    return [speedMap[settings.speed]]
  }
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.5,
        type: prefersReducedMotion ? "tween" : "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  }
  
  // Calculate match percentage
  const matchPercentage = winningSet.length > 0 
    ? Math.round((bestMatch.count / winningSet.length) * 100) 
    : 0
  
  // Get progress color based on match percentage
  const getProgressColor = () => {
    if (matchPercentage < 50) return "bg-amber-500"
    if (matchPercentage < 100) return "bg-emerald-500"
    return "bg-primary"
  }
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-md mx-auto mt-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Try Your Luck
          </CardTitle>
          <CardDescription>
            See how many attempts it takes to match your winning numbers
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="winning" className="flex-1">
                <Target className="h-4 w-4 mr-2" />
                Winning Set
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="winning" className="space-y-4">
              <div className="flex flex-wrap justify-center gap-2 py-2">
                {winningSet.length > 0 ? (
                  winningSet.map((num, index) => (
                    <NumberBubble
                      key={`winning-${num}-${index}`}
                      number={num}
                      variant="highlight"
                      index={index}
                    />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No winning set defined yet
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={generateWinningSet} 
                  className="flex-1"
                  disabled={isRunning || isPaused}
                >
                  <Dices className="h-4 w-4 mr-2" />
                  Generate Random
                </Button>
                
                <Button
                  onClick={() => {
                    if (winningSet.length > 0) {
                      setWinningSet([])
                      resetSimulation()
                    }
                  }}
                  variant="outline"
                  disabled={isRunning || isPaused || winningSet.length === 0}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="max-attempts">Maximum Attempts</Label>
                  <Input
                    id="max-attempts"
                    type="number"
                    min="1"
                    value={maxAttemptsInput}
                    onChange={handleMaxAttemptsChange}
                    onBlur={handleMaxAttemptsBlur}
                    disabled={isRunning || isPaused}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Simulation Speed</Label>
                    <span className="text-xs text-muted-foreground">
                      {settings.speed === "slow" && "Slow"}
                      {settings.speed === "medium" && "Medium"}
                      {settings.speed === "fast" && "Fast"}
                      {settings.speed === "max" && "Maximum"}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={3}
                    step={1}
                    value={getSpeedValue()}
                    onValueChange={(value) => handleSpeedChange(value[0])}
                    disabled={isRunning || isPaused}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Simulation Progress */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Attempts: {currentAttempt.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                Best Match: {bestMatch.count}/{winningSet.length || quantity}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${getProgressColor()}`}
                initial={{ width: "0%" }}
                animate={{ width: `${matchPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            {/* Best match numbers */}
            {bestMatch.set.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-1">Best matching set:</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {bestMatch.set.map((num, index) => (
                    <NumberBubble
                      key={`best-${num}-${index}`}
                      number={num}
                      size="sm"
                      variant={winningSet.includes(num) ? "highlight" : "default"}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-wrap gap-2">
          {!isRunning && !isPaused && (
            <Button 
              onClick={startSimulation} 
              className="flex-1"
              disabled={winningSet.length === 0 || isCompleted}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Simulation
            </Button>
          )}
          
          {isRunning && (
            <Button 
              onClick={pauseSimulation} 
              variant="outline"
              className="flex-1"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          
          {isPaused && (
            <Button 
              onClick={resumeSimulation} 
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          
          {(isRunning || isPaused) && (
            <Button 
              onClick={stopSimulation} 
              variant="destructive"
              className="flex-1"
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
          
          {(isCompleted || (!isRunning && !isPaused && currentAttempt > 0)) && (
            <Button 
              onClick={resetSimulation} 
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}
