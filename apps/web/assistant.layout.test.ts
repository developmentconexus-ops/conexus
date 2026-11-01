import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { listAssistantConnections, listAssistantConversations } from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { createHarness, DESKTOP, ok, PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { OWNER, PROJECT_ID, projectsPage, startsOn } from './sweep-replies.ts'

// The Assistant's Início and Conversas do Projeto in a real browser (step 24.1, criterion 23).
const API = `/api/companies/${COMPANY.id}/assistant`
const BASE: Replies = { ...OWNER, ...projectsPage(COMPANY.id), ...startsOn(COMPANY.id) }

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

function assistant(conversations: { id: string; title: string; projectId: string | null }[]) {
  return {
    ...BASE,
    [`GET ${API}/connections`]: ok(listAssistantConnections, { connections: [] }),
    [`GET ${API}/conversations`]: ok(listAssistantConversations, {
      conversations: conversations.map((one) => ({
        ...one,
        updatedAt: '2026-10-19T12:00:00.000Z',
      })),
      next: { kind: 'END' },
    }),
  }
}

test('no celular, a conversa recente de um Projeto de nome comprido mantém o título e a data na tela', async () => {
  const replies = assistant([
    { id: '44444444-4444-4444-8444-444444444444', title: 'Pedidos do mês', projectId: PROJECT_ID },
  ])
  const page = await harness.open(`/companies/${COMPANY.id}`, { viewport: PHONE, replies })
  const row = page.getByRole('link', { name: /Pedidos do mês/ })
  await row.locator('[data-slot="badge"]').waitFor()
  const title = await row.locator('span.truncate').first().boundingBox()
  const badge = await row.locator('[data-slot="badge"]').boundingBox()
  const date = await row.locator(':scope > span').last().boundingBox()
  const line = await row.boundingBox()
  assert.ok(title && badge && date && line, 'the row is not laid out')
  assert.ok(title.width >= 80, `the title is squeezed to ${title.width}px by the Projeto label`)
  assert.ok(badge.x + badge.width <= date.x, 'the Projeto label runs over the date')
  assert.ok(date.x + date.width <= line.x + line.width + 1, 'the date leaves the row')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), PHONE.width)
  await page.close()
})

test('em Conversas do Projeto, o título, a caixa e a frase de vazio ficam na mesma coluna', async () => {
  const page = await harness.open(`/companies/${COMPANY.id}/projects/${PROJECT_ID}/assistant`, {
    viewport: DESKTOP,
    replies: assistant([]),
  })
  const empty = page.getByText('Nenhuma conversa neste Projeto ainda.')
  await empty.waitFor()
  const title = page.getByRole('heading', { name: 'Conversas' })
  const form = page
    .getByRole('textbox', { name: 'Mensagem para o Assistente' })
    .locator('xpath=ancestor::form')
  const lefts = await Promise.all(
    [title, form, empty].map(async (one) => (await one.boundingBox())?.x),
  )
  assert.ok(
    lefts.every((left) => left !== undefined),
    'something is not laid out',
  )
  assert.equal(
    new Set(lefts.map((left) => Math.round(left ?? 0))).size,
    1,
    `lefts differ: ${lefts}`,
  )
  await page.close()
})
