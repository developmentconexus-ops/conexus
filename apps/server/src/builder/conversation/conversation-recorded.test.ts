import assert from 'node:assert/strict'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setTimeout } from 'node:timers/promises'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { call, post } from '../../hub/identity/test-hub.ts'
import type { Reply } from '../../platform/test-anthropic.ts'
import { testCliProxy } from '../../platform/test-cliproxy-binary.ts'
import type { Read, StreamEvent } from './test-conversation.ts'
import {
  answeredOf,
  asked,
  conversing,
  endOf,
  holding,
  PARTIAL,
  sent,
  settledOf,
  started,
  stopped,
  streamOf,
  title,
} from './test-conversation.ts'
import { dataOf, failuresOf, messagesIn, partsOf } from './test-parts.ts'
import { routedTo } from './test-research.ts'

/** The page the recorded `tool-error` call asks to read, on a site that never answers. */
const MISSING_SITE = 'padaria-inventada.example.test'

function recorded(name: string): Reply {
  return { kind: 'recorded', name }
}

/**
 * The Builder's parts of a turn as the screen folds its stream: each message by its id, in the
 * order it started; the machine's step is told live and not kept.
 */
function folded(events: StreamEvent[]): MastraMessagePart[] {
  return [...messagesIn(events)]
    .filter(([id, message]) => message.role === 'assistant' && !id.endsWith(':machine'))
    .flatMap(([, message]) => message.parts)
}

/** What Mastra keeps for itself beside a part: the screen draws none of it. */
const KEPT_BESIDE = new Set([
  'createdAt',
  'updatedAt',
  'providerMetadata',
  'providerExecuted',
  'model',
])

function bare(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(bare)
  if (typeof value !== 'object' || value === null) return value
  const fields = Object.entries(value).filter(
    ([key, field]) => !KEPT_BESIDE.has(key) && !(key === 'isError' && field === false),
  )
  return Object.fromEntries(fields.map(([key, field]) => [key, bare(field)]))
}

/**
 * Live and saved, compared by what the screen draws: a reasoning's `details` come whole from the
 * saved message and empty from the stream's deltas, and Mastra saves sources and step marks the
 * stream does not say, which the screen does not draw.
 */
function drawn(parts: MastraMessagePart[]): unknown[] {
  return parts
    .filter((part) => part.type !== 'source' && part.type !== 'step-start')
    .map((part) => bare(part.type === 'reasoning' ? { ...part, details: [] } : part))
}

/** The Builder's messages of the last turn, joined, as `readConversation` reads them once Mastra saved them. */
async function readAnswer(hub: Hub, person: Person, url: string): Promise<MastraMessagePart[]> {
  const messages = await answeredOf(hub, person, url)
  const turn = messages.slice(messages.findLastIndex((message) => message.role === 'person') + 1)
  assert.ok(turn.length > 0 && turn.every((message) => message.role === 'builder'))
  return turn.flatMap((message) => message.parts)
}

/** The streamed turn, folded, is the read conversation's last turn (T24, criterion 4). */
async function readAsStreamed(
  where: { hub: Hub; person: Person; url: string },
  said: { events: StreamEvent[] },
) {
  const read = await readAnswer(where.hub, where.person, where.url)
  assert.deepEqual(drawn(folded(said.events)), drawn(read))
  return read
}

/**
 * A question on a new conversation whose answer stops at its first word, by the person's Parar,
 * with the stream reopened before the stop, as a screen reloaded in the middle of the answer.
 */
async function stoppedOf(
  t: TestContext,
  where: { hub: Hub; person: Person; conversations: string; model?: string },
) {
  const { hub, person, conversations } = where
  const url = `${conversations}/${await started(hub, person, conversations, { model: where.model })}`
  const stream = await streamOf(hub, person, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, person, url, 'Liste nomes de padarias')).statusCode, 200)
  // The journal says text in pieces of 200 characters, so this short text waits for the turn's end:
  // the stop comes once the recording's words have reached the turn.
  const opening = await stream.next()
  await setTimeout(1000)
  assert.equal((await stopped(hub, person, url)).statusCode, 200)
  const events = [opening, ...(await stream.turn())]
  assert.equal(endOf(events), 'aborted')
  assert.deepEqual(drawn(folded(events)), drawn(await readAnswer(hub, person, url)))
}

