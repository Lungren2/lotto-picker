/**
 * Debug Logger Utility
 *
 * A file-based logging system for debugging components.
 * Logs events to a file in the application root directory.
 */

// Define log levels
export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

// Interface for log entry
interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  message: string
  data?: any
}

// Main logger class
class DebugLogger {
  private logFile: string
  private enabled: boolean
  private logBuffer: LogEntry[] = []
  private flushInterval: number = 1000 // Flush every second
  private intervalId: number | null = null
  private maxBufferSize: number = 50 // Flush when buffer reaches this size

  constructor(logFile: string, enabled: boolean = true) {
    this.logFile = logFile
    this.enabled = enabled

    // Start the flush interval if enabled
    if (this.enabled) {
      this.startFlushInterval()
    }
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

  // Log a message
  public log(
    level: LogLevel,
    component: string,
    message: string,
    data?: any
  ): void {
    if (!this.enabled) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
    }

    this.logBuffer.push(entry)

    // Flush immediately if buffer is full
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flush()
    }
  }

  // Convenience methods for different log levels
  public info(component: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, component, message, data)
  }

  public warn(component: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, component, message, data)
  }

  public error(component: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, component, message, data)
  }

  public debug(component: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, component, message, data)
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
      console.error("Error writing to log file:", error)
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
          } catch (e) {
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
      console.error("Failed to write to log file:", error)
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
export const debugLogger = new DebugLogger("oddly-debug.log", true)

// Export the logger class for extensibility
export default DebugLogger
