export interface ShortenedURL {
  id: string
  originalUrl: string
  shortCode: string
  createdAt: Date
  expiresAt: Date
  validityMinutes: number
  clickCount: number
  clicks: Array<{
    timestamp: Date
    source: string
    location: string
  }>
}

export interface URLFormData {
  originalUrl: string
  validityMinutes: number
  customShortCode: string
}

export interface URLShortenerState {
  urls: ShortenedURL[]
  loading: boolean
  error: string | null
}

export type URLShortenerAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "ADD_URLS"; payload: ShortenedURL[] }
  | { type: "UPDATE_URL"; payload: ShortenedURL }
  | { type: "LOAD_URLS"; payload: ShortenedURL[] }

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal"
export type LogPackage =
  | "api"
  | "component"
  | "hook"
  | "page"
  | "state"
  | "style"
  | "auth"
  | "config"
  | "middleware"
  | "utils"
