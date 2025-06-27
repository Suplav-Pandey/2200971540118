"use client"

import { Container } from "@mui/material"
import URLShortenerForm from "@/components/url-shortener-form"
import { useLogging } from "@/hooks/use-logging"
import { useEffect } from "react"

export default function HomePage() {
  const { log } = useLogging()

  useEffect(() => {
    log("frontend", "info", "page", "URLShortener page mounted")
    return () => {
      log("frontend", "info", "page", "URLShortener page unmounted")
    }
  }, [log])

  return (
    <Container maxWidth="lg">
      <URLShortenerForm />
    </Container>
  )
}
