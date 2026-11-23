import type { CopyMode } from '@conexus/hub-api'
import type { CopyDefinition } from '../connectors/public.ts'

/**
 * How a pass reads the source, the one classification of a definition. Without `changedSince` every
 * pass reads the whole source and deletes what did not come back, with a `window` or without; with it,
 * a pass rereads the changed rows, within the window's days when there is one (version 1 alone has a window).
 */
export function copyModeOf(definition: CopyDefinition): CopyMode {
  if (definition.changedSince === null) return { kind: 'WHOLE' }
  const window = definition.version === 1 ? definition.window : undefined
  return window === undefined ? { kind: 'CHANGES' } : { kind: 'WINDOW', days: window.days }
}
