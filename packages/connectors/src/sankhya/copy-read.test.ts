import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { readToken, tokenRequest } from '../kernel/auth.ts'
import { SENT_AT } from '../kernel/conformance-declared.ts'
import type { CopyDefinition, CopyPage, PageInput } from '../kernel/copy.ts'
import { PAGE_ROWS } from '../kernel/copy.ts'
import type { Answered } from '../kernel/operation.ts'
import { requestOf } from '../kernel/operation.ts'
import { toRequest } from '../kernel/request.ts'
import { sankhyaCopyModels } from './copies.ts'
import { lerPagina, pageStatement } from './copy-read.ts'
import { sankhya } from './definition.ts'
import { sankhyaFake } from './fake.ts'
import { changedOn, PADARIA_SOL_MATRIZ } from './fake-sales.ts'
import { isOneReadStatement } from './read-only-sql.ts'
import { INVENTED_CELLS } from './refusals.ts'

type Read = (input: Omit<PageInput, 'limit'> & { limit?: number }) => Promise<Answered<CopyPage>>

/** The double without a socket, signed in once: `read` sends one page and gives what the kit reads of the answer. */
async function withDouble(
  use: (read: Read, fake: ReturnType<typeof sankhyaFake>) => Promise<void>,
) {
  const fake = sankhyaFake()
  const login = await fake.handle(
    toRequest(sankhya, tokenRequest(sankhya.auth, fake.credential), null),
  )
  const token = readToken(sankhya.auth, { status: login.status, body: await login.json() })
  assert.equal(token.kind, 'OK')
  if (token.kind !== 'OK') return
  await use(async (input) => {
    const request = requestOf(lerPagina, { limit: PAGE_ROWS, ...input }, { ref: null }, SENT_AT)
    const response = await fake.handle(toRequest(sankhya, request, token.accessToken))
    return lerPagina.answer({
      status: response.status,
      body: z.unknown().parse(await response.json()),
    })
  }, fake)
}

function pageOf(answered: Answered<CopyPage>): CopyPage {
  assert.equal(answered.kind, 'OK', JSON.stringify(answered))
  if (answered.kind !== 'OK') throw new Error('not OK')
  return answered.value
}

function model(id: string): CopyDefinition {
  const found = sankhyaCopyModels.find((each) => each.id === id)
  assert.ok(found)
  return found.definition
}

const FIRST = { since: '1900-01-01', windowFrom: null, after: null } as const

test('páginas pela chave', async () => {
  await withDouble(async (read) => {
    const itens = model('itens_venda')
    const all = PADARIA_SOL_MATRIZ.notas.flatMap((nota) =>
      nota.itens.map((_, at) => [nota.nunota, at + 1]),
    )
    const whole = pageOf(await read({ ...FIRST, definition: itens }))
    assert.equal(whole.more, false)
    assert.equal(whole.rows.length, all.length, 'até 500 numa página só')
    const seen: number[][] = []
    let after: number[] | null = null
    let pages = 0
    for (;;) {
      const page = pageOf(await read({ ...FIRST, definition: itens, after, limit: 100 }))
      pages += 1
      seen.push(...page.rows.map((row) => [Number(row[0]), Number(row[1])]))
      const last = page.rows.at(-1)
      after = last ? [Number(last[0]), Number(last[1])] : null
      assert.equal(page.more, page.rows.length === 100 && seen.length < all.length)
      if (!page.more) break
    }
    assert.equal(pages, Math.ceil(all.length / 100))
    const sorted = [...all].sort((a, b) => (a[0] ?? 0) - (b[0] ?? 0) || (a[1] ?? 0) - (b[1] ?? 0))
    assert.deepEqual(seen, sorted, 'cada linha uma vez, na ordem da chave composta')
    assert.equal(
      lerPagina.input.safeParse({ ...FIRST, definition: itens, limit: PAGE_ROWS + 1 }).success,
      false,
      'nunca mais de 500 por página',
    )
  })
})

