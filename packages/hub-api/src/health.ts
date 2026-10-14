import { z } from 'zod'
import type { Operation } from './operation.ts'

export const Health = z.object({ status: z.literal('LIVE') })
export type Health = z.infer<typeof Health>

export const getHealth = {
  id: 'getHealth',
  summary: 'Says the program is alive, without touching any database.',
  access: 'public',
  method: 'GET',
  path: '/api/health',
  bodyLimit: 1024,
  success: { status: 200, body: Health },
  failures: [],
} as const satisfies Operation
