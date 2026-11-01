import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { MastraDBMessage } from '@mastra/core/agent'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import { checks } from '@mastra/evals/checks'
import { PADARIA_SOL_MATRIZ, salesSankhya, soldBy } from '../../hub/connectors/test-sales.ts'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { call } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { endOf, messagesOf, title } from '../conversation/test-conversation.ts'
import {
  assisting,
  created,
  described,
  READ,
  returnedNumbers,
  shownFiles,
  subscribed,
  talking,
} from './test-assistant.ts'
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

const IMAGES = ['image/svg+xml', 'image/png']
const DOCUMENTS = ['text/markdown', 'text/plain', 'application/pdf', 'text/html']
const DOCUMENTS_OFFICE = /\.(docx|pptx|xlsx)$/

type Subscribed = Awaited<ReturnType<typeof subscribed>>

/** One new conversation per question: the verdict on its numbers and the files `show_file` showed, printed, and the verdict asserted. */
function asking(t: TestContext, on: Subscribed) {
  return async (
    name: string,
    body: object,
    question: string,
    truth: readonly number[] | 'READS',
  ) => {
    const url = await created(on.hub, on.ana, on.assistant, body)
    on.track(url)
    assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say(question)), 'complete')
    const parts = await answerParts(on.hub, on.ana, url)
    const given = truth === 'READS' ? returnedNumbers(parts) : truth
    const verdict = numbersFromReads({ question, parts, truth: given })
    const files = shownFiles(parts)
    t.diagnostic(`${name}: ${JSON.stringify(verdict)}; show_file: ${described(files)}`)
    assert.deepEqual(verdict, { ok: true }, `${question}\n${textOf(parts)}`)
    return files
  }
}

/** The connection read, taken out with `PUT …/connections`, the same question asked again: nothing more is read. */
async function removing(t: TestContext, on: Subscribed) {
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  on.track(url)
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say(QUESTION)), 'complete')
  const before = on.reads.length
  assert.ok(before > 0, 'the first question did not read the connection')
  const taken = await call(on.hub, on.ana, 'PUT', `${url}/connections`, { connections: [] })
  assert.equal(taken.statusCode, 200, taken.body)
  assert.equal(endOf(await say(QUESTION)), 'complete')
  const parts = await answerParts(on.hub, on.ana, url)
  const verdict = numbersFromReads({ question: QUESTION, parts, truth: [] })
  t.diagnostic(
    `ligação tirada: ${JSON.stringify(verdict)}; reads after: ${on.reads.length - before}`,
  )
  assert.equal(on.reads.length, before, 'the Assistant read the connection after it was removed')
  assert.ok(parts.every((part) => Object(part).toolInvocation?.toolName !== READ))
  assert.deepEqual(verdict, { ok: true }, textOf(parts))
}

test('o modelo de verdade: as perguntas do roteiro sobre o dublê, cada uma numa conversa nova, e nenhuma resposta reprovada', {
  timeout: 1_800_000,
}, async (t) => {
  if (REAL_MODEL === undefined) {
    t.skip(
      'opt-in: set CONEXUS_EVAL_REAL_MODEL to a folder; firstmate opens the link the test writes there and writes back the sign-in code (step 24.1, criterion 11b). The machine is the real E2B template when CONEXUS_E2B_KEY_FILE and CONEXUS_E2B_TEMPLATE are set, the local kit otherwise; the result prints which ran, and per question the verdict and the file show_file showed',
    )
    return
  }
  const on = await subscribed(t, REAL_MODEL)
  const ask = asking(t, on)
  const matriz = { connections: [on.matriz] }
  await ask('vendas por vendedor', matriz, QUESTION, SEPTEMBER)
  await ask('sem ligação', { connections: [] }, QUESTION, [])
  const outside = { projectId: on.projectId, ...matriz }
  await ask('Filial fora do Projeto', outside, 'Quanto a Filial vendeu em setembro?', [])

  const chart = await ask('gráfico', matriz, `${QUESTION} Me mostra num gráfico.`, SEPTEMBER)
  const drawn = chart.filter((file) => file.kind === 'FILE' && IMAGES.includes(file.media))
  assert.ok(drawn.length > 0, `show_file showed no image file: ${described(chart)}`)
  assert.ok(
    drawn.every((file) => Number(file.bytes) > 0),
    'the image the machine drew is empty',
  )

  const ordering = 'Documente o nosso processo de encomendas, com boas práticas do setor.'
  const orders = await ask('documento das encomendas', matriz, ordering, 'READS')
  const written = orders.filter(
    (file) => DOCUMENTS.includes(file.media) || DOCUMENTS_OFFICE.test(file.name),
  )
  assert.ok(written.length > 0, `show_file showed no document: ${described(orders)}`)

  await removing(t, on)
})
