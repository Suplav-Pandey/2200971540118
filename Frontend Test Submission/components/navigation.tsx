"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AppBar, Toolbar, Typography, Button, Box, Avatar } from "@mui/material"
import { Link as LinkIcon, Analytics } from "@mui/icons-material"
import { logNavigation, logUserAction, logComponentLifecycle } from "@/utils/logger"

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    logComponentLifecycle("Navigation", "mount")
    return () => logComponentLifecycle("Navigation", "unmount")
  }, [])

  const handleNavigation = (path: string, label: string) => {
    if (pathname !== path) {
      logNavigation(pathname, path)
      logUserAction(`Navigate to ${label}`)
      router.push(path)
    }
  }

  const navigationItems = [
    { path: "/", label: "Shorten URLs", icon: <LinkIcon /> },
    { path: "/stats", label: "Analytics", icon: <Analytics /> },
  ]

  const isActive = (path: string) => pathname === path

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 40,
              height: 40,
              mr: 2,
              fontWeight: 700,
              fontSize: "1rem",
            }}
          >
            G
          </Avatar>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
            GCET
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              startIcon={item.icon}
              onClick={() => handleNavigation(item.path, item.label)}
              sx={{
                color: isActive(item.path) ? "primary.main" : "inherit",
                fontWeight: isActive(item.path) ? 600 : 500,
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
