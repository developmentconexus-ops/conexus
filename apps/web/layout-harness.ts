import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join } from 'node:path'
import { appContentSecurityPolicy } from '@conexus/app-contract'
import type { FailureCode } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import type { Browser, Locator, Page } from 'playwright-core'
import { chromium } from 'playwright-core'
import { build } from 'vite'
import type { z } from 'zod'
import { problemOf } from './src/platform/fixtures.ts'

// The widths come from the browser's layout of the built screens; jsdom computes none.
const ORIGIN = 'https://hub.test'
const TYPES: Record<string, string> = {
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

// The policy the edge sends with an app's page, from its one owner: a piece that needs a style
// element or a data: URI fails here, in the browser, and not after the Release (web W22, testing T23).
// The Hub's own policy adds `frame-src` for the apps' domain, which the Prévia frames, and `data:`
// images, which a connector's logo is (apps/server/src/platform/http.ts).
const APPS_DOMAIN = 'apps.example.test'
const SECURITY_HEADERS = {
  'Content-Security-Policy': `${appContentSecurityPolicy("'none'").replace("img-src 'self'", "img-src 'self' data:")}; frame-src https://*.${APPS_DOMAIN}`,
}
const APP_PAGE = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Encomendas</title><link rel="stylesheet" href="/app.css"></head><body><h1>Encomendas</h1><p>Maria, bolo de cenoura, sexta.</p></body></html>`
const APP_STYLE =
  'body{font:16px system-ui;margin:0;padding:24px;background:#fffdf8;color:#222}h1{margin:0 0 12px}'

export const DESKTOP = { width: 1366, height: 900 }
export const PHONE = { width: 390, height: 844 }
export const SMALL_PHONE = { width: 320, height: 640 }
// A 390px phone at 200% zoom lays out 195 CSS pixels (design V18).
export const ZOOMED_PHONE = { width: 195, height: 422 }
export type Viewport = { width: number; height: number }

/** What the fake Hub answers a request with; `hold` keeps the reply back until it settles. */
export type Reply = {
  status: number
  json?: unknown
  /** A stream's body as the Hub sends it: `id:` and `data:` blocks (`text/event-stream`). */
  events?: readonly unknown[]
  hold?: Promise<unknown>
}

/** The events as the Hub's stream says them; the ids are any one-line string (`EventId`). */
function streamBody(events: readonly unknown[]): string {
  return events
    .map((event, at) => `id: sweep.${at + 1}\ndata: ${JSON.stringify(event)}\n\n`)
    .join('')
}

/** What the route sends for a reply: a stream's blocks, a JSON body or a bare status. */
function answerOf(reply: Reply) {
  if (reply.events !== undefined) {
    return {
      status: reply.status,
      body: streamBody(reply.events),
      contentType: 'text/event-stream',
    }
  }
  return reply.json === undefined
    ? { status: reply.status }
    : { status: reply.status, json: reply.json }
}

/** A success reply checked against the operation's own schema, so a stale fake fails (testing T15). */
export function ok<S extends z.ZodType>(
  operation: { success: { status: 200 | 201; body: S } },
  body: z.input<S>,
): Reply {
  return { status: operation.success.status, json: operation.success.body.parse(body) }
}

/** A refusal in the Hub's own problem shape, with the status the failure table gives its code. */
export function failure(code: FailureCode): Reply {
  const row = FAILURES[code]
  return { status: row.status, json: problemOf(code) }
}

/** Replies by "METHOD /path"; a request with none is recorded as unanswered and answered 500. */
export type Replies = Record<string, Reply>

type Seen = { method: string; path: string; search: string; body: string | null }

export type Harness = {
  start(): Promise<void>
  stop(): Promise<void>
  open(
    path: string,
    options: {
      viewport: Viewport
      replies: Replies
      scheme?: 'light' | 'dark'
      userAgent?: string | undefined
    },
  ): Promise<Page & { seen: Seen[]; problems: string[] }>
  /** The requests no reply was given for, over the whole run. */
  unanswered: string[]
}

/** `/pieces` is the page of chat pieces, built only here, never by `npm run build`. */
function fileOf(pathname: string): string {
  if (pathname.startsWith('/assets/')) return pathname
  return pathname === '/pieces' ? '/pieces.html' : '/index.html'
}

/** A script error, or any console error, which is also where the browser reports a CSP refusal. */
function watchProblems(page: Page): string[] {
  const problems: string[] = []
  page.on('pageerror', (error) => problems.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text())
  })
  return problems
}

/** A Projeto's app, framed by the Prévia: one page under the policy the dispatcher sends. */
async function routeApp(page: Page) {
  await page.route(`https://*.${APPS_DOMAIN}/**`, (route) => {
    const stylesheet = new URL(route.request().url()).pathname === '/app.css'
    return route.fulfill({
      body: stylesheet ? APP_STYLE : APP_PAGE,
      contentType: stylesheet ? 'text/css' : 'text/html',
      headers: { 'Content-Security-Policy': appContentSecurityPolicy(ORIGIN) },
    })
  })
}

