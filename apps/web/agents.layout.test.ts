import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { AgentListed, listAgents } from '@conexus/hub-api'
import { createHarness, DESKTOP, ok, PHONE, ZOOMED_PHONE } from './layout-harness.ts'
import { companies, PROJECT_ID } from './sweep-replies.ts'

// A página Agentes do Início (step 24.3.1, U9), in a real browser at 1366, 390 and 195 px: no
// sideways scroll, every row inside the sheet, the title, the filter and Novo agente in reach.
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const COMPANY_ID = '0'.repeat(32)
const PATH = `/companies/${COMPANY_ID}/agents`
const LONG = 'Conferente de metas com um nome bem comprido para a linha da lista'

function agent(n: number, fields: object = {}) {
  return {
    id: `${`${n}`.repeat(8)}-aaaa-4aaa-8aaa-${`${n}`.repeat(12)}`,
    projectId: PROJECT_ID,
    name: n === 1 ? LONG : `Agente ${n}`,
    description: 'Compara as vendas de ontem com as metas.',
    state: n === 1 ? { kind: 'PUBLISHED', version: 12, changed: true } : { kind: 'DRAFT' },
    updatedAt: '2026-11-02T12:00:00.000Z',
    lastRunAt: n === 1 ? '2026-11-03T12:00:00.000Z' : null,
    tools: n,
    ...fields,
  }
}

function replies(agents: object[]) {
  return {
    ...companies([{ name: 'Empresa Teste', role: 'owner' }], false),
    [`GET /api/companies/${COMPANY_ID}/agents`]: ok(listAgents, {
      agents: agents.map((one) => AgentListed.parse(one)),
    }),
  }
}

for (const viewport of [DESKTOP, PHONE, ZOOMED_PHONE])
  for (const scheme of ['light', 'dark'] as const)
    test(`a página Agentes cabe na tela de ${viewport.width}px, no tema ${scheme}`, async () => {
      const page = await harness.open(PATH, {
        viewport,
        scheme,
        replies: replies([agent(1), agent(2), agent(3)]),
      })
      await page.getByRole('heading', { name: 'Agentes' }).waitFor()
      await page.getByRole('link', { name: new RegExp(LONG.slice(0, 20)) }).waitFor()
      const reach = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        inner: window.innerWidth,
        rows: [...document.querySelectorAll('main a[href*="/agents/"]')].map((el) => {
          const box = el.getBoundingClientRect()
          return { left: box.left, right: box.right }
        }),
      }))
      assert.ok(reach.scroll <= reach.inner, `scrolls sideways: ${reach.scroll} > ${reach.inner}`)
      assert.equal(reach.rows.length, 3)
      for (const row of reach.rows)
        assert.ok(
          row.left >= 0 && row.right <= reach.inner,
          `a row leaves the screen at ${viewport.width}`,
        )
      for (const name of ['Novo agente', 'Projeto']) {
        const box = await page
          .getByRole(name === 'Projeto' ? 'combobox' : 'button', { name })
          .boundingBox()
        assert.ok(
          box && box.x >= 0 && box.x + box.width <= viewport.width,
          `${name} leaves the screen`,
        )
      }
      assert.deepEqual(page.problems, [])
      await page.close()
    })

for (const viewport of [PHONE, ZOOMED_PHONE])
  test(`a última execução fica inteira na linha a ${viewport.width}px`, async () => {
    const page = await harness.open(PATH, {
      viewport,
      replies: replies([agent(1, { lastRunAt: new Date(Date.now() - 180_000).toISOString() })]),
    })
    await page.getByText(/Última execução/).waitFor()
    const seen = await page.evaluate(() => {
      const last = [...document.querySelectorAll('main a[href*="/agents/"] span')].find(
        (el) => el.children.length === 0 && el.textContent?.includes('Última execução'),
      )
      const row = last?.closest('a')
      if (!last || !row) return undefined
      const box = last.getBoundingClientRect()
      const bounds = row.getBoundingClientRect()
      return {
        cut: last.scrollWidth > last.clientWidth,
        inside: box.left >= bounds.left && box.right <= bounds.right,
        shown: getComputedStyle(last).overflow === 'visible',
      }
    })
    assert.deepEqual(seen, { cut: false, inside: true, shown: true })
    await page.close()
  })

test('sem agentes, a frase de que eles nascem num Projeto', async () => {
  const page = await harness.open(PATH, { viewport: PHONE, replies: replies([]) })
  await page.getByText('Nenhum agente ainda. Os agentes nascem num Projeto.').waitFor()
  await page.close()
})
