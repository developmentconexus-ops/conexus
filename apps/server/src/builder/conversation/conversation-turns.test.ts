import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ANA } from '../../hub/identity/test-hub.ts'
import { conversing, holding, sent, started, streamOf, title } from './test-conversation.ts'
import { dataOf, failuresOf } from './test-parts.ts'

const OBSERVER = /^You are the memory consciousness/

test('duas conversas do mesmo Projeto ao mesmo tempo: a segunda é aceita e termina RUN_BUSY com o nome de quem trabalha, sem chamar o modelo', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations, anthropic } = await conversing(
    t,
    (asked) => title(asked) ?? held.reply,
  )
  const urls = [
    `${conversations}/${await started(hub, ana, conversations)}`,
    `${conversations}/${await started(hub, ana, conversations)}`,
  ]
  const [working, refused] = await Promise.all(urls.map((url) => streamOf(hub, ana, url)))
  assert.ok(working && refused)
  t.after(() => working.close())
  t.after(() => refused.close())
  assert.equal((await sent(hub, ana, urls[0] ?? '', 'Primeira')).statusCode, 202)
  await working.text()
  function modelCalls() {
    return anthropic.sent.filter((each) => each.stream && !OBSERVER.test(each.system)).length
  }
  const before = modelCalls()
  assert.equal((await sent(hub, ana, urls[1] ?? '', 'Outra')).statusCode, 202)
  const events = await refused.turn()
  assert.deepEqual(dataOf(events, 'data-conexus-failure'), [{ code: 'RUN_BUSY', person: ANA.name }])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'error' })
  assert.equal(modelCalls(), before, 'the refused run calls no model')
  held.release()
  assert.deepEqual(failuresOf(await working.turn()), [])
})
