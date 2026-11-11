import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { HandedOff } from '@conexus/hub-api'
import { post } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { endOf, messagesOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import type { SentFile } from './test-assistant.ts'
import { created, talking } from './test-assistant.ts'
import {
  COMMAND,
  conversation,
  documentsIn,
  file,
  LONG,
  notesOf,
  PDF,
  PDF_TYPE,
} from './test-files.ts'
import { REAL_MODEL, subscribed, textOf } from './test-real-model.ts'

const WRITE = 'mastra_workspace_write_file'
const SHOW = 'show_file'
const PROPOSE = 'propose_app'
const CONTRACT = 'Onde está o contrato que mandei ontem?'
const QUESTIONS = {
  rules: 'Quais as regras de desconto?',
  terms: 'E os prazos?',
  fines: 'E as multas?',
  contract: CONTRACT,
  diagram: 'Desenhe o fluxo do pedido.',
  excel: 'Faça um Excel com as regras.',
  handoff: 'Leve isso ao Builder.',
} as const
const MERMAID = 'Assim:\n\n```mermaid\nflowchart TD\n  A[Pedido] --> B[Entrega]\n```'
const SUMMARY = 'A padaria registra o desconto de cada cliente.'

const sheet = file('precos.xlsx', 'application/octet-stream', Buffer.alloc(4_096, 1))
const document = file('proposta.docx', 'application/octet-stream', Buffer.alloc(4_096, 2))
const bigPdf = file('politica.pdf', PDF_TYPE, Buffer.concat([PDF, Buffer.alloc(200_000, 'x')]))

/** The question of the person's turn the call belongs to, and how many tool calls that turn has made so far. */
function turnOf(asked: Sent, bases: Map<string, number>): { question: string; step: number } {
  const question = Object.values(QUESTIONS).findLast((each) =>
    asked.texts.some((text) => text.includes(each)),
  )
  assert.ok(question, 'the call carries a question of the script')
  if (!bases.has(question)) bases.set(question, asked.toolUses.length)
  return { question, step: asked.toolUses.length - (bases.get(question) ?? 0) }
}

/** The path the note of the file gave the model in this call; only what the call showed it (testing T28). */
function pathOf(asked: Sent, name: string): string {
  const path = notesOf(asked).find((note) => note.name === name)?.path
  assert.ok(path, `the call carries the note of ${name}`)
  return path
}

function blocks(...each: ReturnType<typeof tool>[]): Reply {
  return { kind: 'blocks', blocks: each }
}

function text(said: string): Reply {
  return { kind: 'text', text: said }
}

/** A model that does what each call shows it a way to do: reads by parts, lists `uploads`, answers in the message. */
function journeyModel() {
  const bases = new Map<string, number>()
  return (asked: Sent): Reply => {
    const { question, step } = turnOf(asked, bases)
    switch (question) {
      case QUESTIONS.rules:
        return step === 0
          ? blocks(tool(COMMAND, { command: `head -c 60 ${pathOf(asked, 'politica.pdf')}` }))
          : text(LONG)
      case QUESTIONS.terms:
        return text(LONG)
      case QUESTIONS.contract:
        return step === 0
          ? blocks(tool(COMMAND, { command: 'ls uploads/*' }))
          : text('Achei o contrato.')
      case QUESTIONS.diagram:
        return text(MERMAID)
      case QUESTIONS.excel:
        if (step === 0) return blocks(tool(WRITE, { path: 'regras.xlsx', content: 'x' }))
        return step === 1 ? blocks(tool(SHOW, { path: 'regras.xlsx' })) : text('Feito.')
      case QUESTIONS.handoff:
        if (step === 0) return blocks(tool(WRITE, { path: 'briefing.md', content: '# Descontos' }))
        if (step === 1) return blocks(tool(PROPOSE, { summary: SUMMARY, briefing: 'briefing.md' }))
        return text('Toque o botão.')
      default:
        return text('Li.')
    }
  }
}

/** The id of the conversation's `propose_app` call, from its stored messages. */
async function proposalOf(on: Awaited<ReturnType<typeof conversation>>): Promise<string> {
  const ids = (await messagesOf(on.hub, on.ana, on.url)).flatMap((message) =>
    message.parts.flatMap((part) => {
      const invoked = Object(part).toolInvocation
      return Object(part).type === 'tool-invocation' && invoked?.toolName === PROPOSE
        ? [String(invoked.toolCallId)]
        : []
    }),
  )
  assert.equal(ids.length, 1, 'one propose_app call')
  return String(ids[0])
}

test('o roteiro do Assistente do dia a dia', async (t) => {
  const on = await conversation(t, journeyModel())
  async function said(question: string, files: SentFile[] = []) {
    assert.equal(endOf(await on.say(question, files)), 'complete')
  }
  await said(QUESTIONS.rules, [bigPdf, sheet, document])
  await said(QUESTIONS.terms)
  await said(QUESTIONS.fines)
  assert.ok(on.observers.length > 0, 'the third turn, past the threshold, was observed')
  await said(QUESTIONS.contract)
  const found = on.calls.findLast((call) => call.toolResults.length > 0)
  assert.match(found?.toolResults.at(-1)?.text ?? '', /[0-9a-f]{64}\.pdf/)
  await said(QUESTIONS.diagram)
  await said(QUESTIONS.excel)
  await said(QUESTIONS.handoff)

  for (const call of [...on.calls, ...on.observers]) {
    assert.deepEqual(documentsIn(call), [], 'no call carries a file that is not an image')
  }
  const first = on.calls[0]
  assert.ok(first)
  assert.deepEqual(
    ['politica.pdf', 'precos.xlsx', 'proposta.docx'].map(
      (name) => notesOf(first).find((note) => note.name === name)?.name,
    ),
    ['politica.pdf', 'precos.xlsx', 'proposta.docx'],
    'the first call carries the note of each file',
  )
  const markers = on.observers.flatMap((each) => each.texts).join('\n')
  for (const name of ['politica.pdf', 'precos.xlsx', 'proposta.docx'])
    assert.ok(markers.includes(`: ${name}]`), `the observer got the marker of ${name}`)

  const body = {
    toolCallId: await proposalOf(on),
    projectName: 'Descontos',
    connections: [on.matriz],
  }
  const touched = await post(
    on.hub,
    on.ana,
    `${on.url}/handoffs`,
    { ...body, deliver: true },
    randomUUID(),
  )
  assert.equal(touched.statusCode, 201, touched.body)
  HandedOff.parse(touched.json())
  const read = await listOf(on)
  for (const line of [
    'Arquivos que a pessoa mandou ao Assistente:',
    '- politica.pdf (PDF, 197,3 KB)',
    '- precos.xlsx (planilha, 4 KB)',
    '- proposta.docx (documento, 4 KB)',
  ])
    assert.ok(read.includes(line), `the Builder's first call lacks: ${line}\n${read}`)
})

/** The text of the Builder's first call after the hand-off, once its turn asked the model (ten seconds at most). */
async function listOf(on: Awaited<ReturnType<typeof conversation>>): Promise<string> {
  for (let tries = 0; tries < 100; tries += 1) {
    const read = on.calls
      .map((each) => each.texts.join('\n'))
      .find((each) => each.includes(SUMMARY) && each.includes('Arquivos que a pessoa mandou'))
    if (read !== undefined) return read
    await sleep(100)
  }
  assert.fail('the Builder never asked the model with the list of files')
}

const OPT_IN =
  'opt-in: set CONEXUS_EVAL_REAL_MODEL to a folder; firstmate opens the link the test writes there and writes back the sign-in code, or CONEXUS_EVAL_CLAUDE_CREDENTIAL names a saved sign-in'

/** A small PDF that holds a line of text, which `pdftotext` converts. */
function readablePdf(line: string): Buffer {
  const stream = `BT /F1 12 Tf 72 720 Td (${line}) Tj ET`
  return Buffer.from(
    `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length ${stream.length}>>stream\n${stream}\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R/Size 6>>\n%%EOF\n`,
  )
}

test('o roteiro com modelo de verdade', { timeout: 1_800_000 }, async (t) => {
  if (REAL_MODEL === undefined) return t.skip(OPT_IN)
  const on = await subscribed(t, REAL_MODEL)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const { say } = await talking(t, on.hub, on.ana, url)
  const contract = file(
    'contrato.pdf',
    PDF_TYPE,
    readablePdf('Contrato de fornecimento: desconto de 5 por cento acima de 100 unidades.'),
  )
  async function answered(question: string, files: SentFile[] = []) {
    assert.equal(endOf(await say(question, files)), 'complete')
    const messages = await messagesOf(on.hub, on.ana, url)
    const asked = messages.findLastIndex((message) => message.role === 'person')
    return messages.slice(asked + 1).flatMap((message) => message.parts)
  }
  const first = await answered('Qual o desconto acima de 100 unidades?', [contract])
  const commands = first.flatMap((part) =>
    part.type === 'tool-invocation' ? [part.toolInvocation.toolName] : [],
  )
  assert.ok(commands.includes(COMMAND), 'the model read the file on the machine, by parts')
  assert.match(textOf(first), /5/, 'the answer carries the discount')
  const next = await answered(CONTRACT)
  assert.ok(
    next.some(
      (part) => part.type === 'tool-invocation' && part.toolInvocation.toolName === COMMAND,
    ),
    'the model looked for the file',
  )
  for (const parts of [first, next]) {
    const written = parts.flatMap((part) =>
      part.type === 'tool-invocation' ? [JSON.stringify(part.toolInvocation.args)] : [],
    )
    assert.ok(
      written.every((each) => !/\.(xlsx|docx)/.test(each)),
      'no spreadsheet or document without a request',
    )
  }
})
