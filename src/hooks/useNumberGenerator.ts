import { useState, useEffect } from "react"
import { NumberArray, generateSet, getAvailableNumbers } from "@/utils/numberUtils"

interface UseNumberGeneratorProps {
  quantity: number
  maxValue: number
}

interface UseNumberGeneratorReturn {
  usedNumbers: NumberArray
  currentSet: NumberArray
  remainingCount: number
  hasEnoughNumbers: boolean
  generateNumbers: () => void
  resetNumbers: () => void
}

export function useNumberGenerator({
  quantity,
  maxValue,
}: UseNumberGeneratorProps): UseNumberGeneratorReturn {
  // State for tracking used and current numbers
  const [usedNumbers, setUsedNumbers] = useState<NumberArray>(() => {
    // load from localStorage if exists
    const saved = localStorage.getItem("usedNumbers")
    return saved ? JSON.parse(saved) : []
  })
  const [currentSet, setCurrentSet] = useState<NumberArray>([])
  const [remainingCount, setRemainingCount] = useState<number>(maxValue)
  const [hasEnoughNumbers, setHasEnoughNumbers] = useState<boolean>(true)

  // Save used numbers to localStorage
  useEffect(() => {
    localStorage.setItem("usedNumbers", JSON.stringify(usedNumbers))
  }, [usedNumbers])

  // Update remaining count and check if enough numbers are available
  useEffect(() => {
    const available = getAvailableNumbers(maxValue, usedNumbers)
    const remaining = available.length
    
    setRemainingCount(remaining)
    setHasEnoughNumbers(remaining >= quantity)
  }, [usedNumbers, quantity, maxValue])

  // Generate a new set of numbers
  const generateNumbers = () => {
    if (!hasEnoughNumbers) return
    
    const available = getAvailableNumbers(maxValue, usedNumbers)
    const next = generateSet(available, quantity)

    setCurrentSet(next)
    setUsedNumbers((prev) => [...prev, ...next])
  }

  // Reset all used numbers
  const resetNumbers = () => {
    setUsedNumbers([])
    setCurrentSet([])
  }

  return {
    usedNumbers,
    currentSet,
    remainingCount,
    hasEnoughNumbers,
    generateNumbers,
    resetNumbers,
  }
}