export function createHarness(root: string): Harness {
  let outDir = ''
  let browser: Browser | undefined
  const unanswered: string[] = []

  async function open(
    path: string,
    options: {
      viewport: Viewport
      replies: Replies
      scheme?: 'light' | 'dark'
      userAgent?: string | undefined
    },
  ) {
    if (!browser) throw new Error('the harness is not started')
    const page = await browser.newPage({
      viewport: options.viewport,
      colorScheme: options.scheme ?? 'light',
      userAgent: options.userAgent,
    })
    const seen: Seen[] = []
    const problems = watchProblems(page)
    await page.route(`${ORIGIN}/**`, async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      if (url.pathname.startsWith('/api/')) {
        const key = `${request.method()} ${url.pathname}`
        seen.push({
          method: request.method(),
          path: url.pathname,
          search: url.search,
          body: request.postData(),
        })
        const reply = options.replies[key]
        if (!reply) {
          unanswered.push(key)
          return route.fulfill({ status: 500, json: failure('INTERNAL_UNEXPECTED').json })
        }
        await reply.hold
        return route.fulfill(answerOf(reply))
      }
      const file = fileOf(url.pathname)
      return route.fulfill({
        body: readFileSync(join(outDir, file)),
        contentType: TYPES[extname(file)] ?? 'text/html',
        headers: SECURITY_HEADERS,
      })
    })
    await routeApp(page)
    await page.goto(`${ORIGIN}${path}`)
    await page.evaluate(() => document.fonts.ready)
    return Object.assign(page, { seen, problems })
  }

  return {
    unanswered,
    open,
    async start() {
      outDir = mkdtempSync(join(tmpdir(), 'conexus-web-layout-'))
      await build({
        root,
        logLevel: 'silent',
        build: {
          outDir,
          rolldownOptions: {
            input: { index: join(root, 'index.html'), pieces: join(root, 'pieces.html') },
          },
        },
      })
      // The headless shell pinned by playwright-core, which the `pretest` script installs.
      browser = await chromium.launch()
    },
    async stop() {
      await browser?.close()
      rmSync(outDir, { recursive: true, force: true })
    },
  }
}

/**
 * Where focus is after the key, once it settles: Base UI moves focus off its guards on the next
 * frame. Each stop reads its name, how its focus is drawn and whether it sits in the open dialog or
 * menu: a 2px outline, or a field's `halo` on its own edge (design V28).
 */
async function press(page: Page, key: string): Promise<string> {
  await page.keyboard.press(key)
  return focusDrawn(page)
}

