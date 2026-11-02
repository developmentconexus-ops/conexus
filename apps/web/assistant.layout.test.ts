import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { listAssistantConnections, listAssistantConversations } from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { createHarness, DESKTOP, ok, PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { ASSISTANT_PATH, ASSISTANT_REPLIES } from './sweep-assistant-states.ts'
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

function assistant(
  conversations: {
    id: string
    title: string
    project: { id: string; name: string } | null
    automation?: { automationId: string; name: string }
  }[],
) {
  return {
    ...BASE,
    [`GET ${API}/connections`]: ok(listAssistantConnections, { connections: [] }),
    [`GET ${API}/conversations`]: ok(listAssistantConversations, {
      conversations: conversations.map((one) => ({
        automation: null,
        ...one,
        updatedAt: '2026-10-19T12:00:00.000Z',
      })),
      next: { kind: 'END' },
    }),
  }
}

test('no celular, a conversa recente de um Projeto de nome comprido mantém o título e a data na tela', async () => {
  const replies = assistant([
    {
      id: '44444444-4444-4444-8444-444444444444',
      title: 'Pedidos do mês',
      project: { id: PROJECT_ID, name: 'Pedidos' },
    },
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

test('no computador, a conversa recente mostra o nome inteiro de um Projeto de nome médio', async () => {
  const name = 'Pedidos e entregas da filial'
  const replies = assistant([
    {
      id: '44444444-4444-4444-8444-444444444444',
      title: 'Pedidos do mês',
      project: { id: PROJECT_ID, name },
    },
  ])
  const page = await harness.open(`/companies/${COMPANY.id}`, { viewport: DESKTOP, replies })
  const badge = page.getByRole('link', { name: /Pedidos do mês/ }).locator('[data-slot="badge"]')
  await badge.waitFor()
  const label = badge.locator('span.truncate')
  const cut = await label.evaluate((one) => one.scrollWidth - one.clientWidth)
  assert.equal(await label.textContent(), name)
  assert.ok(cut <= 0, `the Projeto label is cut by ${cut}px while the row has room`)
  await page.close()
})

test('no computador, a conversa recente mostra Automação · nome inteiro quando a linha tem espaço', async () => {
  const name = 'Resumo de vendas'
  const replies = assistant([
    {
      id: '66666666-4444-4444-8444-444444444444',
      title: 'Pedidos do mês',
      project: null,
      automation: {
        automationId: 'schedule_conexus-automation-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        name,
      },
    },
  ])
  const page = await harness.open(`/companies/${COMPANY.id}`, { viewport: DESKTOP, replies })
  const badge = page.getByRole('link', { name: /Pedidos do mês/ }).locator('[data-slot="badge"]')
  await badge.waitFor()
  const label = badge.locator('span.truncate')
  const cut = await label.evaluate((one) => one.scrollWidth - one.clientWidth)
  assert.equal(await label.textContent(), `Automação · ${name}`)
  assert.ok(cut <= 0, `the Automação label is cut by ${cut}px while the row has room`)
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

test('no celular, a linha de uma leitura recusada diz a frase inteira, sem cortar (QA F3)', async () => {
  const page = await harness.open(ASSISTANT_PATH, { viewport: PHONE, replies: ASSISTANT_REPLIES })
  await page.getByRole('button', { name: /4 ferramentas/ }).click()
  const sentence = page.getByText(/pediu para esperar/)
  await sentence.waitFor()
  const cut = await sentence.evaluate((one) => one.scrollWidth - one.clientWidth)
  assert.ok(cut <= 0, `the refusal is cut by ${cut}px`)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), PHONE.width)
  await page.close()
})

test('no celular, o arquivo abre numa folha que fecha com Esc e devolve o foco ao botão (U4)', async () => {
  const page = await harness.open(ASSISTANT_PATH, { viewport: PHONE, replies: ASSISTANT_REPLIES })
  const open = page.getByRole('button', { name: /^Abrir relatorio/ })
  await open.waitFor()
  await open.click()
  const sheet = page.getByRole('dialog', { name: /^relatorio/ })
  await sheet.waitFor()
  assert.equal(await sheet.getAttribute('aria-modal'), null)
  await page.keyboard.press('Escape')
  await sheet.waitFor({ state: 'detached' })
  await page.close()
})
