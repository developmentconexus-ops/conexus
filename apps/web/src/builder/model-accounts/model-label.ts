import type { ModelId } from '@conexus/hub-api'

/** Words a person reads in capitals, not in the first letter alone. */
const ACRONYMS: ReadonlySet<string> = new Set(['gpt', 'glm', 'oss'])
const DATE_SUFFIX = /-(?:\d{8}|\d{4}-\d{2}-\d{2})$/
const NAME_WORDS = /^[a-z0-9.]+(?:-[a-z0-9.]+)*$/
const VERSION_PART = /^\d{1,2}$/

function wordOf(part: string): string {
  return ACRONYMS.has(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)
}

/**
 * A model as a person reads it, from its id by one rule: drop the provider before the slash and a
 * date at the end, split on `-`, join the numbers that follow one another with dots and write each
 * word with a capital, a few acronyms in full (`claude-opus-4-1-20250805` is "Claude Opus 4.1").
 * An id the rule cannot read as words is shown as it is.
 */
export function modelLabel(model: ModelId): string {
  const name = model.slice(model.indexOf('/') + 1).replace(DATE_SUFFIX, '')
  if (!NAME_WORDS.test(name)) return model
  const words: string[] = []
  let version: string | null = null
  for (const part of name.split('-')) {
    if (VERSION_PART.test(part)) {
      version = version === null ? part : `${version}.${part}`
      continue
    }
    if (version !== null) words.push(version)
    version = null
    words.push(wordOf(part))
  }
  if (version !== null) words.push(version)
  return words.join(' ')
}
