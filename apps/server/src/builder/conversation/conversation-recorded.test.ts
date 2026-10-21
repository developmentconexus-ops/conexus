import assert from 'node:assert/strict'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { ConversationEvent, MessagePart } from '@conexus/hub-api'
import { applyEvent } from '@conexus/hub-api'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { call, post } from '../../hub/identity/test-hub.ts'
import type { Reply } from '../../platform/test-anthropic.ts'
import { testCliProxy } from '../../platform/test-cliproxy-binary.ts'
import {
  answeredOf,
  asked,
  conversing,
  sent,
  started,
  streamOf,
  title,
} from './test-conversation.ts'
import { routedTo } from './test-research.ts'

/** The page the recorded `tool-error` call asks to read, on a site that never answers. */
const MISSING_SITE = 'padaria-inventada.example.test'

function recorded(name: string): Reply {
  return { kind: 'recorded', name }
}

function partsOf(events: ConversationEvent[]): MessagePart[] {
  return events.flatMap((event) => (event.type === 'part' ? [event.part] : []))
}

/** The parts the screen draws from a turn's events: its `turn` snapshot, then each part event. */
function folded(events: ConversationEvent[]): MessagePart[] {
  let parts: MessagePart[] = []
  for (const event of events) {
    if (event.type === 'turn') parts = event.message.parts
    else if (event.type === 'text' || event.type === 'part' || event.type === 'notice') {
      parts = applyEvent(parts, event)
    }
  }
  return parts
}

/** The Builder's last message, as `readConversation` reads it once Mastra saved it. */
async function readAnswer(hub: Hub, person: Person, url: string): Promise<MessagePart[]> {
  const messages = await answeredOf(hub, person, url)
  const answer = messages.at(-1)
  assert.equal(answer?.role, 'builder')
  return answer.parts
}

/**
 * The streamed turn, folded, is the read conversation's last message (T24): as the stream said it,
 * and as a stream reopened after its event `at` says the rest.
 */
async function readAsStreamed(
  t: TestContext,
  where: { hub: Hub; person: Person; url: string },
  said: { events: ConversationEvent[]; ids: string[] },
) {
  const { hub, person, url } = where
  const read = await readAnswer(hub, person, url)
  assert.deepEqual(folded(said.events), read)
  const at = Math.floor(said.events.length / 2)
  const reopened = await streamOf(hub, person, url, said.ids[at])
  t.after(() => reopened.close())
  assert.deepEqual(folded([...said.events.slice(0, at + 1), ...(await reopened.turn())]), read)
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
  assert.equal((await sent(hub, person, url, 'Liste nomes de padarias')).statusCode, 202)
  const opening = await stream.next()
  const first = await stream.said()
  assert.equal(first.type, 'text')
  const reopened = await streamOf(hub, person, url)
  t.after(() => reopened.close())
  const snapshot = await reopened.next()
  assert.equal(snapshot.type, 'turn')
  assert.equal((await post(hub, person, `${url}/stop`, {})).statusCode, 204)
  const events = [opening, first, ...(await stream.turn())]
  const again = [snapshot, ...(await reopened.turn())]
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'aborted' })
  const read = await readAnswer(hub, person, url)
  assert.deepEqual(folded(events), read)
  assert.deepEqual(folded(again), read)
}

test('a busca citada de Claude, tocada da gravação: um texto só, ao vivo e relido (PR 191)', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (each) => title(each) ?? recorded('anthropic-cited'),
  )
  const said = await asked(t, { hub, person: ana, conversations })
  assert.deepEqual(said.events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.ok(partsOf(said.events).some((part) => part.type === 'tool' && part.kind === 'search_web'))
  const read = await readAsStreamed(t, { hub, person: ana, url: said.url }, said)
  assert.equal(read.filter((part) => part.type === 'text').length, 1)
})

test('o pensamento de Claude, tocado da gravação: `reasoning` com segundos ao vivo e reaberto (#176); sem eles guardados, `null`', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (each) => title(each) ?? recorded('anthropic-thinking'),
  )
  const said = await asked(t, { hub, person: ana, conversations })
  const thought = partsOf(said.events).filter((part) => part.type === 'reasoning')
  assert.deepEqual(
    thought.map((part) => [part.state, typeof part.seconds]),
    [
      ['running', 'object'],
      ['completed', 'number'],
    ],
  )
  const read = await readAsStreamed(t, { hub, person: ana, url: said.url }, said)
  const [kept] = read.filter((part) => part.type === 'reasoning')
  assert.equal(kept?.seconds, thought.at(-1)?.seconds)
  // A thread whose times were never kept, as one from before them or whose write failed.
  const conversationId = said.url.split('/').at(-1)
  const { rows } = await hub.test.mastraPool.query(
    'select metadata::text as metadata from mastra.mastra_threads where id = $1',
    [conversationId],
  )
  const metadata = JSON.parse(String(rows[0]?.metadata))
  delete metadata['conexus.thinking']
  await hub.test.mastraPool.query('update mastra.mastra_threads set metadata = $2 where id = $1', [
    conversationId,
    JSON.stringify(metadata),
  ])
  const untimed = await readAnswer(hub, ana, said.url)
  assert.deepEqual(
    untimed.filter((part) => part.type === 'reasoning').map((part) => part.seconds),
    [null],
  )
})

test('a ferramenta de Claude que falha, tocada da gravação: a leitura da página em `error`, lida como ao vivo', async (t) => {
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
  const reads = partsOf(said.events).filter((part) => part.type === 'tool')
  assert.deepEqual(reads.at(-1)?.state, 'error')
  assert.equal(reads.at(-1)?.kind, 'read_page')
  await readAsStreamed(t, { hub, person: ana, url: said.url }, said)
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
