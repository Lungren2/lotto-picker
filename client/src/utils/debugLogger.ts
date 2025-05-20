/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Enhanced Debug Logger Utility
 *
 * A comprehensive logging system for debugging components and tracking errors.
 * Logs events to localStorage and console with support for different log levels.
 */

// Define log levels as a const object instead of enum
export const LogLevel = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  FATAL: "FATAL",
} as const

// Define the LogLevel type
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel]

// Interface for log entry
interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  message: string
  data?: any
  stack?: string
  metadata?: Record<string, any>
}

// Configuration options
interface LoggerConfig {
  minLevel: LogLevel
  enableConsole: boolean
  enableStorage: boolean
  maxStoredLogs: number
  storageKey: string
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: LogLevel.WARN, // Only log warnings and errors by default
  enableConsole: true, // Log to console
  enableStorage: true, // Store logs in localStorage
  maxStoredLogs: 100, // Maximum number of logs to keep in storage
  storageKey: "lotto_picker_logs",
}

// Main logger class
class DebugLogger {
  private logFile: string
  private enabled: boolean
  private logBuffer: LogEntry[] = []
  private flushInterval: number = 1000 // Flush every second
  private intervalId: number | null = null
  private maxBufferSize: number = 50 // Flush when buffer reaches this size
  private config: LoggerConfig

  constructor(
    logFile: string,
    enabled: boolean = true,
    config?: Partial<LoggerConfig>
  ) {
    this.logFile = logFile
    this.enabled = enabled
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Start the flush interval if enabled
    if (this.enabled) {
      this.startFlushInterval()
    }
  }

  // Configure the logger
  public configure(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Enable or disable logging
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled

    if (enabled && !this.intervalId) {
      this.startFlushInterval()
    } else if (!enabled && this.intervalId) {
      this.stopFlushInterval()
    }
  }

  // Get stored logs from localStorage
  public getStoredLogs(): LogEntry[] {
    try {
      const storedLogs = localStorage.getItem(this.config.storageKey)
      return storedLogs ? JSON.parse(storedLogs) : []
    } catch (error) {
      this.logToConsole(
        LogLevel.ERROR,
        "Failed to retrieve stored logs",
        "Logger",
        { error }
      )
      return []
    }
  }

  // Clear all stored logs
  public clearStoredLogs(): void {
    try {
      localStorage.removeItem(this.config.storageKey)
    } catch (error) {
      this.logToConsole(
        LogLevel.ERROR,
        "Failed to clear stored logs",
        "Logger",
        { error }
      )
    }
  }

