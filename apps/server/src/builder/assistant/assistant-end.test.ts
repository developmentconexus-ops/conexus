import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { call } from '../../hub/identity/test-hub.ts'
import { hubBeside } from '../conversation/test-beside.ts'
import {
  conversing,
  endOf,
  holding,
  messagesOf,
  PARTIAL,
  sent,
  streamOf,
  title,
} from '../conversation/test-conversation.ts'
import { failuresOf } from '../conversation/test-parts.ts'
import { assisting, created, reading, said, talking } from './test-assistant.ts'

/** Whether `promise` settles within `ms`. */
async function within(promise: Promise<unknown>, ms: number): Promise<'settled' | 'hung'> {
  const late = new Promise<'hung'>((done) => setTimeout(() => done('hung'), ms).unref())
  return Promise.race([promise.then(() => 'settled' as const), late])
}

/** A Hub beside the test's one, with an Assistant's conversation whose answer holds after `PARTIAL`. */
async function answering(t: TestContext) {
  const held = holding(t)
  const { hub, ana, companyId } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const stopping = await hubBeside(t, hub)
  const assistant = `/api/companies/${companyId}/assistant/conversations`
  const url = await created(stopping, ana, assistant, { connections: [] })
  const stream = await streamOf(stopping, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(stopping, ana, url, 'Uma pergunta')).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)
  return { held, hub, ana, assistant, stopping, url, stream }
}

test('o fim do Hub: no aviso de parar, o turno do Assistente é esperado, uma pergunta nova recebe HUB_UPDATING, e o Hub fecha depois', {
  timeout: 60_000,
}, async (t) => {
  const { held, ana, assistant, stopping, url, stream } = await answering(t)
  const other = await created(stopping, ana, assistant, { connections: [] })
  const stopped = stopping.close(30_000)
  assert.equal(await within(stopped, 500), 'hung', 'the Hub waits for the answer')
  for (const each of [other, url]) {
    const refused = await sent(stopping, ana, each, 'Outra pergunta')
    assert.equal(refused.statusCode, 503)
    assert.equal(Object(refused.json()).code, 'HUB_UPDATING')
  }
  held.release()
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.equal(await within(stopped, 10_000), 'settled')
})

test('o fim do Hub: passado o limite, o turno do Assistente é parado como o do Builder, diz HUB_UPDATED, e o fim acaba no prazo; a conversa segue no Hub seguinte', {
  timeout: 60_000,
}, async (t) => {
  const { held, hub, ana, stopping, url, stream } = await answering(t)
  const stopped = stopping.close(300)
  const events = await stream.turn()
  assert.equal(endOf(events), 'aborted')
  assert.deepEqual(failuresOf(events), ['HUB_UPDATED'])
  assert.equal(await within(stopped, 10_000), 'settled', 'the stop ends within its deadline')
  held.release()
  const next = await talking(t, hub, ana, url)
  assert.equal(endOf(await next.say('E agora?')), 'complete')
})

test('depois do reinício: um Hub novo sobre o mesmo banco continua o fio da conversa de Projeto, com as marcas e a escolha dela; a lista e a remoção a acham', async (t) => {
  const on = await assisting(t, [[reading()], [said('Uma.')], [reading()]])
  const url = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Quantas?')), 'complete')
  const restarted = await hubBeside(t, on.hub)
  assert.equal(endOf(await (await talking(t, restarted, on.ana, url)).say('E hoje?')), 'complete')

  const messages = await messagesOf(restarted, on.ana, url)
  assert.deepEqual(
    messages.filter((each) => each.role === 'person').length,
    2,
    'one thread holds both questions',
  )
  const afterRestart = on.calls.at(-1)
  assert.match(String(afterRestart?.systems.at(1)?.text), /Place: Projeto "Encomendas"/)
  assert.ok(afterRestart?.texts.some((text) => text.includes('"kind":"OK"')))
  const listed = Object((await call(restarted, on.ana, 'GET', on.assistant)).json())
  assert.deepEqual(
    listed.conversations.map((each: { id: string }) => each.id),
    [url.slice(url.lastIndexOf('/') + 1)],
  )
  const project = `${on.company}/projects/${on.projectId}`
  const deleted = await call(restarted, on.ana, 'DELETE', project, { name: 'Encomendas' })
  assert.equal(deleted.statusCode, 204, deleted.body)
  const gone = await call(restarted, on.ana, 'GET', url)
  assert.equal(Object(gone.json()).code, 'CONVERSATION_NOT_FOUND')
})
