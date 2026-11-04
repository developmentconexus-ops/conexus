import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import {
  ASSISTANT_CONTROLLER,
  listAssistantConnections,
  listAssistantConversations,
} from '@conexus/hub-api'
import { createHarness, DESKTOP, ok, PHONE } from './layout-harness.ts'
import { AgentStart, recordedEvent } from './src/builder/conversation/test-recorded.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import {
  ASSISTANT_ID,
  ASSISTANT_MESSAGES,
  ASSISTANT_PATH,
  ASSISTANT_REPLIES,
} from './sweep-assistant-states.ts'
import { WITH_ACCOUNT } from './sweep-conversation-states.ts'
import { OWNER, PROJECT_ID, projectsPage, startsOn } from './sweep-replies.ts'
import { sessionReplies } from './sweep-session.ts'
import { WORKING, WORKING_REPLIES } from './sweep-working.ts'

// The axis of a conversation and the labels of the lists beside it, in a real browser (step 13.3, V59 and V61).
const harness = createHarness(import.meta.dirname, { scrollbars: 'classic' })
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const AUTOMATION = 'schedule_conexus-automation-55555555-5555-4555-8555-555555555555'
const API = `/api/companies/${COMPANY.id}/assistant`

/** Início of the owner with one conversation, in the Projeto, the sidebar lists too. */
function assistantReplies(extra: { automation?: { automationId: string; name: string } } = {}) {
  return {
    ...OWNER,
    ...projectsPage(COMPANY.id),
    ...startsOn(COMPANY.id),
    [`GET ${API}/connections`]: ok(listAssistantConnections, { connections: [] }),
    [`GET ${API}/conversations`]: ok(listAssistantConversations, {
      conversations: [
        {
          id: '44444444-4444-4444-8444-444444444444',
          title: 'Pedidos do mês',
          project: { id: PROJECT_ID, name: 'Pedidos' },
          automation: null,
          ...extra,
          updatedAt: '2026-10-19T12:00:00.000Z',
        },
      ],
      next: { kind: 'END' },
    }),
  }
}

test('a conversa e a caixa ficam no eixo de 720 a 1366 (V59)', async () => {
  const page = await harness.open(ASSISTANT_PATH, { viewport: DESKTOP, replies: ASSISTANT_REPLIES })
  const log = page.getByRole('log', { name: /^Conversa com o / })
  await log.waitFor()
  const form = page.locator('form').filter({ has: page.getByLabel('Mensagem') })
  for (const [name, element] of [
    ['transcript', log],
    ['box', form],
  ] as const) {
    const box = await element.boundingBox()
    assert.ok(box, `the ${name} is not laid out`)
    assert.ok(box.width <= 720, `the ${name} is ${box.width} wide, past the 720 axis`)
  }
  await page.close()
})

test('os rótulos de grupo da barra lateral não saem em caixa alta (V61)', async () => {
  const page = await harness.open(`/companies/${COMPANY.id}`, {
    viewport: DESKTOP,
    replies: assistantReplies(),
  })
  await page.locator('[data-slot=sidebar-day-label]').first().waitFor()
  const transforms = await page
    .locator('[data-slot=sidebar-group-label], [data-slot=sidebar-day-label]')
    .evaluateAll((all) => all.map((one) => getComputedStyle(one).textTransform))
  assert.ok(transforms.length > 0, 'the sidebar has no group label')
  assert.ok(
    transforms.every((value) => value === 'none'),
    `a label is ${transforms}`,
  )
  await page.close()
})

test('os grupos do seletor de modelo não saem em caixa alta (V61)', async () => {
  const page = await harness.open(ASSISTANT_PATH, { viewport: DESKTOP, replies: ASSISTANT_REPLIES })
  await page.getByRole('combobox', { name: 'Modelo e raciocínio' }).click()
  const labels = page.locator('[data-slot=combobox-label]')
  await labels.first().waitFor()
  const transforms = await labels.evaluateAll((all) =>
    all.map((one) => getComputedStyle(one).textTransform),
  )
  assert.ok(
    transforms.every((value) => value === 'none'),
    `a label is ${transforms}`,
  )
  await page.close()
})

