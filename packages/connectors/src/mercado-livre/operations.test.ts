import assert from 'node:assert/strict'
import { test } from 'node:test'
import { requestOf } from '../kernel/operation.ts'
import { toRequest } from '../kernel/request.ts'
import { mercadoLivre } from './definition.ts'
import { mercadoLivreFake } from './fake.ts'
import { mensagensDoPacote } from './operations/mensagens.ts'
import { ACCOUNT, probeAll } from './test-session.ts'

test('não marca como lida', async () => {
  const request = requestOf(mensagensDoPacote, { packId: '2000000000099' }, ACCOUNT)
  assert.equal(request.query.mark_as_read, 'false')
  assert.equal(request.query.tag, 'post_sale')
  const withPaging = requestOf(
    mensagensDoPacote,
    { packId: '2000000000099', offset: 10, limit: 20 },
    ACCOUNT,
  )
  assert.equal(withPaging.query.mark_as_read, 'false')

  const fake = mercadoLivreFake()
  await probeAll(fake)
  assert.equal(fake.markedAsRead(), 0)
})

test('sem dados do comprador', async () => {
  const fake = mercadoLivreFake()
  const values = await probeAll(fake)
  assert.equal(values.length, 27, 'the double answers every read')
  const text = JSON.stringify(values)
  for (const buyer of [
    'maria.ficticia',
    '988776655',
    '52998224725',
    'Maria',
    'Fictícia',
    'COMPRADORFICTICIO',
    'Rua Inventada',
    'dono@exemplo.test',
    '77001',
  ])
    assert.ok(!text.includes(buyer), `an output carries ${buyer}`)
})

test('cada resposta que não é 2xx vira o resultado do kit, sem o corpo de um 2xx', () => {
  const conta = mercadoLivre.operations.find((operation) => operation.id === 'conta')
  assert.ok(conta)
  const answerOf = conta.answer
  function kind(status: number, body: unknown = { message: 'x' }) {
    return answerOf({ status, body }).kind
  }
  assert.equal(kind(401), 'TOKEN_EXPIRED')
  assert.equal(kind(403), 'REFUSED')
  assert.equal(kind(404), 'REFUSED')
  assert.equal(kind(429), 'UNREADABLE')
  assert.equal(kind(500), 'UNREADABLE')
  assert.equal(
    kind(206, { id: 1, nickname: 'x' }),
    'UNREADABLE',
    'a partial answer is never a shorter list',
  )
  assert.equal(kind(200, { unexpected: true }), 'UNREADABLE')
  const odd = conta.answer({ status: 200, body: { secret: 'seller data' } })
  assert.ok(!JSON.stringify(odd).includes('seller data'))
  const refused = conta.answer({
    status: 403,
    body: { code: 'PA_UNAUTHORIZED_RESULT_FROM_POLICIES', message: 'no' },
  })
  assert.ok('native' in refused)
  assert.equal(refused.native.code, 'PA_UNAUTHORIZED_RESULT_FROM_POLICIES')
})

test('o envio pede o formato novo pelo cabeçalho, e o pedido sai com ele', () => {
  const shipment = mercadoLivre.operations.find((operation) => operation.id === 'envio')
  assert.ok(shipment)
  const request = requestOf(shipment, { shipmentId: '40000000001' }, ACCOUNT)
  assert.equal(request.headers?.['x-format-new'], 'true')
  assert.equal(toRequest(mercadoLivre, request, 'bearer').headers.get('x-format-new'), 'true')
})
