import type { HostLabel } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { base64Of, sha256Of } from './digest.ts'
import { withSecurityHeaders } from './headers.ts'
import type { NoAnswerReason } from './hub.ts'

// What each page says: the Hub's own rows, and the ones the dispatcher alone meets, which never
// pass through the Hub (step 8's state matrix). An app past its call's deadline reads as one that
// failed, and its log line says which (decision 0047).
type Page = { status: number; phrase: string; action: string; retry?: string }
const APP_FAILED = { status: 502, phrase: 'O app não conseguiu responder agora.', action: '' }
const PAGES = {
  APP_HANDOFF_INVALID: FAILURES.APP_HANDOFF_INVALID,
  APP_ACCESS_REFUSED: FAILURES.APP_ACCESS_REFUSED,
  APP_NOT_FOUND: FAILURES.APP_NOT_FOUND,
  APP_NOT_PUBLISHED: FAILURES.APP_NOT_PUBLISHED,
  REQUEST_ORIGIN_REFUSED: FAILURES.REQUEST_ORIGIN_REFUSED,
  INTERNAL_UNEXPECTED: FAILURES.INTERNAL_UNEXPECTED,
  EDGE_HUB_UNAVAILABLE: {
    status: 503,
    phrase: 'O Conexus está fora do ar.',
    action: 'Tente de novo em alguns minutos.',
  },
  EDGE_APP_FAILED: APP_FAILED,
  EDGE_APP_DEADLINE: APP_FAILED,
  // A browser that does not keep the session a pass set: 401, as vibesdk answers one without its
  // cookie, and a link that starts the entry over.
  EDGE_SESSION_NOT_KEPT: {
    status: 401,
    phrase: 'Este navegador não guardou a sua entrada.',
    action: '',
    retry: 'Tentar de novo',
  },
} as const satisfies Record<string, Page>
export type PageCode = keyof typeof PAGES

/** The scalar fields a page's log line may carry (security S41). */
export type PageLog = { reason?: NoAnswerReason } | { host: HostLabel; rounds: number }

// The Hub's light and dark tokens (apps/web/src/brand/tokens.css), with system fonts: the page
// loads nothing, so its own CSP names this one style by its hash.
const STYLE = [
  ':root{color-scheme:light dark;--canvas:#f6f7f8;--surface:#ffffff;--line:#dde1e5;--text:#121518;--text-2:#59616a;--on-ink:#ffffff}',
  '@media (prefers-color-scheme:dark){:root{--canvas:#0e1012;--surface:#16191c;--line:#2c3237;--text:#eef0f2;--text-2:#a3abb3;--on-ink:#121518}}',
  'body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;box-sizing:border-box;background:var(--canvas);color:var(--text);font:400 0.9375rem/1.55 system-ui,sans-serif}',
  'main{max-width:28rem;padding:24px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}',
  'h1{margin:0;font-size:1.05rem;line-height:1.3;font-weight:600}',
  'p{margin:8px 0 0;color:var(--text-2)}',
  // The Hub's primary button (apps/web/src/ui/button.tsx): ink, 32 px high, 8 px corners.
  'a{display:inline-flex;align-items:center;height:32px;margin-top:16px;padding:0 12px;border-radius:8px;background:var(--text);color:var(--on-ink);font-weight:500;text-decoration:none}',
].join('')

/**
 * The page of a failure, in Portuguese and without script. Its log line has the Hub's shape, a pino
 * level and a code (scripts/log-line.ts), and nothing the person sent (security S41); `log` adds
 * fixed words or a parsed host. A retry is a link to the app's root. Only the Hub may frame it, so a
 * failure inside the Prévia reads as on the app's own tab.
 */
export async function failurePage(
  code: PageCode,
  hubOrigin: string,
  log: PageLog = {},
): Promise<Response> {
  const { status, phrase, action, retry }: Page = PAGES[code]
  const line = { msg: code, status, ...log }
  if (status >= 500) console.error(JSON.stringify({ level: 50, ...line }))
  else console.log(JSON.stringify({ level: 30, ...line }))
  const styleHash = base64Of(await sha256Of(STYLE))
  const html = [
    '<!doctype html>',
    '<html lang="pt-BR">',
    '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>Conexus</title><style>${STYLE}</style></head>`,
    `<body><main><h1>${phrase}</h1>${action === '' ? '' : `<p>${action}</p>`}${retry === undefined ? '' : `<a href="/">${retry}</a>`}</main></body>`,
    '</html>',
  ].join('\n')
  const headers = withSecurityHeaders(
    new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }),
    `default-src 'none'; style-src 'sha256-${styleHash}'; base-uri 'none'; form-action 'none'; frame-ancestors ${hubOrigin}`,
  )
  return new Response(html, { status, headers })
}
