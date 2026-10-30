import assert from 'node:assert/strict'
import { test } from 'node:test'
import { requestOf } from '../kernel/operation.ts'
import { toRequest } from '../kernel/request.ts'
import { mercadoLivre } from './definition.ts'
import { mercadoLivreFake } from './fake.ts'
import { mensagensDoPacote } from './operations/mensagens.ts'
import { ACCOUNT, answerOf, authorize, probeAll } from './test-session.ts'

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
    '11988776655',
    'dono@exemplo.test',
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
  assert.equal(kind(429), 'BUSY')
  assert.equal(kind(500), 'UNREADABLE')
  assert.equal(
    kind(206, { id: 1, nickname: 'x' }),
    'UNREADABLE',
    'a partial answer is never a shorter list',
  )
  const pedidos = mercadoLivre.operations.find((operation) => operation.id === 'pedidos')
  assert.ok(pedidos)
  assert.equal(pedidos.answer({ status: 200, body: { orders: [] } }).kind, 'UNREADABLE')
  assert.equal(pedidos.answer({ status: 200, body: { results: 'x' } }).kind, 'UNREADABLE')
  const odd = pedidos.answer({ status: 200, body: { results: 'seller data' } })
  assert.ok(!JSON.stringify(odd).includes('seller data'))
  const refused = conta.answer({
    status: 403,
    body: { code: 'PA_UNAUTHORIZED_RESULT_FROM_POLICIES', message: 'no' },
  })
  assert.ok('native' in refused)
  assert.equal(refused.native.code, 'PA_UNAUTHORIZED_RESULT_FROM_POLICIES')
})

test('uma linha passa como o Mercado Livre a mandou, com campo a mais ou de outro tipo', () => {
  const pedidos = mercadoLivre.operations.find((operation) => operation.id === 'pedidos')
  assert.ok(pedidos)
  const answered = pedidos.answer({
    status: 200,
    body: {
      results: [
        { id: 1, extra: { novo: true }, total_amount: 'dez', buyer: { email: 'a@b.test' } },
      ],
      paging: { total: 3, offset: 0, limit: 1 },
    },
  })
  assert.deepEqual(answered, {
    kind: 'OK',
    value: {
      linhas: [{ id: 1, extra: { novo: true }, total_amount: 'dez' }],
      temMais: true,
    },
  })
})

test('o envio pede o formato novo pelo cabeçalho, e o pedido sai com ele', () => {
  const shipment = mercadoLivre.operations.find((operation) => operation.id === 'envio')
  assert.ok(shipment)
  const request = requestOf(shipment, { shipmentId: '40000000001' }, ACCOUNT)
  assert.equal(request.headers?.['x-format-new'], 'true')
  assert.equal(toRequest(mercadoLivre, request, 'bearer').headers.get('x-format-new'), 'true')
})

test('o envio no formato novo não deixa sair o comprador: nome, telefone e endereço de destination', () => {
  const shipment = mercadoLivre.operations.find((operation) => operation.id === 'envio')
  assert.ok(shipment)
  const answered = shipment.answer({
    status: 200,
    body: {
      id: 40000000001,
      status: 'delivered',
      substatus: null,
      origin: { type: 'selling_address', sender_id: 1, shipping_address: { address_line: 'loja' } },
      destination: {
        comments: null,
        receiver_id: 77001,
        receiver_name: 'Maria Fictícia',
        receiver_phone: '11988776655',
        shipping_address: { address_line: 'Rua Inventada 1', zip_code: '99887766' },
      },
    },
  })
  assert.equal(answered.kind, 'OK')
  const text = JSON.stringify(answered)
  for (const buyer of ['Maria', '11988776655', 'Rua Inventada', '99887766', 'destination'])
    assert.ok(!text.includes(buyer), `the shipment carries ${buyer}`)
  assert.ok(text.includes('delivered'))
})

test('o resumo do faturamento é uma linha, e as duas leituras mandam document_type', async () => {
  const fake = mercadoLivreFake()
  const granted = await authorize(fake)
  assert.equal(granted.kind, 'OK')
  const sent = (await probeAll(fake)).filter(({ operation }) =>
    ['periodosDeFaturamento', 'cobrancasDoPeriodo'].includes(operation.id),
  )
  assert.equal(sent.length, 2)
  for (const { request } of sent) assert.equal(request.query.document_type, 'BILL')
  const summary = sent.find(({ operation }) => operation.id === 'cobrancasDoPeriodo')
  assert.ok(summary)
  assert.ok(isRows(summary.value))
  assert.equal(summary.value.linhas.length, 1)
  assert.equal(summary.value.temMais, null)
  const credit = requestOf(
    mercadoLivre.operations.find((operation) => operation.id === 'periodosDeFaturamento') ??
      assert.fail('periodosDeFaturamento'),
    { documentType: 'CREDIT_NOTE' },
    ACCOUNT,
  )
  assert.equal(credit.query.document_type, 'CREDIT_NOTE')
})

function isRows(value: unknown): value is { linhas: unknown[]; temMais: boolean | null } {
  return typeof value === 'object' && value !== null && 'linhas' in value && 'temMais' in value
}

/** Two pages of a read of the double: the first, and the one after it. */
async function twoPages(
  id: string,
  first: Record<string, unknown>,
  second: Record<string, unknown>,
) {
  const fake = mercadoLivreFake()
  const granted = await authorize(fake)
  assert.equal(granted.kind, 'OK')
  if (granted.kind !== 'OK') return assert.fail('authorize')
  const operation = mercadoLivre.operations.find((candidate) => candidate.id === id)
  assert.ok(operation)
  async function page(input: Record<string, unknown>) {
    const request = requestOf(operation ?? assert.fail(id), input, ACCOUNT)
    const answered = (operation ?? assert.fail(id)).answer(
      await answerOf(
        await fake.handle(
          toRequest(mercadoLivre, request, granted.kind === 'OK' ? granted.accessToken : ''),
        ),
      ),
    )
    assert.equal(answered.kind, 'OK', id)
    return answered.kind === 'OK' && isRows(answered.value) ? answered.value : assert.fail(id)
  }
  return [await page(first), await page(second)] as const
}

for (const [id, total] of [
  ['anuncios', 12],
  ['perguntas', 12],
  ['periodosDeFaturamento', 14],
] as const) {
  test(`${id}: a segunda página difere da primeira e temMais vira false no fim`, async () => {
    const limit = id === 'periodosDeFaturamento' ? 6 : 5
    const [first, second] = await twoPages(id, { offset: 0, limit }, { offset: total - 2, limit })
    assert.equal(first.linhas.length, limit)
    assert.equal(first.temMais, true)
    assert.notDeepEqual(second.linhas, first.linhas)
    assert.equal(second.linhas.length, 2)
    assert.equal(second.temMais, false)
  })
}
