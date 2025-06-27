const API_BASE = "http://20.244.56.144/evaluation-service"
const BEARER_TOKEN = "your-bearer-token-here" // Replace with actual token

interface LogPayload {
  stack: string
  level: string
  package: string
  message: string
  timestamp: string
  sessionId: string
  userAgent?: string
  url?: string
}

const sessionId = crypto.randomUUID()

const logToServer = async (stack: string, level: string, packageName: string, message: string) => {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      console.log(`[${level.toUpperCase()}] ${packageName}: ${message}`)
      return
    }

    const payload: LogPayload = {
      stack,
      level,
      package: packageName,
      message,
      timestamp: new Date().toISOString(),
      sessionId,
      userAgent: navigator?.userAgent || "unknown",
      url: window?.location?.href || "unknown",
    }

    // Use fetch with timeout and proper error handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(`${API_BASE}/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BEARER_TOKEN}`,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Don't throw error if logging fails - just log to console
    if (!response.ok) {
      console.warn(`Logging API returned ${response.status}: ${response.statusText}`)
      console.log(`[${level.toUpperCase()}] ${packageName}: ${message}`)
    }
  } catch (error) {
    // Silently fall back to console logging - don't throw errors
    console.log(`[${level.toUpperCase()}] ${packageName}: ${message}`)

    // Only log the fetch error in development
    if (process.env.NODE_ENV === "development") {
      console.warn("Logging API unavailable, using console fallback:", error instanceof Error ? error.message : error)
    }
  }
}

export const Log = (stack: string, level: string, packageName: string, message: string) => {
  // Always log to console first
  if (process.env.NODE_ENV === "development") {
    console.log(`[${level.toUpperCase()}] ${packageName}: ${message}`)
  }

  // Try to log to server asynchronously without blocking
  logToServer(stack, level, packageName, message).catch(() => {
    // Silently ignore server logging errors
  })
}

// Convenience methods for common logging patterns
export const logUserAction = (action: string, details?: string) => {
  Log("frontend", "info", "page", `User action: ${action}${details ? ` - ${details}` : ""}`)
}

export const logError = (error: Error | string, context: string) => {
  const message = error instanceof Error ? error.message : error
  Log("frontend", "error", "api", `Error in ${context}: ${message}`)
}

export const logValidation = (field: string, isValid: boolean, reason?: string) => {
  const level = isValid ? "debug" : "warn"
  const message = `Validation ${isValid ? "passed" : "failed"} for ${field}${reason ? `: ${reason}` : ""}`
  Log("frontend", level, "utils", message)
}

export const logNavigation = (from: string, to: string) => {
  Log("frontend", "debug", "page", `Navigation: ${from} -> ${to}`)
}

export const logComponentLifecycle = (component: string, action: "mount" | "unmount") => {
  Log("frontend", "info", "component", `${component} component ${action}ed`)
}
