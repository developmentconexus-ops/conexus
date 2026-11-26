import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { listAssistantConnections, listAssistantConversations } from '@conexus/hub-api'
import { atRest } from './at-rest.ts'
import { createHarness, ok, PHONE, reachOf, touching, ZOOMED_PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { OWNER, projectsPage, startsOn } from './sweep-replies.ts'

const API = `/api/companies/${COMPANY.id}/assistant`

function listReplies(conversations: { id: string; title: string; project: null }[]) {
  return {
    [`GET ${API}/connections`]: ok(listAssistantConnections, {
      connections: [],
    }),
    [`GET ${API}/conversations`]: ok(listAssistantConversations, {
      conversations: conversations.map((one) => ({
        automation: null,
        ...one,
        createdAt: '2026-10-19T12:00:00.000Z',
        updatedAt: '2026-10-19T12:00:00.000Z',
      })),
      next: { kind: 'END' },
    }),
  }
}

// The company's conversations on the phone: the page of Conversas holds the whole list, with its
// search, its place filter and its tabs; the drawer's column keeps only "Recentes" (design V22, V32, V56).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const PAGE = `/companies/${COMPANY.id}/conversations`
const ONE = [
  {
    id: '44444444-4444-4444-8444-444444444444',
    title: 'Pedidos do mês',
    project: null,
  },
]

test('a lista no celular: o rótulo do lugar é pílula com × de 44 de toque, e buscar ou trocar de aba mantém a página', async () => {
  const page = await harness.open(`${PAGE}?place=HOME`, {
    viewport: PHONE,
    replies: { ...OWNER, ...projectsPage(COMPANY.id), ...startsOn(COMPANY.id) },
  })
  const clear = page.getByRole('button', { name: 'Tirar o filtro: Início' })
  await clear.waitFor()
  await atRest(page)
  const pill = await clear.evaluate((button) => {
    const label = button.parentElement
    if (label === null) throw new Error('the button has no label')
    return {
      radius: parseFloat(getComputedStyle(label).borderTopLeftRadius),
      height: label.getBoundingClientRect().height,
    }
  })
  assert.ok(pill.radius >= pill.height / 2, 'the place label is not a pill')
  const box = page.getByRole('searchbox', { name: 'Buscar pelo título' })
  const frame = await box.boundingBox()
  assert.ok(frame, 'the search field is not laid out')
  const end = {
    x: frame.x + frame.width - 28,
    y: frame.y,
    width: 28,
    height: frame.height,
  }
  await box.fill('')
  await box.hover()
  const bare = await page.screenshot({ clip: end })
  await box.fill('rel')
  const typed = await page.screenshot({ clip: end })
  assert.ok(bare.equals(typed), "the browser's own ✕ is drawn at the end of the field")
  await page.waitForURL((url) => url.searchParams.get('q') === 'rel')
  await page.getByRole('tab', { name: 'Projetos' }).click()
  await page.waitForURL((url) => url.searchParams.get('tab') === 'projects')
  await atRest(page)
  assert.equal(await clear.count(), 0, 'the place label stays on the Projetos tab')
  await page.getByRole('tab', { name: 'Recentes' }).click()
  await page.waitForURL((url) => !url.searchParams.has('tab'))
  await clear.waitFor()
  await touching(page)
  const reach = await reachOf(clear)
  const drawn = await clear.boundingBox()
  assert.ok(drawn, 'the × is not laid out')
  assert.ok(drawn.width + reach.left + reach.right >= 44, 'the × is under 44 px wide to a finger')
  assert.ok(
    drawn.height + reach.up + reach.down >= 44,
    `the × is under 44 px tall to a finger ${JSON.stringify({ drawn, reach })}`,
  )
  await page.close()
})

const FULL = {
  ...OWNER,
  ...projectsPage(COMPANY.id),
  ...startsOn(COMPANY.id),
  ...listReplies(ONE),
}

test('no toque, a página com a lista cheia não rola de lado: nenhum alvo de toque passa da borda (V18)', async () => {
  const page = await harness.open(PAGE, { viewport: PHONE, replies: FULL })
  await page
    .getByRole('main')
    .getByRole('link', { name: /Pedidos do mês/ })
    .waitFor()
  await atRest(page)
  await touching(page)
  const sheet = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  assert.equal(
    sheet.scrollWidth,
    sheet.clientWidth,
    `the page scrolls sideways: ${JSON.stringify(sheet)}`,
  )
  // The search is a field, which keeps its own scale (V32); the filter is the control.
  const filter = page.getByRole('combobox', { name: 'Filtrar conversas' })
  const reach = await reachOf(filter)
  const drawn = await filter.boundingBox()
  assert.ok(drawn, 'the filter is not laid out')
  const shape = JSON.stringify({ drawn, reach })
  assert.ok(drawn.height + reach.up + reach.down >= 44, `the filter is under 44 px tall ${shape}`)
  assert.ok(drawn.width + reach.left + reach.right >= 44, `the filter is under 44 px wide ${shape}`)
  await page.close()
})

test('a gaveta do celular lista só "Recentes": sem busca, e sem rolar de lado', async () => {
  const page = await harness.open(PAGE, { viewport: PHONE, replies: FULL })
  await page.getByRole('button', { name: 'Abrir navegação' }).click()
  const drawer = page.getByRole('dialog', { name: 'Navegação' })
  await drawer.getByRole('link', { name: /Pedidos do mês/ }).waitFor()
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'))
  const content = drawer.locator('[data-slot=sidebar-content]')
  const sideways = await content.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }))
  assert.equal(
    sideways.scrollWidth,
    sideways.clientWidth,
    `the drawer scrolls sideways: ${JSON.stringify(sideways)}`,
  )
  assert.equal(
    await drawer.getByRole('searchbox').count(),
    0,
    'the drawer still carries a search of its own',
  )
  await page.close()
})

test('a página a 200% de ampliação: a busca, o filtro e a aba Projetos continuam ao alcance', async () => {
  const page = await harness.open(PAGE, { viewport: ZOOMED_PHONE, replies: FULL })
  await page
    .getByRole('main')
    .getByRole('link', { name: /Pedidos do mês/ })
    .waitFor()
  await atRest(page)
  for (const control of [
    page.getByRole('searchbox', { name: 'Buscar pelo título' }),
    page.getByRole('combobox', { name: 'Filtrar conversas' }),
    page.getByRole('tab', { name: 'Projetos' }),
  ])
    await control.click({ trial: true, timeout: 3000 })
  await page.close()
})
