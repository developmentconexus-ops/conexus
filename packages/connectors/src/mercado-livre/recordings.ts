// What `scripts/record-connector.ts` saved, read by the double and by its conformance (testing T29):
// the four answers of the real service, every value invented, with the service, the route and the
// date beside the body. Read when asked for, never on import: the double ships with the Hub.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'

const Recording = z.object({
  service: z.string().min(1),
  connector: z.literal('mercado-livre'),
  case: z.string().min(1),
  route: z.object({
    method: z.literal('GET'),
    path: z.string().startsWith('/'),
    query: z.array(z.string()),
  }),
  recordedAt: z.iso.date(),
  status: z.number().int(),
  replaced: z.array(z.string()),
  body: z.record(z.string(), z.unknown()),
})
export type Recording = z.infer<typeof Recording>

export type Case =
  | 'pedidos-alterados'
  | 'anuncios-varredura-1'
  | 'anuncios-varredura-2'
  | 'perguntas-varredura'

const kept = new Map<Case, Recording>()

export function recording(name: Case): Recording {
  const found = kept.get(name)
  if (found !== undefined) return found
  const read = Recording.parse(
    JSON.parse(readFileSync(join(import.meta.dirname, 'recordings', `${name}.json`), 'utf8')),
  )
  kept.set(name, read)
  return read
}

/** The recorded body without the rows: what the service sends around them (filters, sorts, the account). */
export function envelope(name: Case, rows: string): Record<string, unknown> {
  const { [rows]: _rows, ...rest } = recording(name).body
  return rest
}

/** The recorded rows under `key`, as the service sent them. */
export function rowsOf(name: Case, key: string): readonly Record<string, unknown>[] {
  return z.array(z.record(z.string(), z.unknown())).parse(recording(name).body[key])
}
