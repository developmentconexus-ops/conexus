import { Version } from '@conexus/hub-api'
import { z } from 'zod'
import { Failure } from './failure.ts'

const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const
type LogLevel = (typeof LOG_LEVELS)[number]

export type Config = { version: Version; port: number; logLevel: LogLevel }

const Environment = z.object({
  CONEXUS_VERSION: Version,
  HUB_PORT: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(65535)),
  LOG_LEVEL: z.enum(LOG_LEVELS),
})

export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = Environment.safeParse(env)
  if (!parsed.success) {
    const variables = new Set(parsed.error.issues.map((issue) => String(issue.path[0])))
    throw new Failure('CONFIG_INVALID', {
      details: { variables: [...variables].join(','), reason: z.prettifyError(parsed.error) },
    })
  }
  const { CONEXUS_VERSION, HUB_PORT, LOG_LEVEL } = parsed.data
  return { version: CONEXUS_VERSION, port: HUB_PORT, logLevel: LOG_LEVEL }
}