  // Log a message
  public log(
    level: LogLevel,
    component: string,
    message: string,
    data?: any,
    error?: Error
  ): void {
    if (!this.enabled || this.shouldSkipLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
      stack: error?.stack,
    }

    // Log to console if enabled
    if (this.config.enableConsole) {
      this.logToConsole(level, message, component, data, error)
    }

    // Store in localStorage if enabled
    if (this.config.enableStorage) {
      this.storeLog(entry)
    }

    this.logBuffer.push(entry)

    // Flush immediately if buffer is full
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flush()
    }
  }

  // Check if a log should be skipped based on minimum level
  private shouldSkipLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.FATAL,
    ]
    const minLevelIndex = levels.indexOf(this.config.minLevel)
    const currentLevelIndex = levels.indexOf(level)

    return currentLevelIndex < minLevelIndex
  }

  // Log to console with appropriate method
  private logToConsole(
    level: LogLevel,
    message: string,
    component: string,
    data?: any,
    error?: Error
  ): void {
    const formattedMessage = component ? `[${component}] ${message}` : message

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data || "")
        break
      case LogLevel.INFO:
        console.info(formattedMessage, data || "")
        break
      case LogLevel.WARN:
        console.warn(formattedMessage, data || "")
        break
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage, data || "")
        if (error?.stack) console.error(error.stack)
        break
    }
  }

  // Store a log entry in localStorage
  private storeLog(entry: LogEntry): void {
    try {
      const logs = this.getStoredLogs()
      logs.push(entry)

      // Trim logs if exceeding maximum
      const trimmedLogs = logs.slice(-this.config.maxStoredLogs)

      localStorage.setItem(this.config.storageKey, JSON.stringify(trimmedLogs))
    } catch (error) {
      this.logToConsole(LogLevel.ERROR, "Failed to store log", "Logger", {
        error,
      })
    }
  }

  // Convenience methods for different log levels
  public info(component: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, component, message, data)
  }

  public warn(component: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, component, message, data)
  }

  public error(
    component: string,
    message: string,
    data?: any,
    error?: Error
  ): void {
    this.log(LogLevel.ERROR, component, message, data, error)
  }

  public debug(component: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, component, message, data)
  }

  public fatal(
    component: string,
    message: string,
    data?: any,
    error?: Error
  ): void {
    this.log(LogLevel.FATAL, component, message, data, error)
  }

  // Flush the log buffer to the file
  private flush(): void {
    if (this.logBuffer.length === 0) return

    try {
      // Convert buffer to string
      const logText =
        this.logBuffer
          .map((entry) => {
            const dataStr = entry.data ? ` | ${JSON.stringify(entry.data)}` : ""
            return `[${entry.timestamp}] [${entry.level}] [${entry.component}] ${entry.message}${dataStr}`
          })
          .join("\n") + "\n"

      // Write to file using the File System Access API if available
      this.writeToFile(logText)

      // Clear the buffer
      this.logBuffer = []
    } catch (error) {
      // If there's an error, keep the buffer and try again later
      this.logToConsole(LogLevel.ERROR, "Error writing to log file", "Logger", {
        error,
      })
    }
  }

  // Write to file using available APIs
  private async writeToFile(content: string): Promise<void> {
    try {
      // Try to use the File System Access API if available (modern browsers)
      if ("showSaveFilePicker" in window) {
        // For the first write, ask for file location
        let fileHandle

        // Try to get the file handle from localStorage
        const storedHandle = localStorage.getItem("debugLogFileHandle")

        if (storedHandle) {
          try {
            fileHandle = JSON.parse(storedHandle)
          } catch {
            // If parsing fails, request a new file handle
            fileHandle = await (window as any).showSaveFilePicker({
              suggestedName: this.logFile,
              types: [
                {
                  description: "Log Files",
                  accept: { "text/plain": [".log"] },
                },
              ],
            })
            localStorage.setItem(
              "debugLogFileHandle",
              JSON.stringify(fileHandle)
            )
          }
        } else {
          fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: this.logFile,
            types: [
              {
                description: "Log Files",
                accept: { "text/plain": [".log"] },
              },
            ],
          })
          localStorage.setItem("debugLogFileHandle", JSON.stringify(fileHandle))
        }

        // Get a writable stream and write to it
        const writable = await (fileHandle as any).createWritable()
        await writable.write(content)
        await writable.close()
      } else {
        // Fallback to localStorage if File System Access API is not available
        const existingLog = localStorage.getItem(this.logFile) || ""
        localStorage.setItem(this.logFile, existingLog + content)

        // If localStorage gets too big, start trimming old logs
        if (localStorage.getItem(this.logFile)?.length || 0 > 1000000) {
          // 1MB limit
          const logs = localStorage.getItem(this.logFile)?.split("\n") || []
          // Keep only the last 1000 lines
          localStorage.setItem(this.logFile, logs.slice(-1000).join("\n"))
        }
      }
    } catch (error) {
      this.logToConsole(
        LogLevel.ERROR,
        "Failed to write to log file",
        "Logger",
        { error }
      )
    }
  }

  // Start the flush interval
  private startFlushInterval(): void {
    this.intervalId = window.setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  // Stop the flush interval
  private stopFlushInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}

// Create a singleton instance of the logger
export const debugLogger = new DebugLogger("oddly-debug.log", true, {
  minLevel: LogLevel.WARN,
  enableConsole: true,
  enableStorage: true,
  maxStoredLogs: 100,
  storageKey: "lotto_picker_logs",
})

// Export convenience methods from the singleton
export const debug = (component: string, message: string, data?: any) =>
  debugLogger.debug(component, message, data)

export const info = (component: string, message: string, data?: any) =>
  debugLogger.info(component, message, data)

export const warn = (component: string, message: string, data?: any) =>
  debugLogger.warn(component, message, data)

export const error = (
  component: string,
  message: string,
  data?: any,
  error?: Error
) => debugLogger.error(component, message, data, error)

export const fatal = (
  component: string,
  message: string,
  data?: any,
  error?: Error
) => debugLogger.fatal(component, message, data, error)

export const getStoredLogs = () => debugLogger.getStoredLogs()
export const clearStoredLogs = () => debugLogger.clearStoredLogs()
export const configureLogger = (config: Partial<LoggerConfig>) =>
  debugLogger.configure(config)

// Export the logger class for extensibility
export default DebugLogger
