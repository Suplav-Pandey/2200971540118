import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import { URLShortenerProvider } from "@/contexts/url-shortener-context"
import { LoggingProvider } from "@/contexts/logging-context"
import theme from "@/lib/theme"
import Navigation from "@/components/navigation"
import ErrorBoundary from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GCET - URL Shortener",
  description: "Transform long URLs into powerful short links with advanced analytics and management features",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ErrorBoundary>
            <LoggingProvider>
              <URLShortenerProvider>
                <Navigation />
                <main>{children}</main>
              </URLShortenerProvider>
            </LoggingProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'