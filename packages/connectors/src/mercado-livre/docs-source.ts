import { setTimeout as sleep } from 'node:timers/promises'
import { fetchText } from '../kernel/page.ts'

// Mercado Livre's public documentation pages, read at run time and never kept. Only the public
// pages are fetched; no Mercado Livre API is called. It publishes no OpenAPI and no llms.txt, so
// the check is weaker than Sankhya's: the route is in the text of the page the read cites, and the
// shape of the answer is not checked.

const SITE = 'https://developers.mercadolivre.com.br/pt_br'
const SECONDS_BETWEEN_PAGES = 3

/** The documentation page of a slug as plain text: tags gone, the common entities decoded. */
export function textOfPage(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Whether the page documents the route: the method within 300 characters before the path, the
 * path's literal segments as they are and each segment that holds the account or an input value as
 * whatever the page names it (`$USER_ID`, `{user_id}`, `:id`).
 */
export function routeInPage(
  text: string,
  route: Readonly<{ method: string; path: string; variable: readonly string[] }>,
): boolean {
  const segments = route.path
    .split('/')
    .slice(1)
    .map((segment) =>
      route.variable.some((value) => value !== '' && segment.includes(value))
        ? '[^/\\s?&]+'
        : escapeRegex(segment),
    )
  const path = new RegExp(`/${segments.join('/')}(?![A-Za-z0-9_-])`, 'g')
  for (const found of text.matchAll(path)) {
    const before = text.slice(Math.max(0, found.index - 300), found.index)
    if (new RegExp(`\\b${route.method}\\b`).test(before)) return true
  }
  return false
}

/** The pages as text, 3 s apart, each once. */
export async function downloadPages(slugs: Iterable<string>): Promise<Map<string, string>> {
  const pages = new Map<string, string>()
  for (const slug of new Set(slugs)) {
    if (pages.size > 0) await sleep(SECONDS_BETWEEN_PAGES * 1000)
    pages.set(slug, textOfPage(await fetchText(`${SITE}/${slug}`)))
  }
  return pages
}
