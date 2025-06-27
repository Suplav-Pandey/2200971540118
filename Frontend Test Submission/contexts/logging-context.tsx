"use client"

import { createContext, useContext, type ReactNode } from "react"
import { Log } from "@/utils/logger"
import type { LogLevel, LogPackage } from "@/types"

interface LoggingContextType {
  log: (stack: string, level: LogLevel, logPackage: LogPackage, message: string) => void
}

const LoggingContext = createContext<LoggingContextType | undefined>(undefined)

export function LoggingProvider({ children }: { children: ReactNode }) {
  const log = (stack: string, level: LogLevel, logPackage: LogPackage, message: string) => {
    // Use the robust logging function that handles errors gracefully
    Log(stack, level, logPackage, message)
  }

  return <LoggingContext.Provider value={{ log }}>{children}</LoggingContext.Provider>
}

export function useLogging() {
  const context = useContext(LoggingContext)
  if (context === undefined) {
    throw new Error("useLogging must be used within a LoggingProvider")
  }
  return context
}

export { LoggingContext }
