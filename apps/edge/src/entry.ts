import type { HostLabel } from '@conexus/hub-api'
import { FRAME_ENTRY } from '@conexus/hub-api'
import { withSecurityHeaders } from './headers.ts'

// Inside the Hub's Prévia the dispatcher cannot send the browser to `/apps/open`: the Hub's cookie
// does not reach a frame of another site, and the Hub refuses to be framed. The page tells the Hub
// the binding's hash instead, and the Hub asks for the pass with its own session, as vibesdk's
// preview takes its token from the dashboard (`space-preview.ts:151-165`). The message goes to the
// Hub's origin only; any other parent receives nothing.
const SCRIPT = [
  "const entry = document.getElementById('entry').dataset",
  `parent.postMessage({ type: ${JSON.stringify(FRAME_ENTRY)}, host: entry.host, binding: entry.binding }, entry.hub)`,
].join('\n')

/** The entry page's script: the page carries its data, so the script is the same for every app. */
export function entryScript(contentSecurityPolicy: string): Response {
  const headers = new Headers({
    'Content-Type': 'text/javascript; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  return new Response(SCRIPT, { headers: withSecurityHeaders(headers, contentSecurityPolicy) })
}

/** What a frame of the app gets with no session: the page that asks the Hub for a pass. */
export function entryPage(input: {
  hubOrigin: string
  host: HostLabel
  binding: string
  script: string
  cookies: readonly string[]
  contentSecurityPolicy: string
}): Response {
  const html = [
    '<!doctype html>',
    '<html lang="pt-BR">',
    '<head><meta charset="utf-8"><title>Conexus</title></head>',
    `<body><div id="entry" data-hub="${input.hubOrigin}" data-host="${input.host}" data-binding="${input.binding}"></div>`,
    `<script src="${input.script}"></script></body>`,
    '</html>',
  ].join('\n')
  const headers = new Headers({
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  for (const cookie of input.cookies) headers.append('Set-Cookie', cookie)
  return new Response(html, {
    headers: withSecurityHeaders(headers, input.contentSecurityPolicy),
  })
}
