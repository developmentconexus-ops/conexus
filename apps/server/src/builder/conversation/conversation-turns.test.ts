import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { ANA_OWNER, call, codeOf } from '../../hub/identity/test-hub.ts'
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

test('duas mensagens ao mesmo tempo no Projeto: uma abre o turno, a outra é RUN_BUSY, e o fim diz a falha do turno', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (asked) => title(asked) ?? { kind: 'refuse', status: 401 },
  )
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  const both = await Promise.all([sent(hub, ana, url, 'Primeira'), sent(hub, ana, url, 'Segunda')])
  assert.deepEqual(both.map((response) => response.statusCode).sort(), [202, 409])
  const refused = both.find((response) => response.statusCode === 409)
  assert.ok(refused)
  assert.equal(codeOf(refused), 'RUN_BUSY')
  const events = await stream.turn()
  assert.deepEqual(failuresOf(events), ['MODEL_NO_ACCOUNT'])
})

test('uma segunda pergunta durante a resposta: RUN_BUSY e fica fora da conversa; depois do fim, a mesma pergunta passa', async (t) => {
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
  const key = randomUUID()
  const busy = await sent(hub, ana, url, 'Segunda', key)
  assert.equal(codeOf(busy), 'RUN_BUSY')
  assert.equal(Object(busy.json()).person, ANA_OWNER.name)
  assert.equal(Object(busy.json()).title, `O Builder está mudando este app para ${ANA_OWNER.name}.`)
  const first = [['person', [{ type: 'text', text: 'Primeira' }]]]
  assert.deepEqual(rolesAndParts(await call(hub, ana, 'GET', url)), first)
  held.release()
  assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal((await sent(hub, ana, url, 'Segunda', key)).statusCode, 202)
  assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  const read = rolesAndParts(await call(hub, ana, 'GET', url))
  const persons = read.filter(([role]: [string]) => role === 'person')
  assert.deepEqual(persons, [...first, ['person', [{ type: 'text', text: 'Segunda' }]]])
})
