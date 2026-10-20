import { useState } from 'react'

type Theme = 'light' | 'dark'
/** What the person picked: a theme, or to follow the system (design V9). */
export type ThemeChoice = Theme | 'system'

const STORAGE_KEY = 'conexus-theme'
const DARK_SYSTEM = '(prefers-color-scheme: dark)'

function chosen(): ThemeChoice {
  try {
    const value = globalThis.localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    // biome-ignore lint/plugin: storage the browser refuses reads as no pick (C53)
    return 'system'
  }
}

function shown(choice: ThemeChoice): Theme {
  if (choice !== 'system') return choice
  return globalThis.matchMedia?.(DARK_SYSTEM).matches ? 'dark' : 'light'
}

/** Puts the person's pick on <html>; without one, tokens.css follows the system (design V9). */
function apply(choice: ThemeChoice): void {
  if (choice === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = choice
}

export function applyChosenTheme(): void {
  apply(chosen())
}

export function useTheme(): {
  theme: Theme
  choice: ThemeChoice
  choose: (next: ThemeChoice) => void
} {
  const [choice, setChoice] = useState(chosen)
  function choose(next: ThemeChoice) {
    apply(next)
    try {
      if (next === 'system') globalThis.localStorage.removeItem(STORAGE_KEY)
      else globalThis.localStorage.setItem(STORAGE_KEY, next)
      // biome-ignore lint/plugin: a browser that refuses storage keeps the pick for this page only (step 12.2's failure table)
    } catch {
      // The pick still holds for this page when the browser refuses storage.
    }
    setChoice(next)
  }
  return { theme: shown(choice), choice, choose }
}
