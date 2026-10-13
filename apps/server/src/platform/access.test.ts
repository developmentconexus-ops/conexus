import assert from 'node:assert/strict'
import { test } from 'node:test'
import Fastify from 'fastify'
import { enforceAccess } from './access.ts'

type Route = { method: 'GET' | 'POST'; url: string; config?: Record<string, unknown> }

async function start(route: Route) {
  const app = Fastify({ exposeHeadRoutes: false })
  enforceAccess(app)
  app.route({ ...route, handler: async () => ({ ok: true }) })
  await app.ready()
  return app
}

test('recusa rota sem tipo', async () => {
  await assert.rejects(
    start({ method: 'GET', url: '/orphan' }),
    /INTERNAL_UNEXPECTED route=GET \/orphan /,
  )
})

test('recusa tipo desconhecido', async () => {
  await assert.rejects(
    start({ method: 'GET', url: '/api/secret', config: { access: 'secret' } }),
    /route=GET \/api\/secret /,
  )
})

test('recusa o que o tipo não permite', async () => {
  const refused: Route[] = [
    { method: 'POST', url: '/api/write', config: { access: 'public' } },
    { method: 'GET', url: '/other', config: { access: 'public' } },
    { method: 'GET', url: '/api/page', config: { access: 'page' } },
  ]
  for (const route of refused) {
    await assert.rejects(start(route), new RegExp(`route=${route.method} ${route.url} `))
  }
})

test('aceita uma rota pública em /api/', async () => {
  const app = await start({ method: 'GET', url: '/api/ok', config: { access: 'public' } })
  const response = await app.inject({ method: 'GET', url: '/api/ok' })
  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.json(), { ok: true })
})
