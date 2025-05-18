// simulation-worker.js
// Web Worker for background simulation processing

// Import the Mersenne Twister implementation
self.importScripts("./mersenne-twister.js")

// State for the simulation
let state = {
  running: false,
  winningSet: [],
  currentAttempt: 0,
  bestMatch: {
    count: 0,
    set: [],
  },
  quantity: 0,
  maxValue: 0,
  maxAttempts: 1000000,
  notificationFrequency: 1000,
  lastNotificationAt: 0,
  seed: Date.now(),

  // Acceleration settings
  enableAcceleration: true,
  minSpeed: 500, // Start slow (500ms delay between batches)
  maxSpeed: 10, // End fast (10ms delay between batches)
  accelerationFactor: 5, // Medium acceleration curve (1-10)
  currentSpeed: 500, // Current simulation speed (ms delay)
}

// Initialize the RNG
let rng = new MersenneTwister(state.seed)

// Function to generate a random set of numbers
function generateSet(available, quantity) {
  const result = []
  const availableCopy = [...available]

  for (let i = 0; i < quantity; i++) {
    const randomIndex = Math.floor(rng.random() * availableCopy.length)
    result.push(availableCopy[randomIndex])
    availableCopy.splice(randomIndex, 1)
  }

  return result
}

// Function to count matches between two sets
function countMatches(setA, setB) {
  return setA.filter((num) => setB.includes(num)).length
}

// Function to calculate the current delay based on acceleration settings
function calculateAcceleratedDelay() {
  // If acceleration is disabled, return the base delay
  if (!state.enableAcceleration) {
    return state.minSpeed
  }

  // Define acceleration thresholds
  const thresholds = [
    10, // Very beginning
    100, // Early stage
    1000, // Getting going
    10000, // Mid-range
    100000, // Advanced
    1000000, // End-game
  ]

  // Find which threshold range we're in
  let thresholdIndex = 0
  for (let i = 0; i < thresholds.length; i++) {
    if (state.currentAttempt >= thresholds[i]) {
      thresholdIndex = i + 1
    }
  }

  // Calculate progress within the current threshold range
  const lowerThreshold = thresholdIndex > 0 ? thresholds[thresholdIndex - 1] : 0
  const upperThreshold =
    thresholdIndex < thresholds.length
      ? thresholds[thresholdIndex]
      : state.maxAttempts

  // Calculate normalized progress (0-1) within the current range
  const rangeProgress =
    (state.currentAttempt - lowerThreshold) / (upperThreshold - lowerThreshold)

  // Apply acceleration factor (higher = faster acceleration)
  // Use a logarithmic or exponential curve based on the acceleration factor
  const accelerationPower =
    Math.min(10, Math.max(1, state.accelerationFactor)) / 5 // Normalize to 0.2-2
  const accelerationCurve = Math.pow(rangeProgress, 1 / accelerationPower)

  // Calculate the current delay based on min/max speed and progress
  const minDelay = state.minSpeed
  const maxDelay = Math.max(state.maxSpeed, 1) // Ensure we don't go below 1ms

  // Interpolate between min and max delay based on the acceleration curve
  const currentDelay = minDelay - accelerationCurve * (minDelay - maxDelay)

  // Update the current speed in the state
  state.currentSpeed = Math.max(Math.min(minDelay, currentDelay), maxDelay)

  return state.currentSpeed
}

