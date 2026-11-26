import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { LakeTableSummary, listConnections, listLakeTables } from '@conexus/hub-api'
import { createHarness, DESKTOP, ok, PHONE, SMALL_PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { OWNER, projectsPage } from './sweep-replies.ts'

// The tab strip of a lake table is as tall as its tabs: the browser's own scrollbars, which the
// headless shell hides by default, must find nothing to scroll (issue 1385).
const harness = createHarness(import.meta.dirname, { scrollbars: 'classic' })
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const MATRIZ = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  connector: 'sankhya',
  name: 'Matriz',
  connectorVersion: '1',
  state: 'ACTIVE',
  linkedBy: null,
  linkedAt: '2026-11-01T12:00:00.000Z',
  testedAt: null,
  testedBy: null,
  account: null,
} as const
const TABLE = LakeTableSummary.parse({
  id: '11111111-1111-4111-8111-111111111111',
  connection: { id: MATRIZ.id, name: 'Matriz', connector: 'sankhya' },
  name: 'sankhya_notas',
  label: 'Notas e pedidos',
  source: 'TGFCAB',
  mode: { kind: 'CHANGED', column: 'DTALTER', registry: false },
  interval: '24h',
  startDate: null,
  rows: 118402,
  columns: [{ name: 'NUNOTA', type: 'inteiro', description: 'Chave da nota' }],
  lastRun: {
    id: '22222222-2222-4222-8222-222222222222',
    startedAt: '2026-11-02T13:00:00.000Z',
    endedAt: '2026-11-02T13:02:14.000Z',
    whole: false,
    outcome: 'COMPLETE',
    read: 118402,
    written: 118402,
    machine: null,
  },
  next: '2026-11-03T13:00:00.000Z',
})
const API = `/api/companies/${COMPANY.id}`
const replies = {
  ...OWNER,
  ...projectsPage(COMPANY.id),
  [`GET ${API}/connections`]: ok(listConnections, {
    connectors: [],
    connections: [MATRIZ],
    mayManage: true,
  }),
  [`GET ${API}/lake-tables`]: ok(listLakeTables, [TABLE]),
}

for (const viewport of [DESKTOP, PHONE, SMALL_PHONE]) {
  test(`a faixa de abas da tabela não rola em nenhum sentido em ${viewport.width}px`, async () => {
    const page = await harness.open(`/companies/${COMPANY.id}/data/lake/${TABLE.id}`, {
      viewport,
      replies,
    })
    const tabs = page.getByRole('tablist')
    await tabs.waitFor()
    const drawn = await tabs.evaluate((list) => {
      if (!(list instanceof HTMLElement)) throw new Error('the tab list is not an HTML element')
      const style = getComputedStyle(list)
      const borderBelow = Number.parseFloat(style.borderBottomWidth)
      return {
        scrollbarWidth: list.offsetWidth - list.clientWidth - 2 * list.clientLeft,
        scrollbarHeight: list.offsetHeight - list.clientHeight - list.clientTop - borderBelow,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }
    })
    assert.deepEqual(drawn, { scrollbarWidth: 0, scrollbarHeight: 0, pageOverflow: 0 })
    assert.deepEqual(page.problems, [])
    await page.close()
  })
}
