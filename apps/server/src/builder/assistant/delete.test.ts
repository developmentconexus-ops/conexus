import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CARLA, call, codeOf, memberOn } from '../../hub/identity/test-hub.ts'
import { assisting, created } from './test-assistant.ts'

function idOf(url: string) {
  return url.slice(url.lastIndexOf('/') + 1)
}

type Listed = { conversations: { id: string; title: string | null }[] }

test('apagar: a própria conversa dá 204, some da lista e da leitura, e a de outra pessoa ou repetida dá CONVERSATION_NOT_FOUND (1, 3)', async (t) => {
  const on = await assisting(t)
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const mine = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const hers = await created(on.hub, carla, on.assistant, { connections: [] })
  const { killed } = on.hub.assistantMachines

  const refused = await call(on.hub, on.ana, 'DELETE', hers)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'CONVERSATION_NOT_FOUND'])
  assert.equal((await call(on.hub, carla, 'GET', hers)).statusCode, 200, 'hers is untouched')

  const deleted = await call(on.hub, on.ana, 'DELETE', mine)
  assert.equal(deleted.statusCode, 204, deleted.body)
  assert.deepEqual(killed, [idOf(mine)])
  const read = await call(on.hub, on.ana, 'GET', mine)
  assert.deepEqual([read.statusCode, codeOf(read)], [404, 'CONVERSATION_NOT_FOUND'])
  const listed: Listed = Object((await call(on.hub, on.ana, 'GET', on.assistant)).json())
  assert.deepEqual(
    listed.conversations.map((each) => each.id),
    [],
  )

  const again = await call(on.hub, on.ana, 'DELETE', mine)
  assert.deepEqual([again.statusCode, codeOf(again)], [404, 'CONVERSATION_NOT_FOUND'])
})

test('apagar: sem sessão dá SESSION_REQUIRED e nada se apaga (6)', async (t) => {
  const on = await assisting(t)
  const mine = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const response = await call(on.hub, { ...on.ana, cookie: '' }, 'DELETE', mine)
  assert.equal(codeOf(response), 'SESSION_REQUIRED')
  assert.equal((await call(on.hub, on.ana, 'GET', mine)).statusCode, 200)
})
