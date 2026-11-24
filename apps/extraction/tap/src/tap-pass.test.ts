import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hubspotFake } from '@conexus/connectors'
import { recordLine, schemaOf } from './messages.ts'
import type { Double, TapRun } from './test-tap.ts'
import {
  hubspotDouble,
  lastState,
  NOW,
  recordsOf,
  sankhyaDouble,
  selected,
  tap,
} from './test-tap.ts'

function changedOf(run: TapRun, stream: string): readonly (string | null)[] {
  return recordsOf(run, stream).map((row) => (typeof row.dtalter === 'string' ? row.dtalter : null))
}

const ITENS = [selected('TGFITE', 'itens')]

test('a data inicial: a primeira passada de uma tabela de movimento lê da data, e o item sem DTALTER fica fora', async () => {
  const all = changedOf(await tap(sankhyaDouble(), { streams: ITENS }), 'itens')
  const since = changedOf(
    await tap(sankhyaDouble(), { streams: ITENS, startDate: '2026-10-20' }),
    'itens',
  )
  const later = all.filter((value) => value !== null && value >= '2026-10-20')
  assert.ok(later.length > 0 && later.length < all.length)
  assert.deepEqual([...since].sort(), [...later].sort())
  assert.equal(since.includes(null), false)
})

test('o ponto e a data: do ponto quando é depois da data, da data quando o ponto é antes; o maior dos dois', async () => {
  const first = await tap(sankhyaDouble(), { streams: ITENS })
  const all = changedOf(first, 'itens').filter((value) => value !== null)
  const point = lastState(first).bookmarks.itens?.replication_key_value ?? assert.fail()
  assert.equal(point, [...all].sort().at(-1), 'o ponto é a maior alteração lida')
  function state(value: string) {
    return { bookmarks: { itens: { replication_key_value: value } } }
  }
  const fromPoint = await tap(sankhyaDouble(), {
    streams: ITENS,
    state: state(point),
    startDate: '2026-09-01',
  })
  assert.deepEqual(
    changedOf(fromPoint, 'itens'),
    all.filter((value) => value >= point),
  )
  const fromDate = await tap(sankhyaDouble(), {
    streams: ITENS,
    state: state('2026-09-01T00:00:00'),
    startDate: '2026-10-20',
  })
  assert.deepEqual(
    [...changedOf(fromDate, 'itens')].sort(),
    all.filter((value) => value >= '2026-10-20').sort(),
  )
  const nothing = await tap(sankhyaDouble(), {
    streams: ITENS,
    state: state('2099-01-01T00:00:00'),
  })
  assert.equal(changedOf(nothing, 'itens').length, 0)
  assert.deepEqual(
    lastState(nothing).bookmarks.itens,
    { replication_key_value: '2099-01-01T00:00:00' },
    'a passada vazia guarda o ponto',
  )
})

test('o cadastro inteiro: um cadastro e uma tabela inteira leem tudo, com ou sem data', async () => {
  for (const [source, rows] of [
    ['TGFPAR', 9],
    ['TGFNFE', 3],
  ] as const) {
    for (const startDate of [null, '2026-11-01']) {
      const run = await tap(sankhyaDouble(), { streams: [selected(source, 't')], startDate })
      assert.equal(recordsOf(run, 't').length >= rows, true, `${source} ${startDate}`)
      const plain = await tap(sankhyaDouble(), { streams: [selected(source, 't')] })
      assert.equal(
        recordsOf(run, 't').length,
        recordsOf(plain, 't').length,
        `${source} ${startDate}`,
      )
    }
  }
})

const WINDOW = [selected('TGFEFDVMRSTDIA', 'efd')]

function monthsOf(run: TapRun): readonly string[] {
  return [...new Set(recordsOf(run, 'efd').map((row) => String(row.dtref).slice(0, 7)))]
}

test('a janela por mês: a primeira passada lê os meses da contagem, fora do calendário incluídos; a seguinte, o mês e o anterior', async () => {
  const first = await tap(sankhyaDouble(), { streams: WINDOW })
  assert.deepEqual(monthsOf(first), [
    '0208-12',
    '2026-08',
    '2026-09',
    '2026-10',
    '2026-11',
    '2109-07',
  ])
  const next = await tap(sankhyaDouble(), { streams: WINDOW, state: lastState(first) })
  assert.deepEqual(monthsOf(next), ['2026-10', '2026-11'])
  const whole = await tap(sankhyaDouble(), {
    streams: WINDOW,
    state: lastState(first),
    whole: ['TGFEFDVMRSTDIA'],
  })
  assert.equal(monthsOf(whole).length, 6, 'Ler de novo desde a data relê a contagem')
})

test('a janela desde a data: só os meses a partir do mês da data, e a releitura nunca antes dele', async () => {
  const first = await tap(sankhyaDouble(), { streams: WINDOW, startDate: '2026-09-15' })
  assert.deepEqual(monthsOf(first), ['2026-09', '2026-10', '2026-11', '2109-07'])
  const next = await tap(sankhyaDouble(), {
    streams: WINDOW,
    state: lastState(first),
    startDate: '2026-11-01',
  })
  assert.deepEqual(monthsOf(next), ['2026-11'])
})

