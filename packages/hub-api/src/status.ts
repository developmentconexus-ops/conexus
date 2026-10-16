import { z } from 'zod'
import { defineOperation } from './operation.ts'

export const Version = z
  .string()
  .regex(/^v\d+\.\d+\.\d+$/)
  .brand('Version')
export type Version = z.infer<typeof Version>

export const Start = z.discriminatedUnion('state', [
  z.object({ state: z.literal('RECORDED'), version: Version, startedAt: z.iso.datetime() }),
  z.object({ state: z.literal('NONE') }),
])
export type Start = z.infer<typeof Start>

export const HubStatus = z.object({ version: Version, lastStart: Start, previousStart: Start })
export type HubStatus = z.infer<typeof HubStatus>

export const getStatus = defineOperation({
  id: 'getStatus',
  summary: 'Reads the version of the Hub that is live and its last two starts.',
  access: 'public',
  method: 'GET',
  path: '/api/status',
  bodyLimit: 1024,
  success: { status: 200, body: HubStatus },
  failures: ['DATABASE_UNAVAILABLE'],
})
