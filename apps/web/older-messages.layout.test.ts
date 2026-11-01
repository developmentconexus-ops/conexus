import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import {
  ASSISTANT_CONTROLLER,
  BUILDER_CONTROLLER,
  BUILDER_ROUTES,
  listAssistantConnections,
  readAssistantConversation,
} from '@conexus/hub-api'
import { createHarness, DESKTOP, ok, PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { WITH_CONVERSATIONS } from './sweep-conversation-states.ts'
import { OWNER, PROJECT_ID } from './sweep-replies.ts'
import { sessionReplies, storedOf } from './sweep-session.ts'

// The older messages of a long conversation, measured in the browser: jsdom lays nothing out and
// scrolls nothing (testing T23).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(() => harness.stop())

const PROJECT = `/companies/${COMPANY.id}/projects/${PROJECT_ID}`
const FIRST = '11111111-1111-4111-8111-111111111111'
const THREAD = `${BUILDER_ROUTES}/agent-controller/${BUILDER_CONTROLLER}/sessions/${FIRST}/threads/${FIRST}/messages`

const ASSISTANT_THREAD = `${BUILDER_ROUTES}/agent-controller/${ASSISTANT_CONTROLLER}/sessions/${FIRST}/threads/${FIRST}/messages`

const LONG_CONVERSATION = Array.from({ length: 250 }, (_, index) =>
  storedOf({
    id: `m${index}`,
    role: index % 2 === 0 ? 'person' : 'builder',
    parts: [{ type: 'text', text: `${index % 2 === 0 ? 'Pergunta' : 'Resposta'} ${index}` }],
    model: index % 2 === 0 ? null : 'anthropic/claude-sonnet-4',
    createdAt: new Date(Date.UTC(2026, 9, 19, 12, 0, index)).toISOString(),
  }),
)

test('ao chegar ao topo as 100 mensagens anteriores chegam sem mexer no ponto da leitura, e as que estão na tela ficam enquanto elas chegam', async () => {
  for (const viewport of [DESKTOP, PHONE]) {
    const page = await harness.open(`${PROJECT}/conversations/${FIRST}`, {
      viewport,
      replies: WITH_CONVERSATIONS,
    })
    const limits: number[] = []
    await page.route(`**${THREAD}*`, async (route) => {
      const limit = Number(new URL(route.request().url()).searchParams.get('limit'))
      limits.push(limit)
      if (limit > 100) await new Promise((resolve) => setTimeout(resolve, 600))
      return route.fulfill({ json: { messages: LONG_CONVERSATION.slice(-limit) } })
    })
    await page.reload()
    if (viewport === PHONE)
      await page.getByRole('button', { name: 'Conversa', exact: true }).click()
    await page.getByText('Resposta 249', { exact: true }).waitFor()
    const scroller = page.getByLabel('Rolagem da conversa')
    const box = await scroller.boundingBox()
    assert.ok(box)
    // Up to the middle of what is read, where the reader is still away from the top.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.wheel(0, -1200)
    // The fake stream ends and reopens by itself, and each reopening reads the window again, so
    // the number of reads races it; what the person is owed is that none asks for more than the window.
    await page.waitForTimeout(300)
    assert.deepEqual(
      [...new Set(limits)],
      [100],
      `${viewport.width}px: reading the middle asks for nothing more than the window`,
    )
    const anchor = page.getByText('Resposta 151', { exact: true })
    for (let wheel = 0; wheel < 80 && !limits.some((limit) => limit > 100); wheel++) {
      await page.mouse.wheel(0, -2000)
      await page.waitForTimeout(30)
    }
    await page.getByRole('status', { name: 'Carregando mensagens anteriores' }).waitFor()
    const before = await anchor.evaluate((el) => el.getBoundingClientRect().top)
    assert.equal(
      await anchor.count(),
      1,
      `${viewport.width}px: the messages on screen stay while the read arrives`,
    )
    await page.getByText('Resposta 51', { exact: true }).waitFor({ state: 'attached' })
    await page.waitForTimeout(300)
    const after = await anchor.evaluate((el) => el.getBoundingClientRect().top)
    assert.ok(
      Math.abs(after - before) <= 1,
      `${viewport.width}px: the place moved ${after - before}px`,
    )
    assert.deepEqual([...new Set(limits)], [100, 200])
    assert.equal(
      await page.getByRole('status', { name: 'Carregando mensagens anteriores' }).count(),
      0,
    )
    assert.deepEqual(page.problems, [])
    await page.close()
  }
})

test('uma conversa do Início com mais de 100 mensagens abre no fim, rola dentro da caixa e pede a página anterior ao chegar ao topo', async () => {
  const page = await harness.open(`/companies/${COMPANY.id}/conversations/${FIRST}`, {
    viewport: DESKTOP,
    replies: {
      ...OWNER,
      [`GET /api/companies/${COMPANY.id}/assistant/connections`]: ok(listAssistantConnections, {
        connections: [],
      }),
      [`GET /api/companies/${COMPANY.id}/assistant/conversations/${FIRST}`]: ok(
        readAssistantConversation,
        {
          conversation: {
            id: FIRST,
            title: 'Vendas da semana',
            updatedAt: '2026-10-19T12:00:00.000Z',
            projectId: null,
            connections: [],
          },
        },
      ),
      ...sessionReplies(FIRST, { controller: ASSISTANT_CONTROLLER }),
    },
  })
  const limits: number[] = []
  await page.route(`**${ASSISTANT_THREAD}*`, async (route) => {
    const limit = Number(new URL(route.request().url()).searchParams.get('limit'))
    limits.push(limit)
    return route.fulfill({ json: { messages: LONG_CONVERSATION.slice(-limit) } })
  })
  await page.reload()
  await page.getByText('Resposta 249', { exact: true }).waitFor()
  const scroller = page.getByLabel('Rolagem da conversa')
  const room = await scroller.evaluate((el) => ({
    scrolls: el.scrollHeight > el.clientHeight,
    page: document.documentElement.scrollHeight - innerHeight,
  }))
  assert.ok(room.scrolls, 'the conversation does not scroll inside its box')
  assert.ok(room.page <= 0, `the page grew ${room.page}px past the screen`)
  const box = await scroller.boundingBox()
  assert.ok(box)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  for (let wheel = 0; wheel < 80 && !limits.some((limit) => limit > 100); wheel++) {
    await page.mouse.wheel(0, -2000)
    await page.waitForTimeout(30)
  }
  assert.ok(
    limits.some((limit) => limit > 100),
    'reaching the top asked for no older page',
  )
  await page.close()
})
