"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import {
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  Box,
  IconButton,
  CircularProgress,
  Chip,
  Paper,
} from "@mui/material"
import { Add, Remove, ContentCopy, Link as LinkIcon } from "@mui/icons-material"
import { useURLShortener } from "@/hooks/use-url-shortener"
import { Log, logUserAction, logValidation, logComponentLifecycle } from "@/utils/logger"
import type { URLFormData, ShortenedURL } from "@/types"

interface URLFormEntry extends URLFormData {
  id: string
  errors: {
    originalUrl?: string
    validityMinutes?: string
    customShortCode?: string
  }
}

export default function URLShortenerForm() {
  const { createShortUrls, loading, error } = useURLShortener()
  const [urlForms, setUrlForms] = useState<URLFormEntry[]>([
    {
      id: crypto.randomUUID(),
      originalUrl: "",
      validityMinutes: 30,
      customShortCode: "",
      errors: {},
    },
  ])
  const [results, setResults] = useState<ShortenedURL[]>([])
  const [successMessage, setSuccessMessage] = useState<string>("")

  useEffect(() => {
    logComponentLifecycle("URLShortenerForm", "mount")
    return () => logComponentLifecycle("URLShortenerForm", "unmount")
  }, [])

  const validateForm = useCallback((form: URLFormEntry): boolean => {
    const errors: URLFormEntry["errors"] = {}
    let isValid = true

    if (!form.originalUrl.trim()) {
      errors.originalUrl = "URL is required"
      isValid = false
      logValidation("originalUrl", false, "empty")
    } else {
      try {
        const url = new URL(form.originalUrl)
        if (!url.protocol.startsWith("http")) {
          errors.originalUrl = "URL must start with http:// or https://"
          isValid = false
          logValidation("originalUrl", false, "invalid protocol")
        } else {
          logValidation("originalUrl", true, form.originalUrl)
        }
      } catch {
        errors.originalUrl = "Please enter a valid URL"
        isValid = false
        logValidation("originalUrl", false, "invalid format")
      }
    }

    if (form.validityMinutes <= 0) {
      errors.validityMinutes = "Validity must be a positive number"
      isValid = false
      logValidation("validityMinutes", false, "non-positive")
    }

    if (form.customShortCode && !/^[a-zA-Z0-9]{3,20}$/.test(form.customShortCode)) {
      errors.customShortCode = "Short code must be 3-20 alphanumeric characters"
      isValid = false
      logValidation("customShortCode", false, "invalid format")
    }

    setUrlForms((prev) => prev.map((f) => (f.id === form.id ? { ...f, errors } : f)))
    return isValid
  }, [])

  const addUrlForm = useCallback(() => {
    if (urlForms.length < 5) {
      const newForm: URLFormEntry = {
        id: crypto.randomUUID(),
        originalUrl: "",
        validityMinutes: 30,
        customShortCode: "",
        errors: {},
      }
      setUrlForms((prev) => [...prev, newForm])
      logUserAction("Add URL form", `Total forms: ${urlForms.length + 1}`)
    }
  }, [urlForms.length])

  const removeUrlForm = useCallback(
    (id: string) => {
      if (urlForms.length > 1) {
        setUrlForms((prev) => prev.filter((form) => form.id !== id))
        logUserAction("Remove URL form", `Remaining forms: ${urlForms.length - 1}`)
      }
    },
    [urlForms.length],
  )

  const updateUrlForm = useCallback((id: string, field: keyof URLFormData, value: string | number) => {
    setUrlForms((prev) =>
      prev.map((form) =>
        form.id === id ? { ...form, [field]: value, errors: { ...form.errors, [field]: undefined } } : form,
      ),
    )
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      logUserAction("Submit URL shortener form", `${urlForms.length} forms`)

      const validForms = urlForms.filter((form) => form.originalUrl.trim())
      if (validForms.length === 0) {
        Log("frontend", "warn", "component", "No valid URLs to shorten")
        return
      }

      const allValid = validForms.every(validateForm)
      if (!allValid) {
        Log("frontend", "warn", "component", "Form validation failed")
        return
      }

      try {
        const urlsData = validForms.map(({ id, errors, ...rest }) => rest)
        const newUrls = await createShortUrls(urlsData)
        setResults(newUrls)
        setSuccessMessage(`Successfully created ${newUrls.length} short URL${newUrls.length > 1 ? "s" : ""}!`)

        setUrlForms([
          {
            id: crypto.randomUUID(),
            originalUrl: "",
            validityMinutes: 30,
            customShortCode: "",
            errors: {},
          },
        ])

        logUserAction("Short URLs created", `${newUrls.length} URLs`)
      } catch (error) {
        Log("frontend", "error", "component", `Failed to create short URLs: ${error}`)
      }
    },
    [urlForms, validateForm, createShortUrls],
  )

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      logUserAction("Copy URL to clipboard", text)
    } catch (error) {
      Log("frontend", "error", "component", "Failed to copy URL to clipboard")
    }
  }, [])

  return (
    <Box sx={{ p: 4 }}>
      <Box textAlign="center" sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          GCET URL Shortener
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Transform long URLs into powerful short links
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Create Short URLs ({urlForms.length}/5)
          </Typography>

          <form onSubmit={handleSubmit}>
            {urlForms.map((form, index) => (
              <Paper key={form.id} sx={{ p: 3, mb: 3, backgroundColor: "grey.50" }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">URL #{index + 1}</Typography>
                  {urlForms.length > 1 && (
                    <IconButton onClick={() => removeUrlForm(form.id)} color="error" size="small">
                      <Remove />
                    </IconButton>
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Original URL"
                      placeholder="https://example.com/very-long-url"
                      value={form.originalUrl}
                      onChange={(e) => updateUrlForm(form.id, "originalUrl", e.target.value)}
                      error={!!form.errors.originalUrl}
                      helperText={form.errors.originalUrl || "Enter the URL you want to shorten"}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Validity (minutes)"
                      type="number"
                      value={form.validityMinutes}
                      onChange={(e) => updateUrlForm(form.id, "validityMinutes", Number.parseInt(e.target.value) || 30)}
                      error={!!form.errors.validityMinutes}
                      helperText={form.errors.validityMinutes || "Default: 30 minutes"}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Custom Short Code (optional)"
                      placeholder="mycode123"
                      value={form.customShortCode}
                      onChange={(e) => updateUrlForm(form.id, "customShortCode", e.target.value)}
                      error={!!form.errors.customShortCode}
                      helperText={form.errors.customShortCode || "3-20 alphanumeric characters"}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}

            <Box display="flex" gap={2} justifyContent="center" mt={3}>
              {urlForms.length < 5 && (
                <Button variant="outlined" startIcon={<Add />} onClick={addUrlForm} disabled={loading}>
                  Add URL ({urlForms.length}/5)
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <LinkIcon />}
              >
                {loading ? "Creating..." : "Shorten URLs"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Your Shortened URLs
            </Typography>
            {results.map((url) => (
              <Card key={url.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="h6" color="primary">
                      {`${window.location.origin}/${url.shortCode}`}
                    </Typography>
                    <IconButton
                      onClick={() => copyToClipboard(`${window.location.origin}/${url.shortCode}`)}
                      size="small"
                    >
                      <ContentCopy />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {url.originalUrl}
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Chip label={`Expires: ${url.expiresAt.toLocaleString()}`} size="small" />
                    <Chip label={`${url.validityMinutes} min`} size="small" />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
