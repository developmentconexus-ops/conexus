// The first step of `scripts/record-connector.ts`: one declared read, built and sent as the Hub
// sends it (`requestOf`, then `toRequest`, as `sentFor` does in the executor) and its bytes read by
// the Hub's own `bodyOf`, kept before `operation.answer` reads them, as Nango's interceptor keeps
// `response.data` (dryrun.service.ts:468-475). The credential is a parameter and never leaves it.
import { isAbsolute, relative, resolve } from 'node:path'
import type { Connector } from '@conexus/connectors'
import { AccountRef, requestOf, toRequest } from '@conexus/connectors'
import { z } from 'zod'
import { bodyOf } from '../apps/server/src/hub/connectors/wire.ts'

/** The reads the card names: orders by changed date, the listing scan's two pages and the questions scan. */
export const CASES = [
  'pedidos-alterados',
  'anuncios-varredura-1',
  'anuncios-varredura-2',
  'perguntas-varredura',
] as const
export type Case = (typeof CASES)[number]

/** What the raw file in the private folder keeps: the route as sent (no credential), the status and the body as the service sent it. */
export const Raw = z.object({
  case: z.enum(CASES),
  connector: z.string(),
  method: z.string(),
  path: z.string(),
  query: z.record(z.string(), z.string()),
  status: z.number().int(),
  body: z.unknown(),
  recordedAt: z.iso.date(),
})
export type Raw = z.infer<typeof Raw>

const PAGE_1 = 'anuncios-varredura-1'

/** The operation of a case and its input; the second listing page carries the first page's `scroll_id`. */
export function inputOf(
  name: Case,
  now: Date,
  first: unknown,
): { operation: string; input: unknown } {
  if (name === 'pedidos-alterados') {
    const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return {
      operation: 'pedidos',
      input: { changedFrom: week.toISOString(), offset: 0, limit: 50 },
    }
  }
  if (name === PAGE_1) return { operation: 'anuncios', input: { scan: true, limit: 100 } }
  if (name === 'perguntas-varredura')
    return { operation: 'perguntas', input: { scan: true, limit: 50 } }
  const scroll = z.object({ scroll_id: z.string().min(1) }).safeParse(first)
  if (!scroll.success)
    throw new Error('The first page carries no scroll_id; the second page cannot be asked.')
  return { operation: 'anuncios', input: { scrollId: scroll.data.scroll_id, limit: 100 } }
}

/** A folder outside the repository: a raw body inside it could be committed. */
export function assertOutside(out: string, root: string): string {
  const path = resolve(out)
  const inside = relative(root, path)
  if (!inside.startsWith('..') && !isAbsolute(inside))
    throw new Error('--out must be a folder outside the repository.')
  return path
}

/**
 * Sends one case and returns what arrived. A refusal or an unreadable body is thrown by status
 * only, nothing is returned, and the credential and the account are never in the message.
 */
export async function recorded(
  a: Readonly<{
    fetch: typeof fetch
    connector: Connector
    name: Case
    account: string
    token: string
    now: Date
    first: unknown
  }>,
): Promise<Raw> {
  const { operation: id, input } = inputOf(a.name, a.now, a.first)
  const operation = a.connector.operations.find((candidate) => candidate.id === id)
  if (operation === undefined) throw new Error(`${a.connector.id} declares no ${id}`)
  const request = requestOf(operation, input, { ref: AccountRef.parse(a.account) }, a.now)
  const response = await a.fetch(toRequest(a.connector, request, a.token), {
    signal: AbortSignal.timeout(60_000),
  })
  const bytes = await bodyOf(response)
  if (bytes === null || !response.ok)
    throw new Error(`The service answered ${response.status}; nothing is saved.`)
  const text = Buffer.from(bytes).toString('utf8')
  if (text.includes(a.token)) throw new Error('The body carries the credential; nothing is saved.')
  return {
    case: a.name,
    connector: a.connector.id,
    method: request.method,
    path: request.path,
    query: request.query,
    status: response.status,
    body: z.unknown().parse(JSON.parse(text)),
    recordedAt: a.now.toISOString().slice(0, 10),
  }
}
