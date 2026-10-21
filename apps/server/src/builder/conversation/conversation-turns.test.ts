import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call } from '../../hub/identity/test-hub.ts'
import {
  conversing,
  failuresOf,
  holding,
  PARTIAL,
  rolesAndParts,
  sent,
  started,
  streamOf,
  title,
} from './test-conversation.ts'

test('duas mensagens ao mesmo tempo: uma acorda o turno, a outra entra nele, e o fim diz a falha do turno', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (asked) => title(asked) ?? { kind: 'refuse', status: 401 },
  )
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  const both = await Promise.all([sent(hub, ana, url, 'Primeira'), sent(hub, ana, url, 'Segunda')])
  assert.deepEqual(
    both.map((response) => response.statusCode),
    [202, 202],
  )
  const events = await stream.turn()
  assert.deepEqual(failuresOf(events), ['MODEL_NO_ACCOUNT'])
})

test('uma segunda pergunta durante a resposta: as duas ficam na conversa, antes e depois de salvas', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' }
    return asked.texts.includes('Segunda') ? { kind: 'text', text: 'Resposta' } : held.reply
  })
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Primeira')).statusCode, 202)
  assert.deepEqual(await stream.said(), { type: 'text', delta: PARTIAL })
  assert.equal((await sent(hub, ana, url, 'Segunda')).statusCode, 202)
  const asked = [
    ['person', [{ type: 'text', text: 'Primeira' }]],
    ['person', [{ type: 'text', text: 'Segunda' }]],
  ]
  assert.deepEqual(rolesAndParts(await call(hub, ana, 'GET', url)), asked)
  held.release()
  assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  const read = rolesAndParts(await call(hub, ana, 'GET', url))
  const persons = read.filter(([role]: [string]) => role === 'person')
  assert.deepEqual(persons, asked)
})