function nunotas(page: CopyPage) {
  return page.rows.map((row) => Number(row[0]))
}

/** The three forms of the date filter. */
async function dateFilters(read: Read) {
  const vendas = model('vendas')
  const notas = PADARIA_SOL_MATRIZ.notas
  const since = '2026-10-15'
  const windowFrom = '2026-10-01'
  const both = { definition: vendas, after: null, since, windowFrom }
  assert.deepEqual(
    nunotas(pageOf(await read(both))),
    notas.filter((n) => changedOn(n.dtneg) >= since || n.dtneg >= windowFrom).map((n) => n.nunota),
    'com alteração e janela: (alteração >= since) OR (janela >= windowFrom)',
  )
  const sql = pageStatement({ ...both, limit: PAGE_ROWS })
  assert.match(
    sql,
    /\(Q\.DTALTER >= TO_DATE\('2026-10-15', 'YYYY-MM-DD'\) OR Q\.DTNEG >= TO_DATE\('2026-10-01', 'YYYY-MM-DD'\)\)/,
  )
  assert.ok(isOneReadStatement(sql))
  const { window: _window, ...changedOnly } = vendas
  assert.deepEqual(
    nunotas(pageOf(await read({ ...both, definition: changedOnly }))),
    notas.filter((n) => changedOn(n.dtneg) >= since).map((n) => n.nunota),
    'só com alteração: a primeira metade',
  )
  assert.ok(nunotas(pageOf(await read({ ...both, definition: changedOnly }))).length > 0)
  assert.deepEqual(
    nunotas(pageOf(await read({ ...both, definition: { ...vendas, changedSince: null } }))),
    notas.map((n) => n.nunota),
    'sem alteração: a fonte inteira',
  )
  assert.doesNotMatch(
    pageStatement({ ...both, definition: { ...vendas, changedSince: null }, limit: 1 }),
    /TO_DATE/,
  )
}

/** Each cell as its type's canonical text, from the double. */
async function cellsOf(read: Read) {
  const vendas = model('vendas')
  const notas = PADARIA_SOL_MATRIZ.notas
  const first = pageOf(await read({ ...FIRST, definition: vendas })).rows[0]
  const nota = notas[0]
  assert.ok(first && nota)
  function at(name: string) {
    return first?.[vendas.columns.findIndex((column) => column.name === name)]
  }
  assert.equal(at('NUNOTA'), String(nota.nunota))
  assert.equal(at('DTNEG'), nota.dtneg, 'data AAAA-MM-DD')
  assert.equal(at('DTALTER'), changedOn(nota.dtneg).replace(' ', 'T'), 'carimbo ISO')
  assert.match(at('VLRNOTA') ?? '', /^\d+(\.\d+)?$/, 'decimal com ponto')
  assert.equal(at('TIPMOV'), 'V')
  const flags: CopyDefinition = {
    version: 1,
    source: { kind: 'QUERY', sql: 'SELECT CODPARC, CGC_CPF, ATIVO FROM TGFPAR' },
    columns: [
      { name: 'CODPARC', type: 'bigint' },
      { name: 'CGC_CPF', type: 'text' },
      { name: 'ATIVO', type: 'boolean' },
    ],
    key: ['CODPARC'],
    changedSince: null,
  }
  const parceiros = pageOf(await read({ ...FIRST, definition: flags })).rows
  assert.deepEqual(parceiros[0], ['100', null, 'true'], 'nulo e verdadeiro')
  assert.ok(
    parceiros.some((row) => row[2] === 'false'),
    'falso',
  )
}

