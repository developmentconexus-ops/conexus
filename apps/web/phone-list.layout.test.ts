import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { listAssistantConnections, listAssistantConversations } from '@conexus/hub-api'
import { createHarness, ok, PHONE, reachOf, touching } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { OWNER, projectsPage, startsOn } from './sweep-replies.ts'

const API = `/api/companies/${COMPANY.id}/assistant`

function listReplies(conversations: { id: string; title: string; project: null }[]) {
  return {
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

// The company's list inside the phone's drawer: the place label and the list's own controls (design V22, V32, V56).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

test('a lista na gaveta do celular: o rótulo do lugar é pílula com × de 44 de toque, e buscar ou filtrar não fecha a gaveta', async () => {
  const page = await harness.open(`/companies/${COMPANY.id}?place=HOME`, {
    viewport: PHONE,
    replies: { ...OWNER, ...projectsPage(COMPANY.id), ...startsOn(COMPANY.id) },
  })
  await page.getByRole('button', { name: 'Abrir navegação' }).click()
  const drawer = page.getByRole('dialog', { name: 'Navegação' })
  const clear = drawer.getByRole('button', { name: 'Tirar o filtro: Início' })
  await clear.waitFor()
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'))
  const pill = await clear.evaluate((button) => {
    const label = button.parentElement
    if (label === null) throw new Error('the button has no label')
    return {
      radius: parseFloat(getComputedStyle(label).borderTopLeftRadius),
      height: label.getBoundingClientRect().height,
    }
  })
  assert.ok(pill.radius >= pill.height / 2, 'the place label is not a pill')
  await drawer.getByRole('button', { name: 'Buscar conversa' }).click()
  const box = drawer.getByRole('searchbox', { name: 'Buscar pelo título' })
  const frame = await box.boundingBox()
  assert.ok(frame, 'the search field is not laid out')
  const end = { x: frame.x + frame.width - 28, y: frame.y, width: 28, height: frame.height }
  await box.fill('')
  await box.hover()
  const bare = await page.screenshot({ clip: end })
  await box.fill('rel')
  const typed = await page.screenshot({ clip: end })
  assert.ok(bare.equals(typed), "the browser's own ✕ is drawn at the end of the field")
  await page.waitForURL((url) => url.searchParams.get('q') === 'rel')
  await drawer.getByRole('tab', { name: 'Projetos' }).click()
  await page.waitForURL((url) => url.searchParams.get('tab') === 'projects')
  await page.waitForTimeout(400)
  assert.ok(await drawer.isVisible(), 'searching or switching the tab closed the drawer')
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

test('no toque, a gaveta com a lista cheia não rola de lado: nenhum alvo de toque passa da borda da área que rola (V18)', async () => {
  const replies = {
    ...OWNER,
    ...projectsPage(COMPANY.id),
    ...startsOn(COMPANY.id),
    ...listReplies([
      { id: '44444444-4444-4444-8444-444444444444', title: 'Pedidos do mês', project: null },
    ]),
  }
  const page = await harness.open(`/companies/${COMPANY.id}`, { viewport: PHONE, replies })
  await page.getByRole('button', { name: 'Abrir navegação' }).click()
  const drawer = page.getByRole('dialog', { name: 'Navegação' })
  await drawer.getByRole('link', { name: /Pedidos do mês/ }).waitFor()
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'))
  await touching(page)
  const content = await drawer.locator('[data-slot=sidebar-content]').evaluate((element) => {
    const box = element.getBoundingClientRect()
    const leaking = [...element.querySelectorAll('*')].flatMap((each) => {
      const after = getComputedStyle(each, '::after')
      const right = each.getBoundingClientRect().right
      const reach =
        after.position === 'absolute'
          ? each.getBoundingClientRect().left + parseFloat(after.left) + parseFloat(after.width)
          : right
      return Math.max(right, reach) > box.right + 0.5
        ? [`${each.tagName.toLowerCase()}[${each.getAttribute('aria-label') ?? ''}]`]
        : []
    })
    const sideways = ['auto', 'scroll'].includes(getComputedStyle(element).overflowX)
    return { scrolls: sideways && element.scrollWidth > element.clientWidth, leaking }
  })
  assert.equal(content.scrolls, false, `the drawer scrolls sideways: ${JSON.stringify(content)}`)
  await page.close()
})