test('a busca citada de Claude, tocada da gravação: o texto dito uma vez só, ao vivo e relido (PR 191)', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (each) => title(each) ?? recorded('anthropic-cited'),
  )
  const said = await asked(t, { hub, person: ana, conversations })
  assert.equal(endOf(said.events), 'complete')
  const calls = partsOf(said.events).filter((part) => part.type === 'tool-invocation')
  assert.ok(calls.some((part) => part.toolInvocation.toolName === 'web_search'))
  const read = await readAsStreamed({ hub, person: ana, url: said.url }, said)
  // The answer's words are read once, not again after the citations (PR 191).
  const words = read.map((part) => (part.type === 'text' ? part.text : '')).join('')
  assert.equal(words.split('Aqui estão duas receitas').length, 2)
  assert.equal(words.split('Em resumo, a principal diferença').length, 2)
})

test('o pensamento de Claude, tocado da gravação: o raciocínio e o `data-conexus-thought` com segundos, ao vivo e reaberto (#176)', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (each) => title(each) ?? recorded('anthropic-thinking'),
  )
  const said = await asked(t, { hub, person: ana, conversations })
  assert.ok(partsOf(said.events).some((part) => part.type === 'reasoning'))
  const thought = dataOf(said.events, 'data-conexus-thought')
  assert.ok(thought.length > 0)
  const read = await readAsStreamed({ hub, person: ana, url: said.url }, said)
  const kept = read.flatMap((part) => (part.type === 'data-conexus-thought' ? [part.data] : []))
  assert.deepEqual(kept, [thought.at(-1)])
  assert.equal(typeof Object(kept[0]).seconds, 'number')
})

test('a ferramenta de Claude que falha, tocada da gravação: a leitura da página em erro, lida como ao vivo', async (t) => {
  routedTo(t, { [MISSING_SITE]: new Error(`getaddrinfo ENOTFOUND ${MISSING_SITE}`) })
  let calls = 0
  const { hub, ana, conversations } = await conversing(t, (each) => {
    const titled = title(each)
    if (titled !== undefined) return titled
    calls += 1
    return calls === 1
      ? recorded('anthropic-tool-error')
      : { kind: 'text', text: 'Não consegui ler a página.' }
  })
  const said = await asked(t, { hub, person: ana, conversations })
  const reads = partsOf(said.events).flatMap((part) =>
    part.type === 'tool-invocation' ? [part.toolInvocation] : [],
  )
  assert.equal(reads.at(-1)?.toolName, 'web_fetch')
  assert.equal(reads.at(-1)?.state, 'result')
  assert.equal(Object(reads.at(-1)?.result).isError, true)
  await readAsStreamed({ hub, person: ana, url: said.url }, said)
})

test('Claude interrompido, tocado da gravação: o turno termina `aborted`, lido como ao vivo', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (each) => title(each) ?? recorded('anthropic-abort'),
  )
  await stoppedOf(t, { hub, person: ana, conversations })
})

test('Gemini pelo CLIProxy interrompido, tocado da gravação: o turno termina `aborted`, lido como ao vivo', async (t) => {
  // Anthropic answers only the title; the question goes to Gemini.
  const { hub, ana, companyId, conversations } = await conversing(
    t,
    (each) => title(each) ?? { kind: 'refuse', status: 500 },
  )
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'google_cliproxy')`,
    [companyId],
  )
  const double = testCliProxy()
  rmSync(join(double.control, 'mode'), { force: true })
  writeFileSync(join(double.control, 'recording'), 'google-abort')
  t.after(() => rmSync(join(double.control, 'recording'), { force: true }))
  const signIns = `/api/companies/${companyId}/model-account-sign-ins`
  const body = { owner: 'company', kind: 'google_cliproxy', label: 'Google' }
  const opened = await post(hub, ana, signIns, body)
  assert.equal(opened.statusCode, 201, opened.body)
  const { url: address, signInId } = Object(opened.json())
  const state = String(new URL(address).searchParams.get('state'))
  const code = `http://localhost:51121/oauth-callback?state=${state}&code=c-1`
  const linked = await post(hub, ana, `${signIns}/${signInId}`, { code })
  assert.equal(linked.statusCode, 201, linked.body)
  await stoppedOf(t, { hub, person: ana, conversations, model: 'google/gemini-3.5-flash-lite' })
})

