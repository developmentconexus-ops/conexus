export function option(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}

/** A card is any `.md` directly in `docs/steps/`: the one owner for the radius, approval and docs checks (delivery L5). */
export const STEP_CARD = /^[^/]+\.md$/

export type Track = 'frontier' | 'pattern' | 'design' | 'assistant'

/**
 * The track a card belongs to (delivery L5): `pattern-` in the file name is the pattern track's, a
 * `Trilho: desenho` line among the first five lines is the design track's, a `Trilho: assistente`
 * line there is the Assistant track's, any other card is the
 * frontier's.
 */
export function trackOf(name: string, text: string): Track {
  if (name.startsWith('pattern-')) return 'pattern'
  const head = text.split('\n').slice(0, 5)
  if (head.includes('Trilho: desenho')) return 'design'
  return head.includes('Trilho: assistente') ? 'assistant' : 'frontier'
}
