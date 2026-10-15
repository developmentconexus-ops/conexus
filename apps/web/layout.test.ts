import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join } from 'node:path'
import { after, before, test } from 'node:test'
import { HubStatus, Problem, SessionState } from '@conexus/hub-api'
import type { Browser, Locator, Page } from 'playwright-core'
import { chromium } from 'playwright-core'
import { build } from 'vite'

// The widths come from the browser's layout of the built screens; jsdom computes none.
const ORIGIN = 'https://hub.test'
const DESKTOP = { width: 1366, height: 900 }
const PHONE = { width: 390, height: 844 }
const SMALL_PHONE = { width: 320, height: 640 }
// A 390px phone at 200% zoom lays out 195 CSS pixels (design V18).
const ZOOMED_PHONE = { width: 195, height: 422 }
const WIDE_PHONE = { width: 600, height: 900 }
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
const UNAVAILABLE = Problem.parse({
  type: 'about:blank',
  title: 'O banco do Conexus não respondeu.',
  status: 503,
  code: 'DATABASE_UNAVAILABLE',
  traceId: 'trace-layout',
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
  // The headless shell pinned by playwright-core, which the `pretest` script installs.
  browser = await chromium.launch()
})

after(async () => {
  await browser?.close()
  rmSync(outDir, { recursive: true, force: true })
})

/** Opens a screen of the built app, with the Hub's two reads answered from the contract's shapes. */
async function open(
  path: string,
  viewport: typeof DESKTOP,
  session: SessionState | Problem,
): Promise<Page> {
  const page = await browser.newPage({ viewport })
  await page.route(`${ORIGIN}/**`, (route) => {
    const { pathname } = new URL(route.request().url())
    if (pathname === '/api/sessions/current') {
      return route.fulfill({ status: 'code' in session ? session.status : 200, json: session })
    }
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

for (const [viewport, drawer] of [
  [PHONE, 292.5],
  [WIDE_PHONE, 320],
] as const) {
  test(`a gaveta tem ${drawer}px numa tela de ${viewport.width}px`, async () => {
    const page = await open('/', viewport, SIGNED_IN)
    await page.getByRole('button', { name: 'Abrir navegação' }).click()
    assert.equal(await widthOf(page.getByRole('dialog', { name: 'Navegação' })), drawer)
    await page.close()
  })
}

test('a mensagem de falha tem 448px de largura numa tela de 1366px', async () => {
  const page = await open('/', DESKTOP, UNAVAILABLE)
  assert.equal(await widthOf(page.getByRole('alert').locator('..')), 448)
  await page.close()
})

for (const viewport of [SMALL_PHONE, ZOOMED_PHONE]) {
  test(`a barra do topo cabe numa tela de ${viewport.width}px, com a conta à vista`, async () => {
    const page = await open('/', viewport, SIGNED_IN)
    const account = await page.getByRole('button', { name: 'Conta de Ana Lima' }).boundingBox()
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth)
    assert.deepEqual(
      { scroll, accountEnd: (account?.x ?? 0) + (account?.width ?? 0) <= viewport.width },
      { scroll: viewport.width, accountEnd: true },
    )
    await page.close()
  })
}

test('o Tab mostra o contorno de 2px no campo e no botão', async () => {
  const page = await open('/login', DESKTOP, SIGNED_OUT)
  await page.getByRole('textbox', { name: 'E-mail' }).waitFor()
  const outlines: string[] = []
  for (let stop = 0; stop < 3; stop++) {
    await page.keyboard.press('Tab')
    outlines.push(
      await page.evaluate(() => {
        const focused = document.activeElement
        if (!focused) return 'nothing focused'
        const style = getComputedStyle(focused)
        return `${focused.textContent || focused.getAttribute('name')} ${style.outlineStyle} ${style.outlineWidth}`
      }),
    )
  }
  assert.deepEqual(outlines, ['email solid 2px', 'password solid 2px', 'Entrar solid 2px'])
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
