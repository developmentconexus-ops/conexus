import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CARLA, call, codeOf, memberOn } from '../../hub/identity/test-hub.ts'
import {
  automating,
  created as automation,
  ended,
  ranNow,
  salesSummary,
} from '../automations/test-automations.ts'
import { holding, PARTIAL, sent, streamOf, title } from '../conversation/test-conversation.ts'
import { assisting, created, publishedApp } from './test-assistant.ts'

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

test('apagar com a resposta aberta: a resposta para, a máquina morre, o fio sai, e o app e as versões do Projeto ficam (2)', async (t) => {
  const held = holding(t)
  const on = await assisting(t, (asked) => title(asked) ?? held.reply)
  await publishedApp(on.hub, { ...on, personId: on.ana.id })
  const url = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [],
  })
  const stream = await streamOf(on.hub, on.ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(on.hub, on.ana, url, 'Uma pergunta')).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)

  const deleted = await call(on.hub, on.ana, 'DELETE', url)
  assert.equal(deleted.statusCode, 204, deleted.body)
  assert.deepEqual(on.hub.assistantMachines.killed, [idOf(url)])
  const read = await call(on.hub, on.ana, 'GET', url)
  assert.deepEqual([read.statusCode, codeOf(read)], [404, 'CONVERSATION_NOT_FOUND'])
  const [versions] = await on.hub.test.asOwner(
    'select count(*)::int as n from apps.app_version where project_id = $1',
    [on.projectId],
  )
  assert.equal(Object(versions).n, 1, 'the Projeto keeps its version')
})

test('apagar com a máquina que não morre: o fio fica e o próximo apagar o acha (3)', async (t) => {
  const on = await assisting(t)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const { api } = on.hub.assistantMachines.deps
  const kill = api.kill
  api.kill = async () => {
    throw new Error('the provider did not answer')
  }
  const failed = await call(on.hub, on.ana, 'DELETE', url)
  assert.notEqual(failed.statusCode, 204)
  assert.equal((await call(on.hub, on.ana, 'GET', url)).statusCode, 200, 'the thread stays')

  api.kill = kill
  const deleted = await call(on.hub, on.ana, 'DELETE', url)
  assert.equal(deleted.statusCode, 204, deleted.body)
  assert.equal((await call(on.hub, on.ana, 'GET', url)).statusCode, 404)
})

test('apagar a conversa aberta por uma automação: some só ela; a automação e o histórico ficam (4)', {
  timeout: 150_000,
}, async (t) => {
  const on = await automating(t)
  const made = await automation(on.hub, on.ana, on.automations, salesSummary([]))
  const at = `${on.automations}/${made.id}`
  const run = await ended(on.hub, on.ana, at, await ranNow(on.hub, on.ana, at))
  const conversationId = String(run.state.conversationId)
  const url = `${on.assistant}/${conversationId}`
  assert.equal((await call(on.hub, on.ana, 'GET', url)).statusCode, 200)

  const deleted = await call(on.hub, on.ana, 'DELETE', url)
  assert.equal(deleted.statusCode, 204, deleted.body)
  assert.equal((await call(on.hub, on.ana, 'GET', url)).statusCode, 404)
  const kept = Object((await call(on.hub, on.ana, 'GET', on.automations)).json()).automations
  assert.deepEqual(
    kept.map((each: { id: string }) => each.id),
    [made.id],
    'the automation stays',
  )
  const history = await call(on.hub, on.ana, 'GET', `${at}/runs`)
  assert.equal(Object(history.json()).runs.length, 1, 'its history stays')
})

test('apagar por quem saiu da empresa dá NOT_FOUND, a mesma recusa de toda rota da empresa (6)', async (t) => {
  const on = await assisting(t)
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const hers = await created(on.hub, carla, on.assistant, { connections: [] })
  const removed = await call(on.hub, on.ana, 'DELETE', `${on.company}/members/${carla.id}`)
  assert.equal(removed.statusCode, 204, removed.body)
  const refused = await call(on.hub, carla, 'DELETE', hers)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
})
