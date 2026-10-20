import type { ModelId } from '@conexus/hub-api'

/** Words a person reads in capitals, not in the first letter alone. */
const ACRONYMS: ReadonlySet<string> = new Set(['gpt', 'glm', 'oss'])
const DATE_SUFFIX = /-(\d{4})-?(\d{2})-?(\d{2})$/
const NAME_WORDS = /^[a-z0-9.]+(?:-[a-z0-9.]+)*$/
const VERSION_PART = /^\d{1,2}$/

function wordOf(part: string): string {
  return ACRONYMS.has(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)
}

/**
 * A model as a person reads it, from its id by one rule: drop the provider before the slash, split
 * on `-`, join the numbers that follow one another with dots and write each word with a capital, a
 * few acronyms in full, and a date at the end after it, as the old picker kept it
 * (`claude-opus-4-1-20250805` is "Claude Opus 4.1 (2025-08-05)"), so a dated copy reads apart from
 * the model it copies. An id the rule cannot read as words is shown as it is.
 */
export function modelLabel(model: ModelId): string {
  const bare = model.slice(model.indexOf('/') + 1)
  const date = DATE_SUFFIX.exec(bare)
  const name = date === null ? bare : bare.slice(0, date.index)
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
  if (date !== null) words.push(`(${date.slice(1).join('-')})`)
  return words.join(' ')
}