// Function to run a single simulation step
function runSimulationStep() {
  if (!state.running || !state.winningSet.length) return false

  // Generate a random set
  const available = Array.from({ length: state.maxValue }, (_, i) => i + 1)
  const newSet = generateSet(available, state.quantity)

  // Count matches
  const matches = countMatches(newSet, state.winningSet)

  // Update attempt count and best match
  state.currentAttempt++

  // Update best match if this is better
  if (matches > state.bestMatch.count) {
    state.bestMatch = {
      count: matches,
      set: newSet,
    }
  }

  // Check if we should send a progress update
  const shouldNotify =
    state.currentAttempt - state.lastNotificationAt >=
    state.notificationFrequency
  if (shouldNotify) {
    state.lastNotificationAt = state.currentAttempt

    // Send progress update to main thread
    self.postMessage({
      type: "progress",
      currentAttempt: state.currentAttempt,
      bestMatch: state.bestMatch,
      shouldNotify: true,
      currentSpeed: state.currentSpeed,
    })
  } else if (state.currentAttempt % 10000 === 0) {
    // Send less frequent updates without notification
    self.postMessage({
      type: "progress",
      currentAttempt: state.currentAttempt,
      bestMatch: state.bestMatch,
      shouldNotify: false,
      currentSpeed: state.currentSpeed,
    })
  }

  // Check if we found a match
  if (matches === state.quantity) {
    state.running = false

    // Send completion message
    self.postMessage({
      type: "complete",
      currentAttempt: state.currentAttempt,
      bestMatch: state.bestMatch,
      reason: "match_found",
    })

    return true
  }

  // Check if we've reached the max attempts
  if (state.currentAttempt >= state.maxAttempts) {
    state.running = false

    // Send completion message
    self.postMessage({
      type: "complete",
      currentAttempt: state.currentAttempt,
      bestMatch: state.bestMatch,
      reason: "max_attempts",
    })

    return true
  }

  return false
}

// Function to run the simulation in batches
function runSimulationBatch() {
  if (!state.running) return

  // Calculate batch size based on current attempt count
  // As we progress, increase the batch size for better performance
  let batchSize = 1000

  if (state.enableAcceleration) {
    // Dynamically adjust batch size based on current attempt count
    if (state.currentAttempt > 100000) {
      batchSize = 10000
    } else if (state.currentAttempt > 10000) {
      batchSize = 5000
    } else if (state.currentAttempt > 1000) {
      batchSize = 2000
    }
  }

  // Run a batch of simulations
  let completed = false

  for (let i = 0; i < batchSize; i++) {
    completed = runSimulationStep()
    if (completed) break
  }

  // Calculate the delay for the next batch based on acceleration
  const delay = state.enableAcceleration ? calculateAcceleratedDelay() : 0

  // If not completed, schedule the next batch with the calculated delay
  if (!completed && state.running) {
    setTimeout(runSimulationBatch, delay)
  }

  // Send a progress update with the current speed
  if (state.currentAttempt % 10000 === 0) {
    self.postMessage({
      type: "progress",
      currentAttempt: state.currentAttempt,
      bestMatch: state.bestMatch,
      shouldNotify: false,
      currentSpeed: state.currentSpeed,
    })
  }
}

// Handle messages from the main thread
self.addEventListener("message", function (e) {
  const data = e.data

  switch (data.command) {
    case "start":
      // Initialize the simulation
      state = {
        running: true,
        winningSet: data.winningSet,
        currentAttempt: 0,
        bestMatch: {
          count: 0,
          set: [],
        },
        quantity: data.quantity,
        maxValue: data.maxValue,
        maxAttempts: data.maxAttempts || 1000000,
        notificationFrequency: data.notificationFrequency || 1000,
        lastNotificationAt: 0,
        seed: data.seed || Date.now(),

        // Acceleration settings
        enableAcceleration:
          data.enableAcceleration !== undefined
            ? data.enableAcceleration
            : true,
        minSpeed: data.minSpeed || 500,
        maxSpeed: data.maxSpeed || 10,
        accelerationFactor: data.accelerationFactor || 5,
        currentSpeed: data.minSpeed || 500,
      }

      // Initialize the RNG with the provided seed
      rng = new MersenneTwister(state.seed)

      // Start the simulation
      runSimulationBatch()
      break

    case "pause":
      state.running = false

      // Send current state back
      self.postMessage({
        type: "paused",
        currentAttempt: state.currentAttempt,
        bestMatch: state.bestMatch,
      })
      break

    case "resume":
      state.running = true

      // Resume the simulation
      runSimulationBatch()
      break

    case "stop":
      state.running = false

      // Send current state back
      self.postMessage({
        type: "stopped",
        currentAttempt: state.currentAttempt,
        bestMatch: state.bestMatch,
      })
      break

    case "getState":
      // Send current state back
      self.postMessage({
        type: "state",
        state: {
          running: state.running,
          currentAttempt: state.currentAttempt,
          bestMatch: state.bestMatch,
          winningSet: state.winningSet,
        },
      })
      break
  }
})