/** Where focus is once it settles, and how its focus is drawn, as `press` reads it. */
export function focusDrawn(page: Page): Promise<string> {
  return page.evaluate(
    () =>
      new Promise<string>((settled) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const focused = document.activeElement
            if (!focused || focused === document.body) return settled('body')
            const name =
              focused.getAttribute('aria-label') ||
              focused.textContent?.trim() ||
              focused.getAttribute('name') ||
              (focused instanceof HTMLTextAreaElement || focused instanceof HTMLInputElement
                ? focused.labels?.[0]?.textContent?.trim()
                : undefined)
            // A field draws a transparent outline for forced colors; its focus is the ipê edge and a
            // see-through ipê halo, on the field or on the group around it (design V28, decision B).
            function channels(colour: string) {
              const canvas = document.createElement('canvas')
              canvas.width = 1
              canvas.height = 1
              const context = canvas.getContext('2d', { willReadFrequently: true })
              if (!context) return [0, 0, 0, 0]
              context.fillStyle = colour
              context.fillRect(0, 0, 1, 1)
              return [...context.getImageData(0, 0, 1, 1).data]
            }
            function ipe(colour: string) {
              const accent = getComputedStyle(document.documentElement).getPropertyValue(
                '--color-accent',
              )
              const [r = 0, g = 0, b = 0, a = 0] = channels(colour)
              const [ar = 0, ag = 0, ab = 0] = channels(accent)
              return Math.max(Math.abs(r - ar), Math.abs(g - ag), Math.abs(b - ab)) <= 2 ? a : 0
            }
            // A frame holds focus for the page inside it, which draws its own (`:focus` is false on the frame).
            if (focused instanceof HTMLIFrameElement) return settled(`${name} framed`)
            const own = getComputedStyle(focused)
            const frame = getComputedStyle(focused.closest('[data-focus-frame]') ?? focused)
            const shadow = frame.boxShadow.slice(0, frame.boxShadow.indexOf(')') + 1)
            // While the Builder answers, the field's edge is the turning ring (`working-ring`).
            const edge =
              ipe(frame.borderTopColor) === 255 || frame.backgroundImage.includes('conic')
            const halo = edge && ipe(shadow) > 0 && ipe(shadow) < 255
            const drawn =
              own.outlineColor !== 'rgba(0, 0, 0, 0)'
                ? `${own.outlineStyle} ${own.outlineWidth}`
                : halo
                  ? 'halo'
                  : `${frame.outlineStyle} ${frame.outlineWidth}`
            const inside = focused.closest('[role=dialog], [role=menu]') ? ' inside' : ''
            settled(`${name} ${drawn}${inside}`)
          }),
        ),
      ),
  )
}

export async function presses(page: Page, key: string, count: number): Promise<string[]> {
  const stops: string[] = []
  for (let stop = 0; stop < count; stop++) stops.push(await press(page, key))
  return stops
}

/** The page under a finger: `pointer: coarse` is true, as on a phone (`Emulation.setTouchEmulationEnabled`). */
export async function touching(page: Page): Promise<void> {
  const session = await page.context().newCDPSession(page)
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  await session.send('Emulation.setEmitTouchEventsForMouse', {
    enabled: true,
    configuration: 'mobile',
  })
  await page.waitForFunction(() => matchMedia('(pointer: coarse)').matches)
}

/** How many px outside its drawn box a press still lands on the element, up to 20, from the middle of each edge. */
export function reachOf(locator: Locator): Promise<{
  up: number
  down: number
  left: number
  right: number
}> {
  return locator.evaluate((element) => {
    const box = element.getBoundingClientRect()
    const mid = { x: box.left + box.width / 2, y: box.top + box.height / 2 }
    function hits(x: number, y: number) {
      const hit = document.elementFromPoint(x, y)
      return hit !== null && element.contains(hit)
    }
    function reach(at: (step: number) => [number, number]) {
      let steps = 0
      while (steps < 20 && hits(...at(steps))) steps += 1
      return steps
    }
    return {
      up: reach((step) => [mid.x, box.top - 1 - step]),
      down: reach((step) => [mid.x, box.bottom + step]),
      left: reach((step) => [box.left - 1 - step, mid.y]),
      right: reach((step) => [box.right + step, mid.y]),
    }
  })
}

/** Under a finger, what lands on points inside the element's drawn box instead of it: a neighbour's touch area over it. */
export function stolenBy(locator: Locator): Promise<string[]> {
  return locator.evaluate((element) => {
    const box = element.getBoundingClientRect()
    const thieves = new Set<string>()
    for (let column = 1; column < 8; column += 1)
      for (let row = 1; row < 8; row += 1) {
        const hit = document.elementFromPoint(
          box.left + (box.width * column) / 8,
          box.top + (box.height * row) / 8,
        )
        if (hit === null || !element.contains(hit)) {
          const owner = hit?.closest('button, a')
          thieves.add(owner?.getAttribute('aria-label') ?? hit?.tagName ?? 'nothing')
        }
      }
    return [...thieves]
  })
}
