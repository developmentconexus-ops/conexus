import { z } from 'zod'
import type { Operation } from './operation.ts'

export const Version = z
  .string()
  .regex(/^v\d+\.\d+\.\d+$/)
  .brand('Version')
export type Version = z.infer<typeof Version>

export const HubStatus = z.object({ version: Version })
export type HubStatus = z.infer<typeof HubStatus>

export const getStatus = {
  id: 'getStatus',
  summary: 'Reads the version of the Hub that is live.',
  access: 'public',
  method: 'GET',
  path: '/api/status',
  bodyLimit: 1024,
  success: { status: 200, body: HubStatus },
  failures: [],
} as const satisfies Operation
