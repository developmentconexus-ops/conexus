import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CARLA, call, codeOf, memberOn } from '../../hub/identity/test-hub.ts'
import { assisting, created } from './test-assistant.ts'

test('renomear: o título fica na lista, e um título vazio ou longo demais é REQUEST_MALFORMED (5)', async (t) => {
  const on = await assisting(t)
  const mine = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const renamed = await call(on.hub, on.ana, 'PATCH', mine, { title: '  Pedidos de outubro ' })
  assert.equal(renamed.statusCode, 200, renamed.body)
  assert.equal(Object(renamed.json()).title, 'Pedidos de outubro')
  const read = await call(on.hub, on.ana, 'GET', mine)
  assert.equal(Object(read.json()).conversation.title, 'Pedidos de outubro')
  for (const title of ['   ', 'a'.repeat(121)]) {
    const refused = await call(on.hub, on.ana, 'PATCH', mine, { title })
    assert.deepEqual([refused.statusCode, codeOf(refused)], [400, 'REQUEST_MALFORMED'])
  }
  const hers = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const other = await call(on.hub, hers, 'PATCH', mine, { title: 'De outra pessoa' })
  assert.deepEqual([other.statusCode, codeOf(other)], [404, 'CONVERSATION_NOT_FOUND'])
})
