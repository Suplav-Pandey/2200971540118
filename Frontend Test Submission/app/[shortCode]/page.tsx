"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  Container,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Card,
  CardContent,
  Button,
  Fade,
  LinearProgress,
} from "@mui/material"
import { Link as LinkIcon, Error, Home, Analytics } from "@mui/icons-material"
import Link from "next/link"
import { useURLShortener } from "@/hooks/use-url-shortener"
import { Log, logUserAction, logError, logComponentLifecycle } from "@/utils/logger"

export default function RedirectPage() {
  const params = useParams()
  const { handleRedirect } = useURLShortener()
  const shortCode = params.shortCode as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    logComponentLifecycle("RedirectPage", "mount")
    return () => logComponentLifecycle("RedirectPage", "unmount")
  }, [])

  useEffect(() => {
    if (shortCode) {
      Log("frontend", "info", "page", `Redirect page accessed for shortCode: ${shortCode}`)
      logUserAction("Access short URL", shortCode)

      const performRedirect = async () => {
        try {
          setLoading(true)
          const result = await handleRedirect(shortCode)

          if (result.success && result.url) {
            setRedirectUrl(result.url)
            Log("frontend", "info", "page", `Successful redirect setup for ${shortCode} -> ${result.url}`)

            // Start countdown
            const timer = setInterval(() => {
              setCountdown((prev) => {
                if (prev <= 1) {
                  clearInterval(timer)
                  window.location.href = result.url
                  return 0
                }
                return prev - 1
              })
            }, 1000)

            return () => clearInterval(timer)
          } else {
            setError(result.error || "Unknown error occurred")
            logError(result.error || "Unknown redirect error", "RedirectPage")
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Failed to process redirect"
          setError(errorMessage)
          logError(errorMessage, "RedirectPage")
        } finally {
          setLoading(false)
        }
      }

      performRedirect()
    }
  }, [shortCode, handleRedirect])

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Fade in={loading}>
          <Card sx={{ textAlign: "center", p: 4 }}>
            <CardContent>
              <CircularProgress size={48} sx={{ mb: 3 }} />
              <Typography variant="h5" gutterBottom>
                Processing your request...
              </Typography>
              <Typography color="text.secondary">
                Validating short URL: <strong>/{shortCode}</strong>
              </Typography>
              <LinearProgress sx={{ mt: 3, borderRadius: 1 }} />
            </CardContent>
          </Card>
        </Fade>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Fade in={!loading}>
          <Card>
            <CardContent sx={{ textAlign: "center", p: 4 }}>
              <Error sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Link Not Found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                The shortened URL you're looking for doesn't exist or has expired.
              </Typography>

              <Alert severity="error" sx={{ mb: 4, textAlign: "left" }}>
                <Typography variant="body2">
                  <strong>Short Code:</strong> /{shortCode}
                </Typography>
                <Typography variant="body2">
                  <strong>Error:</strong> {error}
                </Typography>
              </Alert>

              <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<Home />}
                  component={Link}
                  href="/"
                  onClick={() => logUserAction("Navigate to home from error page")}
                >
                  Create New Link
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Analytics />}
                  component={Link}
                  href="/stats"
                  onClick={() => logUserAction("Navigate to stats from error page")}
                >
                  View Statistics
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    )
  }

  if (redirectUrl) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Fade in={!loading}>
          <Card>
            <CardContent sx={{ textAlign: "center", p: 4 }}>
              <LinkIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Redirecting...
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                You will be redirected to your destination in <strong>{countdown}</strong> seconds
              </Typography>

              <Alert severity="success" sx={{ mb: 4, textAlign: "left" }}>
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                  <strong>Destination:</strong> {redirectUrl}
                </Typography>
              </Alert>

              <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                <Button
                  variant="contained"
                  onClick={() => {
                    logUserAction("Manual redirect click")
                    window.location.href = redirectUrl
                  }}
                >
                  Go Now
                </Button>
                <Button variant="outlined" component={Link} href="/" onClick={() => logUserAction("Cancel redirect")}>
                  Cancel
                </Button>
              </Box>

              <LinearProgress variant="determinate" value={(3 - countdown) * 33.33} sx={{ mt: 3, borderRadius: 1 }} />
            </CardContent>
          </Card>
        </Fade>
      </Container>
    )
  }

  return null
}
