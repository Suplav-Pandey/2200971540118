"use client"

import { useCallback, useState } from "react"
import { useURLShortenerContext } from "@/contexts/url-shortener-context"
import { Log, logUserAction, logError, logValidation } from "@/utils/logger"
import type { URLFormData, ShortenedURL } from "@/types"

interface RedirectResult {
  success: boolean
  url?: string
  error?: string
}

export function useURLShortener() {
  const { state, dispatch } = useURLShortenerContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateShortCode = useCallback((length = 6): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    Log("frontend", "debug", "utils", `Generated shortcode: ${result}`)
    return result
  }, [])

  const isShortCodeUnique = useCallback(
    (shortCode: string): boolean => {
      const isUnique = !state.urls.some((url) => url.shortCode === shortCode)
      logValidation("shortcode uniqueness", isUnique, shortCode)
      return isUnique
    },
    [state.urls],
  )

  const validateUrl = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url)
      const isValid = urlObj.protocol.startsWith("http")
      logValidation("URL format", isValid, url)
      return isValid
    } catch {
      logValidation("URL format", false, url)
      return false
    }
  }, [])

  const validateShortCode = useCallback((shortCode: string): boolean => {
    const regex = /^[a-zA-Z0-9]{3,20}$/
    const isValid = regex.test(shortCode)
    logValidation("shortcode format", isValid, shortCode)
    return isValid
  }, [])

  const createShortUrls = useCallback(
    async (urlsData: URLFormData[]) => {
      dispatch({ type: "SET_LOADING", payload: true })
      setLoading(true)
      setError(null)

      Log("frontend", "info", "hook", `Creating ${urlsData.length} short URLs`)
      logUserAction("Create short URLs", `${urlsData.length} URLs`)

      try {
        const newUrls: ShortenedURL[] = []

        for (const [index, urlData] of urlsData.entries()) {
          Log("frontend", "debug", "hook", `Processing URL ${index + 1}/${urlsData.length}`)

          // Validate URL
          if (!validateUrl(urlData.originalUrl)) {
            throw new Error(`Invalid URL format: ${urlData.originalUrl}`)
          }

          // Generate or validate short code
          let shortCode = urlData.customShortCode?.trim()
          if (shortCode) {
            if (!validateShortCode(shortCode)) {
              throw new Error(`Invalid short code format: ${shortCode}`)
            }
            if (!isShortCodeUnique(shortCode)) {
              throw new Error(`Short code already exists: ${shortCode}`)
            }
          } else {
            // Generate unique shortcode
            let attempts = 0
            do {
              shortCode = generateShortCode(Math.random() > 0.5 ? 6 : 7)
              attempts++
              if (attempts > 10) {
                throw new Error("Failed to generate unique short code after multiple attempts")
              }
            } while (!isShortCodeUnique(shortCode))
          }

          const now = new Date()
          const validityMinutes = urlData.validityMinutes || 30
          const expiresAt = new Date(now.getTime() + validityMinutes * 60000)

          const newUrl: ShortenedURL = {
            id: crypto.randomUUID(),
            originalUrl: urlData.originalUrl,
            shortCode,
            createdAt: now,
            expiresAt,
            validityMinutes,
            clickCount: 0,
            clicks: [],
          }

          newUrls.push(newUrl)
          Log("frontend", "info", "hook", `Created short URL: ${shortCode} -> ${urlData.originalUrl}`)
        }

        dispatch({ type: "ADD_URLS", payload: newUrls })
        Log("frontend", "info", "hook", `Successfully created ${newUrls.length} short URLs`)
        logUserAction("Short URLs created successfully", `${newUrls.length} URLs`)

        return newUrls
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create short URLs"
        dispatch({ type: "SET_ERROR", payload: errorMessage })
        setError(errorMessage)
        logError(errorMessage, "createShortUrls")
        throw error
      } finally {
        setLoading(false)
        dispatch({ type: "SET_LOADING", payload: false })
      }
    },
    [dispatch, validateUrl, validateShortCode, isShortCodeUnique, generateShortCode],
  )

  const handleRedirect = useCallback(
    async (shortCode: string): Promise<RedirectResult> => {
      Log("frontend", "info", "hook", `Handling redirect for shortCode: ${shortCode}`)
      logUserAction("Attempt redirect", shortCode)

      try {
        const url = state.urls.find((u) => u.shortCode === shortCode)

        if (!url) {
          const errorMsg = `Short URL not found: ${shortCode}`
          Log("frontend", "warn", "hook", errorMsg)
          return { success: false, error: "This short URL does not exist or has been removed." }
        }

        const now = new Date()
        if (now > url.expiresAt) {
          const errorMsg = `Short URL expired: ${shortCode} (expired at ${url.expiresAt.toISOString()})`
          Log("frontend", "warn", "hook", errorMsg)
          return {
            success: false,
            error: `This short URL expired on ${url.expiresAt.toLocaleDateString()} at ${url.expiresAt.toLocaleTimeString()}.`,
          }
        }

        // Record click analytics
        const click = {
          timestamp: new Date(),
          source: typeof document !== "undefined" ? document.referrer || "direct" : "direct",
          location: await getLocationInfo(),
        }

        const updatedUrl = {
          ...url,
          clickCount: url.clickCount + 1,
          clicks: [...url.clicks, click],
        }

        dispatch({ type: "UPDATE_URL", payload: updatedUrl })
        Log("frontend", "info", "hook", `Recorded click for ${shortCode}, total clicks: ${updatedUrl.clickCount}`)
        logUserAction("Successful redirect", `${shortCode} -> ${url.originalUrl}`)

        return { success: true, url: url.originalUrl }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Redirect failed"
        logError(errorMessage, "handleRedirect")
        return { success: false, error: "An unexpected error occurred during redirect." }
      }
    },
    [state.urls, dispatch],
  )

  // Mock function to simulate getting location info
  const getLocationInfo = async (): Promise<string> => {
    const mockLocations = [
      "New York, US",
      "London, UK",
      "Tokyo, JP",
      "Sydney, AU",
      "Berlin, DE",
      "Toronto, CA",
      "Mumbai, IN",
      "São Paulo, BR",
    ]
    return mockLocations[Math.floor(Math.random() * mockLocations.length)]
  }

  return {
    ...state,
    createShortUrls,
    handleRedirect,
    loading,
    error,
  }
}
