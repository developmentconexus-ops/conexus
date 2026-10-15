import { getHealth } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from './http.ts'

export function registerHealth(app: FastifyInstance): void {
  serve(app, getHealth, () => answer({ status: 'LIVE' }))
}
