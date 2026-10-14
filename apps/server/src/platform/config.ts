import { Version } from '@conexus/hub-api'
import { z } from 'zod'
import { DatabaseUrl } from './database.ts'
import { Failure } from './failure.ts'
import { readSecretFile } from './secret-file.ts'

const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const
type LogLevel = (typeof LOG_LEVELS)[number]

export type Config = {
  version: Version
  port: number
  logLevel: LogLevel
  databaseUrl: DatabaseUrl
}
type MigrateConfig = Config & { migrationDatabaseUrl: DatabaseUrl }

const Environment = z.object({
  CONEXUS_VERSION: Version,
  HUB_PORT: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(65535)),
  LOG_LEVEL: z.enum(LOG_LEVELS),
  HUB_DATABASE_URL_FILE: z.string().min(1),
})
const MigrationKey = z.object({ HUB_MIGRATION_DATABASE_URL_FILE: z.string().min(1) })

function invalid(variables: string, reason?: string): Failure {
  return new Failure('CONFIG_INVALID', {
    details: reason === undefined ? { variables } : { variables, reason },
  })
}

function readUrl(variable: string, path: string): DatabaseUrl {
  const value = readSecretFile(variable, path)
  try {
    return DatabaseUrl.parse(value)
  } catch (cause) {
    throw new Failure('CONFIG_INVALID', { details: { variables: variable }, cause })
  }
}

function variablesOf(error: z.ZodError): string {
  return [...new Set(error.issues.map((issue) => String(issue.path[0])))].join(',')
}

export function readConfig(mode: 'serve', env?: NodeJS.ProcessEnv): Config
export function readConfig(mode: 'migrate', env?: NodeJS.ProcessEnv): MigrateConfig
export function readConfig(mode: 'serve' | 'migrate', env = process.env): Config | MigrateConfig {
  const parsed = Environment.safeParse(env)
  if (!parsed.success) throw invalid(variablesOf(parsed.error), z.prettifyError(parsed.error))
  const { data } = parsed
  const config: Config = {
    version: data.CONEXUS_VERSION,
    port: data.HUB_PORT,
    logLevel: data.LOG_LEVEL,
    databaseUrl: readUrl('HUB_DATABASE_URL_FILE', data.HUB_DATABASE_URL_FILE),
  }
  if (mode === 'serve') return config
  const owner = MigrationKey.safeParse(env)
  if (!owner.success) throw invalid(variablesOf(owner.error), z.prettifyError(owner.error))
  const path = owner.data.HUB_MIGRATION_DATABASE_URL_FILE
  return { ...config, migrationDatabaseUrl: readUrl('HUB_MIGRATION_DATABASE_URL_FILE', path) }
}

const TestEnvironment = z.object({
  CONEXUS_TEST_DATABASE_URL: z.string().min(1),
  CONEXUS_TEST_RUNTIME_PASSWORD: z.string().min(1),
  CONEXUS_TEST_DATABASE_CONTAINER: z.string().min(1).optional(),
})

export function readTestDatabase(env = process.env): {
  ownerUrl: DatabaseUrl
  runtimePassword: string
  container: string | undefined
} {
  const parsed = TestEnvironment.safeParse(env)
  if (!parsed.success) throw invalid(variablesOf(parsed.error))
  return {
    ownerUrl: DatabaseUrl.parse(parsed.data.CONEXUS_TEST_DATABASE_URL),
    runtimePassword: parsed.data.CONEXUS_TEST_RUNTIME_PASSWORD,
    container: parsed.data.CONEXUS_TEST_DATABASE_CONTAINER,
  }
}
