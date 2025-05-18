/**
 * Memoized utility functions for odds calculations
 */

// Cache for factorial calculations
const factorialCache: Record<number, number> = {
  0: 1,
  1: 1,
};

/**
 * Calculate factorial of a number with memoization
 * @param n Number to calculate factorial for
 * @returns Factorial of n
 */
export function factorial(n: number): number {
  // Check if we have a cached result
  if (factorialCache[n] !== undefined) {
    return factorialCache[n];
  }
  
  // Calculate and cache the result
  let result = n;
  for (let i = n - 1; i > 1; i--) {
    result *= i;
  }
  
  factorialCache[n] = result;
  return result;
}

// Cache for combinations calculations
const combinationsCache: Record<string, number> = {};

/**
 * Calculate combinations (n choose r) with memoization
 * @param n Total number of items
 * @param r Number of items to choose
 * @returns Number of possible combinations
 */
export function combinations(n: number, r: number): number {
  // Ensure r is not greater than n
  if (r > n) return 0;
  
  // Optimize for common cases
  if (r === 0 || r === n) return 1;
  if (r === 1) return n;
  
  // Use symmetry to reduce calculations
  if (r > n / 2) {
    r = n - r;
  }
  
  // Create a cache key
  const cacheKey = `${n}_${r}`;
  
  // Check if we have a cached result
  if (combinationsCache[cacheKey] !== undefined) {
    return combinationsCache[cacheKey];
  }
  
  // Calculate using factorials
  const result = factorial(n) / (factorial(r) * factorial(n - r));
  
  // Cache the result
  combinationsCache[cacheKey] = result;
  return result;
}

// Cache for hypergeometric calculations
const hypergeometricCache: Record<string, number> = {};

/**
 * Calculate hypergeometric probability with memoization
 * @param k Number of successes in the sample
 * @param N Population size
 * @param K Number of successes in the population
 * @param n Sample size
 * @returns Probability
 */
export function hypergeometric(k: number, N: number, K: number, n: number): number {
  // Create a cache key
  const cacheKey = `${k}_${N}_${K}_${n}`;
  
  // Check if we have a cached result
  if (hypergeometricCache[cacheKey] !== undefined) {
    return hypergeometricCache[cacheKey];
  }
  
  // Calculate using combinations
  const result = (combinations(K, k) * combinations(N - K, n - k)) / combinations(N, n);
  
  // Cache the result
  hypergeometricCache[cacheKey] = result;
  return result;
}

/**
 * Calculate the adjusted probability with multiple sets
 * @param probability Single set probability
 * @param numSets Number of sets
 * @returns Adjusted probability
 */
export function adjustedProbability(probability: number, numSets: number): number {
  return 1 - Math.pow(1 - probability, numSets);
}

/**
 * Clear all calculation caches
 */
export function clearCaches(): void {
  // Keep the base cases
  Object.keys(factorialCache).forEach(key => {
    if (parseInt(key) > 1) {
      delete factorialCache[parseInt(key)];
    }
  });
  
  // Clear other caches completely
  Object.keys(combinationsCache).forEach(key => {
    delete combinationsCache[key];
  });
  
  Object.keys(hypergeometricCache).forEach(key => {
    delete hypergeometricCache[key];
  });
}
