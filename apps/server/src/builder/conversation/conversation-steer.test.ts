import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { ConversationEvent } from '@conexus/hub-api'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { call, post } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import {
  conversing,
  holding,
  KEY,
  PARTIAL,
  rolesAndParts,
  sent,
  started,
  streamOf,
  title,
} from './test-conversation.ts'
import { ask, conversingWith, tool, untilCard, WHO } from './test-questions.ts'

const STEER = 'Só eu cadastro.'
const ANSWER = 'Certo, só você.'

/** How many of the call's texts carry the steer: Mastra wraps it as `<user delivery="while-active">`. */
function steersIn(asked: Sent): number {
  return asked.texts.filter((text) => text.includes(STEER)).length
}

/** A conversation whose first answer holds after `PARTIAL`; a call that has the steer answers at once. */
async function holdingConversation(
  t: Parameters<typeof holding>[0],
  afterSteer: Reply = { kind: 'text', text: ANSWER },
) {
  const held = holding(t)
  const calls: Sent[] = []
  const hub = await conversing(t, (asked) => {
    if (!asked.stream) return title(asked) ?? { kind: 'text', text: 'Título' }
    calls.push(asked)
    return steersIn(asked) > 0 ? afterSteer : held.reply
  })
  const url = `${hub.conversations}/${await started(hub.hub, hub.ana, hub.conversations)}`
  const stream = await streamOf(hub.hub, hub.ana, url)
  t.after(() => stream.close())
  return { ...hub, held, calls, url, stream }
}

function lastOf(calls: Sent[]): Sent {
  const last = calls.at(-1)
  assert.ok(last)
  return last
}

function personStarts(events: ConversationEvent[]) {
  return events.flatMap((event) =>
    event.type === 'message_start' && event.message.role === 'person' ? [event.message] : [],
  )
}

test('uma mensagem enquanto o Builder escreve entra na mesma volta: 202, um fim', async (t) => {
  const { hub, ana, companyId, held, calls, url, stream } = await holdingConversation(t)
  assert.equal((await sent(hub, ana, url, 'Crie um app de encomendas')).statusCode, 202)
  assert.equal(await stream.text(), PARTIAL)
  const key = randomUUID()
  const steered = await sent(hub, ana, url, STEER, key)
  assert.equal(steered.statusCode, 202, steered.body)
  held.release()
  const events = await stream.turn()
  const conversationId = url.split('/').at(-1)
  const [person, ...others] = personStarts(events)
  assert.deepEqual(others, [])
  assert.ok(person)
  assert.equal(person.id, `${conversationId}:${key}`)
  assert.deepEqual(person.parts, [{ type: 'text', text: STEER }])
  const starts = events.flatMap((event, at) =>
    event.type === 'message_start' ? [[at, event.message.role] as const] : [],
  )
  assert.deepEqual(
    starts.map(([, role]) => role),
    ['person', 'builder'],
  )
  assert.deepEqual(
    events.filter((event) => event.type === 'turnEnd'),
    [{ type: 'turnEnd', reason: 'complete' }],
  )
  assert.equal(steersIn(lastOf(calls)), 1)
  assert.ok(
    calls.every((each) => each.key === KEY),
    "the run took the message on the company's account",
  )
  assert.ok(companyId)
  const read = rolesAndParts(await call(hub, ana, 'GET', url))
  assert.deepEqual(read, [
    ['person', [{ type: 'text', text: 'Crie um app de encomendas' }]],
    ['builder', [{ type: 'text', text: PARTIAL }]],
    ['person', [{ type: 'text', text: STEER }]],
    ['builder', [{ type: 'text', text: ANSWER }]],
  ])
})

test('Parar com uma mensagem que o Builder não leu: ela não chega ao modelo', async (t) => {
  const { hub, ana, held, calls, url, stream } = await holdingConversation(t)
  assert.equal((await sent(hub, ana, url, 'Crie um app de encomendas')).statusCode, 202)
  assert.equal(await stream.text(), PARTIAL)
  const key = randomUUID()
  assert.equal((await sent(hub, ana, url, STEER, key)).statusCode, 202)
  assert.equal((await post(hub, ana, `${url}/stop`, {})).statusCode, 204)
  held.release()
  const events = await stream.turn()
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'aborted' })
  await sleep(1000)
  assert.ok(calls.every((each) => steersIn(each) === 0))
  assert.equal(calls.length, 1)
  const read = JSON.stringify(rolesAndParts(await call(hub, ana, 'GET', url)))
  assert.ok(!read.includes(STEER))
})

