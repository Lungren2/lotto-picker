// Define types for our application
export type NumberArray = number[]

import { getDefaultRNG, MersenneTwister } from "./mersenneTwister"

/**
 * Generates a random set of numbers from the available pool
 * @param available Array of available numbers to choose from
 * @param quantity Number of numbers to generate
 * @param rng Optional Mersenne Twister instance for random number generation
 * @returns Array of randomly selected numbers
 */
export const generateSet = (
  available: NumberArray,
  quantity: number,
  rng: MersenneTwister = getDefaultRNG()
): NumberArray => {
  // Use the Mersenne Twister's built-in unique integers function if available numbers match the range
  if (available.length === Math.max(...available)) {
    const min = Math.min(...available)
    const max = Math.max(...available)
    if (min === 1 && max === available.length) {
      return rng.uniqueInts(quantity, min, max)
    }
  }

  // Otherwise use Fisher–Yates shuffle with MT random numbers
  const arr = [...available]
  for (let i = arr.length - 1; i > arr.length - (quantity + 1); i--) {
    const j = rng.intRange(0, i)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(arr.length - quantity)
}

/**
 * Calculates the available numbers (not yet used)
 * @param maxValue Maximum value in the range
 * @param usedNumbers Array of already used numbers
 * @returns Array of available numbers
 */
export const getAvailableNumbers = (
  maxValue: number,
  usedNumbers: NumberArray
): NumberArray => {
  const allNums = Array.from({ length: maxValue }, (_, i) => i + 1)
  return allNums.filter((n) => !usedNumbers.includes(n))
}

/**
 * Checks if there are enough numbers available
 * @param availableCount Number of available numbers
 * @param requiredCount Number of required numbers
 * @returns Boolean indicating if there are enough numbers
 */
export const hasEnoughNumbers = (
  availableCount: number,
  requiredCount: number
): boolean => {
  return availableCount >= requiredCount
}
