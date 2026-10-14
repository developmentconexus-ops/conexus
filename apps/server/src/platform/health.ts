import type { Health } from '@conexus/hub-api'
import { getHealth } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { serve } from './http.ts'

export function registerHealth(app: FastifyInstance): void {
  serve(app, getHealth, (): Health => ({ status: 'LIVE' }))
}
