import { useState, useEffect, useRef } from "react"
import type { NumberArray } from "@/utils/numberUtils"
import { generateSet, getAvailableNumbers } from "@/utils/numberUtils"
import { MersenneTwister, createRNG } from "@/utils/mersenneTwister"

interface UseNumberGeneratorProps {
  quantity: number
  maxValue: number
  seed?: number // Optional seed for the random number generator
}

interface UseNumberGeneratorReturn {
  usedNumbers: NumberArray
  currentSet: NumberArray
  remainingCount: number
  hasEnoughNumbers: boolean
  generateNumbers: () => void
  resetNumbers: () => void
  reseed: (newSeed?: number) => void // Function to reinitialize the RNG with a new seed
}

export function useNumberGenerator({
  quantity,
  maxValue,
  seed,
}: UseNumberGeneratorProps): UseNumberGeneratorReturn {
  // Create a ref to hold our Mersenne Twister instance
  const rngRef = useRef<MersenneTwister>(createRNG(seed))

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

  // Function to reinitialize the RNG with a new seed
  const reseed = (newSeed?: number) => {
    const seedValue = newSeed ?? Date.now()
    rngRef.current.seed(seedValue)
  }

  // Generate a new set of numbers using Mersenne Twister
  const generateNumbers = () => {
    if (!hasEnoughNumbers) return

    const available = getAvailableNumbers(maxValue, usedNumbers)
    // Pass the Mersenne Twister instance to generateSet
    const next = generateSet(available, quantity, rngRef.current)

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
    reseed,
  }
}
