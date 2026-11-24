import { z } from 'zod'

/** How a connector's provider JSON numbers are read (`Connector.numbers`). */
export const Numbers = z.enum(['EXACT', 'DOUBLE'])
export type Numbers = z.infer<typeof Numbers>

const WHOLE = /^-?\d+$/

/**
 * JSON with every number a double cannot hold as written kept as its source text: one past 2^53, or
 * with a fraction or an exponent (Node's `context.source`, the singer-sdk's `Decimal` parse). A whole
 * number a double holds stays a number. Throws `SyntaxError` as `JSON.parse` does.
 */
export function parseExact(text: string): unknown {
  return z.unknown().parse(
    JSON.parse(text, (_key, value: unknown, context?: { source?: string }) => {
      if (typeof value !== 'number' || context?.source === undefined) return value
      const exact = WHOLE.test(context.source) && Number.isSafeInteger(value)
      return exact ? value : context.source
    }),
  )
}

/** A provider's JSON answer, read as the connector declares its numbers. */
export function parseJson(text: string, numbers: Numbers): unknown {
  return numbers === 'EXACT' ? parseExact(text) : z.unknown().parse(JSON.parse(text))
}
