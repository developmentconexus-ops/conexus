import assert from 'node:assert/strict'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { MastraDBMessage } from '@mastra/core/agent'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import { checks } from '@mastra/evals/checks'
import { linkSankhya, testOf } from '../../hub/connectors/test-connections.ts'
import { PADARIA_SOL_MATRIZ, salesSankhya, soldBy } from '../../hub/connectors/test-sales.ts'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import {
  ANA_OWNER,
  call,
  hubWithLog,
  personOn,
  plantCompany,
  post,
} from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { endOf, MODEL, messagesOf, title } from '../conversation/test-conversation.ts'
import { assisting, created, READ, talking } from './test-assistant.ts'
import { numbersFromReads } from './test-numbers.ts'

const QUESTION = 'Quanto a Padaria Sol vendeu em setembro por vendedor?'
const SOLD_BY_SELLER =
  "SELECT V.APELIDO, ROUND(SUM(I.VLRTOT), 2) AS TOTAL FROM TGFCAB C JOIN TGFITE I ON I.NUNOTA = C.NUNOTA JOIN TGFVEN V ON V.CODVEND = C.CODVEND WHERE C.DTNEG BETWEEN '2026-09-01' AND '2026-09-30' GROUP BY V.APELIDO ORDER BY TOTAL DESC"
const SEPTEMBER = [...soldBy(PADARIA_SOL_MATRIZ, '2026-09').values()]
const BRL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** The connections the conversation's block names, as the model reads them; none is `[]`. */
function chosenIn(call: Sent): string[] {
  const listed = /Connections in this conversation: (.*)\.$/m.exec(call.system)?.[1] ?? 'none'
  return listed === 'none' ? [] : listed.split(', ').map((each) => each.replace(/ \(.*\)$/, ''))
}

/** The rows of the last read the model was given, as the tool answered them. */
function lastRows(call: Sent): { APELIDO: string; TOTAL: number }[] | undefined {
  for (const text of [...call.texts].reverse()) {
    if (!text.includes('"linhas"')) continue
    return Object(JSON.parse(text)).value.linhas
  }
  return undefined
}

/**
 * A model that does what the Assistant's setup gives it a way to do, and nothing else (as the
 * Builder's `obedient`): it reads a connection only when its block names it and it has
 * `connector_read`, then answers with what the read returned; a connection not named, or none,
 * it says so. It keys on those facts, not on the instructions' sentences.
 */
function reader() {
  return (call: Sent): Reply => {
    const titled = title(call)
    if (titled !== undefined) return titled
    const rows = lastRows(call)
    if (rows !== undefined) {
      const said = rows.map((row) => `${row.APELIDO} vendeu R$ ${BRL.format(row.TOTAL)}`)
      return { kind: 'text', text: `Em setembro: ${said.join(', ')}.` }
    }
    const asked = call.texts.at(-1) ?? ''
    const wanted = asked.includes('Filial') ? 'Filial' : 'Matriz'
    const chosen = chosenIn(call)
    if (chosen.length === 0) {
      return {
        kind: 'text',
        text: 'Esta conversa não tem sistema escolhido: escolha um na barra da conversa, ou ligue um em Integrações.',
      }
    }
    if (!chosen.includes(wanted) || !call.tools.includes(READ)) {
      return { kind: 'text', text: `A ${wanted} não está nesta conversa.` }
    }
    const input = {
      connection: wanted,
      operation: 'sankhya.consultar',
      input: { sql: SOLD_BY_SELLER },
    }
    return { kind: 'blocks', blocks: [{ type: 'tool_use', name: READ, input }] }
  }
}

/** The parts of the conversation's last answer, as Mastra stored them, read through its route. */
async function answerParts(hub: Hub, person: Person, url: string): Promise<MastraMessagePart[]> {
  const messages = await messagesOf(hub, person, url)
  const asked = messages.findLastIndex((message) => message.role === 'person')
  return messages.slice(asked + 1).flatMap((message) => message.parts)
}

/** Mastra's own checks of the turn: the tool called and no tool erred, each a score of 1. */
async function scored(parts: MastraMessagePart[], tool: string) {
  const output: MastraDBMessage[] = [
    { id: 'answer', role: 'assistant', createdAt: new Date(), content: { format: 2, parts } },
  ]
  const input = {
    inputMessages: [],
    rememberedMessages: [],
    systemMessages: [],
    taggedSystemMessages: {},
  }
  return Promise.all(
    [checks.calledTool(tool), checks.noToolErrors()].map(
      async (scorer) => (await scorer.run({ input, output })).score,
    ),
  )
}

function textOf(parts: MastraMessagePart[]): string {
  return parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join('\n')
}

test('as vendas por vendedor: o Assistente lê o Sankhya da Matriz, nenhuma ferramenta erra, e a conferência aprova cada número', async (t) => {
  const on = await assisting(t, reader(), await salesSankhya(t))
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say(QUESTION)), 'complete')
  const parts = await answerParts(on.hub, on.ana, url)
  assert.deepEqual(await scored(parts, READ), [1, 1])
  assert.deepEqual(numbersFromReads({ question: QUESTION, parts, truth: SEPTEMBER }), { ok: true })
  assert.match(textOf(parts), /JOAO vendeu R\$ 8\.072,70/)
})

