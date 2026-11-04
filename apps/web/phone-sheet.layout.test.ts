import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import {
  CONSTRUTOR_CONTROLLER,
  CONSTRUTOR_TOOL,
  getAgent,
  listAgentVersions,
  listConstrutorConversations,
  listTools,
} from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import type { Replies } from './layout-harness.ts'
import { createHarness, failure, ok, PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { ASSISTANT_PATH, ASSISTANT_REPLIES } from './sweep-assistant-states.ts'
import { WITH_ACCOUNT } from './sweep-conversation-states.ts'
import { PROJECT_ID, projectsPage } from './sweep-replies.ts'
import { sessionReplies } from './sweep-session.ts'

// The sheets that open over a conversation on a phone, with their own Fechar in the corner: what a
// header leaves it, and where it sits (step 24.3, the Assistant's file and the Construtor's draft).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

type Box = { x: number; y: number; width: number; height: number }

function middle(box: Box) {
  return box.y + box.height / 2
}

function crosses(a: Box, b: Box) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

async function sheetOfFile(page: Page) {
  const open = page.getByRole('button', { name: /^Abrir relatorio/ })
  await open.waitFor()
  await open.click()
  const sheet = page.getByRole('dialog', { name: /^relatorio/ })
  await sheet.waitFor()
  return sheet
}

test('no celular, o Fechar da folha do arquivo fica na altura do centro do cabeçalho, na de Baixar', async () => {
  const page = await harness.open(ASSISTANT_PATH, { viewport: PHONE, replies: ASSISTANT_REPLIES })
  const sheet = await sheetOfFile(page)
  const close = await sheet.getByRole('button', { name: 'Fechar' }).boundingBox()
  const baixar = await sheet.getByRole('button', { name: 'Baixar' }).boundingBox()
  assert.ok(close && baixar, 'the header is not laid out')
  assert.ok(
    Math.abs(middle(close) - middle(baixar)) <= 1,
    `Fechar is centered at ${middle(close)}, Baixar at ${middle(baixar)}`,
  )
  await page.close()
})

const CHAT = '55555555-5555-4555-8555-555555555555'
const AGENT = '11111111-aaaa-4aaa-8aaa-111111111111'
const AGENTS = `/api/companies/${COMPANY.id}/projects/${PROJECT_ID}`
const AGENT_NAME = 'Conferente de metas com um nome bem comprido para a linha'

const DRAFTED = {
  id: AGENT,
  projectId: PROJECT_ID,
  name: AGENT_NAME,
  description: 'Compara as vendas de ontem com as metas.',
  state: { kind: 'DRAFT' as const },
  updatedAt: '2026-11-02T12:00:00.000Z',
  lastRunAt: null,
  draft: {
    name: AGENT_NAME,
    description: 'Compara as vendas de ontem com as metas.',
    instructions: 'Diga quem ficou abaixo da meta.',
    model: null,
    memory: { observational: true },
    connections: [],
    web: false,
    appData: false,
  },
  revision: 3,
  tools: [],
  offered: [],
  createdBy: null,
}

/** The Construtor's conversation that saved an agent's draft, with the agent read as `reading` answers. */
function construtor(reading: Replies[string]): Replies {
  return {
    ...WITH_ACCOUNT,
    ...projectsPage(COMPANY.id),
    [`GET ${AGENTS}/construtor/conversations`]: ok(listConstrutorConversations, {
      conversations: [{ id: CHAT, title: 'Meu agente', updatedAt: '2026-11-02T12:00:00.000Z' }],
    }),
    [`GET ${AGENTS}/agents/${AGENT}`]: reading,
    [`GET ${AGENTS}/agents/${AGENT}/versions`]: ok(listAgentVersions, { versions: [] }),
    [`GET ${AGENTS}/tools`]: ok(listTools, { tools: [], ready: [] }),
    ...sessionReplies(CHAT, {
      controller: CONSTRUTOR_CONTROLLER,
      messages: [
        {
          id: 'm1',
          role: 'builder',
          parts: [
            {
              type: 'tool-invocation',
              toolInvocation: {
                state: 'result',
                toolCallId: 'c1',
                toolName: CONSTRUTOR_TOOL.agentDraft,
                args: {},
                result: { kind: 'SAVED', agent: { id: AGENT, name: AGENT_NAME } },
              },
            },
          ],
          model: 'anthropic/claude-sonnet-4',
          createdAt: '2026-11-02T12:01:00.000Z',
        },
      ],
    }),
  }
}

async function draftSheet(page: Page) {
  const line = page.getByRole('button', { name: /Montou o rascunho do agente/ })
  await line.waitFor()
  await line.click()
  const sheet = page.getByRole('dialog', { name: 'Rascunho do agente' })
  await sheet.waitFor()
  return sheet
}

const CONSTRUTOR_PATH = `/companies/${COMPANY.id}/projects/${PROJECT_ID}/agents/construtor/${CHAT}`

test('no celular, o título e o selo de estado do rascunho na folha não cruzam o Fechar da folha', async () => {
  const replies = construtor(ok(getAgent, { agent: DRAFTED }))
  const page = await harness.open(CONSTRUTOR_PATH, { viewport: PHONE, replies })
  const sheet = await draftSheet(page)
  const title = sheet.getByRole('heading', { name: /^Rascunho · / })
  await title.waitFor()
  const stamp = title.locator('xpath=following-sibling::*[1]')
  const [close, name, state] = await Promise.all([
    sheet.getByRole('button', { name: 'Fechar' }).boundingBox(),
    title.boundingBox(),
    stamp.boundingBox(),
  ])
  assert.ok(close && name && state, 'the header is not laid out')
  assert.ok(!crosses(name, close), 'Fechar crosses the title')
  assert.ok(!crosses(state, close), 'Fechar crosses the state stamp')
  await page.close()
})

for (const [label, reading, text] of [
  ['o agente apagado', failure('AGENT_NOT_FOUND'), /Este agente foi apagado/],
  ['a leitura recusada', failure('DATABASE_UNAVAILABLE'), /banco do Conexus não respondeu/],
] as const)
  test(`no celular, com ${label}, o texto na folha do rascunho não cruza o Fechar da folha`, async () => {
    const page = await harness.open(CONSTRUTOR_PATH, {
      viewport: PHONE,
      replies: construtor(reading),
    })
    const sheet = await draftSheet(page)
    const sentence = sheet.getByText(text).first()
    await sentence.waitFor()
    const [close, said] = await Promise.all([
      sheet.getByRole('button', { name: 'Fechar' }).boundingBox(),
      sentence.boundingBox(),
    ])
    assert.ok(close && said, 'the sheet is not laid out')
    assert.ok(!crosses(said, close), 'Fechar crosses the sentence')
    await page.close()
  })
