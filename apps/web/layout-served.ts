import { appContentSecurityPolicy } from '@conexus/app-contract'
import { DIAGRAM_FRAME } from '@conexus/hub-api'

// The policy the edge sends with an app's page, from its one owner: a piece that needs a style
// element or a data: URI fails here, in the browser, and not after the Release (web W22, testing T23).
// The Hub's own policy adds `frame-src` for the apps' domain, which the Prévia frames, and `data:`
// images, which a connector's logo is, and `'self'`, the drawing frame (apps/server/src/platform/http.ts).
export const APPS_DOMAIN = 'apps.example.test'
const SECURITY_HEADERS = {
  'Content-Security-Policy': `${appContentSecurityPolicy("'none'").replace("img-src 'self'", "img-src 'self' data:")}; frame-src 'self' https://*.${APPS_DOMAIN}`,
}

/** `/pieces` is the page of chat pieces, built only here, never by `npm run build`. */
export function fileOf(pathname: string): string {
  if (pathname.startsWith('/assets/') || pathname === DIAGRAM_FRAME.path) return pathname
  if (pathname === '/diagram') return '/diagram.html'
  return pathname === '/pieces' ? '/pieces.html' : '/index.html'
}

/** What the Hub sends with a built file: the frame's own policy for the frame, CORS for the assets it loads. */
export function headersFor(pathname: string): Record<string, string> {
  if (pathname === DIAGRAM_FRAME.path) {
    return { 'Content-Security-Policy': DIAGRAM_FRAME.policy, 'X-Frame-Options': 'SAMEORIGIN' }
  }
  return pathname.startsWith('/assets/')
    ? { ...SECURITY_HEADERS, 'Access-Control-Allow-Origin': '*' }
    : SECURITY_HEADERS
}
