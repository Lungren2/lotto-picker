/**
 * Memoized utility functions for odds calculations
 */

// Constants for factorial calculation
const MAX_SAFE_FACTORIAL = 170 // Maximum n where factorial(n) < Number.MAX_VALUE
const BIGINT_THRESHOLD = 20 // Threshold to start using BigInt for intermediate calculations
const FACTORIAL_CHUNK_SIZE = 10 // Size of chunks for parallel factorial calculation

// Cache for factorial calculations
const factorialCache: Record<number, number> = {
  0: 1,
  1: 1,
}

// Cache for BigInt factorial calculations
const factorialBigIntCache: Record<number, bigint> = {
  0: 1n,
  1: 1n,
}

/**
 * Calculate factorial of a number with highly optimized algorithm and BigInt support
 * Uses chunking, memoization, and dynamic programming for maximum efficiency
 *
 * @param n Number to calculate factorial for
 * @returns Factorial of n (as number if possible, otherwise converted from BigInt)
 * @throws Error if n is negative or too large
 */
export function factorial(n: number): number {
  // Error handling for invalid inputs
  if (n < 0) {
    throw new Error("Factorial is not defined for negative numbers")
  }

  if (!Number.isInteger(n)) {
    throw new Error("Factorial is only defined for integers")
  }

  if (n > 300) {
    throw new Error("Factorial calculation would exceed memory limits")
  }

  // Handle base cases
  if (n <= 1) return 1

  // Check if we have a cached result for small numbers
  if (factorialCache[n] !== undefined) {
    return factorialCache[n]
  }

  // For larger numbers that exceed JavaScript's Number precision, use BigInt
  if (n > MAX_SAFE_FACTORIAL) {
    // Use BigInt calculation and convert back to number (with potential loss of precision)
    return Number(factorialBigInt(n))
  }

  // Find the largest cached value less than or equal to n
  const cachedValues = Object.keys(factorialCache)
    .map(Number)
    .filter((x) => x <= n)
    .sort((a, b) => b - a)

  const largestCached = cachedValues[0] || 1

  // If we already have the value cached, return it
  if (largestCached === n) {
    return factorialCache[n]
  }

  // For medium to large numbers, use chunking strategy for better performance
  if (n > BIGINT_THRESHOLD) {
    return calculateFactorialWithChunks(n, largestCached)
  }

  // For small numbers, use standard iterative calculation
  let result = factorialCache[largestCached]

  // Multiply by each number from largestCached+1 to n
  for (let i = largestCached + 1; i <= n; i++) {
    result *= i

    // Cache intermediate results for future use
    if (i % 5 === 0 || i === n) {
      factorialCache[i] = result
    }
  }

  return result
}

/**
 * Calculate factorial using a chunking strategy for better performance
 * Breaks the calculation into chunks to improve cache locality and reduce overhead
 *
 * @param n Number to calculate factorial for
 * @param startValue Starting value for calculation (from cache)
 * @returns Factorial of n
 */
function calculateFactorialWithChunks(n: number, startValue: number): number {
  // Start with the largest cached value
  let result = BigInt(factorialCache[startValue])

  // Calculate remaining factorial in chunks
  const remaining = n - startValue
  const chunks = Math.ceil(remaining / FACTORIAL_CHUNK_SIZE)

  for (let chunk = 0; chunk < chunks; chunk++) {
    const chunkStart = startValue + chunk * FACTORIAL_CHUNK_SIZE + 1
    const chunkEnd = Math.min(chunkStart + FACTORIAL_CHUNK_SIZE - 1, n)

    // Calculate product for this chunk
    let chunkProduct = BigInt(1)
    for (let i = chunkStart; i <= chunkEnd; i++) {
      chunkProduct *= BigInt(i)
    }

    // Multiply result by chunk product
    result *= chunkProduct

    // Cache the intermediate result
    const intermediateN = chunkEnd
    if (intermediateN % 10 === 0 || intermediateN === n) {
      factorialCache[intermediateN] = Number(result)
    }
  }

  // Cache and return the final result
  factorialCache[n] = Number(result)
  return factorialCache[n]
}

/**
 * Calculate factorial using BigInt for very large numbers
 * Uses chunking strategy for better performance
 *
 * @param n Number to calculate factorial for
 * @returns Factorial of n as BigInt
 */
