import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hubspotFake } from '@conexus/connectors'
import type { Double } from './test-tap.ts'
import {
  activated,
  hubspotDouble,
  lastState,
  monthsOf,
  NOW,
  recordsOf,
  sankhyaDouble,
  selected,
  tap,
  WINDOW,
} from './test-tap.ts'

test('a data que recua com uma passada inteira salva: a passada é planejada de novo, inteira, desde a data nova; a igual e a mais nova retomam', async () => {
  const run = await tap(sankhyaDouble(), { streams: WINDOW, startDate: '2026-10-01' })
  const middle = run.messages.filter(({ type }) => type === 'STATE')[0] ?? assert.fail()
  const saved = lastState({ ...run, messages: [middle] })
  const pass = saved.bookmarks.efd?.pass ?? assert.fail()
  async function again(startDate: string | null, state = saved) {
    const next = await tap(sankhyaDouble(), {
      streams: WINDOW,
      state,
      startDate,
      now: NOW + 60_000,
    })
    const versions = activated(next, 'efd').map((message) => message.version)
    return { months: monthsOf(next), versions }
  }
  for (const startDate of ['2026-08-01', null]) {
    const replanned = await again(startDate)
    assert.ok(replanned.months.includes('2026-08'), `${startDate}`)
    assert.deepEqual(replanned.versions, [NOW + 60_000], `${startDate}`)
  }
  const withPoint = await again('2026-08-01', {
    bookmarks: { efd: { replication_key_value: '2026-11', pass } },
  })
  assert.ok(withPoint.months.includes('2026-08'), 'replanejada inteira, não do ponto')
  for (const startDate of ['2026-10-01', '2026-11-01']) {
    assert.deepEqual((await again(startDate)).versions, [NOW], startDate)
  }
  const changed = await again('2026-08-01', {
    bookmarks: { efd: { pass: { ...pass, whole: false } } },
  })
  assert.equal(changed.months.includes('2026-08'), false, 'a passada que não é inteira retoma')
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

test('a consulta que cai e volta: 5xx, 429 e a rede repetidos até cinco vezes, com a espera crescendo; um 4xx não', async () => {
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
  assert.equal(once.count(), 3, 'o dicionário, o teto e o logout: o 4xx não se repete')
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
