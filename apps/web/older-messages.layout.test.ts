import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { BUILDER_CONTROLLER, BUILDER_ROUTES } from '@conexus/hub-api'
import { createHarness, DESKTOP, PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { WITH_CONVERSATIONS } from './sweep-conversation-states.ts'
import { PROJECT_ID } from './sweep-replies.ts'
import { storedOf } from './sweep-session.ts'

// The older messages of a long conversation, measured in the browser: jsdom lays nothing out and
// scrolls nothing (testing T23).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(() => harness.stop())

const PROJECT = `/companies/${COMPANY.id}/projects/${PROJECT_ID}`
const FIRST = '11111111-1111-4111-8111-111111111111'
const THREAD = `${BUILDER_ROUTES}/agent-controller/${BUILDER_CONTROLLER}/sessions/${FIRST}/threads/${FIRST}/messages`

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
    await page.waitForTimeout(300)
    assert.deepEqual(limits, [100], `${viewport.width}px: reading the middle asks for nothing more`)
    const anchor = page.getByText('Resposta 151', { exact: true })
    for (let wheel = 0; wheel < 80 && limits.length < 2; wheel++) {
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
    // The fake stream ends and reopens, and each reopening reads the window again.
    assert.deepEqual([...new Set(limits)], [100, 200])
    assert.equal(
      await page.getByRole('status', { name: 'Carregando mensagens anteriores' }).count(),
      0,
    )
    assert.deepEqual(page.problems, [])
    await page.close()
  }
})
