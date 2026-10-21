import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ConversationEvent } from '@conexus/hub-api'
import { call } from '../../hub/identity/test-hub.ts'
import {
  asked,
  conversing,
  hubBeside,
  messagesOf,
  sent,
  started,
  streamOf,
} from './test-conversation.ts'
import { citing, FETCH_ERROR, PAGES, printedOf, researching, UNREACHABLE } from './test-research.ts'

type Part = Extract<ConversationEvent, { type: 'part' }>['part']

/** The parts a turn said, in order, each as the stream said it. */
function partsOf(events: ConversationEvent[]): Part[] {
  return events.flatMap((event) => (event.type === 'part' ? [event.part] : []))
}

/** Each tool's states in the order the stream said them, by its id. */
function toolStates(events: ConversationEvent[]) {
  const states = new Map<string, { kind: string; subject: unknown; states: string[] }>()
  for (const part of partsOf(events)) {
    if (part.type !== 'tool') continue
    const seen = states.get(part.id) ?? { kind: part.kind, subject: part.subject, states: [] }
    seen.states.push(part.state)
    states.set(part.id, seen)
  }
  return [...states.values()]
}

test('um turno pensa, pesquisa e lê três páginas: o pensamento roda e termina com segundos, cada ferramenta roda e termina', async (t) => {
  const { hub, ana, conversations } = await conversing(t, await researching(t))
  const { events } = await asked(t, { hub, person: ana, conversations })
  const thinking = partsOf(events).filter((part) => part.type === 'reasoning')
  assert.deepEqual(
    thinking.map((part) => part.state),
    ['running', 'completed'],
  )
  assert.equal(thinking[0]?.seconds, null)
  assert.ok(Number.isInteger(thinking[1]?.seconds), 'the thinking ends with its seconds')
  assert.deepEqual(toolStates(events).slice(0, 4), [
    {
      kind: 'search_web',
      subject: { query: 'apps de encomenda de padaria' },
      states: ['running', 'completed'],
    },
    ...PAGES.map((url) => ({
      kind: 'read_page',
      subject: { url, title: null },
      states: ['running', 'completed'],
    })),
  ])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
})

test('o pensamento, os argumentos, os resultados e o erro de uma ferramenta não saem no stream, na leitura nem no log', async (t) => {
  const printed = printedOf(t)
  const { hub, ana, conversations, lines, anthropic } = await conversing(
    t,
    await researching(t),
    (config) => ({
      ...config,
      logLevel: 'info',
    }),
  )
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Compare as padarias')).statusCode, 202)
  await stream.turn()
  const given = anthropic.sent.flatMap((each) => each.texts).join('\n')
  assert.ok(given.includes(FETCH_ERROR), 'the failed fetch told the model its error')
  const read = await call(hub, ana, 'GET', url)
  assert.equal(read.statusCode, 200)
  for (const text of [stream.seen.raw, read.body, JSON.stringify(lines), printed.join('')]) {
    assert.doesNotMatch(
      text,
      /SECRET-PLANTED-TEXT|secret-planted-text|Vou pesquisar|Conteúdo|ENOTFOUND/,
    )
  }
})

test('uma ferramenta que falha fica `error`, sem o texto do erro; uma desconhecida é `other`, recusada (`denied`)', async (t) => {
  const { hub, ana, conversations } = await conversing(t, await researching(t))
  const { events } = await asked(t, { hub, person: ana, conversations })
  assert.deepEqual(toolStates(events).slice(-2), [
    { kind: 'read_page', subject: { url: UNREACHABLE, title: null }, states: ['running', 'error'] },
    { kind: 'other', subject: null, states: ['running', 'denied'] },
  ])
  const raw = JSON.stringify(events)
  assert.doesNotMatch(raw, /not found|Available tools|planted_tool|ENOTFOUND|SECRET-PLANTED-TEXT/)
})

test('recarregar: o pensamento e as ferramentas relidos na ordem, num turno só, com o modelo e os segundos ditos ao vivo (#176)', async (t) => {
  const { hub, ana, conversations } = await conversing(t, await researching(t))
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  const seconds = events.flatMap((event) =>
    event.type === 'part' && event.part.type === 'reasoning' && event.part.state === 'completed'
      ? [event.part.seconds]
      : [],
  )
  assert.equal(seconds.length, 1)
  assert.equal(typeof seconds[0], 'number')
  const messages = await messagesOf(await hubBeside(t, hub), ana, url)
  assert.deepEqual(
    messages.map((message) => [message.role, message.model]),
    [
      ['person', null],
      ['builder', 'anthropic/claude-sonnet-4-6'],
    ],
  )
  const parts = messages[1]?.parts.map((part) => ('id' in part ? { ...part, id: '' } : part))
  const tool = { type: 'tool', id: '', state: 'completed' } as const
  assert.deepEqual(parts, [
    { type: 'reasoning', id: '', state: 'completed', seconds: seconds[0] },
    { ...tool, kind: 'search_web', subject: { query: 'apps de encomenda de padaria' } },
    ...PAGES.map((url) => ({ ...tool, kind: 'read_page', subject: { url, title: null } })),
    { ...tool, kind: 'read_page', state: 'error', subject: { url: UNREACHABLE, title: null } },
    { ...tool, kind: 'other', state: 'denied', subject: null },
    { type: 'text', text: 'Comparei as padarias.' },
  ])
})

test('uma resposta que cita a pesquisa é um texto só, ao vivo e relida, sem quebra nos trechos citados', async (t) => {
  const { hub, ana, conversations } = await conversing(t, citing())
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  const answer =
    'Encontrei estes apps.\n\n- **Meslo:** uma plataforma para confeitarias. A limitação é que é especializada em encomendas.'
  const said = events.flatMap((event) =>
    event.type === 'text' ? [event.delta] : event.type === 'part' ? [event.part.type] : [],
  )
  assert.equal(said.slice(said.lastIndexOf('tool') + 1).join(''), answer)
  const messages = await messagesOf(await hubBeside(t, hub), ana, url)
  assert.deepEqual(
    messages[1]?.parts.map((part) => (part.type === 'text' ? part.text : part.type)),
    ['Vou buscar os apps.', 'tool', answer],
  )
})
