import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call } from '../../hub/identity/test-hub.ts'
import { conversing, KEY, sent, started, streamOf } from './test-conversation.ts'

test('um turno: a resposta vem aos poucos, a conversa ganha título e o Mastra guarda a empresa no dono', async (t) => {
  const { hub, ana, companyId, conversations, anthropic } = await conversing(t, (asked) =>
    asked.stream
      ? { kind: 'text', text: 'Olá, Ana. Vamos comparar os apps.' }
      : { kind: 'text', text: 'Apps de encomenda' },
  )
  const id = await started(hub, ana, conversations)
  const url = `${conversations}/${id}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal(
    (await sent(hub, ana, url, 'Compare dois apps de encomenda de padaria')).statusCode,
    202,
  )
  const events = await stream.turn()
  const text = events.flatMap((event) => (event.type === 'text' ? [event.delta] : [])).join('')
  assert.equal(text, 'Olá, Ana. Vamos comparar os apps.')
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.ok(anthropic.sent.every((each) => each.key === KEY))
  const read = Object((await call(hub, ana, 'GET', url)).json()).conversation
  assert.deepEqual(
    read.messages.map((message: { role: string; parts: unknown[] }) => [
      message.role,
      message.parts,
    ]),
    [
      ['person', [{ type: 'text', text: 'Compare dois apps de encomenda de padaria' }]],
      ['builder', [{ type: 'text', text: 'Olá, Ana. Vamos comparar os apps.' }]],
    ],
  )
  assert.equal(read.model, 'anthropic/claude-sonnet-4-5')
  const threads = await hub.test.mastraPool.query(
    'select "resourceId" from mastra.mastra_threads where id = $1',
    [id],
  )
  assert.deepEqual(threads.rows, [{ resourceId: `company:${companyId}:person:${ana.id}` }])
  const indexed = await hub.test.asOwner(
    `select company_id, person_id from builder.conversation where id = $1`,
    [id],
  )
  assert.deepEqual(indexed, [{ company_id: companyId, person_id: ana.id }])
})
