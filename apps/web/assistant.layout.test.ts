import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { listAssistantConnections, listAssistantConversations } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import { holdsColumn } from './chat-column.ts'
import type { Replies } from './layout-harness.ts'
import { createHarness, DESKTOP, LAPTOP, ok, PHONE, touching } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { ASSISTANT_PATH, ASSISTANT_REPLIES } from './sweep-assistant-states.ts'
import { OWNER, PROJECT_ID, PROJECT_NAME, projectsPage, startsOn } from './sweep-replies.ts'

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

test('no celular, a linha de Continuar de um Projeto de nome comprido mantém o título e a idade na tela', async () => {
  const replies = assistant([
    {
      id: '44444444-4444-4444-8444-444444444444',
      title: 'Pedidos do mês',
      project: { id: PROJECT_ID, name: 'Pedidos' },
    },
  ])
  const page = await harness.open(`/companies/${COMPANY.id}`, { viewport: PHONE, replies })
  const row = page
    .getByRole('region', { name: 'Continuar' })
    .getByRole('link', { name: /Pedidos do mês/ })
  await row.waitFor()
  const [title, project, age] = await Promise.all(
    [0, 1, 2].map((at) => row.locator(':scope > span').nth(at).boundingBox()),
  )
  const line = await row.boundingBox()
  assert.ok(title && project && age && line, 'the row is not laid out')
  assert.ok(title.width >= 80, `the title is squeezed to ${title.width}px by the Projeto label`)
  assert.ok(project.x + project.width <= age.x, 'the Projeto label runs over the age')
  assert.ok(age.x + age.width <= line.x + line.width + 1, 'the age leaves the row')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), PHONE.width)
  await page.close()
})

test('no computador, a linha de Continuar mostra o nome inteiro de um Projeto de nome médio', async () => {
  const name = 'Pedidos e entregas da filial'
  const replies = assistant([
    {
      id: '44444444-4444-4444-8444-444444444444',
      title: 'Pedidos do mês',
      project: { id: PROJECT_ID, name },
    },
  ])
  const page = await harness.open(`/companies/${COMPANY.id}`, { viewport: DESKTOP, replies })
  const row = page
    .getByRole('region', { name: 'Continuar' })
    .getByRole('link', { name: /Pedidos do mês/ })
  const label = row.locator(':scope > span').nth(1)
  await label.waitFor()
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

test('no celular, a folha do arquivo mostra o nome e o Fechar da folha não encosta em nada do cabeçalho', async () => {
  const page = await harness.open(ASSISTANT_PATH, { viewport: PHONE, replies: ASSISTANT_REPLIES })
  const open = page.getByRole('button', { name: /^Abrir relatorio/ })
  await open.waitFor()
  await open.click()
  const sheet = page.getByRole('dialog', { name: /^relatorio/ })
  await sheet.waitFor()
  const name = sheet.locator('section h2')
  await name.waitFor()
  const close = await sheet.getByRole('button', { name: 'Fechar' }).boundingBox()
  const baixar = await sheet.getByRole('button', { name: 'Baixar' }).boundingBox()
  const title = await name.boundingBox()
  assert.ok(close && baixar && title, 'the header is not laid out')
  for (const [label, box] of [
    ['Baixar', baixar],
    ['o nome', title],
  ] as const)
    assert.ok(box.x + box.width <= close.x, `Fechar touches ${label}`)
  await page.close()
})

const TWO_TOOLS = [
  {
    connectionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    connector: 'sankhya',
    name: 'Vendas',
    chosen: true,
  },
  {
    connectionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    connector: 'sankhya',
    name: 'Estoque',
    chosen: true,
  },
]

const WITH_TOOLS = {
  ...assistant([]),
  [`GET ${API}/connections`]: ok(listAssistantConnections, { connections: TWO_TOOLS }),
}

/** The left edge of each control of the box's row, measured from the box's own edge. */
async function offsets(page: Page, names: string[]) {
  const box = await page.locator('[data-slot="input-group"]').first().boundingBox()
  assert.ok(box, 'the box is not laid out')
  return Promise.all(
    names.map(async (name) => {
      const one = await page.getByRole('button', { name }).boundingBox()
      assert.ok(one, `${name} is not laid out`)
      return Math.round(one.x - box.x)
    }),
  )
}

test('a linha da caixa de Início, sem Projeto, a 1366: + em 13, pasta em 49, ferramentas em 85, enviar em 675', async () => {
  const page = await harness.open(`/companies/${COMPANY.id}`, {
    viewport: DESKTOP,
    replies: WITH_TOOLS,
  })
  await page.getByRole('button', { name: '2 ferramentas' }).waitFor()
  assert.deepEqual(
    await offsets(page, ['Anexar e ferramentas', 'Projeto da conversa', '2 ferramentas', 'Enviar']),
    [13, 49, 85, 675],
  )
  await page.close()
})

test('a 390 os três controles da esquerda ficam onde estavam, só com o número e sem palavra', async () => {
  const page = await harness.open(`/companies/${COMPANY.id}`, {
    viewport: PHONE,
    replies: WITH_TOOLS,
  })
  const tools = page.getByRole('button', { name: '2 ferramentas' })
  await tools.waitFor()
  const [plus, folder, count] = await offsets(page, [
    'Anexar e ferramentas',
    'Projeto da conversa',
    '2 ferramentas',
  ])
  assert.deepEqual([plus, folder, count], [13, 49, 85])
  assert.equal(await tools.getByText('ferramentas').isVisible(), false)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), PHONE.width)
  await page.close()
})

