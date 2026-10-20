import { useState } from 'react'
import { pageStorage } from './storage.ts'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'conexus-theme'
const DARK_SYSTEM = '(prefers-color-scheme: dark)'
const picks = pageStorage('local')

function chosen(): Theme | undefined {
  const value = picks.getItem(STORAGE_KEY)
  return value === 'light' || value === 'dark' ? value : undefined
}

function shown(): Theme {
  return chosen() ?? (globalThis.matchMedia?.(DARK_SYSTEM).matches ? 'dark' : 'light')
}

/** Puts the person's pick on <html>; without one, tokens.css follows the system (design V9). */
export function applyChosenTheme(): void {
  const theme = chosen()
  if (theme) document.documentElement.dataset.theme = theme
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState(shown)
  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    picks.setItem(STORAGE_KEY, next)
    setTheme(next)
  }
  return { theme, toggle }
}
