// Define types for our application
export type NumberArray = number[]

/**
 * Generates a random set of numbers from the available pool
 * @param available Array of available numbers to choose from
 * @param quantity Number of numbers to generate
 * @returns Array of randomly selected numbers
 */
export const generateSet = (available: NumberArray, quantity: number): NumberArray => {
  // Fisher–Yates shuffle partial for the first 'quantity' numbers
  const arr = [...available]
  for (let i = arr.length - 1; i > arr.length - (quantity + 1); i--) {
    const j = Math.floor(Math.random() * (i + 1))
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
export const getAvailableNumbers = (maxValue: number, usedNumbers: NumberArray): NumberArray => {
  const allNums = Array.from({ length: maxValue }, (_, i) => i + 1)
  return allNums.filter((n) => !usedNumbers.includes(n))
}

/**
 * Checks if there are enough numbers available
 * @param availableCount Number of available numbers
 * @param requiredCount Number of required numbers
 * @returns Boolean indicating if there are enough numbers
 */
export const hasEnoughNumbers = (availableCount: number, requiredCount: number): boolean => {
  return availableCount >= requiredCount
}
