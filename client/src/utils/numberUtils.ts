import { getDefaultRNG, MersenneTwister } from "./mersenneTwister"

// Define types for our application
export type NumberArray = number[]

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

/**
 * Counts how many numbers in set A match numbers in set B
 * @param setA First set of numbers
 * @param setB Second set of numbers
 * @returns Number of matching numbers
 */
export const countMatches = (setA: NumberArray, setB: NumberArray): number => {
  return setA.filter((num) => setB.includes(num)).length
}

/**
 * Checks if two number sets are identical (same numbers, regardless of order)
 * @param setA First set of numbers
 * @param setB Second set of numbers
 * @returns Boolean indicating if the sets match exactly
 */
export const areSetsEqual = (setA: NumberArray, setB: NumberArray): boolean => {
  if (setA.length !== setB.length) return false

  // Sort both arrays to ensure consistent comparison
  const sortedA = [...setA].sort((a, b) => a - b)
  const sortedB = [...setB].sort((a, b) => a - b)

  // Compare each element
  return sortedA.every((num, index) => num === sortedB[index])
}