test('na conversa de Projeto, o nome do Projeto fica na pasta e as ferramentas vêm depois dele', async () => {
  const page = await harness.open(`/companies/${COMPANY.id}/projects/${PROJECT_ID}/assistant`, {
    viewport: DESKTOP,
    replies: WITH_TOOLS,
  })
  const tools = page.getByRole('button', { name: '2 ferramentas' })
  await tools.waitFor()
  const name = page.locator('form').getByText(PROJECT_NAME)
  await name.waitFor()
  const [named, counted] = await Promise.all([name.boundingBox(), tools.boundingBox()])
  assert.ok(named && counted, 'the row is not laid out')
  assert.ok(named.x + named.width <= counted.x, 'the tools come after the Projeto name')
  assert.equal(await page.getByRole('button', { name: 'Projeto da conversa' }).count(), 0)
  await page.close()
})

test('com 11 ferramentas, as linhas do "+" mantêm 32 px e a lista rola (U5, critério 19)', async () => {
  const tools = Array.from({ length: 11 }, (_, index) => ({
    connectionId: `${String(index + 1).padStart(8, '0')}-aaaa-4aaa-8aaa-aaaaaaaaaaaa`,
    connector: 'sankhya',
    name: `Ferramenta ${index + 1}`,
    chosen: true,
  }))
  const page = await harness.open(`/companies/${COMPANY.id}`, {
    viewport: DESKTOP,
    replies: {
      ...assistant([]),
      [`GET ${API}/connections`]: ok(listAssistantConnections, { connections: tools }),
    },
  })
  await page.getByRole('button', { name: '11 ferramentas' }).click()
  const dialog = page.getByRole('dialog', { name: 'Anexar e ferramentas' })
  await dialog.getByRole('switch').first().waitFor()
  const rows = await dialog
    .getByRole('switch')
    .evaluateAll((switches) =>
      switches.map((one) => (one.closest('li') ?? one).getBoundingClientRect().height),
    )
  assert.equal(rows.length, 11)
  for (const height of rows) assert.ok(height >= 32, `a row shrank to ${height}px`)
  const scroll = await dialog.locator('.overflow-y-auto').evaluate((list) => ({
    visible: list.clientHeight,
    total: list.scrollHeight,
  }))
  assert.ok(scroll.total > scroll.visible, 'the list does not scroll')
  await page.close()
})

async function plusRows(viewport: typeof DESKTOP, touch: boolean) {
  const page = await harness.open(ASSISTANT_PATH, { viewport, replies: ASSISTANT_REPLIES })
  await page.getByRole('button', { name: 'Anexar e ferramentas' }).click()
  const dialog = page.getByRole('dialog', { name: 'Anexar e ferramentas' })
  await dialog.getByRole('switch').first().waitFor()
  if (touch) await touching(page)
  const rows = await dialog
    .getByRole('button')
    .evaluateAll((all) => all.map((one) => one.getBoundingClientRect().height))
  await page.close()
  return rows
}

test('as linhas do "+" têm 44 px num toque e 32 com o mouse (V58)', async () => {
  const fine = await plusRows(DESKTOP, false)
  assert.ok(fine.length > 0 && fine.every((height) => height === 32), `mouse rows: ${fine}`)
  const touch = await plusRows(PHONE, true)
  assert.ok(touch.length > 0 && touch.every((height) => height === 44), `touch rows: ${touch}`)
})

// The founder, 2026-11-09: the box moved and the scroll took it along (design V54).
for (const viewport of [LAPTOP, PHONE])
  test(`a ${viewport.width} px, na conversa do Assistente, quem rola é a conversa e a caixa fica onde estava`, async () => {
    const page = await harness.open(ASSISTANT_PATH, { viewport, replies: ASSISTANT_REPLIES })
    await holdsColumn(page, viewport)
    await page.close()
  })
