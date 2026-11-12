import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, codeOf, post } from './test-hub.ts'
import { roleOf, roles, world } from './test-roles.ts'

const THREE = ['contato', 'endereco', 'documento']

test('os tipos de cada papel: dono e administrador com os três, os outros e o papel novo sem nenhum', async (t) => {
  const w = await world(t)
  await post(w.hub, w.ana, `${w.base}/roles`, { label: 'Estoque', connectors: {} })
  const list = await roles(w)
  assert.deepEqual(roleOf(list, 'owner').personal, THREE)
  assert.deepEqual(roleOf(list, 'admin').personal, THREE)
  assert.deepEqual(roleOf(list, 'developer').personal, [])
  assert.deepEqual(roleOf(list, 'member').personal, [])
  assert.deepEqual(roleOf(list, 'estoque').personal, [])
})

test('marcar contato no membro: 200, a leitura seguinte o traz, a conexão do papel fica, e tirar o desfaz', async (t) => {
  const w = await world(t)
  const url = `${w.base}/roles/member`
  const connectors = roleOf(await roles(w), 'member').connectors
  const marked = await call(w.hub, w.ana, 'PUT', url, { connectors, personal: ['contato'] })
  assert.equal(marked.statusCode, 200)
  assert.deepEqual(Object(marked.json()).role.personal, ['contato'])
  const after = roleOf(await roles(w), 'member')
  assert.deepEqual(after.personal, ['contato'])
  assert.deepEqual(after.connectors, connectors)
  assert.deepEqual(roleOf(await roles(w), 'developer').personal, [])
  await call(w.hub, w.ana, 'PUT', url, { connectors })
  assert.deepEqual(roleOf(await roles(w), 'member').personal, [])
})

test('sensível recusado: sensivel e tipo desconhecido recusados sem gravar, e o dono não muda', async (t) => {
  const w = await world(t)
  const url = `${w.base}/roles/member`
  for (const personal of [['sensivel'], ['religiao']]) {
    const refused = await call(w.hub, w.ana, 'PUT', url, { connectors: {}, personal })
    assert.deepEqual([refused.statusCode, codeOf(refused)], [400, 'REQUEST_MALFORMED'])
  }
  assert.deepEqual(roleOf(await roles(w), 'member').personal, [])
  const fixed = await call(w.hub, w.ana, 'PUT', `${w.base}/roles/owner`, {
    connectors: {},
    personal: ['contato'],
  })
  assert.equal(fixed.statusCode, 409)
  assert.equal(codeOf(fixed), 'ROLE_FIXED')
})

test('papel novo com tipos: Vendas nasce com contato e endereço, e criar com sensivel é recusado', async (t) => {
  const w = await world(t)
  const created = await post(w.hub, w.ana, `${w.base}/roles`, {
    label: 'Vendas',
    connectors: {},
    personal: ['contato', 'endereco'],
  })
  assert.equal(created.statusCode, 201)
  assert.deepEqual(Object(created.json()).role.personal, ['contato', 'endereco'])
  assert.deepEqual(roleOf(await roles(w), 'vendas').personal, ['contato', 'endereco'])
  const refused = await post(w.hub, w.ana, `${w.base}/roles`, {
    label: 'Financeiro',
    connectors: {},
    personal: ['sensivel'],
  })
  assert.equal(codeOf(refused), 'REQUEST_MALFORMED')
})
