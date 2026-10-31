import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call } from '../../hub/identity/test-hub.ts'
import {
  conversing,
  endOf,
  holding,
  hubBeside,
  messagesOf,
  PARTIAL,
  sent,
  sessionUrl,
  settledOf,
  started,
  streamOf,
  title,
} from './test-conversation.ts'
import { failuresIn, failuresOf } from './test-parts.ts'

/** Whether `promise` settles within `ms`. */
async function within(promise: Promise<unknown>, ms: number): Promise<'settled' | 'hung'> {
  const late = new Promise<'hung'>((done) => setTimeout(() => done('hung'), ms).unref())
  return Promise.race([promise.then(() => 'settled' as const), late])
}

/** The lines the stopping Hub logs. */
function logged() {
  const lines: { fields: Record<string, unknown>; message: string }[] = []
  const log: Parameters<typeof hubBeside>[2] = {
    info: (fields, message) => lines.push({ fields, message }),
    error: (fields, message) => lines.push({ fields, message }),
  }
  return { log, line: (message: string) => lines.find((one) => one.message === message)?.fields }
}

/** A Hub beside the test's one, with a conversation whose answer holds after `PARTIAL`. */
async function answering(t: Parameters<typeof holding>[0]) {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const { log, line } = logged()
  const stopping = await hubBeside(t, hub, log)
  const url = `${conversations}/${await started(stopping, ana, conversations)}`
  const stream = await streamOf(stopping, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(stopping, ana, url, 'Uma pergunta')).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)
  return { held, hub, ana, conversations, stopping, url, stream, line }
}

test('termina antes de fechar: no aviso de parar, a resposta em andamento termina e é guardada, e o Hub só fecha depois (0a)', {
  timeout: 60_000,
}, async (t) => {
  const { held, hub, ana, stopping, url, stream, line } = await answering(t)
  const stopped = stopping.close(30_000)
  assert.equal(await within(stopped, 500), 'hung', 'the Hub waits for the answer')
  held.release()
  const events = await stream.turn()
  assert.equal(endOf(events), 'complete')
  assert.deepEqual(failuresOf(events), [])
  assert.equal(await within(stopped, 10_000), 'settled')
  assert.deepEqual(line('SHUTDOWN_DRAINING'), { inFlight: 1 })
  assert.equal(line('SHUTDOWN_DRAINED')?.finished, 1)
  assert.equal(line('SHUTDOWN_DRAINED')?.left, 0)
  const answer = (await settledOf(hub, ana, url)).at(-1)
  assert.equal(answer?.role, 'builder')
  assert.deepEqual(failuresIn(answer?.parts ?? []), [])
  assert.ok(answer?.parts.some((part) => part.type === 'text' && part.text.startsWith(PARTIAL)))
})

test('a resposta nova: durante a espera uma mensagem nova é recusada com HUB_UPDATING, e ler a conversa, o estado e o fluxo continuam (0b)', {
  timeout: 60_000,
}, async (t) => {
  const { held, ana, conversations, stopping, url, stream } = await answering(t)
  const other = `${conversations}/${await started(stopping, ana, conversations)}`
  const stopped = stopping.close(30_000)
  for (const each of [other, url]) {
    const refused = await sent(stopping, ana, each, 'Outra pergunta')
    assert.equal(refused.statusCode, 503)
    assert.equal(Object(refused.json()).code, 'HUB_UPDATING')
  }
  assert.equal((await call(stopping, ana, 'GET', sessionUrl(url))).statusCode, 200)
  await messagesOf(stopping, ana, url)
  const opened = await streamOf(stopping, ana, other)
  t.after(() => opened.close())
  held.release()
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.equal(await within(stopped, 10_000), 'settled')
})

test('o limite: a resposta que passa da espera é parada como Parar, guardada com o que escreveu, e diz HUB_UPDATED (0c)', {
  timeout: 60_000,
}, async (t) => {
  const { hub, ana, stopping, url, stream, line } = await answering(t)
  const stopped = stopping.close(300)
  const events = await stream.turn()
  assert.equal(endOf(events), 'aborted')
  assert.deepEqual(failuresOf(events), ['HUB_UPDATED'])
  assert.equal(await within(stopped, 10_000), 'settled', 'the stop ends within its deadline')
  assert.equal(line('SHUTDOWN_DRAINED')?.finished, 0)
  assert.equal(line('SHUTDOWN_DRAINED')?.left, 1)
  const ended = line('CONVERSATION_TURN_ENDED')
  assert.equal(ended?.errorCode, 'HUB_UPDATED')
  const answer = (await settledOf(hub, ana, url)).filter((one) => one.role === 'builder')
  const parts = answer.flatMap((one) => one.parts)
  assert.deepEqual(failuresIn(parts), ['HUB_UPDATED'])
  assert.ok(parts.some((part) => part.type === 'text' && part.text.startsWith(PARTIAL)))
})

test('sem respostas: o fim do Hub não espera nada a mais que hoje (0e)', {
  timeout: 60_000,
}, async (t) => {
  const { hub } = await conversing(t, (asked) => title(asked) ?? { kind: 'text', text: 'Feito.' })
  const { log, line } = logged()
  const stopping = await hubBeside(t, hub, log)
  assert.equal(await within(stopping.close(30_000), 2_000), 'settled')
  assert.deepEqual(line('SHUTDOWN_DRAINING'), { inFlight: 0 })
  assert.equal(line('SHUTDOWN_DRAINED')?.left, 0)
  assert.ok(Number(line('SHUTDOWN_DRAINED')?.waitedMs) < 100)
})
