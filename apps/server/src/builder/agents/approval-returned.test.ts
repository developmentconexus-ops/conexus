import assert from 'node:assert/strict'
import { test } from 'node:test'
import { said } from '../assistant/test-assistant.ts'
import { endOf, sent } from '../conversation/test-conversation.ts'
import { approving, launched } from './test-approval.ts'

const SUCESSO = 'Pedido Incluído/Atualizado/Cancelado com sucesso.'
const ELSEWHERE = {
  codigo: 1,
  tipo: 'SUCESSO',
  mensagem: SUCESSO,
  retorno: { numero: 98115 },
  detalhe: 'z'.repeat(50_000),
}
const LONG = { mensagem: SUCESSO, retorno: { codigoPedido: 98116 }, detalhe: 'x'.repeat(100_000) }

/** What the model reads of a body past 40 000 characters: the first and the last 20 000, never half of one. */
function cutOf(body: unknown): string {
  const whole = Array.from(typeof body === 'string' ? body : JSON.stringify(body))
  const head = whole.slice(0, 20_000).join('')
  return `${head}…[${whole.length - 40_000} characters cut]…${whole.slice(-20_000).join('')}`
}

test('o que voltou chega ao modelo, no incerto com a instrução de lê-la e num sucesso: o começo e o fim de um corpo acima de 40 mil caracteres, e a linha guarda tudo', async (t) => {
  const answers = [ELSEWHERE, LONG]
  // Before the Hub starts, which takes the fetch it calls the provider with.
  const real = globalThis.fetch
  t.mock.method(globalThis, 'fetch', (input: Request | string | URL, init?: RequestInit) => {
    const adding =
      input instanceof Request &&
      input.method === 'POST' &&
      input.url.endsWith('/v1/vendas/pedidos')
    return adding ? Promise.resolve(Response.json(answers.shift())) : real(input, init)
  })
  const on = await approving(t, [
    [launched()],
    [said('O sistema diz que incluiu o pedido 98115.')],
    [launched()],
    [said('Pedido 98116 lançado.')],
  ])
  const agent = await on.writer('AUTO')
  const a = await on.opened(agent.id)
  await sent(on.hub, on.ana, a.url, 'Lance o pedido')
  assert.equal(endOf(await a.stream.turn()), 'complete')
  const uncertain = JSON.parse(on.calls[1]?.toolResults[0]?.text ?? '')
  assert.equal(uncertain.kind, 'WRITE_UNCERTAIN')
  assert.deepEqual(uncertain.returned, { status: 200, body: cutOf(ELSEWHERE) })
  assert.match(uncertain.instruction, /If "returned" shows what the system did/)

  const b = await on.opened(agent.id)
  await sent(on.hub, on.ana, b.url, 'Lance o pedido')
  assert.equal(endOf(await b.stream.turn()), 'complete')
  const done = JSON.parse(on.calls[3]?.toolResults.at(-1)?.text ?? '')
  assert.deepEqual(done.value, { codigoPedido: 98116 })
  assert.deepEqual(done.returned, { status: 200, body: cutOf(LONG) })
  const rows = await on.hub.test.asOwner(
    "select answer->'returned'->'body' as body from connectors.connector_write order by created_at",
  )
  assert.deepEqual(
    rows.map((row) => row.body),
    [ELSEWHERE, LONG],
  )
})

test('o teto ao modelo vale na recusa: a falha lançada leva o começo e o fim de um corpo longo, e a linha guarda tudo', async (t) => {
  const refusal = {
    statusCode: 400,
    error: { code: 'BAD_REQUEST', message: 'Recusado.', details: '😀'.repeat(100_000) },
  }
  const real = globalThis.fetch
  t.mock.method(globalThis, 'fetch', (input: Request | string | URL, init?: RequestInit) => {
    const adding =
      input instanceof Request &&
      input.method === 'POST' &&
      input.url.endsWith('/v1/vendas/pedidos')
    return adding ? Promise.resolve(Response.json(refusal, { status: 400 })) : real(input, init)
  })
  const on = await approving(t, [[launched()], [said('Não lancei.')]])
  const agent = await on.writer('AUTO')
  const { url, stream } = await on.opened(agent.id)
  await sent(on.hub, on.ana, url, 'Lance o pedido')
  assert.equal(endOf(await stream.turn()), 'complete')
  const [result] = on.calls[1]?.toolResults ?? []
  assert.equal(result?.error, true)
  const told = JSON.parse(result?.text ?? '')
  assert.equal(told.kind, 'REFUSED')
  assert.equal(told.body, cutOf(refusal))
  assert.ok(told.body.isWellFormed(), 'no character is cut in half')
  assert.equal(told.message, cutOf(`Recusado. ${refusal.error.details}`))
  const [row] = await on.hub.test.asOwner(
    "select answer->'native'->'body' as body from connectors.connector_write",
  )
  assert.deepEqual(row?.body, refusal)
})
