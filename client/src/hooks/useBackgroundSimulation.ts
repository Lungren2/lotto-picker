import { useState, useEffect, useRef, useCallback } from "react"
import { useSimulationStore } from "@/stores/simulationStore"
import { toast } from "@/components/ui/sonner"

interface UseBackgroundSimulationProps {
  quantity: number
  maxValue: number
}

interface UseBackgroundSimulationReturn {
  isRunningInBackground: boolean
  startBackgroundSimulation: () => void
  stopBackgroundSimulation: () => void
  hasNotificationPermission: boolean
  requestNotificationPermission: () => Promise<boolean>
  currentSpeed: number
}

export function useBackgroundSimulation({
  quantity,
  maxValue,
}: UseBackgroundSimulationProps): UseBackgroundSimulationReturn {
  // Get state and actions from the simulation store
  const {
    winningSet,
    isRunningInBackground,
    settings,
    startBackgroundSimulation: storeStartBackgroundSimulation,
    stopBackgroundSimulation: storeStopBackgroundSimulation,
    updateFromBackground,
  } = useSimulationStore()

  // State for notification permission
  const [hasNotificationPermission, setHasNotificationPermission] =
    useState<boolean>(Notification.permission === "granted")

  // State for tracking current speed
  const [currentSpeed, setCurrentSpeed] = useState<number>(500)

  // Ref for the worker
  const workerRef = useRef<Worker | null>(null)

  // Function to request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications not supported", {
        description: "Your browser does not support notifications.",
      })
      return false
    }

    if (Notification.permission === "granted") {
      setHasNotificationPermission(true)
      return true
    }

    if (Notification.permission === "denied") {
      toast.error("Notification permission denied", {
        description: "Please enable notifications in your browser settings.",
      })
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      const granted = permission === "granted"
      setHasNotificationPermission(granted)

      if (granted) {
        toast.success("Notifications enabled", {
          description:
            "You will receive notifications for simulation progress.",
        })
      } else {
        toast.error("Notifications disabled", {
          description:
            "You will not receive notifications for simulation progress.",
        })
      }

      return granted
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      toast.error("Error requesting permission", {
        description: "There was an error requesting notification permission.",
      })
      return false
    }
  }, [])

  // Function to start background simulation
  const startBackgroundSimulation = useCallback(() => {
    if (!winningSet.length) {
      toast.error("No winning set defined", {
        description: "Please generate or set a winning set of numbers first.",
      })
      return
    }

    // Check if notifications are enabled but permission not granted
    if (settings.enableNotifications && Notification.permission !== "granted") {
      requestNotificationPermission()
    }

    // Create a new worker if needed
    if (!workerRef.current) {
      try {
        workerRef.current = new Worker("/simulation-worker.js")

        // Set up message handler
        workerRef.current.onmessage = (e) => {
          const data = e.data

          switch (data.type) {
            case "progress":
              // Update the simulation state
              updateFromBackground(data.currentAttempt, data.bestMatch)

              // Update the current speed if provided
              if (data.currentSpeed) {
                setCurrentSpeed(data.currentSpeed)
              }

              // Send a notification if needed
              if (
                data.shouldNotify &&
                settings.enableNotifications &&
                Notification.permission === "granted"
              ) {
                navigator.serviceWorker.ready.then((registration) => {
                  const { currentAttempt, bestMatch } = data
                  registration.showNotification("Simulation Progress", {
                    body: `Attempt: ${currentAttempt.toLocaleString()}. Best match: ${
                      bestMatch.count
                    }/${winningSet.length}`,
                    icon: "/pwa-192x192.png",
                    badge: "/pwa-64x64.png",
                    tag: "simulation-progress",
                    data: {
                      url: window.location.href,
                      attempts: currentAttempt,
                      bestMatch: bestMatch.count,
                      total: winningSet.length,
                    },
                  })
                })
              }
              break

            case "complete":
              // Update the simulation state
              updateFromBackground(data.currentAttempt, data.bestMatch)

              // Complete the simulation
              useSimulationStore.getState().completeSimulation()
              break

            case "paused":
            case "stopped":
              // Update the simulation state
              updateFromBackground(data.currentAttempt, data.bestMatch)
              break
          }
        }

        // Set up error handler
        workerRef.current.onerror = (error) => {
          console.error("Worker error:", error)
          toast.error("Simulation error", {
            description:
              "There was an error running the simulation in the background.",
          })
          storeStopBackgroundSimulation()
        }
      } catch (error) {
        console.error("Error creating worker:", error)
        toast.error("Background processing not supported", {
          description: "Your browser does not support background processing.",
        })
        return
      }
    }

    // Start the background simulation in the store
    storeStartBackgroundSimulation(quantity, maxValue)

    // Start the worker
    workerRef.current.postMessage({
      command: "start",
      winningSet,
      quantity,
      maxValue,
      maxAttempts: settings.maxAttempts,
      notificationFrequency: settings.notificationFrequency,
      seed: Date.now(),

      // Pass acceleration settings
      enableAcceleration: settings.enableAcceleration,
      minSpeed: settings.minSpeed,
      maxSpeed: settings.maxSpeed,
      accelerationFactor: settings.accelerationFactor,
    })

    toast.success("Background simulation started", {
      description:
        "The simulation will continue running even if you switch tabs.",
    })
  }, [
    winningSet,
    settings,
    quantity,
    maxValue,
    storeStartBackgroundSimulation,
    storeStopBackgroundSimulation,
    updateFromBackground,
    requestNotificationPermission,
  ])

  // Function to stop background simulation
  const stopBackgroundSimulation = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ command: "stop" })
    }

    storeStopBackgroundSimulation()

    toast.info("Background simulation stopped", {
      description: "The simulation has been stopped.",
    })
  }, [storeStopBackgroundSimulation, workerRef])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  // Check for service worker support
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      toast.error("Service Worker not supported", {
        description: "Your browser does not support background processing.",
      })
    }
  }, [])

  return {
    isRunningInBackground,
    startBackgroundSimulation,
    stopBackgroundSimulation,
    hasNotificationPermission,
    requestNotificationPermission,
    currentSpeed,
  }
}
