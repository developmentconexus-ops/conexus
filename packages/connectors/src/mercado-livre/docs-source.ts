import { mkdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

// Mercado Livre's public documentation pages, read at run time and never kept. Only the public
// pages are fetched; no Mercado Livre API is called. The site answers 403 to a plain HTTP client
// and to headless Chromium, and 200 to a normal browser window, so the pages are read through a
// headed Chromium (`inBrowser`): run it by hand on a desktop, never in CI. It publishes no OpenAPI and
// no llms.txt, so the check is weaker than Sankhya's: the route is in the text of the page the read
// cites, and the shape of the answer is not checked.

const SITE = 'https://developers.mercadolivre.com.br/pt_br'
const SECONDS_BETWEEN_PAGES = 3

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Whether the page documents the route: the method within 300 characters before the path (`null`
 * for a page that lists the path in a table without one), the path's literal segments as they are
 * and each segment that is the account or an input value as whatever the page names it
 * (`$USER_ID`, `{user_id}`, `:id`).
 */
export function routeInPage(
  text: string,
  route: Readonly<{ method: string | null; path: string; variable: readonly string[] }>,
): boolean {
  const segments = route.path
    .split('/')
    .slice(1)
    .map((segment) => (route.variable.includes(segment) ? '[^/\\s?&]+' : escapeRegex(segment)))
  const path = new RegExp(`/${segments.join('/')}(?![A-Za-z0-9_-])`, 'g')
  for (const found of text.matchAll(path)) {
    if (route.method === null) return true
    const before = text.slice(Math.max(0, found.index - 300), found.index)
    if (new RegExp(`\\b${route.method}\\b`).test(before)) return true
  }
  return false
}

/** The text of a page as a reader sees it, or why it could not be read. */
type FetchPage = (url: string) => Promise<string>

/** The pages as text, 3 s apart, each once. A page that is not there (404) ends the read. */
export async function downloadPages(
  slugs: Iterable<string>,
  fetchPage: FetchPage,
): Promise<Map<string, string>> {
  const pages = new Map<string, string>()
  for (const slug of new Set(slugs)) {
    if (pages.size > 0) await sleep(SECONDS_BETWEEN_PAGES * 1000)
    pages.set(slug, await fetchPage(`${SITE}/${slug}`))
  }
  return pages
}

/**
 * Runs `use` with a page reader that goes through a real browser window (headed Chromium of
 * `playwright-core`), closed after. The text is what the window shows (`innerText`), so a route
 * the page highlights in tags is still one run of text. With `saveTo`, each page's text is also
 * written there, named by its slug, so a failed check leaves what the browser saw.
 */
export async function inBrowser<T>(
  use: (fetchPage: FetchPage) => Promise<T>,
  saveTo?: string,
): Promise<T> {
  const { chromium } = await import('playwright-core')
  const browser = await chromium.launch({ headless: false })
  try {
    const page = await browser.newPage({ locale: 'pt-BR' })
    return await use(async (url) => {
      const response = await page.goto(url, { waitUntil: 'load', timeout: 30_000 })
      const status = response?.status() ?? 0
      if (status < 200 || status >= 300) throw new Error(`${url}: ${status}`)
      const text = await page.locator('body').innerText()
      if (saveTo) {
        await mkdir(saveTo, { recursive: true })
        await writeFile(join(saveTo, `${basename(url)}.txt`), `${status} ${page.url()}\n${text}`)
      }
      return text
    })
  } finally {
    await browser.close()
  }
}