function factorialBigInt(n: number): bigint {
  // Check if we have a cached result
  if (factorialBigIntCache[n] !== undefined) {
    return factorialBigIntCache[n]
  }

  // Find the largest cached BigInt value
  const cachedValues = Object.keys(factorialBigIntCache)
    .map(Number)
    .filter((x) => x <= n)
    .sort((a, b) => b - a)

  const largestCached = cachedValues[0] || 1

  // Start with the largest cached value
  let result = factorialBigIntCache[largestCached]

  // For large values, use chunking strategy
  if (n - largestCached > FACTORIAL_CHUNK_SIZE) {
    const remaining = n - largestCached
    const chunks = Math.ceil(remaining / FACTORIAL_CHUNK_SIZE)

    for (let chunk = 0; chunk < chunks; chunk++) {
      const chunkStart = largestCached + chunk * FACTORIAL_CHUNK_SIZE + 1
      const chunkEnd = Math.min(chunkStart + FACTORIAL_CHUNK_SIZE - 1, n)

      // Calculate product for this chunk
      let chunkProduct = 1n
      for (let i = chunkStart; i <= chunkEnd; i++) {
        chunkProduct *= BigInt(i)
      }

      // Multiply result by chunk product
      result *= chunkProduct

      // Cache intermediate results
      const intermediateN = chunkEnd
      if (intermediateN % 20 === 0 || intermediateN === n) {
        factorialBigIntCache[intermediateN] = result
      }
    }
  } else {
    // For smaller ranges, calculate directly
    for (let i = largestCached + 1; i <= n; i++) {
      result *= BigInt(i)
    }
  }

  // Cache and return the result
  factorialBigIntCache[n] = result
  return result
}

// Cache for combinations calculations
const combinationsCache: Record<string, number> = {}

/**
 * Calculate combinations (n choose r) with memoization and error handling
 * @param n Total number of items
 * @param r Number of items to choose
 * @returns Number of possible combinations
 * @throws Error if inputs are invalid or calculation fails
 */
