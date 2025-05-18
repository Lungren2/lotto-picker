/**
 * JavaScript implementation of the Mersenne Twister (MT19937) algorithm
 * Based on the pseudocode from https://en.wikipedia.org/wiki/Mersenne_Twister
 */

// Constants for MT19937
const N = 624;
const M = 397;
const MATRIX_A = 0x9908b0df;   // Constant vector a
const UPPER_MASK = 0x80000000; // Most significant bit
const LOWER_MASK = 0x7fffffff; // Least significant 31 bits

/**
 * Mersenne Twister generator class
 */
class MersenneTwister {
  /**
   * Initialize the generator with a seed
   * @param {number} seed The seed value (defaults to current timestamp if not provided)
   */
  constructor(seed) {
    this.mt = new Array(N);
    this.index = N + 1;
    this.seed(seed || Date.now());
  }
  
  /**
   * Initialize or reinitialize with a seed
   * @param {number} seed The seed value
   */
  seed(seed) {
    this.mt[0] = seed >>> 0;
    
    for (let i = 1; i < N; i++) {
      this.mt[i] = (1812433253 * (this.mt[i - 1] ^ (this.mt[i - 1] >>> 30)) + i) >>> 0;
    }
    
    this.index = N;
  }
  
  /**
   * Generate an array of 624 untempered numbers
   */
  twist() {
    for (let i = 0; i < N; i++) {
      const x = (this.mt[i] & UPPER_MASK) + (this.mt[(i + 1) % N] & LOWER_MASK);
      let xA = x >>> 1;
      
      if (x % 2 !== 0) {
        xA ^= MATRIX_A;
      }
      
      this.mt[i] = this.mt[(i + M) % N] ^ xA;
    }
    
    this.index = 0;
  }
  
  /**
   * Extract a tempered value based on MT[index]
   * @returns {number} A random 32-bit integer
   */
  int32() {
    if (this.index >= N) {
      this.twist();
    }
    
    let y = this.mt[this.index++];
    
    // Tempering
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    
    return y >>> 0;
  }
  
  /**
   * Generate a random integer between min and max (inclusive)
   * @param {number} min Minimum value (default: 1)
   * @param {number} max Maximum value (default: 100)
   * @returns {number} Random integer in the specified range
   */
  intRange(min = 1, max = 100) {
    if (min > max) {
      [min, max] = [max, min]; // Swap if min > max
    }
    
    const range = max - min + 1;
    // Use rejection sampling to avoid modulo bias
    const limit = Math.floor(0xffffffff / range) * range;
    let r;
    
    do {
      r = this.int32();
    } while (r >= limit);
    
    return min + (r % range);
  }
  
  /**
   * Generate a random float in the range [0, 1) with 32-bit resolution
   * @returns {number} Random float between 0 (inclusive) and 1 (exclusive)
   */
  random() {
    return this.int32() * (1.0 / 4294967296.0); // Divide by 2^32
  }
  
  /**
   * Generate a random float in the range [0, 1] with 32-bit resolution
   * @returns {number} Random float between 0 (inclusive) and 1 (inclusive)
   */
  randomInclusive() {
    return this.int32() * (1.0 / 4294967295.0); // Divide by 2^32 - 1
  }
  
  /**
   * Generate a random float in the range (0, 1) with 32-bit resolution
   * @returns {number} Random float between 0 (exclusive) and 1 (exclusive)
   */
  randomExclusive() {
    return (this.int32() + 0.5) * (1.0 / 4294967296.0); // Divide by 2^32
  }
  
  /**
   * Generate a random float in a specified range
   * @param {number} min Minimum value
   * @param {number} max Maximum value
   * @returns {number} Random float in the specified range
   */
  floatRange(min, max) {
    return min + this.random() * (max - min);
  }
  
  /**
   * Generate an array of unique random integers in a specified range
   * @param {number} count Number of integers to generate
   * @param {number} min Minimum value (inclusive)
   * @param {number} max Maximum value (inclusive)
   * @returns {Array<number>} Array of unique random integers
   */
  uniqueInts(count, min, max) {
    if (count > (max - min + 1)) {
      throw new Error('Cannot generate more unique numbers than the range allows');
    }
    
    // For small ranges or large count, use Fisher-Yates shuffle
    if (count > (max - min + 1) / 3) {
      const allNumbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      
      // Fisher-Yates shuffle
      for (let i = allNumbers.length - 1; i > 0; i--) {
        const j = this.intRange(0, i);
        [allNumbers[i], allNumbers[j]] = [allNumbers[j], allNumbers[i]];
      }
      
      return allNumbers.slice(0, count);
    }
    
    // For small count relative to range, use rejection sampling
    const result = [];
    const used = new Set();
    
    while (result.length < count) {
      const num = this.intRange(min, max);
      if (!used.has(num)) {
        used.add(num);
        result.push(num);
      }
    }
    
    return result;
  }
}
