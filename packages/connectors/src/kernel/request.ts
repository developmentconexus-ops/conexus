import type { Connector } from './definition.ts'
import type { ProviderRequest, TokenRequest } from './operation.ts'

/** A path is one absolute path on the origin: one leading '/', no scheme, no userinfo, no '..', no backslash, even percent-encoded. */
function assertPath(path: string): void {
  const decoded = safeDecode(path)
  const refused =
    !path.startsWith('/') ||
    path.startsWith('//') ||
    [path, decoded].some((text) => text.includes('..') || text.includes('@') || text.includes('\\'))
  if (refused) throw new Error('Request path refused')
}

function safeDecode(path: string): string {
  try {
    return decodeURIComponent(path)
  } catch {
    throw new Error('Request path refused')
  }
}

/**
 * The fetch Request on the connector's origin: the one place a connector's URL is built (S36).
 * `origin` is the connector's own, or a local double's that the Hub's configuration names (U3); the
 * URL is checked against the origin it was given.
 */
export function toRequest(
  connector: Connector,
  request: ProviderRequest | TokenRequest,
  bearer: string | null,
  origin: string = connector.origin,
): Request {
  assertPath(request.path)
  const url = new URL(request.path, origin)
  if (url.origin !== new URL(origin).origin) throw new Error('Request left its origin')
  for (const [name, value] of Object.entries(request.query)) url.searchParams.set(name, value)
  const headers = new Headers('headers' in request ? request.headers : {})
  if (bearer !== null) headers.set('authorization', `Bearer ${bearer}`)
  let body: string | undefined
  if ('form' in request) {
    body = request.form.toString()
    headers.set('content-type', 'application/x-www-form-urlencoded')
  } else if (request.body !== undefined) {
    body = JSON.stringify(request.body)
    headers.set('content-type', 'application/json')
  }
  return new Request(url, { method: request.method, headers, body, redirect: 'error' })
}
