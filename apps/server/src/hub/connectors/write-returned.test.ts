import assert from 'node:assert/strict'
import { test } from 'node:test'
import { markOf } from './public.ts'
import { placedAnswer, writing } from './test-write.ts'

const SUCESSO = 'Pedido Incluído/Atualizado/Cancelado com sucesso.'

test('o que voltou: um sucesso traz a resposta inteira, e a linha e a repetição a guardam', async (t) => {
  const on = await writing(t)
  const asked = on.byAna()
  const answered = await on.ask(asked)
  assert.deepEqual(answered, {
    kind: 'OK',
    value: { codigoPedido: 98001 },
    returned: placedAnswer(98001),
  })
  const [row] = await on.ledger()
  assert.equal(row?.state, 'DONE')
  assert.deepEqual(row?.answer, answered)
  assert.deepEqual(await on.ask(asked), answered)
  assert.equal(on.mode.posts, 1)
})

test('o que voltou: um 2xx com o número noutra chave é incerto com a resposta inteira, guardada, e a trava segura a próxima', async (t) => {
  const body = { codigo: 1, tipo: 'SUCESSO', mensagem: SUCESSO, retorno: { numero: 98115 } }
  const on = await writing(t, { order: async () => Response.json(body) })
  const asked = on.byAna()
  const mark = markOf(asked.threadId, asked.toolCallId)
  const uncertain = { kind: 'WRITE_UNCERTAIN', mark, returned: { status: 200, body } }
  assert.deepEqual(await on.ask(asked), uncertain)
  const [row] = await on.ledger()
  assert.equal(row?.state, 'UNCERTAIN')
  assert.deepEqual(row?.answer, uncertain)
  assert.deepEqual(await on.ask(asked), uncertain)
  assert.equal((await on.ask(on.byAna())).kind, 'WRITE_OPEN')
  assert.equal(on.mode.posts, 1)
})

test('o que voltou: um 200 de sucesso sem retorno não prova recusa: incerto, e a próxima não sai', async (t) => {
  const body = { codigo: 1, tipo: 'SUCESSO', mensagem: SUCESSO }
  const on = await writing(t, { order: async () => Response.json(body) })
  const asked = on.byAna()
  assert.deepEqual(await on.ask(asked), {
    kind: 'WRITE_UNCERTAIN',
    mark: markOf(asked.threadId, asked.toolCallId),
    returned: { status: 200, body },
  })
  assert.equal((await on.ask(on.byAna())).kind, 'WRITE_OPEN')
  assert.equal(on.mode.posts, 1)
})

test('o que voltou: um 2xx em texto chega como texto, e o token que ele ecoa ou o de um JSON ecoado é trocado', async (t) => {
  let text = true
  const on = await writing(t, {
    order: async (request) => {
      const echo = request.headers.get('authorization') ?? ''
      return text ? new Response(`<html>ok ${echo}</html>`) : Response.json({ echo })
    },
  })
  const html = await on.ask(on.byAna())
  assert.equal(html.kind, 'WRITE_UNCERTAIN')
  assert.deepEqual(Object(html).returned, {
    status: 200,
    body: '<html>ok Bearer [redacted]</html>',
  })
  text = false
  const asked = on.byAna()
  const json = await on.ask({ ...asked, approvedBy: asked.scope.personId })
  assert.deepEqual(Object(json).returned, { status: 200, body: { echo: 'Bearer [redacted]' } })
})

test('o que voltou: o 504 depois de enviar traz o que o gateway disse, e o corte, nada', async (t) => {
  const on = await writing(t)
  on.fake.orderSwitches.lostAfterStore = true
  const timeout = await on.ask(on.byAna())
  assert.deepEqual(Object(timeout).returned, {
    status: 504,
    body: { code: 'GTW3503', message: 'Tempo limite do gateway esgotado' },
  })
  on.fake.orderSwitches.lostAfterStore = false
  on.mode.cut = true
  const asked = on.byAna()
  const cut = await on.ask({ ...asked, approvedBy: asked.scope.personId })
  assert.deepEqual(cut, {
    kind: 'WRITE_UNCERTAIN',
    mark: markOf(asked.threadId, asked.toolCallId),
    returned: null,
  })
})

test('o que voltou: um NUL e meio caractere na resposta saem do que a linha guarda, e a linha termina', async (t) => {
  const on = await writing(t, {
    order: async () =>
      new Response(
        '{"mensagem":"a\\u0000b","retorno":{"x\\u0000":"c\\\\u0000","\\udc00":"d\\ud800"}}',
        {
          headers: { 'content-type': 'application/json' },
        },
      ),
  })
  const answered = await on.ask(on.byAna())
  assert.deepEqual(Object(answered).returned.body, {
    mensagem: 'a\u0000b',
    retorno: { 'x\u0000': 'c\\u0000', '\udc00': 'd\ud800' },
  })
  const [row] = await on.ledger()
  assert.equal(row?.state, 'UNCERTAIN')
  assert.deepEqual(Object(row?.answer).returned.body, {
    mensagem: 'ab',
    retorno: { x: 'c\\u0000', '\ufffd': 'd\ufffd' },
  })
  assert.equal(on.lines('CONNECTOR_WRITE_UNRECORDED').length, 0)
})

test('o que voltou: uma linha gravada antes de o registro guardar a resposta devolve returned null na repetição', async (t) => {
  const on = await writing(t)
  const asked = on.byAna()
  await on.ask(asked)
  await on.hub.test.asOwner("update connectors.connector_write set answer = answer - 'returned'")
  assert.deepEqual(await on.ask(asked), {
    kind: 'OK',
    value: { codigoPedido: 98001 },
    returned: null,
  })
  assert.equal(on.mode.posts, 1)
})

test('o que voltou: um 4xx que o kit não lê não prova recusa: incerto, com a resposta', async (t) => {
  const body = { message: 'Method Not Allowed' }
  const on = await writing(t, { order: async () => Response.json(body, { status: 405 }) })
  const asked = on.byAna()
  assert.deepEqual(await on.ask(asked), {
    kind: 'WRITE_UNCERTAIN',
    mark: markOf(asked.threadId, asked.toolCallId),
    returned: { status: 405, body },
  })
})
