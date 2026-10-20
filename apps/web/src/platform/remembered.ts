import type { PersonId } from '@conexus/hub-api'

// Ids carry no space, so a list is stored as one line of ids separated by spaces.
const SEPARATOR = ' '

function keyOf(list: string, personId: PersonId): string {
  return `conexus-remembered:${personId}:${list}`
}

/**
 * What this browser remembers of `list` for the person, the last one first; the caller keeps only
 * the ids the Hub still lists.
 */
export function recall(list: string, personId: PersonId): string[] {
  try {
    const stored = globalThis.localStorage.getItem(keyOf(list, personId)) ?? ''
    return stored.split(SEPARATOR).filter((id) => id !== '')
  } catch {
    // Storage the browser refuses remembers nothing (C53).
    return []
  }
}

/**
 * Puts `id` first in the person's `list`, keeping `keep` at most. A browser that refuses storage
 * remembers nothing, like a new one (step 12.2's failure table).
 */
export function remember(list: string, personId: PersonId, id: string, keep: number): void {
  const ids = [id, ...recall(list, personId).filter((one) => one !== id)].slice(0, keep)
  try {
    globalThis.localStorage.setItem(keyOf(list, personId), ids.join(SEPARATOR))
    // biome-ignore lint/plugin: a browser that refuses storage remembers nothing (step 12.2's failure table)
  } catch {
    // Nothing is remembered; the next entry opens the first company, as a new browser does.
  }
}
