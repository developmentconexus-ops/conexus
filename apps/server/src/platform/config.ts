import { Email, Version } from '@conexus/hub-api'
import { z } from 'zod'
import { DatabaseUrl } from './database.ts'
import { Failure } from './failure.ts'
import { Secret } from './secret.ts'
import { readSecretFile } from './secret-file.ts'

const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const
type LogLevel = (typeof LOG_LEVELS)[number]

const SESSION_SECRET_MIN_LENGTH = 32

/** The Hub's address as the browser sees it, the only `Origin` its writes accept (security S24). */
export const PublicOrigin = z
  .string()
  .refine((value) => URL.parse(value)?.protocol === 'https:' && URL.parse(value)?.origin === value)
  .brand('PublicOrigin')
export type PublicOrigin = z.infer<typeof PublicOrigin>

/** Signs the session cookie: a copy of the database without it opens no session (security S16). */
export type SessionSecret = Secret<'SessionSecret'>
export const SessionSecret = {
  parse(value: string): SessionSecret {
    if (value.length < SESSION_SECRET_MIN_LENGTH) throw new TypeError('session secret too short')
    return new Secret('SessionSecret', value)
  },
}

const LOOPBACK = ['127.0.0.1', 'localhost', '[::1]']

/**
 * The mail provider's send address, with the account in it: the one place mail goes (S36). The
 * token leaves only over https; plain http is allowed only to this machine, where no wire sees it.
 */
export const MailApiUrl = z
  .string()
  .refine((value) => {
    const url = URL.parse(value)
    if (url?.protocol === 'https:') return true
    return url?.protocol === 'http:' && LOOPBACK.includes(url.hostname)
  })
  .brand('MailApiUrl')
export type MailApiUrl = z.infer<typeof MailApiUrl>

/** Sends mail as the installation; it leaves the program only in the adapter's request (S35). */
export type MailToken = Secret<'MailToken'>
export const MailToken = {
  parse(value: string): MailToken {
    return new Secret('MailToken', value)
  },
}

type BaseConfig = {
  version: Version
  port: number
  logLevel: LogLevel
  databaseUrl: DatabaseUrl
}
export type Config = BaseConfig & {
  publicOrigin: PublicOrigin
  sessionSecret: SessionSecret
  mailApiUrl: MailApiUrl
  mailFrom: Email
  mailToken: MailToken
}
type MigrateConfig = BaseConfig & { migrationDatabaseUrl: DatabaseUrl }

const Environment = z.object({
  CONEXUS_VERSION: Version,
  HUB_PORT: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(65535)),
  LOG_LEVEL: z.enum(LOG_LEVELS),
  HUB_DATABASE_URL_FILE: z.string().min(1),
})
const MigrationKey = z.object({ HUB_MIGRATION_DATABASE_URL_FILE: z.string().min(1) })
const ServeEnvironment = z.object({
  HUB_PUBLIC_ORIGIN: PublicOrigin,
  HUB_SESSION_SECRET_FILE: z.string().min(1),
  HUB_MAIL_API_URL: MailApiUrl,
  HUB_MAIL_FROM: Email,
  HUB_MAIL_TOKEN_FILE: z.string().min(1),
})

function invalid(variables: string, reason?: string): Failure {
  return new Failure('CONFIG_INVALID', {
    details: reason === undefined ? { variables } : { variables, reason },
  })
}

function readSecret<T>(variable: string, path: string, parse: (value: string) => T): T {
  const value = readSecretFile(variable, path)
  try {
    return parse(value)
  } catch (cause) {
    throw new Failure('CONFIG_INVALID', { details: { variables: variable }, cause })
  }
}

function readUrl(variable: string, path: string): DatabaseUrl {
  return readSecret(variable, path, DatabaseUrl.parse)
}

function parsed<T extends z.ZodType>(schema: T, env: NodeJS.ProcessEnv): z.output<T> {
  const result = schema.safeParse(env)
  if (!result.success) throw invalid(variablesOf(result.error), z.prettifyError(result.error))
  return result.data
}

function variablesOf(error: z.ZodError): string {
  return [...new Set(error.issues.map((issue) => String(issue.path[0])))].join(',')
}

function baseConfig(data: z.output<typeof Environment>): BaseConfig {
  return {
    version: data.CONEXUS_VERSION,
    port: data.HUB_PORT,
    logLevel: data.LOG_LEVEL,
    databaseUrl: readUrl('HUB_DATABASE_URL_FILE', data.HUB_DATABASE_URL_FILE),
  }
}

export function readConfig(mode: 'serve', env?: NodeJS.ProcessEnv): Config
export function readConfig(mode: 'migrate', env?: NodeJS.ProcessEnv): MigrateConfig
export function readConfig(mode: 'serve' | 'migrate', env = process.env): Config | MigrateConfig {
  const data = parsed(Environment, env)
  if (mode === 'migrate') {
    const path = parsed(MigrationKey, env).HUB_MIGRATION_DATABASE_URL_FILE
    return {
      ...baseConfig(data),
      migrationDatabaseUrl: readUrl('HUB_MIGRATION_DATABASE_URL_FILE', path),
    }
  }
  const serve = parsed(ServeEnvironment, env)
  return {
    ...baseConfig(data),
    publicOrigin: serve.HUB_PUBLIC_ORIGIN,
    sessionSecret: readSecret(
      'HUB_SESSION_SECRET_FILE',
      serve.HUB_SESSION_SECRET_FILE,
      SessionSecret.parse,
    ),
    mailApiUrl: serve.HUB_MAIL_API_URL,
    mailFrom: serve.HUB_MAIL_FROM,
    mailToken: readSecret('HUB_MAIL_TOKEN_FILE', serve.HUB_MAIL_TOKEN_FILE, MailToken.parse),
  }
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
