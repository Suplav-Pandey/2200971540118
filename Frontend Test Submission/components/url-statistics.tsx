"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Box,
  TextField,
  MenuItem,
  Grid,
  Alert,
  Button,
} from "@mui/material"
import { ContentCopy, Launch } from "@mui/icons-material"
import { useURLShortenerContext } from "@/contexts/url-shortener-context"
import { Log, logUserAction, logComponentLifecycle } from "@/utils/logger"
import type { ShortenedURL } from "@/types"

export default function URLStatistics() {
  const { state } = useURLShortenerContext()
  const [sortBy, setSortBy] = useState<"created" | "clicks" | "expires">("created")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired">("all")

  useEffect(() => {
    logComponentLifecycle("URLStatistics", "mount")
    return () => logComponentLifecycle("URLStatistics", "unmount")
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    const totalUrls = state.urls.length
    const activeUrls = state.urls.filter((url) => now <= url.expiresAt).length
    const expiredUrls = totalUrls - activeUrls
    const totalClicks = state.urls.reduce((sum, url) => sum + url.clickCount, 0)

    return { totalUrls, activeUrls, expiredUrls, totalClicks }
  }, [state.urls])

  const filteredAndSortedUrls = useMemo(() => {
    let filtered = state.urls

    if (filterStatus !== "all") {
      const now = new Date()
      filtered = filtered.filter((url) => {
        const isExpired = now > url.expiresAt
        return filterStatus === "expired" ? isExpired : !isExpired
      })
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "created":
          return b.createdAt.getTime() - a.createdAt.getTime()
        case "clicks":
          return b.clickCount - a.clickCount
        case "expires":
          return a.expiresAt.getTime() - b.expiresAt.getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [state.urls, sortBy, filterStatus])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      logUserAction("Copy URL from stats", text)
    } catch (error) {
      Log("frontend", "error", "component", "Failed to copy URL to clipboard from stats")
    }
  }

  const openUrl = (url: string) => {
    window.open(url, "_blank")
    logUserAction("Open original URL", url)
  }

  const getStatusChip = (url: ShortenedURL) => {
    const isExpired = new Date() > url.expiresAt
    return <Chip label={isExpired ? "Expired" : "Active"} color={isExpired ? "error" : "success"} size="small" />
  }

  if (state.urls.length === 0) {
    return (
      <Box sx={{ p: 4 }}>
        <Box textAlign="center" sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            URL Analytics
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Track performance and insights for your shortened URLs
          </Typography>
        </Box>

        <Alert severity="info">
          <Typography variant="h6" gutterBottom>
            No URLs to analyze yet
          </Typography>
          <Typography>Create some shortened URLs first to see detailed analytics here.</Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => {
              logUserAction("Navigate to create URLs from empty stats")
              window.location.href = "/"
            }}
          >
            Create Your First URL
          </Button>
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box textAlign="center" sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          GCET URL Analytics
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Comprehensive insights for your shortened URLs
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total URLs
              </Typography>
              <Typography variant="h4" color="primary.main">
                {stats.totalUrls}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active URLs
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.activeUrls}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Clicks
              </Typography>
              <Typography variant="h4" color="secondary.main">
                {stats.totalClicks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Expired URLs
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.expiredUrls}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Sort by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <MenuItem value="created">Creation Date</MenuItem>
                <MenuItem value="clicks">Click Count</MenuItem>
                <MenuItem value="expires">Expiry Date</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Filter by Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              >
                <MenuItem value="all">All URLs</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="expired">Expired Only</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* URL List */}
      <Grid container spacing={2}>
        {filteredAndSortedUrls.map((url) => (
          <Grid item xs={12} key={url.id}>
            <Card>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" color="primary">
                        /{url.shortCode}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => copyToClipboard(`${window.location.origin}/${url.shortCode}`)}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {url.originalUrl.length > 50 ? `${url.originalUrl.substring(0, 50)}...` : url.originalUrl}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {getStatusChip(url)}
                      <Chip label={`${url.clickCount} clicks`} size="small" variant="outlined" />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2">Created: {url.createdAt.toLocaleDateString()}</Typography>
                    <Typography variant="body2">Expires: {url.expiresAt.toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <IconButton size="small" onClick={() => openUrl(url.originalUrl)}>
                      <Launch />
                    </IconButton>
                  </Grid>
                </Grid>

                {url.clicks.length > 0 && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Recent Clicks:
                    </Typography>
                    {url.clicks.slice(-3).map((click, index) => (
                      <Typography key={index} variant="body2" color="text.secondary">
                        {click.timestamp.toLocaleString()} - {click.location}
                      </Typography>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
