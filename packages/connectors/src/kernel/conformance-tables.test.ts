import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { sankhya } from '../sankhya/definition.ts'
import { sankhyaFake } from '../sankhya/fake.ts'
import { clientCredentials } from './auth.ts'
import type { CredentialFake } from './conformance-session.ts'
import { assertListsWalk, assertTreatedColumns } from './conformance-tables.ts'
import { defineConnector } from './definition.ts'
import type { ListRead } from './operation.ts'
import { defineOperation, get } from './operation.ts'
import { Rows } from './rows.ts'
import type { TreatedColumn } from './tables-treated.ts'

const FIXTURE_ROWS = 137
const FIRST_AT = Date.parse('2026-01-01T00:00:00.000Z')
const MINUTE = 60_000
/** The row each position of the double holds: an id and the instant it changed, with an offset. */
function rowOf(at: number) {
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

const RIGHT: ListRead = {
  paging: { kind: 'OFFSET', offset: 'offset', limit: 'limit', max: 50, ceiling: null },
  changed: { input: 'changedFrom', field: 'changed' },
}
const SWAPPED: ListRead = {
  ...RIGHT,
  paging: { kind: 'OFFSET', offset: 'limit', limit: 'offset', max: 50, ceiling: null },
}

/** A connector of one list read over a double of 137 rows in memory, for the conformance of a declaration. */
function listingConnector(list: ListRead) {
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
      credentialClass: 'SHAREABLE',
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
    numbers: 'DOUBLE',
    skill: { written: { content: '---\nname: listing\n---\nthings', references: {} } },
  })
}

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } })
}

/** How a double misbehaves while still answering in the shape the schema reads: it ignores `offset`, reports a total with a row missing, or answers an empty page after the first while saying more follows. */
type Plant = 'IGNORES_OFFSET' | 'DROPS_LAST' | 'EMPTY_AFTER_FIRST' | null

/** The double: `/token` gives a bearer, `/things` pages the 137 rows by `offset` and `limit`, and with `changed_from` only the rows changed since. */
function listingFake(plant: Plant = null): CredentialFake {
  return {
    credential: { key: 'invented-key' },
    serve: () => Promise.reject(new Error('the fixture double is never served')),
    handle: async (request) => {
      const url = new URL(request.url)
      if (url.pathname === '/token') return json({ access_token: 'bearer', expires_in: 3600 })
      const offset = plant === 'IGNORES_OFFSET' ? 0 : Number(url.searchParams.get('offset'))
      const limit = Number(url.searchParams.get('limit'))
      const since = url.searchParams.get('changed_from')
      const all = Array.from({ length: FIXTURE_ROWS }, (_, at) => rowOf(at)).filter(
        (row) => since === null || Date.parse(row.changed) >= Date.parse(since),
      )
      const held = plant === 'DROPS_LAST' ? all.slice(0, -1) : all
      const empty = plant === 'EMPTY_AFTER_FIRST' && offset > 0
      return json({
        items: empty ? [] : held.slice(offset, offset + limit),
        total: all.length,
        offset: Number(url.searchParams.get('offset')),
        limit,
      })
    },
  }
}

test('a conformidade anda pelo readTablePage todas as páginas do dublê de uma leitura de lista', async () => {
  await assertListsWalk(listingConnector(RIGHT), listingFake())
  await assert.rejects(
    assertListsWalk(listingConnector(SWAPPED), listingFake()),
    z.ZodError,
    'o tamanho e o deslocamento trocados: o esquema da leitura recusa o tamanho 0',
  )
  await assert.rejects(
    assertListsWalk(listingConnector(RIGHT), listingFake('IGNORES_OFFSET')),
    /repeats a row/,
    'um dublê que ignora o deslocamento repete as linhas da primeira página',
  )
  await assert.rejects(
    assertListsWalk(listingConnector(RIGHT), listingFake('DROPS_LAST')),
    /lacks rows/,
    'um total que não bate com as linhas entregues',
  )
  const requested: string[] = []
  const counting = listingFake('EMPTY_AFTER_FIRST')
  const handle = counting.handle
  await assert.rejects(
    assertListsWalk(listingConnector(RIGHT), {
      ...counting,
      handle: (request) => {
        requested.push(new URL(request.url).search)
        return handle(request)
      },
    }),
    /lacks rows/,
    'uma página vazia que diz ter mais termina a caminhada, sem erro e sem repetir a posição',
  )
  const things = requested.filter((search) => search.includes('limit=50'))
  assert.equal(new Set(things).size, things.length, 'nenhuma leitura repetida')
  assert.equal(
    things.filter((search) => search.includes('offset=50')).length,
    1,
    'a página vazia é lida uma vez e a caminhada para',
  )
  await assert.rejects(
    assertListsWalk(
      listingConnector({ ...RIGHT, changed: { input: 'changedFrom', field: 'ausente' } }),
      listingFake(),
    ),
    /carry/,
    'o campo de alteração que as linhas não trazem',
  )
})

function sankhyaTreating(table: string, columns: readonly TreatedColumn[]) {
  const tables = sankhya.tables ?? assert.fail()
  const declared = tables.declared.map((each) =>
    each.name === table ? { ...each, treated: { description: 'Um molde.', columns } } : each,
  )
  return defineConnector({ ...sankhya, tables: { ...tables, declared } })
}

test('a conformidade recusa o molde que lê uma coluna que a gravação não tem, e o nome repetido ou fora do formato', async () => {
  const nota: TreatedColumn = { column: 'nunota', as: 'nunota', cast: 'KEEP' }
  function checked(columns: readonly TreatedColumn[], table = 'notas') {
    return assertTreatedColumns(sankhyaTreating(table, columns), sankhyaFake())
  }
  await checked([nota])
  await assert.rejects(
    checked([nota, { column: 'statusnfe', as: 'statusnfe', cast: 'KEEP' }]),
    /notas treats statusnfe, no column of its source/,
  )
  await assert.rejects(checked([{ ...nota, column: 'NUNOTA' }]), /NUNOTA, no column of its source/)
  await assert.rejects(checked([nota], 'financeiro'), /financeiro treats nunota, no column/)
  await assert.rejects(
    checked([nota, { column: 'codemp', as: 'nunota', cast: 'KEEP' }]),
    /two columns as nunota/,
  )
  for (const as of ['Nota', '1nota', 'nota"', ''])
    await assert.rejects(checked([{ ...nota, as }]), /no name of a column/, as)
})
