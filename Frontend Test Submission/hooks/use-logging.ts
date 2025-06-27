"use client"

import { useContext } from "react"
import { LoggingContext } from "@/contexts/logging-context"

export function useLogging() {
  const context = useContext(LoggingContext)
  if (context === undefined) {
    throw new Error("useLogging must be used within a LoggingProvider")
  }
  return context
}