test('um padrão em Gemini 3.8 Flash, como o CLIProxy o nomeia: a conversa começa nele e a chamada vai pelo CLIProxy com esse nome', async (t) => {
  const { hub, ana, companyId, conversations } = await conversing(
    t,
    (each) => title(each) ?? { kind: 'refuse', status: 500 },
  )
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'google_cliproxy')`,
    [companyId],
  )
  const double = testCliProxy()
  rmSync(join(double.control, 'mode'), { force: true })
  rmSync(join(double.control, 'models'), { force: true })
  rmSync(join(double.control, 'asked'), { force: true })
  writeFileSync(join(double.control, 'recording'), 'google-abort')
  t.after(() => rmSync(join(double.control, 'recording'), { force: true }))
  const signIns = `/api/companies/${companyId}/model-account-sign-ins`
  const body = { owner: 'company', kind: 'google_cliproxy', label: 'Google' }
  const opened = await post(hub, ana, signIns, body)
  assert.equal(opened.statusCode, 201, opened.body)
  const { url: address, signInId } = Object(opened.json())
  const state = String(new URL(address).searchParams.get('state'))
  const code = `http://localhost:51121/oauth-callback?state=${state}&code=c-1`
  const linked = await post(hub, ana, `${signIns}/${signInId}`, { code })
  assert.equal(linked.statusCode, 201, linked.body)
  const chosen = { model: 'google/gemini-3.8-flash-high', effort: 'high' }
  const saved = await call(hub, ana, 'PUT', `/api/companies/${companyId}/default-model`, chosen)
  assert.equal(saved.statusCode, 200, saved.body)
  await stoppedOf(t, { hub, person: ana, conversations })
  const asked = readFileSync(join(double.control, 'asked'), 'utf8').trim().split('\n')
  assert.deepEqual(asked, ['gemini-3.8-flash-high'])
})

/** The texts of the person's messages among the conversation's. */
function questions(messages: Read[]) {
  return messages
    .filter((each) => each.role === 'person')
    .map((each) => each.parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])))
}

test('mandar é o `sendMessage` do Mastra: nenhuma gravação nossa antes do turno, e a pergunta lida uma vez depois dele (30)', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (each) => title(each) ?? held.reply)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)
  held.release()
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.deepEqual(questions(await answeredOf(hub, ana, url)), [['Uma pergunta']])
})

test('a versão e a falha voltam como partes da mensagem do Builder, e nenhuma vai ao modelo (30)', async (t) => {
  let streamed = 0
  const { hub, ana, conversations, anthropic } = await conversing(t, (each): Reply => {
    const titled = title(each)
    if (titled !== undefined) return titled
    streamed += 1
    if (streamed === 1) {
      const input = { path: 'a.ts', content: 'x\n' }
      const write = { type: 'tool_use', name: 'mastra_workspace_write_file', input } as const
      return { kind: 'blocks', blocks: [write] }
    }
    return streamed === 2 ? { kind: 'text', text: 'Pronto.' } : { kind: 'refuse', status: 401 }
  })
  const first = await asked(t, { hub, person: ana, conversations }, 'Faça a página')
  assert.equal(dataOf(first.events, 'data-conexus-version').length, 1)
  const stream = await streamOf(hub, ana, first.url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, first.url, 'Mude a cor')).statusCode, 200)
  const failed = await stream.turn()
  assert.deepEqual(failuresOf(failed), ['MODEL_NO_ACCOUNT'])
  const kinds = (await settledOf(hub, ana, first.url))
    .filter((each) => each.role === 'builder')
    .map((each) =>
      each.parts.map((part) => part.type).filter((type) => type.startsWith('data-conexus-')),
    )
  assert.deepEqual(kinds, [
    [],
    ['data-conexus-version'],
    ['data-conexus-notice'],
    ['data-conexus-failure'],
  ])
  const toModel = anthropic.sent.filter((each) => each.stream).flatMap((each) => each.texts)
  assert.doesNotMatch(toModel.join('\n'), /conexus-(version|failure|machine)|MODEL_NO_ACCOUNT/)
})
