import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import type { StreamEvent } from './test-conversation.ts'
import {
  conversing,
  endOf,
  holding,
  KEY,
  PARTIAL,
  rolesAndParts,
  sent,
  started,
  stopped,
  streamOf,
  title,
} from './test-conversation.ts'
import { answerTo, ask, conversingWith, tool, untilCard, WHO } from './test-questions.ts'

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

function personStarts(events: StreamEvent[]) {
  return events.flatMap((event) =>
    event.type === 'message_start' && event.message.role !== 'assistant' ? [event.message] : [],
  )
}

/** What the person said into the run, as Mastra's live signal carries it (`data-user-message`). */
function saidIn(parts: MastraMessagePart[]): unknown[] {
  return parts.flatMap((part) =>
    part.type === 'data-user-message' && 'data' in part ? [Object(part.data).contents] : [],
  )
}

test('uma mensagem enquanto o Builder escreve entra na mesma volta: {ok: true}, um fim', async (t) => {
  const { hub, ana, companyId, held, calls, url, stream } = await holdingConversation(t)
  assert.equal((await sent(hub, ana, url, 'Crie um app de encomendas')).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)
  const steered = await sent(hub, ana, url, STEER)
  assert.deepEqual([steered.statusCode, steered.json()], [200, { ok: true }])
  held.release()
  const events = await stream.turn()
  const [person, ...others] = personStarts(events)
  assert.deepEqual(others, [])
  assert.ok(person)
  assert.equal(person.role, 'signal', "the person's message, where Mastra put it (42)")
  assert.deepEqual(saidIn(person.content.parts), [STEER])
  assert.equal(endOf(events), 'complete')
  assert.equal(events.filter((event) => event.type === 'agent_end').length, 1)
  assert.equal(steersIn(lastOf(calls)), 1)
  assert.ok(
    calls.every((each) => each.key === KEY),
    "the run took the message on the company's account",
  )
  assert.ok(companyId)
  const read = await rolesAndParts(hub, ana, url)
  assert.deepEqual(read, [
    ['person', [{ type: 'text', text: 'Crie um app de encomendas' }]],
    ['builder', [{ type: 'text', text: PARTIAL }]],
    ['person', [{ type: 'text', text: STEER }]],
    ['builder', [{ type: 'text', text: ANSWER }]],
  ])
})

test('Parar com uma mensagem que o Builder não leu: Mastra a leva à volta seguinte, uma vez (46)', async (t) => {
  const { hub, ana, held, calls, url, stream } = await holdingConversation(t)
  assert.equal((await sent(hub, ana, url, 'Crie um app de encomendas')).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)
  assert.equal((await sent(hub, ana, url, STEER)).statusCode, 200)
  assert.equal((await stopped(hub, ana, url)).statusCode, 200)
  held.release()
  assert.equal(endOf(await stream.turn()), 'aborted')
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.deepEqual(calls.map(steersIn), [0, 1])
  const read = await rolesAndParts(hub, ana, url)
  assert.deepEqual(read.slice(2), [
    ['person', [{ type: 'text', text: STEER }]],
    ['builder', [{ type: 'text', text: ANSWER }]],
  ])
})

const WHOEVER = { kind: 'answers', answers: ['Todos (recomendado)'] } as const

test('uma mensagem com a pergunta aberta: {ok: true}, Mastra a guarda até a resposta e a leva à volta que ela abre (44)', {
  timeout: 60_000,
}, async (t) => {
  const { hub, ana, url, stream, send, calls } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 200)
  const { card } = await untilCard(stream, 'question')
  const steered = await sent(hub, ana, url, STEER)
  assert.deepEqual([steered.statusCode, steered.json()], [200, { ok: true }])
  await sleep(1000)
  assert.equal(calls.length, 1, 'Mastra holds the message while the card is open')
  assert.equal((await answerTo(hub, ana, url, card.toolCallId, WHOEVER)).statusCode, 200)
  const events = await stream.turn()
  assert.equal(endOf(events), 'complete')
  assert.equal(events.filter((event) => event.type === 'agent_end').length, 1)
  assert.ok(calls.slice(1).some((each) => steersIn(each) > 0))
  const read = await rolesAndParts(hub, ana, url)
  assert.equal(
    read.filter(([role, parts]) => role === 'person' && JSON.stringify(parts).includes(STEER))
      .length,
    1,
  )
})

test('a volta que a resposta abre com a mensagem guardada vai pela conta da empresa e escreve na máquina do Projeto', {
  timeout: 60_000,
}, async (t) => {
  const write = tool('mastra_workspace_write_file', { path: 'src/quem.ts', content: 'eu\n' })
  const { hub, ana, url, stream, send, calls, companyId, projectId } = await conversingWith(t, [
    [ask(WHO)],
    [write],
  ])
  assert.equal((await send()).statusCode, 200)
  const { card } = await untilCard(stream, 'question')
  const asked = calls.length
  assert.equal((await sent(hub, ana, url, STEER)).statusCode, 200)
  assert.equal((await answerTo(hub, ana, url, card.toolCallId, WHOEVER)).statusCode, 200)
  assert.equal(endOf(await stream.turn()), 'complete')
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
