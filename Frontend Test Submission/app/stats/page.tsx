"use client"

import { Container } from "@mui/material"
import URLStatistics from "@/components/url-statistics"
import { useLogging } from "@/hooks/use-logging"
import { useEffect } from "react"

export default function StatsPage() {
  const { log } = useLogging()

  useEffect(() => {
    log("frontend", "info", "page", "Statistics page mounted")
    return () => {
      log("frontend", "info", "page", "Statistics page unmounted")
    }
  }, [log])

  return (
    <Container maxWidth="lg">
      <URLStatistics />
    </Container>
  )
}
