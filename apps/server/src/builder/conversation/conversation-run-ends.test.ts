import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ANA } from '../../hub/identity/test-hub.ts'
import { hubBeside } from './test-beside.ts'
import {
  conversing,
  endOf,
  holding,
  PARTIAL,
  sent,
  started,
  streamOf,
  title,
} from './test-conversation.ts'
import { dataOf, failuresOf } from './test-parts.ts'

/** Whether `promise` settles within `ms`. */
async function within(promise: Promise<unknown>, ms: number): Promise<'settled' | 'hung'> {
  const late = new Promise<'hung'>((done) => setTimeout(() => done('hung'), ms).unref())
  return Promise.race([promise.then(() => 'settled' as const), late])
}

test('o Mastra não consegue guardar a resposta no fim do turno: o turno termina, e desligar não espera para sempre', {
  timeout: 60_000,
}, async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const closing = await hubBeside(t, hub)
  const url = `${conversations}/${await started(closing, ana, conversations)}`
  const stream = await streamOf(closing, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(closing, ana, url, 'Uma pergunta')).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)
  const pool = hub.test.mastraPool
  await pool.query('alter table mastra.mastra_messages rename to mastra_messages_out')
  held.release()
  assert.equal(await within(stream.turn(), 10_000), 'settled', 'the turn ends')
  await pool.query('alter table mastra.mastra_messages_out rename to mastra_messages')
  assert.equal(await within(closing.close(), 10_000), 'settled', 'the close does not hang')
})

test('desligar no meio do turno o para como Parar: o fim diz parado, a versão fica guardada e o desligar acaba dentro do prazo', {
  timeout: 60_000,
}, async (t) => {
  const held = holding(t)
  const write = {
    type: 'tool_use',
    name: 'mastra_workspace_write_file',
    input: { path: 'a.ts', content: 'x\n' },
  } as const
  let step = 0
  const { hub, ana, conversations } = await conversing(t, (asked) => {
    if (title(asked) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    return step === 1 ? { kind: 'blocks', blocks: [write] } : held.reply
  })
  const closing = await hubBeside(t, hub)
  const url = `${conversations}/${await started(closing, ana, conversations)}`
  const stream = await streamOf(closing, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(closing, ana, url, 'Crie o app')).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)
  const closed = closing.close()
  const events = await stream.turn()
  assert.equal(endOf(events), 'aborted')
  assert.deepEqual(
    dataOf(events, 'data-conexus-version').map((version) => Object(version).number),
    [1],
  )
  assert.equal(await within(closed, 10_000), 'settled', 'the close ends within the deadline')
})

test('a linha cai e o turno acaba sem ela: o stream seguinte abre dizendo que nada está em curso', {
  timeout: 60_000,
}, async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const first = await streamOf(hub, ana, url)
  t.after(() => first.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 200)
  assert.equal(await first.text(), PARTIAL)
  first.close()
  held.release()
  for (let attempt = 0; ; attempt += 1) {
    const again = await streamOf(hub, ana, url)
    const running = (await again.seed()).isRunning
    again.close()
    if (!running) break
    assert.ok(attempt < 50, 'the session says the run is over')
    await new Promise((done) => setTimeout(done, 100))
  }
})

test('a execução recusada termina uma vez e solta só a trava da sua conversa: a outra segue dona do Projeto (48)', {
  timeout: 60_000,
}, async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const [working, refused] = [
    `${conversations}/${await started(hub, ana, conversations)}`,
    `${conversations}/${await started(hub, ana, conversations)}`,
  ]
  const onWorking = await streamOf(hub, ana, working)
  t.after(() => onWorking.close())
  const onRefused = await streamOf(hub, ana, refused)
  t.after(() => onRefused.close())
  assert.equal((await sent(hub, ana, working, 'Primeira')).statusCode, 200)
  assert.equal(await onWorking.text(), PARTIAL)
  const busy = [{ code: 'RUN_BUSY', person: ANA.name }]
  for (const message of ['Outra', 'Mais uma']) {
    assert.equal((await sent(hub, ana, refused, message)).statusCode, 200)
    const events = await onRefused.turn()
    assert.deepEqual(dataOf(events, 'data-conexus-failure'), busy, "still the other's Projeto")
    assert.equal(events.filter((event) => event.type === 'agent_end').length, 1)
  }
  held.release()
  assert.deepEqual(failuresOf(await onWorking.turn()), [])
  assert.equal((await sent(hub, ana, refused, 'Agora')).statusCode, 200)
  assert.deepEqual(failuresOf(await onRefused.turn()), [], 'the Projeto is free once the run ends')
})
