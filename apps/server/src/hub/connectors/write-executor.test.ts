import assert from 'node:assert/strict'
import { test } from 'node:test'
import { markOf } from './public.ts'
import { writing } from './test-write.ts'

/** One write whose answer the provider's door is scripted to give, and the same call asked again. */
async function scripted(t: Parameters<typeof writing>[0], order: () => Promise<Response>) {
  const on = await writing(t, { order })
  const request = on.byAna()
  const first = await on.ask(request)
  const again = await on.ask(request)
  return { on, request, first, again }
}

test('uma conexão que nunca se fez não enviou nada: a falha vai ao modelo, e a mesma chamada de novo não envia', async (t) => {
  const { on, first, again } = await scripted(t, () =>
    Promise.reject(new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } })),
  )
  assert.deepEqual(first, { kind: 'UNREACHABLE' })
  assert.deepEqual(again, first)
  assert.equal(on.mode.posts, 1)
  assert.equal(Object((await on.ledger())[0]).state, 'REFUSED')
})

test('o corte depois de sair, o 5xx e o GTW3503 dão WRITE_UNCERTAIN com a marca, enviados uma vez', async (t) => {
  const answers = [
    () => Promise.reject(new TypeError('terminated', { cause: { code: 'UND_ERR_SOCKET' } })),
    () => Promise.resolve(Response.json({ code: 'X' }, { status: 502 })),
    () => Promise.resolve(Response.json({ code: 'GTW3503', message: 'tempo' }, { status: 504 })),
    // The gateway's own code decides, whatever the status it travels under.
    () => Promise.resolve(Response.json({ code: 'GTW3503', message: 'tempo' }, { status: 408 })),
  ]
  for (const order of answers) {
    const { on, request, first, again } = await scripted(t, order)
    const mark = markOf(request.threadId, request.toolCallId)
    assert.deepEqual(first, { kind: 'WRITE_UNCERTAIN', mark })
    assert.deepEqual(again, first)
    assert.equal(on.mode.posts, 1)
  }
})

test('um 429 não espera nem repete, e um 2xx que não lê deixa a sorte do pedido desconhecida', async (t) => {
  const busy = await scripted(t, () =>
    Promise.resolve(Response.json({ code: 'X' }, { status: 429, headers: { 'retry-after': '0' } })),
  )
  assert.equal(busy.first.kind, 'BUSY')
  assert.equal(busy.on.mode.posts, 1)
  const odd = await scripted(t, () =>
    Promise.resolve(Response.json({ mensagem: 'ok', retorno: { codigoPedido: 'x' } })),
  )
  assert.equal(odd.first.kind, 'WRITE_UNCERTAIN')
  assert.equal(odd.on.mode.posts, 1)
})
