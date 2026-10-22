// What an app's page may load on its own host: never framed, nothing submitted elsewhere, and
// only its own origin for scripts, styles, images, fonts and calls (application-csp.ts:4,14). The
// dispatcher sends it on every answer and the check opens the built screens under it (decision 0055).
export const APP_CONTENT_SECURITY_POLICY =
  "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'"

const MEDIA_TYPES: Readonly<Record<string, string>> = {
  js: 'text/javascript',
  mjs: 'text/javascript',
  json: 'application/json',
  css: 'text/css',
  html: 'text/html',
  txt: 'text/plain',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  woff2: 'font/woff2',
  wasm: 'application/wasm',
}

/** The media type a version's file is sent and served with, by its extension. */
export function mediaTypeOf(path: string): string {
  return MEDIA_TYPES[path.split('.').at(-1)?.toLowerCase() ?? ''] ?? 'application/octet-stream'
}
