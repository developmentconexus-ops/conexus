import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join } from 'node:path'
import type { FailureCode } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import type { Browser, Page } from 'playwright-core'
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

export const DESKTOP = { width: 1366, height: 900 }
export const PHONE = { width: 390, height: 844 }
export const SMALL_PHONE = { width: 320, height: 640 }
export type Viewport = { width: number; height: number }

/** What the fake Hub answers a request with; `hold` keeps the reply back until it settles. */
export type Reply = { status: number; json?: unknown; hold?: Promise<unknown> }

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
    },
  ): Promise<Page & { seen: Seen[] }>
  /** The requests no reply was given for, over the whole run. */
  unanswered: string[]
}

export function createHarness(root: string): Harness {
  let outDir = ''
  let browser: Browser | undefined
  const unanswered: string[] = []

  async function open(
    path: string,
    options: { viewport: Viewport; replies: Replies; scheme?: 'light' | 'dark' },
  ) {
    if (!browser) throw new Error('the harness is not started')
    const page = await browser.newPage({
      viewport: options.viewport,
      colorScheme: options.scheme ?? 'light',
    })
    const seen: Seen[] = []
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
        return route.fulfill(
          reply.json === undefined
            ? { status: reply.status }
            : { status: reply.status, json: reply.json },
        )
      }
      const file = url.pathname.startsWith('/assets/') ? url.pathname : '/index.html'
      return route.fulfill({
        body: readFileSync(join(outDir, file)),
        contentType: TYPES[extname(file)] ?? 'text/html',
      })
    })
    await page.goto(`${ORIGIN}${path}`)
    await page.evaluate(() => document.fonts.ready)
    return Object.assign(page, { seen })
  }

  return {
    unanswered,
    open,
    async start() {
      outDir = mkdtempSync(join(tmpdir(), 'conexus-web-layout-'))
      await build({ root, logLevel: 'silent', build: { outDir } })
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
 * frame. Each stop reads its name, its drawn outline and whether it sits in the open dialog or menu.
 */
async function press(page: Page, key: string): Promise<string> {
  await page.keyboard.press(key)
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
              focused.getAttribute('name')
            const { outlineStyle, outlineWidth } = getComputedStyle(focused)
            const inside = focused.closest('[role=dialog], [role=menu]') ? ' inside' : ''
            settled(`${name} ${outlineStyle} ${outlineWidth}${inside}`)
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
