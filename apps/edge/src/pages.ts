import { FAILURES } from '@conexus/hub-api'
import { base64Of, sha256Of } from './digest.ts'
import { withSecurityHeaders } from './headers.ts'

// What each page says: the Hub's own rows, and two the dispatcher alone meets, which never pass
// through the Hub (step 8's state matrix).
const PAGES = {
  APP_HANDOFF_INVALID: FAILURES.APP_HANDOFF_INVALID,
  APP_ACCESS_REFUSED: FAILURES.APP_ACCESS_REFUSED,
  APP_NOT_FOUND: FAILURES.APP_NOT_FOUND,
  REQUEST_ORIGIN_REFUSED: FAILURES.REQUEST_ORIGIN_REFUSED,
  INTERNAL_UNEXPECTED: FAILURES.INTERNAL_UNEXPECTED,
  EDGE_HUB_UNAVAILABLE: {
    status: 503,
    phrase: 'O Conexus está fora do ar.',
    action: 'Tente de novo em alguns minutos.',
  },
  EDGE_APP_FAILED: { status: 502, phrase: 'O app não conseguiu responder agora.', action: '' },
} as const satisfies Record<string, { status: number; phrase: string; action: string }>
export type PageCode = keyof typeof PAGES

// The Hub's light and dark tokens (apps/web/src/brand/tokens.css), with system fonts: the page
// loads nothing, so its own CSP names this one style by its hash.
const STYLE = [
  ':root{color-scheme:light dark;--canvas:#f6f7f8;--surface:#ffffff;--line:#dde1e5;--text:#121518;--text-2:#59616a}',
  '@media (prefers-color-scheme:dark){:root{--canvas:#0e1012;--surface:#16191c;--line:#2c3237;--text:#eef0f2;--text-2:#a3abb3}}',
  'body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;box-sizing:border-box;background:var(--canvas);color:var(--text);font:400 0.9375rem/1.55 system-ui,sans-serif}',
  'main{max-width:28rem;padding:24px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}',
  'h1{margin:0;font-size:1.05rem;line-height:1.3;font-weight:600}',
  'p{margin:8px 0 0;color:var(--text-2)}',
].join('')

/**
 * The page of a failure, in Portuguese and without script. Its log line has the Hub's shape, a pino
 * level and a code (scripts/log-line.ts), and nothing the person sent (security S41).
 */
export async function failurePage(code: PageCode): Promise<Response> {
  const { status, phrase, action } = PAGES[code]
  if (status >= 500) console.error(JSON.stringify({ level: 50, msg: code, status }))
  else console.log(JSON.stringify({ level: 30, msg: code, status }))
  const styleHash = base64Of(await sha256Of(STYLE))
  const html = [
    '<!doctype html>',
    '<html lang="pt-BR">',
    '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>Conexus</title><style>${STYLE}</style></head>`,
    `<body><main><h1>${phrase}</h1>${action === '' ? '' : `<p>${action}</p>`}</main></body>`,
    '</html>',
  ].join('\n')
  const headers = withSecurityHeaders(
    new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }),
    `default-src 'none'; style-src 'sha256-${styleHash}'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
  )
  return new Response(html, { status, headers })
}
