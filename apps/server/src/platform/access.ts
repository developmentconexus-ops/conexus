import type { AccessKind } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Failure } from './failure.ts'

const AccessConfig = z.looseObject({ access: z.enum(['page', 'public']).optional() })

type Shape = { methods: readonly string[]; path: RegExp }
const ALLOWED: Record<AccessKind, Shape> = {
  page: { methods: ['GET', 'HEAD'], path: /^\/($|favicon\.svg$|assets\/)/ },
  public: { methods: ['GET'], path: /^\/api\// },
}

function declared(config: unknown): AccessKind | undefined {
  const parsed = AccessConfig.safeParse(config ?? {})
  return parsed.success ? parsed.data.access : undefined
}

function refuse(route: string, reason: string): never {
  throw new Failure('INTERNAL_UNEXPECTED', { details: { route, reason } })
}

export function enforceAccess(app: FastifyInstance): void {
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
    if (declared(request.routeOptions.config) === undefined) throw new Failure('NOT_FOUND')
  })
}