test('a inteira: a NF-e lê tudo a cada rodada, com o mesmo estado', async () => {
  const first = await tap(sankhyaDouble(), { streams: [selected('TGFNFE', 'nfe')] })
  const again = await tap(sankhyaDouble(), {
    streams: [selected('TGFNFE', 'nfe')],
    state: lastState(first),
  })
  assert.equal(recordsOf(again, 'nfe').length, recordsOf(first, 'nfe').length)
  assert.deepEqual(lastState(first).bookmarks.nfe, {})
})

function failing(double: Double, failures: number, fail: () => Response | never) {
  let left = failures
  let pages = 0
  return {
    count: () => pages,
    fetch: async (request: Request) => {
      if (new URL(request.url).pathname === '/authenticate') return double.fake.handle(request)
      pages += 1
      if (pages > 1 && left > 0) {
        left -= 1
        return fail()
      }
      return double.fake.handle(request)
    },
  }
}

const VENDEDORES = [selected('TGFVEN', 'vendedores')]

test('a página que cai e volta: 5xx, 429 e a rede repetidos até cinco vezes, com a espera crescendo; um 4xx não', async () => {
  const kinds: [string, () => Response][] = [
    ['5xx', () => new Response('{}', { status: 503 })],
    ['429', () => new Response('{}', { status: 429, headers: { 'retry-after-ms': '1500' } })],
    [
      'a rede',
      () => {
        throw new TypeError('fetch failed')
      },
    ],
  ]
  const plain = recordsOf(await tap(sankhyaDouble(), { streams: VENDEDORES }), 'vendedores')
  for (const [what, fail] of kinds) {
    const double = sankhyaDouble()
    const back = failing(double, 4, fail)
    const run = await tap(double, { streams: VENDEDORES, fetch: back.fetch })
    assert.equal(run.code, 0, what)
    assert.equal(run.result, null, `${what}: nenhum TapFailure`)
    assert.deepEqual(recordsOf(run, 'vendedores'), plain, `${what}: as linhas uma vez`)
    const waited = what === '429' ? [1500, 1500, 1500, 1500] : [2500, 4500, 8500, 16500]
    assert.deepEqual(run.waits, waited, what)
  }
  const double = sankhyaDouble()
  const down = await tap(double, {
    streams: VENDEDORES,
    fetch: failing(double, 5, () => new Response('{}', { status: 502 })).fetch,
  })
  assert.equal(down.code, 1)
  assert.partialDeepStrictEqual(down.result, {
    code: 'COPY_SOURCE_UNREACHABLE',
    table: 'vendedores',
  })
  const refused = sankhyaDouble()
  const once = failing(refused, 1, () => new Response('{"error":"bad"}', { status: 400 }))
  const bad = await tap(refused, { streams: VENDEDORES, fetch: once.fetch })
  assert.equal(bad.code, 1)
  assert.equal(once.count(), 2, 'o dicionário e a página, e o 4xx não se repete')
  assert.deepEqual(bad.waits, [])
})

test('a rodada seguinte retoma do ponto: STATE depois de cada página, e a passada parada segue com a mesma versão', async () => {
  const run = await tap(await hubspotDouble(), { streams: [selected('negocios', 'deals')] })
  const types = run.messages.map(({ type }) => type).filter((type, at, all) => type !== all[at - 1])
  assert.deepEqual(types, [
    'SCHEMA',
    'RECORD',
    'STATE',
    'RECORD',
    'STATE',
    'RECORD',
    'ACTIVATE_VERSION',
    'STATE',
  ])
  const middle = run.messages.filter(({ type }) => type === 'STATE')[0]
  const fake = hubspotFake()
  const resumed = await tap(await hubspotDouble(fake), {
    streams: [selected('negocios', 'deals')],
    state: lastState({ ...run, messages: [middle ?? assert.fail()] }),
    now: NOW + 60_000,
  })
  const first = recordsOf(run, 'deals').length - recordsOf(resumed, 'deals').length
  assert.equal(first, 100, 'a primeira página não se relê')
  assert.deepEqual(
    new Set(resumed.messages.filter(({ type }) => type === 'RECORD').map(({ version }) => version)),
    new Set([NOW]),
  )
})

test('o binário: base64 com contentEncoding no esquema, os bytes como vieram; o CLOB é texto', () => {
  const columns = [
    { name: 'IMAGEM', type: 'binary', description: null },
    { name: 'XML', type: 'text', description: 'Campo xml' },
  ] as const
  assert.deepEqual(schemaOf(columns).properties, {
    imagem: { type: ['string', 'null'], contentEncoding: 'base64' },
    xml: { type: ['string', 'null'], description: 'Campo xml' },
  })
  const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 255]).toString('base64')
  const line = JSON.parse(
    recordLine({ stream: 's', columns, row: { IMAGEM: bytes, XML: '<a/>' }, version: 1 }),
  )
  assert.deepEqual(
    Buffer.from(line.record.imagem, 'base64'),
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 255]),
  )
})
