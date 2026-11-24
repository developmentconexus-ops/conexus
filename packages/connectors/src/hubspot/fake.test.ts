import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hubspotFake } from '../index.ts'
import { tableReachOf, walkTable } from '../kernel/conformance-tables.ts'
import { hubspot } from './definition.ts'

test('o registro muda entre duas leituras: o negócio alterado e o removido, por uma rota que só o dublê tem', async () => {
  const fake = hubspotFake()
  const reach = await tableReachOf(hubspot, fake)
  const table = hubspot.tables?.declared.find(({ name }) => name === 'negocios') ?? assert.fail()
  async function deals() {
    return new Map((await walkTable(reach, table)).map((deal) => [deal.id, deal]))
  }
  function route(id: string, acao: string) {
    const url = `${hubspot.origin}/__teste/negocios/${id}`
    return fake.handle(new Request(url, { method: 'POST', body: JSON.stringify({ acao }) }))
  }
  const before = await deals()
  assert.equal(before.get('3000')?.amount, '1000')
  assert.equal((await route('3000', 'ALTERAR')).status, 200)
  assert.equal((await route('3001', 'REMOVER')).status, 200)
  assert.equal((await route('9999', 'REMOVER')).status, 404, 'um negócio que não existe')
  const after = await deals()
  assert.partialDeepStrictEqual(after.get('3000'), {
    amount: '1',
    hs_lastmodifieddate: '2026-11-20T13:00:00.000Z',
  })
  assert.equal(after.has('3001'), false)
  assert.equal(after.size, before.size - 1)
  assert.equal(
    (await walkTable(await tableReachOf(hubspot, hubspotFake()), table)).length,
    230,
    'outro dublê não vê a mudança',
  )
})
