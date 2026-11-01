import { z } from 'zod'

/** A number as the answer wrote it: its value at the places shown, its scale (mil, milhão) and whether it is a percentage. */
type Shown = { text: string; value: number; places: number; scale: number; percent: boolean }

export type NumbersVerdict =
  | { ok: true }
  | { ok: false; number: string; why: 'NOT_IN_READS' | 'NOT_TRUE' }

const MONTHS =
  'janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro'
/** Dates and hours, which are no figure of the company: taken out before the numbers are read. */
const NOT_FIGURES = [
  /\b\d{4}-\d{2}-\d{2}\b/g,
  /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g,
  new RegExp(`\\b(?:${MONTHS})(?:\\s+de)?\\s+\\d{4}\\b`, 'gi'),
  /\bdia\s+\d{1,2}\b/gi,
  /\b\d{1,2}(?::\d{2})+\b/g,
  /\b\d{1,2}h(?:\d{2})?\b/gi,
]
const SCALES: Record<string, number> = {
  mil: 1e3,
  milhão: 1e6,
  milhões: 1e6,
  bilhão: 1e9,
  bilhões: 1e9,
}
const NUMBER =
  /(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?)(?:\s*(mil|milhão|milhões|bilhão|bilhões)\b)?(\s*%)?/gi

function parsed(digits: string): { value: number; places: number } {
  if (digits.includes(',')) {
    const [whole = '', fraction = ''] = digits.replaceAll('.', '').split(',')
    return { value: Number(`${whole}.${fraction}`), places: fraction.length }
  }
  if (/^\d{1,3}(?:\.\d{3})+$/.test(digits)) {
    return { value: Number(digits.replaceAll('.', '')), places: 0 }
  }
  return { value: Number(digits), places: digits.split('.')[1]?.length ?? 0 }
}

/** The numbers of a text, in the Brazilian way ("8.072,70") and the plain one ("8072.7"), without its dates and hours. */
function shownIn(text: string): Shown[] {
  const figures = NOT_FIGURES.reduce((left, pattern) => left.replace(pattern, ' '), text)
  return [...figures.matchAll(NUMBER)].map((match) => {
    const [whole, digits = '', scale, percent] = match
    return {
      text: whole.trim(),
      ...parsed(digits),
      scale: scale === undefined ? 1 : (SCALES[scale.toLowerCase()] ?? 1),
      percent: percent !== undefined,
    }
  })
}

function rounded(value: number, places: number): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

function same(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-9
}

/**
 * Whether a number of `pool`, rounded to the places the answer shows, gives the shown one; a
 * percentage may also be the ratio of two numbers of the pool.
 */
function foundIn(shown: Shown, pool: readonly number[]): boolean {
  const direct = pool.some((each) => same(rounded(each / shown.scale, shown.places), shown.value))
  if (direct || !shown.percent) return direct
  return pool.some((a) =>
    pool.some((b) => b !== 0 && same(rounded((100 * a) / b, shown.places), shown.value)),
  )
}

/** Every number a value holds, as numbers or as numeric text. */
function numbersOf(value: unknown): number[] {
  if (typeof value === 'number') return [value]
  if (typeof value === 'string') return shownIn(value).map((each) => each.value * each.scale)
  if (Array.isArray(value)) return value.flatMap(numbersOf)
  if (value !== null && typeof value === 'object') return Object.values(value).flatMap(numbersOf)
  return []
}

const Invocation = z.object({
  type: z.literal('tool-invocation'),
  toolInvocation: z.object({ state: z.literal('result'), result: z.unknown() }),
})
const Text = z.object({ type: z.literal('text'), text: z.string() })

/**
 * The check of an answer's numbers (step 24.1, criterion 11a), over the parts Mastra stored for the
 * turn: each number of the final answer, apart from its dates, its hours and the numbers of the
 * question, must be in the outputs of the turn's tools and in the truth the test computed from the
 * double's data; the first that is not is said. A test tool, called as `checks.calledTool` is.
 */
export function numbersFromReads(turn: {
  question: string
  parts: readonly unknown[]
  truth: readonly number[]
}): NumbersVerdict {
  const reads = turn.parts.flatMap((part) => {
    const invocation = Invocation.safeParse(part)
    return invocation.success ? numbersOf(invocation.data.toolInvocation.result) : []
  })
  const lastTool = turn.parts.findLastIndex((part) => Invocation.safeParse(part).success)
  const answer = turn.parts
    .slice(lastTool + 1)
    .flatMap((part) => {
      const text = Text.safeParse(part)
      return text.success ? [text.data.text] : []
    })
    .join('\n')
  const asked = shownIn(turn.question).map((each) => each.value * each.scale)
  for (const shown of shownIn(answer)) {
    if (asked.some((each) => same(each, shown.value * shown.scale))) continue
    if (!foundIn(shown, reads)) return { ok: false, number: shown.text, why: 'NOT_IN_READS' }
    if (!foundIn(shown, turn.truth)) return { ok: false, number: shown.text, why: 'NOT_TRUE' }
  }
  return { ok: true }
}
