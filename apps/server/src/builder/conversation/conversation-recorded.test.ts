import assert from 'node:assert/strict'
import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { ConversationEvent, MessagePart } from '@conexus/hub-api'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { post } from '../../hub/identity/test-hub.ts'
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

/** The Builder's last message, as `readConversation` reads it once Mastra saved it. */
async function readAnswer(hub: Hub, person: Person, url: string): Promise<MessagePart[]> {
  const messages = await answeredOf(hub, person, url)
  const answer = messages.at(-1)
  assert.equal(answer?.role, 'builder')
  return answer.parts
}

/** A question on a new conversation whose answer stops at its first word, by the person's Parar. */
async function stoppedOf(
  t: TestContext,
  where: { hub: Hub; person: Person; conversations: string; model?: string },
) {
  const { hub, person, conversations } = where
  const url = `${conversations}/${await started(hub, person, conversations, { model: where.model })}`
  const stream = await streamOf(hub, person, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, person, url, 'Liste nomes de padarias')).statusCode, 202)
  const first = await stream.said()
  assert.equal(first.type, 'text')
  assert.equal((await post(hub, person, `${url}/stop`, {})).statusCode, 204)
  return { url, events: [first, ...(await stream.turn())] }
}

test('a busca citada de Claude, tocada da gravação: um texto só, ao vivo e relido (PR 191)', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (each) => title(each) ?? recorded('anthropic-cited'),
  )
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.ok(partsOf(events).some((part) => part.type === 'tool' && part.kind === 'search_web'))
  const read = await readAnswer(hub, ana, url)
  assert.equal(read.filter((part) => part.type === 'text').length, 1)
})

test('o pensamento de Claude, tocado da gravação: `reasoning` com os segundos ao vivo', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (each) => title(each) ?? recorded('anthropic-thinking'),
  )
  const { events } = await asked(t, { hub, person: ana, conversations })
  const thought = partsOf(events).filter((part) => part.type === 'reasoning')
  assert.deepEqual(
    thought.map((part) => [part.state, typeof part.seconds]),
    [
      ['running', 'object'],
      ['completed', 'number'],
    ],
  )
})

test('a ferramenta de Claude que falha, tocada da gravação: a leitura da página em `error`', async (t) => {
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
  const { events } = await asked(t, { hub, person: ana, conversations })
  const reads = partsOf(events).filter((part) => part.type === 'tool')
  assert.deepEqual(reads.at(-1)?.state, 'error')
  assert.equal(reads.at(-1)?.kind, 'read_page')
})

test('Claude interrompido, tocado da gravação: o turno termina `aborted`', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (each) => title(each) ?? recorded('anthropic-abort'),
  )
  const { events } = await stoppedOf(t, { hub, person: ana, conversations })
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'aborted' })
})

test('Gemini pelo CLIProxy interrompido, tocado da gravação: o turno termina `aborted`', async (t) => {
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
  const { events } = await stoppedOf(t, {
    hub,
    person: ana,
    conversations,
    model: 'google/gemini-3.5-flash-lite',
  })
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'aborted' })
})
