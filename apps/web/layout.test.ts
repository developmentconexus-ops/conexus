import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join } from 'node:path'
import { after, before, test } from 'node:test'
import { HubStatus, SessionState } from '@conexus/hub-api'
import type { Browser, Locator, Page } from 'playwright-core'
import { chromium } from 'playwright-core'
import { build } from 'vite'

// The widths come from the browser's layout of the built screens; jsdom computes none.
const ORIGIN = 'https://hub.test'
const DESKTOP = { width: 1366, height: 900 }
const PHONE = { width: 390, height: 844 }
const TYPES: Record<string, string> = {
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}
const SIGNED_OUT = SessionState.parse({ state: 'SIGNED_OUT' })
const SIGNED_IN = SessionState.parse({
  state: 'SIGNED_IN',
  person: { id: 'person-ana', name: 'Ana Lima', email: 'ana@example.test' },
})
const STATUS = HubStatus.parse({
  version: 'v0.3.0',
  lastStart: { state: 'NONE' },
  previousStart: { state: 'NONE' },
})

let outDir = ''
let browser: Browser

before(async () => {
  outDir = mkdtempSync(join(tmpdir(), 'conexus-web-layout-'))
  await build({ root: import.meta.dirname, logLevel: 'silent', build: { outDir } })
  // The headless shell pinned by playwright-core: `npx playwright-core install chromium-headless-shell`.
  browser = await chromium.launch()
})

after(async () => {
  await browser?.close()
  rmSync(outDir, { recursive: true, force: true })
})

/** Opens a screen of the built app, with the Hub's two reads answered from the contract's shapes. */
async function open(path: string, viewport: typeof DESKTOP, session: SessionState): Promise<Page> {
  const page = await browser.newPage({ viewport })
  await page.route(`${ORIGIN}/**`, (route) => {
    const { pathname } = new URL(route.request().url())
    if (pathname === '/api/sessions/current') return route.fulfill({ json: session })
    if (pathname === '/api/status') return route.fulfill({ json: STATUS })
    const file = pathname.startsWith('/assets/') ? pathname : '/index.html'
    return route.fulfill({
      body: readFileSync(join(outDir, file)),
      contentType: TYPES[extname(file)] ?? 'text/html',
    })
  })
  await page.goto(`${ORIGIN}${path}`)
  await page.evaluate(() => document.fonts.ready)
  return page
}

async function widthOf(locator: Locator): Promise<number> {
  const box = await locator.boundingBox()
  assert.ok(box, 'the element is not laid out')
  return box.width
}

for (const [viewport, field] of [
  [DESKTOP, 384],
  [PHONE, 358],
] as const) {
  test(`o formulário de entrada tem ${field}px de largura numa tela de ${viewport.width}px`, async () => {
    const page = await open('/login', viewport, SIGNED_OUT)
    assert.equal(await widthOf(page.getByRole('textbox', { name: 'E-mail' })), field)
    await page.close()
  })
}

test('a gaveta do telefone tem três quartos da tela de 390px', async () => {
  const page = await open('/', PHONE, SIGNED_IN)
  await page.getByRole('button', { name: 'Abrir navegação' }).click()
  assert.equal(await widthOf(page.getByRole('dialog', { name: 'Navegação' })), 292.5)
  await page.close()
})

for (const viewport of [DESKTOP, PHONE]) {
  test(`o título da página que não existe cabe numa linha numa tela de ${viewport.width}px`, async () => {
    const page = await open('/nada', viewport, SIGNED_OUT)
    const lines = await page.getByRole('heading', { level: 1 }).evaluate((heading) => {
      const text = document.createRange()
      text.selectNodeContents(heading)
      return new Set([...text.getClientRects()].map((line) => line.top)).size
    })
    assert.equal(lines, 1)
    await page.close()
  })
}
