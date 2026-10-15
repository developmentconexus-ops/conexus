import type { AccessKind } from '@conexus/hub-api'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import type { PublicOrigin } from './config.ts'
import { Failure } from './failure.ts'

const AccessConfig = z.looseObject({
  access: z.enum(['page', 'public', 'entry', 'session']).optional(),
})
const READS = ['GET', 'HEAD']
const JSON_MEDIA_TYPE = 'application/json'

type Shape = { methods: readonly string[]; path: RegExp }
const ALLOWED: Record<AccessKind, Shape> = {
  page: { methods: READS, path: /^\/($|favicon\.svg$|assets\/)/ },
  public: { methods: ['GET'], path: /^\/api\// },
  entry: { methods: ['POST', 'PUT'], path: /^\/api\// },
  session: { methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], path: /^\/api\// },
}

function declared(config: unknown): AccessKind | undefined {
  const parsed = AccessConfig.safeParse(config ?? {})
  return parsed.success ? parsed.data.access : undefined
}

function refuse(route: string, reason: string): never {
  throw new Failure('INTERNAL_UNEXPECTED', { details: { route, reason } })
}

function hasBody(request: FastifyRequest): boolean {
  const length = request.headers['content-length']
  return request.headers['transfer-encoding'] !== undefined || (length ?? '0') !== '0'
}

function mediaType(request: FastifyRequest): string | undefined {
  return request.headers['content-type']?.split(';')[0]?.trim().toLowerCase()
}

/** A form post from another site is the one write a browser sends with cookies and no preflight. */
function checkWrite(request: FastifyRequest, publicOrigin: PublicOrigin): void {
  const site = request.headers['sec-fetch-site']
  if (request.headers.origin !== publicOrigin || (site !== undefined && site !== 'same-origin')) {
    throw new Failure('REQUEST_ORIGIN_REFUSED')
  }
  const type = mediaType(request)
  if (type === undefined ? hasBody(request) : type !== JSON_MEDIA_TYPE) {
    throw new Failure('REQUEST_MEDIA_TYPE_REFUSED')
  }
}

export function enforceAccess(app: FastifyInstance, deps: { publicOrigin: PublicOrigin }): void {
  app.addHook('onRoute', (route) => {
    const methods = [route.method].flat()
    const where = `${methods.join('|')} ${route.url}`
    const access = declared(route.config)
    if (access === undefined) {
      refuse(where, 'the route declares no known access kind')
    } else {
      const allowed = ALLOWED[access]
      const outside = methods.some((method) => !allowed.methods.includes(method))
      if (outside || !allowed.path.test(route.url)) {
        refuse(where, `${access} access does not allow it`)
      }
    }
  })
  app.addHook('onRequest', async (request) => {
    const access = declared(request.routeOptions.config)
    if (access === undefined) throw new Failure('NOT_FOUND')
    if (access !== 'entry' && access !== 'session') return
    if (!READS.includes(request.method)) checkWrite(request, deps.publicOrigin)
    // The Tunnel puts the client's address here; the attempt limit keys on it (security S28, S29).
    if (access === 'entry' && !request.headers['cf-connecting-ip']) {
      throw new Failure('REQUEST_MALFORMED')
    }
  })
}