/** The recorded answer of decision 0063 through the read's answer. */
function recordedCells() {
  const recorded = INVENTED_CELLS.body
  const answered = lerPagina.answer({
    status: INVENTED_CELLS.status,
    body: {
      ...recorded,
      responseBody: {
        ...recorded.responseBody,
        fieldsMetadata: [
          { ...recorded.responseBody.fieldsMetadata[0], name: 'C0_S' },
          { ...recorded.responseBody.fieldsMetadata[1], name: 'C1_N' },
          { name: 'EXTRA' },
        ],
        rows: recorded.responseBody.rows.map((row) => [...row, 'N']),
      },
    },
  })
  assert.deepEqual(pageOf(answered), { rows: [['2026-01-02T03:04:05', '1234.5']], more: false })
  const asDate = lerPagina.answer({
    status: 200,
    body: {
      ...recorded,
      responseBody: {
        ...recorded.responseBody,
        fieldsMetadata: [{ name: 'C0_D' }, { name: 'C1_T' }, { name: 'EXTRA' }],
        rows: recorded.responseBody.rows.map((row) => [...row, 'N']),
      },
    },
  })
  assert.deepEqual(pageOf(asDate), { rows: [['2026-01-02', '1234.5']], more: false })
  const notADate = lerPagina.answer({
    status: 200,
    body: {
      ...recorded,
      responseBody: {
        ...recorded.responseBody,
        fieldsMetadata: [{ name: 'C0_N' }, { name: 'C1_N' }, { name: 'EXTRA' }],
        rows: recorded.responseBody.rows.map((row) => [...row, 'N']),
      },
    },
  })
  assert.equal(notADate.kind, 'UNREADABLE', 'uma célula fora do tipo nunca vira texto')
}

test('datas e células', async () => {
  await withDouble(async (read) => {
    await dateFilters(read)
    await cellsOf(read)
  })
  recordedCells()
})

test('a recusa gravada', async () => {
  await withDouble(async (read, fake) => {
    fake.switches.refuse.add('consultar')
    const answered = await read({ ...FIRST, definition: model('vendas') })
    assert.equal(answered.kind, 'REFUSED')
    if (answered.kind !== 'REFUSED') return
    assert.deepEqual(answered.native.body, {
      serviceName: 'DbExplorerSP.executeQuery',
      status: '0',
      pendingPrinting: 'false',
      statusMessage: 'Serviço recusado',
    })
  })
})

test('o filtro de leitura', async () => {
  let built = 0
  await withDouble(async () => {
    for (const sql of [
      'DELETE FROM TGFCAB',
      'SELECT NUNOTA FROM TGFCAB; DROP TABLE TGFCAB',
      'SELECT NUNOTA FROM TGFCAB -- x',
      'SELECT NUNOTA INTO X FROM TGFCAB',
    ]) {
      const definition = { ...model('vendas'), source: { kind: 'QUERY' as const, sql } }
      const input = { ...FIRST, definition, limit: PAGE_ROWS }
      assert.equal(lerPagina.input.safeParse(input).success, false, sql)
      assert.throws(() => {
        requestOf(lerPagina, input, { ref: null }, SENT_AT)
        built += 1
      }, z.ZodError)
    }
  })
  assert.equal(built, 0, 'nenhum pedido sai')
})

const CANONICAL: Readonly<Record<CopyDefinition['columns'][number]['type'], RegExp>> = {
  text: /^[\s\S]*$/,
  numeric: /^-?\d+(\.\d+)?$/,
  bigint: /^-?\d+$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  timestamp: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
  boolean: /^(true|false)$/,
}

test('os cinco modelos', async () => {
  await withDouble(async (read) => {
    assert.equal(sankhyaCopyModels.length, 5)
    for (const { id, definition } of sankhyaCopyModels) {
      const page = pageOf(await read({ ...FIRST, definition }))
      assert.ok(page.rows.length > 0, id)
      for (const row of page.rows) {
        assert.equal(row.length, definition.columns.length, id)
        definition.columns.forEach(({ name, type }, at) => {
          const cell = row[at]
          if (cell !== null) assert.match(cell ?? '', CANONICAL[type], `${id}.${name}`)
        })
      }
      assert.ok(
        page.rows.every(
          (row) => row[definition.columns.findIndex((c) => c.name === 'DTALTER')] !== null,
        ),
        `${id}: a alteração vem`,
      )
    }
  })
})
