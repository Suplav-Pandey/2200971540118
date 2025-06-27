"use client"

import type React from "react"
import { createContext, useContext, useReducer, type ReactNode, useEffect } from "react"
import type { URLShortenerState, URLShortenerAction } from "@/types"
import { Log } from "@/utils/logger"

const initialState: URLShortenerState = {
  urls: [],
  loading: false,
  error: null,
}

function urlShortenerReducer(state: URLShortenerState, action: URLShortenerAction): URLShortenerState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false }
    case "ADD_URLS":
      return { ...state, urls: [...state.urls, ...action.payload], loading: false, error: null }
    case "UPDATE_URL":
      return {
        ...state,
        urls: state.urls.map((url) => (url.id === action.payload.id ? action.payload : url)),
      }
    case "LOAD_URLS":
      return { ...state, urls: action.payload }
    default:
      return state
  }
}

interface URLShortenerContextType {
  state: URLShortenerState
  dispatch: React.Dispatch<URLShortenerAction>
}

const URLShortenerContext = createContext<URLShortenerContextType | undefined>(undefined)

export function URLShortenerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(urlShortenerReducer, initialState)

  useEffect(() => {
    // Load URLs from localStorage on mount
    try {
      if (typeof window !== "undefined") {
        const savedUrls = localStorage.getItem("shortenedUrls")
        if (savedUrls) {
          const urls = JSON.parse(savedUrls).map((url: any) => ({
            ...url,
            createdAt: new Date(url.createdAt),
            expiresAt: new Date(url.expiresAt),
            clicks: url.clicks.map((click: any) => ({
              ...click,
              timestamp: new Date(click.timestamp),
            })),
          }))
          dispatch({ type: "LOAD_URLS", payload: urls })
          Log("frontend", "info", "state", `Loaded ${urls.length} URLs from localStorage`)
        }
      }
    } catch (error) {
      Log("frontend", "error", "state", "Failed to load URLs from localStorage")
    }
  }, [])

  useEffect(() => {
    // Save URLs to localStorage whenever state changes
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("shortenedUrls", JSON.stringify(state.urls))
        Log("frontend", "debug", "state", "URLs saved to localStorage")
      }
    } catch (error) {
      Log("frontend", "error", "state", "Failed to save URLs to localStorage")
    }
  }, [state.urls])

  return <URLShortenerContext.Provider value={{ state, dispatch }}>{children}</URLShortenerContext.Provider>
}

export function useURLShortenerContext() {
  const context = useContext(URLShortenerContext)
  if (context === undefined) {
    throw new Error("useURLShortenerContext must be used within a URLShortenerProvider")
  }
  return context
}
