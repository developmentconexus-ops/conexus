import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CONNECTORS } from '@conexus/connectors'
import { z } from 'zod'
import { assertOutside, recorded } from './record-connector-calls.ts'
import { swapped } from './record-connector-swap.ts'

const ML = CONNECTORS.find((connector) => connector.id === 'mercado-livre')
if (ML === undefined) throw new Error('No Mercado Livre')
const NOW = new Date('2026-11-11T12:00:00.000Z')
// Invented bytes in the shape of the service's bodies; the real ones never enter a test.
const SELLER = '987654321'
const TOKEN = 'APP_USR-fake-token-0001'

function answering(bodies: unknown[]) {
  const seen: Request[] = []
  const fake: typeof fetch = async (input) => {
    seen.push(input instanceof Request ? input : new Request(input))
    return new Response(JSON.stringify(bodies.shift()), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
  return { fake, seen }
}

const ARGS = { connector: ML, account: SELLER, token: TOKEN, now: NOW, first: null }

test('o gravador monta o pedido pela declaração da operação e guarda o corpo como chegou', async () => {
  const body = { paging: { total: 1, offset: 0, limit: 50 }, results: [{ id: 1 }] }
  const { fake, seen } = answering([body])
  const raw = await recorded({ ...ARGS, fetch: fake, name: 'pedidos-alterados' })
  const url = new URL(seen[0]?.url ?? '')
  assert.equal(url.pathname, '/orders/search')
  assert.equal(url.searchParams.get('seller'), SELLER)
  assert.equal(url.searchParams.get('order.date_last_updated.from'), '2026-11-04T12:00:00.000Z')
  assert.equal(seen[0]?.headers.get('authorization'), `Bearer ${TOKEN}`)
  assert.deepEqual(raw.body, body)
  assert.equal(JSON.stringify(raw).includes(TOKEN), false)
})

test('a segunda página da varredura manda o scroll_id da primeira', async () => {
  const { fake, seen } = answering([{ results: ['MLB1'] }])
  await recorded({
    ...ARGS,
    fetch: fake,
    name: 'anuncios-varredura-2',
    first: { scroll_id: 'SCROLL0001', results: ['MLB1'] },
  })
  const url = new URL(seen[0]?.url ?? '')
  assert.equal(url.searchParams.get('scroll_id'), 'SCROLL0001')
  assert.equal(url.searchParams.get('search_type'), 'scan')
})

test('sem scroll_id na primeira página a segunda não é pedida', async () => {
  const { fake, seen } = answering([])
  await assert.rejects(
    recorded({ ...ARGS, fetch: fake, name: 'anuncios-varredura-2', first: { results: [] } }),
    /no scroll_id/,
  )
  assert.equal(seen.length, 0)
})

test('uma recusa do serviço não grava nada e a mensagem não traz a credencial', async () => {
  const refuse: typeof fetch = async () => new Response('{"message":"x"}', { status: 403 })
  await assert.rejects(
    recorded({ ...ARGS, fetch: refuse, name: 'perguntas-varredura' }),
    (error: Error) => error.message.includes('403') && !error.message.includes(TOKEN),
  )
})

test('um corpo que traz a credencial não é guardado', async () => {
  const { fake } = answering([{ echo: TOKEN }])
  await assert.rejects(
    recorded({ ...ARGS, fetch: fake, name: 'perguntas-varredura' }),
    /carries the credential/,
  )
})

test('a pasta de saída dentro do repositório é recusada', () => {
  assert.throws(() => assertOutside('/repo/data/raw', '/repo'), /outside the repository/)
  assert.throws(() => assertOutside('/repo', '/repo'), /outside the repository/)
  assert.equal(assertOutside('/elsewhere/raw', '/repo'), '/elsewhere/raw')
})

const Swapped = z.object({
  paging: z.object({ total: z.number() }),
  results: z
    .array(
      z.object({
        id: z.number(),
        status: z.string(),
        date_created: z.string().optional(),
        date_last_updated: z.string().optional(),
        seller: z.object({ id: z.number() }).optional(),
      }),
    )
    .min(1),
})

const REAL = {
  paging: { total: 1300, limit: 50 },
  scroll_id: 'AbCdEf0123456789xyzREALscroll',
  results: [
    {
      id: 2000007654321,
      status: 'paid',
      date_created: '2026-11-01T08:30:15.000-03:00',
      date_last_updated: '2026-11-02T10:00:00.000-03:00',
      total_amount: 189.9,
      seller: { id: 987654321, nickname: 'LOJAREALDAMARIA' },
      item: { id: 'MLB3456789012', title: 'Camiseta Maria Silva', unit_price: 94.95 },
      buyer: { id: 55555555, nickname: 'COMPRADORREAL', email: 'real@exemplo.test' },
    },
    { id: 2000007654322, status: 'cancelled', total_amount: 10 },
  ],
}

test('a troca muda ids, nomes, preços e datas, e guarda a forma', () => {
  const done = swapped({ body: REAL, account: SELLER, path: `/users/${SELLER}/items/search` })
  const text = JSON.stringify(done.body)
  for (const real of [
    'AbCdEf',
    'LOJAREAL',
    'Maria Silva',
    'COMPRADORREAL',
    '2000007654321',
    '189.9',
  ])
    assert.equal(text.includes(real), false, real)
  assert.equal(done.path.includes(SELLER), false)
  const body = Swapped.parse(done.body)
  const first = body.results[0]
  assert.equal(first?.status, 'paid')
  assert.equal(body.paging.total, 1300)
  assert.match(first?.date_created ?? '', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}-03:00$/)
  assert.equal(String(first?.id).length, '2000007654321'.length)
  assert.ok(done.replaced.includes('results.buyer.nickname'))
  assert.ok(done.replaced.includes('scroll_id'))
})

test('o mesmo valor real vira o mesmo inventado, e a ordem das datas fica', () => {
  const done = swapped({ body: REAL, account: SELLER, path: `/users/${SELLER}/x` })
  const body = Swapped.parse(done.body)
  assert.equal(String(body.results[0]?.seller?.id), done.path.split('/')[2])
  const [created, updated] = [body.results[0]?.date_created, body.results[0]?.date_last_updated]
  assert.ok(Date.parse(created ?? '') < Date.parse(updated ?? ''))
  assert.equal(
    Date.parse(updated ?? '') - Date.parse(created ?? ''),
    (25 * 60 + 29) * 60_000 + 45_000,
  )
})

test('um endereço ou prefixo de credencial que sobra recusa a gravação', () => {
  assert.throws(
    () => swapped({ body: { 'maria@exemplo.test': 'x' }, account: SELLER, path: '/x' }),
    /nothing is saved/,
  )
})
