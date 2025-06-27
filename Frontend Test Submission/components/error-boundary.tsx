"use client"

import type React from "react"
import { Component, type ReactNode } from "react"
import { Container, Typography, Button, Box, Alert } from "@mui/material"
import { Refresh } from "@mui/icons-material"
import { logError } from "@/utils/logger"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error })
    logError(error, "ErrorBoundary")
    console.error("Error caught by boundary:", error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Box textAlign="center">
            <Typography variant="h4" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              We encountered an unexpected error. Please try refreshing the page.
            </Typography>

            {this.state.error && (
              <Alert severity="error" sx={{ mb: 4, textAlign: "left" }}>
                <Typography variant="body2">{this.state.error.message}</Typography>
              </Alert>
            )}

            <Button variant="contained" startIcon={<Refresh />} onClick={this.handleReload}>
              Reload Page
            </Button>
          </Box>
        </Container>
      )
    }

    return this.props.children
  }
}