export function combinations(n: number, r: number): number {
  // Input validation
  if (!Number.isInteger(n) || !Number.isInteger(r)) {
    throw new Error("Combinations are only defined for integers")
  }

  if (n < 0 || r < 0) {
    throw new Error("Combinations are not defined for negative numbers")
  }

  // Ensure r is not greater than n
  if (r > n) return 0

  // Optimize for common cases
  if (r === 0 || r === n) return 1
  if (r === 1) return n

  // Use symmetry to reduce calculations
  if (r > n / 2) {
    r = n - r
  }

  // Create a cache key
  const cacheKey = `${n}_${r}`

  // Check if we have a cached result
  if (combinationsCache[cacheKey] !== undefined) {
    return combinationsCache[cacheKey]
  }

  try {
    let result: number

    // For large values, use a more numerically stable algorithm
    // to avoid calculating large factorials separately
    if (n > 50) {
      // Use logarithmic approach for large numbers to prevent overflow
      result = Math.exp(logFactorial(n) - logFactorial(r) - logFactorial(n - r))
    } else {
      // For smaller values, use the standard factorial approach
      result = factorial(n) / (factorial(r) * factorial(n - r))
    }

    // Cache the result
    combinationsCache[cacheKey] = result
    return result
  } catch (error) {
    // If factorial calculation fails, try the logarithmic approach
    try {
      const result = Math.exp(
        logFactorial(n) - logFactorial(r) - logFactorial(n - r)
      )

      // Cache the result
      combinationsCache[cacheKey] = result
      return result
    } catch (fallbackError) {
      // If all approaches fail, throw a more descriptive error
      throw new Error(
        `Failed to calculate combinations(${n}, ${r}): ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }
}

/**
 * Calculate the natural logarithm of n! using Stirling's approximation for large n
 * @param n Number to calculate log(n!) for
 * @returns Natural logarithm of n!
 */
function logFactorial(n: number): number {
  // For small values, calculate directly
  if (n < 20) {
    return Math.log(factorial(n))
  }

  // For larger values, use Stirling's approximation:
  // log(n!) ≈ n*log(n) - n + 0.5*log(2*π*n) + 1/(12*n) - ...
  return n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n) + 1 / (12 * n)
}

// Cache for hypergeometric calculations
const hypergeometricCache: Record<string, number> = {}

/**
 * Calculate hypergeometric probability with memoization and error handling
 * @param k Number of successes in the sample
 * @param N Population size
 * @param K Number of successes in the population
 * @param n Sample size
 * @returns Probability
 * @throws Error if inputs are invalid or calculation fails
 */
export function hypergeometric(
  k: number,
  N: number,
  K: number,
  n: number
): number {
  // Input validation
  if (
    !Number.isInteger(k) ||
    !Number.isInteger(N) ||
    !Number.isInteger(K) ||
    !Number.isInteger(n)
  ) {
    throw new Error("Hypergeometric distribution requires integer parameters")
  }

  if (N < 0 || K < 0 || n < 0 || k < 0) {
    throw new Error(
      "Hypergeometric distribution requires non-negative parameters"
    )
  }

  if (K > N) {
    throw new Error(
      "Number of successes in population (K) cannot exceed population size (N)"
    )
  }

  if (n > N) {
    throw new Error("Sample size (n) cannot exceed population size (N)")
  }

  if (k > n || k > K) {
    // If k exceeds either n or K, probability is 0
    return 0
  }

  if (n - k > N - K) {
    // If failures in sample exceed available failures in population, probability is 0
    return 0
  }

  // Create a cache key
  const cacheKey = `${k}_${N}_${K}_${n}`

  // Check if we have a cached result
  if (hypergeometricCache[cacheKey] !== undefined) {
    return hypergeometricCache[cacheKey]
  }

  try {
    let result: number

    // For large values, use logarithmic approach to avoid numerical issues
    if (N > 100 || K > 50 || n > 50) {
      // Calculate using logarithms to avoid overflow
      // log(P(X=k)) = log(C(K,k)) + log(C(N-K,n-k)) - log(C(N,n))
      const logProb =
        logCombinations(K, k) +
        logCombinations(N - K, n - k) -
        logCombinations(N, n)

      result = Math.exp(logProb)
    } else {
      // For smaller values, use the standard approach
      result =
        (combinations(K, k) * combinations(N - K, n - k)) / combinations(N, n)
    }

    // Cache the result
    hypergeometricCache[cacheKey] = result
    return result
  } catch (error) {
    // If standard calculation fails, try the logarithmic approach as fallback
    try {
      const logProb =
        logCombinations(K, k) +
        logCombinations(N - K, n - k) -
        logCombinations(N, n)

      const result = Math.exp(logProb)

      // Cache the result
      hypergeometricCache[cacheKey] = result
      return result
    } catch (fallbackError) {
      // If all approaches fail, throw a more descriptive error
      throw new Error(
        `Failed to calculate hypergeometric(${k}, ${N}, ${K}, ${n}): ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }
}

/**
 * Calculate the natural logarithm of combinations(n,r) using logarithmic factorials
 * @param n Total number of items
 * @param r Number of items to choose
 * @returns Natural logarithm of combinations(n,r)
 */
function logCombinations(n: number, r: number): number {
  // Handle edge cases
  if (r > n) return -Infinity
  if (r === 0 || r === n) return 0 // log(1) = 0
  if (r === 1) return Math.log(n)

  // Use symmetry to reduce calculations
  if (r > n / 2) {
    r = n - r
  }

  // Calculate using logarithmic factorials
  return logFactorial(n) - logFactorial(r) - logFactorial(n - r)
}

/**
 * Calculate the adjusted probability with multiple sets
 * @param probability Single set probability
 * @param numSets Number of sets
 * @returns Adjusted probability
 */
export function adjustedProbability(
  probability: number,
  numSets: number
): number {
  return 1 - Math.pow(1 - probability, numSets)
}

/**
 * Clear all calculation caches
 */
export function clearCaches(): void {
  // Keep the base cases for regular factorial cache
  Object.keys(factorialCache).forEach((key) => {
    if (parseInt(key) > 1) {
      delete factorialCache[parseInt(key)]
    }
  })

  // Keep the base cases for BigInt factorial cache
  Object.keys(factorialBigIntCache).forEach((key) => {
    if (parseInt(key) > 1) {
      delete factorialBigIntCache[parseInt(key)]
    }
  })

  // Clear other caches completely
  Object.keys(combinationsCache).forEach((key) => {
    delete combinationsCache[key]
  })

  Object.keys(hypergeometricCache).forEach((key) => {
    delete hypergeometricCache[key]
  })
}
