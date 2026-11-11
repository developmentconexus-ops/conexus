import { z } from 'zod'
import { clientCredentials } from './auth.ts'
import type { CredentialFake } from './conformance.ts'
import { defineConnector } from './definition.ts'
import type { ListRead } from './list.ts'
import { defineOperation, get } from './operation.ts'
import { Rows } from './rows.ts'

export const FIXTURE_ROWS = 137
const FIRST_AT = Date.parse('2026-01-01T00:00:00.000Z')
const MINUTE = 60_000
/** The row each position of the double holds: an id and the instant it changed, with an offset. */
export function rowOf(at: number) {
  return {
    id: `r${at}`,
    changed: new Date(FIRST_AT + at * MINUTE).toISOString().replace('Z', '-03:00'),
  }
}

const Body = z
  .object({
    items: z.array(z.record(z.string(), z.unknown())),
    total: z.int(),
    offset: z.int(),
    limit: z.int(),
  })
  .transform(({ items, total, offset, limit }) =>
    Rows.parse({ linhas: items, temMais: offset + limit < total, total }),
  )
const Asked = z.object({
  offset: z.number().int().min(0),
  limit: z.number().int().min(1).max(50),
  changedFrom: z.string().optional(),
})

export const RIGHT: ListRead = {
  paging: { kind: 'OFFSET', offset: 'offset', limit: 'limit', max: 50, ceiling: null },
  changed: { input: 'changedFrom', field: 'changed' },
}
export const SWAPPED: ListRead = {
  ...RIGHT,
  paging: { kind: 'OFFSET', offset: 'limit', limit: 'offset', max: 50, ceiling: null },
}

/** A connector of one list read over a double of 137 rows in memory, for the conformance of a declaration. */
export function listingConnector(list: ListRead) {
  const things = defineOperation({
    id: 'things',
    class: 'read',
    subject: 'things',
    idempotent: true,
    summary: 'Lista as coisas.',
    label: 'Coisas',
    input: Asked,
    output: Body,
    list,
    probe: (): z.infer<typeof Asked> => ({ offset: 0, limit: 5 }),
    request: (input) =>
      get('/things', { offset: input.offset, limit: input.limit, changed_from: input.changedFrom }),
    answer: (answer) => ({ kind: 'OK', value: Body.parse(answer.body) }),
  })
  return defineConnector({
    id: 'listing',
    name: 'Listing',
    version: '1.0.0',
    origin: 'https://listing.test',
    auth: clientCredentials({
      fields: {
        key: {
          label: 'Key',
          maxLength: 40,
          help: { text: 'A chave.', url: 'https://listing.test/keys' },
          visible: false,
        },
      },
      token: { path: '/token', form: { key: { field: 'key' } }, headers: {} },
      answer: z.object({ access_token: z.string(), expires_in: z.int() }).transform((token) => ({
        accessToken: token.access_token,
        expiresInSeconds: token.expires_in,
      })),
    }),
    account: { kind: 'none' },
    category: 'Teste',
    summary: 'Um conector de teste.',
    logo: '',
    perProject: 'one',
    subjects: { things: 'Coisas' },
    operations: [things],
    callLimit: { countedBy: 'ACCOUNT' },
    check: things,
    skill: { content: 'things Coisas', references: { 'things.md': 'things' } },
  })
}

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } })
}

/** The double: `/token` gives a bearer, `/things` pages the 137 rows by `offset` and `limit`, and with `changed_from` only the rows changed since. */
export const listingFake: CredentialFake = {
  credential: { key: 'invented-key' },
  serve: () => Promise.reject(new Error('the fixture double is never served')),
  handle: async (request) => {
    const url = new URL(request.url)
    if (url.pathname === '/token') return json({ access_token: 'bearer', expires_in: 3600 })
    const offset = Number(url.searchParams.get('offset'))
    const limit = Number(url.searchParams.get('limit'))
    const since = url.searchParams.get('changed_from')
    const all = Array.from({ length: FIXTURE_ROWS }, (_, at) => rowOf(at)).filter(
      (row) => since === null || Date.parse(row.changed) >= Date.parse(since),
    )
    return json({ items: all.slice(offset, offset + limit), total: all.length, offset, limit })
  },
}
