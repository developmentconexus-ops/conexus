import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { BRUNO, call, memberOn, post } from '../../hub/identity/test-hub.ts'
import { assisting } from './test-assistant.ts'

type Shown = { connections: { connectionId: string; name: string; chosen: boolean }[] }

/** Empresa Teste with Bruno on a role that reaches no operation of either Sankhya connection. */
async function unreached(t: TestContext) {
  const on = await assisting(t)
  const made = await post(on.hub, on.ana, `${on.company}/roles`, { label: 'Vazio', connectors: {} })
  assert.equal(made.statusCode, 201, made.body)
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, String(Object(made.json()).role.role))
  return { on, bruno }
}

function names(response: { json(): unknown }): string[] {
  const shown: Shown = Object(response.json()).conversation ?? Object(response.json())
  return shown.connections.map((each) => each.name)
}

async function rowOf(on: Awaited<ReturnType<typeof assisting>>, id: string) {
  const [row] = await on.hub.test.asOwner(
    'select connections from builder.assistant_conversation where id = $1',
    [id],
  )
  return Object(row).connections
}

test('a lista não oferece a conexão fora do alcance: Vazio recebe [] na empresa e no Projeto; a dona, as do lugar', async (t) => {
  const { on, bruno } = await unreached(t)
  const offered = `${on.company}/assistant/connections`
  const inProject = `${offered}?projectId=${on.projectId}`
  for (const at of [offered, inProject]) {
    const listed = await call(on.hub, bruno, 'GET', at)
    assert.equal(listed.statusCode, 200, listed.body)
    assert.deepEqual(names(listed), [], at)
  }
  assert.deepEqual(names(await call(on.hub, on.ana, 'GET', offered)), ['Matriz', 'Filial'])
  assert.deepEqual(names(await call(on.hub, on.ana, 'GET', inProject)), ['Matriz'])
})

test('criar: ela não fica, nem na escolha, nem em connections, nem na linha', async (t) => {
  const { on, bruno } = await unreached(t)
  const body = { connections: [on.matriz, on.filial] }
  const made = await post(on.hub, bruno, on.assistant, body, randomUUID())
  assert.equal(made.statusCode, 201, made.body)
  assert.deepEqual(names(made), [])
  assert.deepEqual(await rowOf(on, String(Object(made.json()).conversation.id)), [])
})

test('trocar: ela não fica, nem na resposta, nem na linha', async (t) => {
  const { on, bruno } = await unreached(t)
  const made = await post(on.hub, bruno, on.assistant, { connections: [] }, randomUUID())
  assert.equal(made.statusCode, 201, made.body)
  const id = String(Object(made.json()).conversation.id)
  const changed = await call(on.hub, bruno, 'PUT', `${on.assistant}/${id}/connections`, {
    connections: [on.matriz],
  })
  assert.equal(changed.statusCode, 200, changed.body)
  assert.deepEqual(names(changed), [])
  assert.deepEqual(await rowOf(on, id), [])
})

test('a conversa lida não a nomeia; a da dona lista as do lugar com chosen da linha', async (t) => {
  const { on, bruno } = await unreached(t)
  const his = await post(on.hub, bruno, on.assistant, { connections: [] }, randomUUID())
  const read = await call(
    on.hub,
    bruno,
    'GET',
    `${on.assistant}/${String(Object(his.json()).conversation.id)}`,
  )
  assert.equal(read.statusCode, 200, read.body)
  assert.deepEqual(names(read), [])
  const hers = await post(on.hub, on.ana, on.assistant, { connections: [on.filial] }, randomUUID())
  const id = String(Object(hers.json()).conversation.id)
  const shown: Shown = Object(
    (await call(on.hub, on.ana, 'GET', `${on.assistant}/${id}`)).json(),
  ).conversation
  assert.deepEqual(
    shown.connections.map((each) => [each.name, each.chosen]),
    [
      ['Matriz', false],
      ['Filial', true],
    ],
  )
  assert.deepEqual(await rowOf(on, id), [on.filial])
})