test('uma mensagem com pergunta aberta abre o turno seguinte e responde antes de ele acabar', async (t) => {
  const held = holding(t)
  const calls: Sent[] = []
  const hub = await conversing(t, (asked) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' }
    calls.push(asked)
    if (calls.length === 1) return { kind: 'blocks', blocks: [ask(WHO)] }
    return held.reply
  })
  const url = `${hub.conversations}/${await started(hub.hub, hub.ana, hub.conversations)}`
  const stream = await streamOf(hub.hub, hub.ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub.hub, hub.ana, url, 'Crie um app de encomendas')).statusCode, 202)
  // The question ends the turn that asked it.
  for (;;) {
    const event = await stream.next()
    if (event.type === 'turnEnd') break
  }
  const steering = sent(hub.hub, hub.ana, url, STEER)
  // Mastra gives an aborted parked run up to 5 s to end (`ABORT_STREAM_GRACE_MS`) before it accepts
  // the next; the answer comes then, with the next call still held, not when that call ends.
  const raced = await Promise.race([steering, sleep(15_000, 'pending')])
  assert.notEqual(raced, 'pending')
  assert.equal(Object(raced).statusCode, 202)
  held.release()
  const events = await stream.turn()
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal(events.filter((event) => event.type === 'turnEnd').length, 1)
  const read = rolesAndParts(await call(hub.hub, hub.ana, 'GET', url))
  assert.equal(
    read.filter(
      ([role, parts]: [string, unknown]) =>
        role === 'person' && JSON.stringify(parts).includes(STEER),
    ).length,
    1,
  )
})

test('a mensagem enviada durante a volta volta pelo Last-Event-ID e pelo quadro do turno', async (t) => {
  const again = holding(t)
  const { hub, ana, held, url, stream } = await holdingConversation(t, again.reply)
  assert.equal((await sent(hub, ana, url, 'Crie um app de encomendas')).statusCode, 202)
  assert.equal(await stream.text(), PARTIAL)
  assert.equal((await sent(hub, ana, url, STEER)).statusCode, 202)
  held.release()
  for (;;) {
    const event = await stream.next()
    if (event.type === 'message_start' && event.message.role === 'person') break
  }
  // The turn goes on, held again after the steer: a stream that reopens meets it in progress.
  const [opening] = stream.seen.ids
  assert.ok(opening)
  const resumed = await streamOf(hub, ana, url, opening)
  t.after(() => resumed.close())
  const replayed: ConversationEvent[] = []
  while (personStarts(replayed).length === 0) replayed.push(await resumed.next())
  assert.equal(personStarts(replayed).length, 1)
  const fresh = await streamOf(hub, ana, url)
  t.after(() => fresh.close())
  const opened = await fresh.next()
  assert.equal(opened.type, 'turn')
  const persons = Object(opened).messages.filter(
    (message: { role: string; parts: unknown }) =>
      message.role === 'person' && JSON.stringify(message.parts).includes(STEER),
  )
  assert.equal(persons.length, 1)
  again.release()
  await stream.turn()
})

test('a mesma mensagem com a mesma chave duas vezes: uma vez no modelo', async (t) => {
  const { hub, ana, held, calls, url, stream } = await holdingConversation(t)
  assert.equal((await sent(hub, ana, url, 'Crie um app de encomendas')).statusCode, 202)
  assert.equal(await stream.text(), PARTIAL)
  const key = randomUUID()
  assert.equal((await sent(hub, ana, url, STEER, key)).statusCode, 202)
  assert.equal((await sent(hub, ana, url, STEER, key)).statusCode, 202)
  held.release()
  await stream.turn()
  assert.equal(steersIn(lastOf(calls)), 1)
})

test('a volta que uma mensagem abre com a pergunta aberta vai pela conta da empresa e escreve na máquina do Projeto', {
  timeout: 60_000,
}, async (t) => {
  const write = tool('mastra_workspace_write_file', { path: 'src/quem.ts', content: 'eu\n' })
  const { hub, ana, url, stream, send, calls, companyId, projectId } = await conversingWith(t, [
    [ask(WHO)],
    [write],
  ])
  assert.equal((await send()).statusCode, 202)
  await untilCard(stream, 'question')
  const asked = calls.length
  assert.equal((await sent(hub, ana, url, 'Melhor: só eu cadastro.')).statusCode, 202)
  const events = await stream.turn()
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  const steered = calls.slice(asked)
  assert.ok(steered.length > 0)
  assert.ok(
    steered.every((each) => each.key === KEY),
    "the company's account",
  )
  assert.ok(steered.every((each) => each.tools.includes('mastra_workspace_write_file')))
  const repository = hub.builder.repository({
    companyId: CompanyId.parse(companyId),
    projectId: ProjectId.parse(projectId),
  })
  assert.equal(await repository.version(), 1)
  const files = (await repository.tree(await repository.main())) ?? []
  assert.ok(
    files.some((file) => file.path === 'src/quem.ts'),
    "the Projeto's machine wrote it",
  )
})
