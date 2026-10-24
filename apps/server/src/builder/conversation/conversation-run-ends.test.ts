import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call } from '../../hub/identity/test-hub.ts'
import {
  conversing,
  holding,
  hubBeside,
  PARTIAL,
  sent,
  started,
  streamOf,
  title,
} from './test-conversation.ts'

/** Whether `promise` settles within `ms`. */
async function within(promise: Promise<unknown>, ms: number): Promise<'settled' | 'hung'> {
  const late = new Promise<'hung'>((done) => setTimeout(() => done('hung'), ms).unref())
  return Promise.race([promise.then(() => 'settled' as const), late])
}

function inProgressOf(read: { json(): unknown }): unknown {
  const body = read.json()
  assert.ok(typeof body === 'object' && body !== null && 'conversation' in body)
  const { conversation } = body
  assert.ok(typeof conversation === 'object' && conversation !== null)
  return 'inProgress' in conversation ? conversation.inProgress : undefined
}

test('o Mastra não consegue guardar a resposta no fim do turno: o turno termina, e desligar não espera para sempre', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const closing = await hubBeside(t, hub)
  const url = `${conversations}/${await started(closing, ana, conversations)}`
  const stream = await streamOf(closing, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(closing, ana, url, 'Uma pergunta')).statusCode, 202)
  assert.equal(await stream.text(), PARTIAL)
  const pool = hub.test.mastraPool
  await pool.query('alter table mastra.mastra_messages rename to mastra_messages_out')
  held.release()
  assert.equal(await within(stream.turn(), 10_000), 'settled', 'the turn ends')
  await pool.query('alter table mastra.mastra_messages_out rename to mastra_messages')
  assert.equal(await within(closing.close(), 10_000), 'settled', 'the close does not hang')
})

test('a linha cai e o turno acaba sem ela: a leitura diz que nenhum turno está em curso, para a tela sair de "trabalhando"', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const first = await streamOf(hub, ana, url)
  t.after(() => first.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 202)
  assert.equal(await first.text(), PARTIAL)
  assert.equal(inProgressOf(await call(hub, ana, 'GET', url)), true)
  first.close()
  held.release()
  for (let attempt = 0; inProgressOf(await call(hub, ana, 'GET', url)) !== false; attempt += 1) {
    assert.ok(attempt < 50, 'the read says the turn is over')
    await new Promise((done) => setTimeout(done, 100))
  }
})
