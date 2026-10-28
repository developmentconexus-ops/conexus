import { useSyncExternalStore } from 'react'
import { z } from 'zod'
import { pageStorage } from './storage.ts'

/** What the person picked: a theme, or to follow the system (design V9). */
export const ThemeChoice = z.enum(['light', 'dark', 'system'])
export type ThemeChoice = z.infer<typeof ThemeChoice>

/** The three choices' words, in the account menu's order (design V9). */
export const THEME_LABELS: Record<ThemeChoice, string> = {
  light: 'Claro',
  dark: 'Escuro',
  system: 'Como o sistema',
}

const STORAGE_KEY = 'conexus-theme'
const picks = pageStorage('local')

function root(): HTMLElement {
  return document.documentElement
}

/** The pick on <html>, which this page shows; without one, tokens.css follows the system. */
function shown(): ThemeChoice {
  return ThemeChoice.catch('system').parse(root().dataset.theme ?? 'system')
}

function apply(choice: ThemeChoice): void {
  if (choice === 'system') delete root().dataset.theme
  else root().dataset.theme = choice
}

/** Puts the pick this browser keeps on <html> as the page opens. */
export function applyChosenTheme(): void {
  apply(ThemeChoice.catch('system').parse(picks.getItem(STORAGE_KEY)))
}

function subscribe(changed: () => void): () => void {
  const watch = new MutationObserver(changed)
  watch.observe(root(), { attributes: true, attributeFilter: ['data-theme'] })
  return () => watch.disconnect()
}

/**
 * The person's pick, read from <html> so every place that shows it agrees, and the way to change it.
 * A browser that refuses storage keeps the pick for this page only.
 */
export function useTheme(): { choice: ThemeChoice; choose: (next: ThemeChoice) => void } {
  const choice = useSyncExternalStore(subscribe, shown)
  function choose(next: ThemeChoice) {
    apply(next)
    if (next === 'system') picks.removeItem(STORAGE_KEY)
    else picks.setItem(STORAGE_KEY, next)
  }
  return { choice, choose }
}
