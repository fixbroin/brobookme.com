"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Button variant="outline" className="h-10 w-10 bg-muted/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200 border border-border/50 shadow-sm rounded-lg text-muted-foreground" size="icon" onClick={toggleTheme}>
      <Sun className="h-5.5 w-5.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5.5 w-5.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
