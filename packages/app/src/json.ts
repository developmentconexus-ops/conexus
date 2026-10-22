import { z } from 'zod'
import type { Operations } from './operations.ts'

// Beside the SDK and not in `check/`: the check's program runs it inside the app's own bundle, on
// the app's own Zod, and the platform copies the SDK into the app without `check/`.

/** A part of an operation that JSON cannot carry: where it is and Zod's own words for it. */
export type NotJson = Readonly<{
  operation: string
  side: 'input' | 'output'
  path: string
  message: string
}>

/** A place in Zod's JSON Schema as the app's reader names it: `cliente.endereco`, `itens[].preco`. */
function pathOf(jsonPath: readonly (string | number)[]): string {
  const names: string[] = []
  for (let at = 0; at < jsonPath.length; at += 1) {
    const key = jsonPath[at]
    if (key === 'properties' && at + 1 < jsonPath.length) {
      names.push(String(jsonPath[at + 1]))
      at += 1
    } else if (key === 'items' || key === 'additionalProperties') names.push('[]')
  }
  return names.join('.').replaceAll('.[]', '[]')
}

/**
 * The first part of `schema` that does not travel. What travels is the input side of both schemas
 * (the client sends `z.input` of the input; the Worker encodes the output back to its input side),
 * so both are read with `io: 'input'`; the output is read again with `io: 'output'` for a one-way
 * transform, which `safeEncode` cannot reverse. A codec reverses, so it travels.
 */
function firstOf(schema: z.ZodType, side: NotJson['side']) {
  let found: Readonly<{ path: string; message: string }> | undefined
  function keep(ctx: Readonly<{ path: (string | number)[]; message: string }>) {
    found ??= { path: pathOf(ctx.path), message: ctx.message }
    return 'any' as const
  }
  z.toJSONSchema(schema, { io: 'input', unrepresentable: keep })
  if (side === 'output' && found === undefined) {
    z.toJSONSchema(schema, {
      io: 'output',
      unrepresentable: (ctx) => (ctx.zodSchema._zod.def.type === 'transform' ? keep(ctx) : 'any'),
    })
  }
  return found
}

/**
 * The check's one rule on the operations (card of step 14, U4): each input and output fits in JSON,
 * as `z.toJSONSchema` (zod 4.6.5) judges it. A `z.date()` without a codec, a `bigint` or a `Map`
 * does not; an e-mail, a default or a union does.
 */
export function notJson(operations: Operations): NotJson[] {
  return Object.entries(operations).flatMap(([operation, spec]) =>
    (['input', 'output'] as const).flatMap((side) => {
      const found = firstOf(spec[side], side)
      return found === undefined ? [] : [{ operation, side, ...found }]
    }),
  )
}