test('a ligação de fora do Projeto: numa conversa do Projeto só com a Matriz, a Filial não é lida e a resposta diz que ela não está na conversa', async (t) => {
  const on = await assisting(t, reader(), await salesSankhya(t))
  const url = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz, on.filial],
  })
  const asked = await (await talking(t, on.hub, on.ana, url)).say('Quanto a Filial vendeu ontem?')
  assert.equal(endOf(asked), 'complete')
  assert.ok(on.reads.every((read) => read.connectionId !== on.filial))
  const parts = await answerParts(on.hub, on.ana, url)
  assert.match(textOf(parts), /Filial não está nesta conversa/)
  assert.deepEqual(numbersFromReads({ question: 'ontem', parts, truth: [] }), { ok: true })
})

test('sem ligação: a conversa sem sistema escolhido diz isso e aponta a barra, sem chamar connector_read', async (t) => {
  const on = await assisting(t, reader(), await salesSankhya(t))
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say(QUESTION)), 'complete')
  const parts = await answerParts(on.hub, on.ana, url)
  assert.ok(parts.every((part) => part.type !== 'tool-invocation'))
  assert.match(textOf(parts), /barra/)
  assert.equal(on.reads.length, 0)
})

/** Where firstmate runs the real model's case: the authorize link goes there, and the sign-in code comes back there. */
// biome-ignore lint/style/noProcessEnv: the switch of this one opt-in case, not the app's configuration
const REAL_MODEL = process.env.CONEXUS_EVAL_REAL_MODEL

/** The sign-in code firstmate writes after opening the link, read once and deleted; never printed. */
async function codeFrom(folder: string): Promise<string> {
  const path = join(folder, 'code.txt')
  for (let waited = 0; waited < 600; waited += 1) {
    if (existsSync(path)) {
      const code = readFileSync(path, 'utf8').trim()
      rmSync(path)
      return code
    }
    await sleep(1000)
  }
  throw new Error('No sign-in code arrived in ten minutes.')
}

/** A Hub that calls the real model, through a Claude subscription signed in by the routes, as a person signs in. */
async function subscribed(t: TestContext, folder: string) {
  const sankhya = await salesSankhya(t)
  const hub = await hubWithLog(t, (config) => ({
    ...config,
    connectorOrigins: new Map([['sankhya', sankhya.origin]]),
  }))
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const company = `/api/companies/${companyId}`
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'claude_subscription')`,
    [companyId],
  )
  const body = { owner: 'company', kind: 'claude_subscription', label: 'Assinatura' }
  const opened = await post(hub, ana, `${company}/model-account-sign-ins`, body)
  assert.equal(opened.statusCode, 201, opened.body)
  const { url, signInId } = Object(opened.json())
  writeFileSync(join(folder, 'authorize-url.txt'), `${url}\n`)
  const code = await codeFrom(folder)
  const linked = await post(hub, ana, `${company}/model-account-sign-ins/${signInId}`, { code })
  assert.equal(linked.statusCode, 201, linked.body)
  const model = { model: MODEL, effort: 'off' }
  assert.equal((await call(hub, ana, 'PUT', `${company}/default-model`, model)).statusCode, 200)
  const connections = `${company}/connections`
  const ids = []
  for (const [name, credential] of [
    ['Matriz', sankhya.matriz],
    ['Filial', sankhya.filial],
  ] as const) {
    const made = await linkSankhya(hub, ana, connections, credential, undefined, name)
    const id = String(Object(made.json()).connection.id)
    assert.equal(Object((await testOf(hub, ana, connections, id)).json()).result, 'WORKING')
    ids.push(id)
  }
  const projected = await post(hub, ana, `${company}/projects`, { name: 'Vendas' })
  const projectId = String(Object(projected.json()).project.id)
  const grant = `${company}/projects/${projectId}/connections/${ids[0]}`
  assert.equal((await call(hub, ana, 'PUT', grant)).statusCode, 200)
  return { hub, ana, assistant: `${company}/assistant/conversations`, matriz: ids[0], projectId }
}

test('o modelo de verdade: as perguntas do roteiro sobre o dublê, cada uma numa conversa nova, e nenhuma resposta reprovada', {
  timeout: 1_800_000,
}, async (t) => {
  if (REAL_MODEL === undefined) {
    t.skip(
      'opt-in: set CONEXUS_EVAL_REAL_MODEL to a folder; firstmate opens the link the test writes there and writes back the sign-in code (step 24.1, criterion 11b)',
    )
    return
  }
  const on = await subscribed(t, REAL_MODEL)
  const asks = [
    { body: { connections: [on.matriz] }, question: QUESTION, truth: SEPTEMBER },
    { body: { connections: [] }, question: QUESTION, truth: [] },
    {
      body: { projectId: on.projectId, connections: [on.matriz] },
      question: 'Quanto a Filial vendeu em setembro?',
      truth: [],
    },
  ]
  for (const each of asks) {
    const url = await created(on.hub, on.ana, on.assistant, each.body)
    assert.equal(
      endOf(await (await talking(t, on.hub, on.ana, url)).say(each.question)),
      'complete',
    )
    const parts = await answerParts(on.hub, on.ana, url)
    const verdict = numbersFromReads({ question: each.question, parts, truth: each.truth })
    assert.deepEqual(verdict, { ok: true }, `${each.question}\n${textOf(parts)}`)
  }
})
