import assert from 'node:assert/strict'
import { test } from 'node:test'
import { codeOf } from '../../hub/identity/test-hub.ts'
import { conversing, sent, started, streamOf, title } from './test-conversation.ts'
import { failuresOf } from './test-parts.ts'

test('duas conversas do mesmo Projeto ao mesmo tempo: uma abre o turno, a outra é RUN_BUSY, e o fim diz a falha do turno', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (asked) => title(asked) ?? { kind: 'refuse', status: 401 },
  )
  const urls = [
    `${conversations}/${await started(hub, ana, conversations)}`,
    `${conversations}/${await started(hub, ana, conversations)}`,
  ]
  const streams = await Promise.all(urls.map((url) => streamOf(hub, ana, url)))
  for (const stream of streams) t.after(() => stream.close())
  const both = await Promise.all(urls.map((url) => sent(hub, ana, url, 'Primeira')))
  assert.deepEqual(both.map((response) => response.statusCode).sort(), [202, 409])
  const refused = both.find((response) => response.statusCode === 409)
  assert.ok(refused)
  assert.equal(codeOf(refused), 'RUN_BUSY')
  const opened = streams[both.findIndex((response) => response.statusCode === 202)]
  assert.ok(opened)
  assert.deepEqual(failuresOf(await opened.turn()), ['MODEL_NO_ACCOUNT'])
})