for (const viewport of [DESKTOP, PHONE])
  test(`em Conversas do Projeto, a Automação de nome comprido fica dentro da linha a ${viewport.width}`, async () => {
    const page = await harness.open(`/companies/${COMPANY.id}/projects/${PROJECT_ID}/assistant`, {
      viewport,
      replies: assistantReplies({
        automation: { automationId: AUTOMATION, name: 'Conferir os pedidos de todas as filiais' },
      }),
    })
    const row = page.getByRole('link', { name: /Pedidos do mês/ })
    await row.waitFor()
    const badge = row.getByText(/^Automação · /)
    const title = row.getByText(/^Pedidos do mês$/)
    const [line, tag, name] = await Promise.all([
      row.boundingBox(),
      badge.boundingBox(),
      title.boundingBox(),
    ])
    assert.ok(line && tag && name, 'the row is not laid out')
    assert.ok(name.width > 0, 'the title has no width left')
    assert.ok(line.height <= 44, `the row is ${line.height} high`)
    assert.ok(
      tag.y >= line.y && tag.y + tag.height <= line.y + line.height,
      'the badge leaves the row',
    )
    assert.ok(tag.x + tag.width <= line.x + line.width, 'the badge leaves the row sideways')
    await page.close()
  })

const WIDE = { width: 1800, height: 900 }

// The scrollbar belongs to the window's edge and the working line to the box (founder, 2026-11-03).
for (const viewport of [DESKTOP, WIDE, PHONE])
  test(`na conversa em andamento a rolagem vai à borda e "trabalhando" alinha com a caixa a ${viewport.width}`, async () => {
    const page = await harness.open(ASSISTANT_PATH, {
      viewport,
      replies: {
        ...ASSISTANT_REPLIES,
        ...sessionReplies(ASSISTANT_ID, {
          controller: ASSISTANT_CONTROLLER,
          messages: ASSISTANT_MESSAGES,
          display: { isRunning: true },
          events: [recordedEvent('abort', AgentStart)],
        }),
      },
    })
    const scroller = page.getByLabel('Rolagem da conversa')
    const working = page.getByRole('status').filter({ hasText: 'trabalhando' })
    const form = page.locator('form').filter({ has: page.getByLabel('Mensagem') })
    await working.waitFor()
    // The scroller stays hidden until its first scroll to the end lands; measuring before that
    // reads the conversation at the top.
    await scroller.waitFor()
    const [scroll, line, box, log, last] = await Promise.all([
      scroller.boundingBox(),
      working.locator('svg').first().boundingBox(),
      form.boundingBox(),
      page.getByRole('log', { name: /^Conversa com o / }).boundingBox(),
      page.locator('[data-slot=message-scroller-item]').last().boundingBox(),
    ])
    assert.ok(scroll && line && box && log && last, 'the conversation is not laid out')
    assert.equal(
      Math.round(scroll.x + scroll.width),
      viewport.width,
      'the scrollbar is not at the window edge',
    )
    assert.equal(
      Math.round(scroll.y + scroll.height),
      viewport.height,
      'the scrollbar stops above the bottom of the window',
    )
    assert.ok(
      box.y >= scroll.y && box.y + box.height <= scroll.y + scroll.height,
      'the box is not over the bottom of the scroll area',
    )
    assert.ok(
      last.y + last.height <= line.y,
      'the end of the conversation is under the working line and the box',
    )
    assert.ok(
      Math.abs(log.x + log.width / 2 - (box.x + box.width / 2)) <= 1,
      'the column of messages is not centred on the box',
    )
    assert.ok(
      Math.abs(line.x - box.x) <= 1,
      `the working line starts at ${line.x}, the box at ${box.x}`,
    )
    await page.close()
  })

// The panel at the Builder's side is narrower than the axis and its gutters: the footer must not cover the scrollbar's end.
test('no painel estreito do Construtor a caixa fica dentro da área de rolagem, sem cobrir a barra', async () => {
  const page = await harness.open(
    `/companies/${COMPANY.id}/projects/${PROJECT_ID}/conversations/${WORKING}`,
    {
      viewport: { width: 1366, height: 560 },
      replies: { ...WITH_ACCOUNT, ...WORKING_REPLIES },
    },
  )
  const scroller = page.getByLabel('Rolagem da conversa')
  const form = page.locator('form').filter({ has: page.getByLabel('Mensagem') })
  await form.waitFor()
  const [scroll, box, bar] = await Promise.all([
    scroller.boundingBox(),
    form.boundingBox(),
    scroller.evaluate((element: HTMLElement) => element.offsetWidth - element.clientWidth),
  ])
  assert.ok(scroll && box, 'the panel is not laid out')
  assert.ok(bar > 0, 'the browser shows no scrollbar')
  assert.ok(box.x + box.width <= scroll.x + scroll.width - bar, 'the box covers the scrollbar')
  assert.equal(Math.round(scroll.y + scroll.height), 560, 'the scrollbar stops above the bottom')
  await page.close()
})
