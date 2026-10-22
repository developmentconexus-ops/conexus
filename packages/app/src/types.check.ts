import { z } from 'zod'
import { defineHandlers, defineOperations } from './index.ts'

const operations = defineOperations({
  escrever: { input: z.object({ texto: z.string() }), output: z.object({ id: z.int() }) },
})

// Never run: `npm run typecheck` fails if a handler's types stop following its operation's Zod.
export const handlers = defineHandlers(operations, {
  // @ts-expect-error: the input is `{ texto: string }`, not `{ nome: string }`.
  escrever: ({ nome }: { nome: string }) => ({ id: nome.length }),
})

export const returning = defineHandlers(operations, {
  // @ts-expect-error: the output is `{ id: number }`, not `{ codigo: number }`.
  escrever: () => ({ codigo: 1 }),
})

export const missing = defineHandlers(
  operations,
  // @ts-expect-error: every declared operation needs its handler.
  {},
)
