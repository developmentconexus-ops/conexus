import { Email, Version } from '@conexus/hub-api'
import { z } from 'zod'
import type { GitCopyBucket } from './config-git.ts'
import { GitCopyKey, GitEnvironment } from './config-git.ts'
import { DatabaseUrl } from './database.ts'
import { Failure } from './failure.ts'
import type { SealKeys } from './seal.ts'
import { parseSealKeys } from './seal.ts'
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

/** The domain the apps' hosts live one label under, such as `<name>--<nickname>.<domain>` (0024). */
export const AppsDomain = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)+$/)
  .brand('AppsDomain')
export type AppsDomain = z.infer<typeof AppsDomain>

const LOOPBACK = ['127.0.0.1', 'localhost', '[::1]']

/** A credential leaves only over https; plain http is allowed only to this machine, where no wire sees it. */
function overHttpsOrLoopback(value: string): boolean {
  const url = URL.parse(value)
  if (url?.protocol === 'https:') return true
  return url?.protocol === 'http:' && LOOPBACK.includes(url.hostname)
}

/** The mail provider's send address, with the account in it: the one place mail goes (S36). */
export const MailApiUrl = z.string().refine(overHttpsOrLoopback).brand('MailApiUrl')
export type MailApiUrl = z.infer<typeof MailApiUrl>

/** Sends mail as the installation; `createMail` in mail.ts reveals it into its request (S35). */
export type MailToken = Secret<'MailToken'>
export const MailToken = {
  parse(value: string): MailToken {
    return new Secret('MailToken', value)
  },
}

/** The Neon API the companies' key is sent to: the one place it goes (S36). */
export const NeonApiUrl = z.string().refine(overHttpsOrLoopback).brand('NeonApiUrl')
export type NeonApiUrl = z.infer<typeof NeonApiUrl>

/** The Neon organization that holds the companies' projects, apart from the Hub's own (decision 0040). */
export const NeonOrgId = z.string().min(1).brand('NeonOrgId')
export type NeonOrgId = z.infer<typeof NeonOrgId>

/** Creates and deletes the companies' Neon projects; `createNeonProjects` reveals it into its client (S36). */
export type NeonApiKey = Secret<'NeonApiKey'>
export const NeonApiKey = {
  parse(value: string): NeonApiKey {
    return new Secret('NeonApiKey', value)
  },
}

/**
 * Derives every app login's password (decision 0043); `createCompanyPostgres` reveals it into its SQL.
 * It is what `openssl rand -hex 32` writes, as `publish-edge.sh` requires of the dispatcher's copy:
 * any other byte would derive other passwords on each side.
 */
export type AppLoginKey = Secret<'AppLoginKey'>
export const AppLoginKey = {
  parse(value: string): AppLoginKey {
    if (!/^[0-9a-f]{64}$/.test(value)) throw new TypeError('app login key not 64 hex digits')
    return new Secret('AppLoginKey', value)
  },
}

/** Cloudflare's API the apps' token is sent to: the one place it goes (S36). */
export const CloudflareApiUrl = z.string().refine(overHttpsOrLoopback).brand('CloudflareApiUrl')
export type CloudflareApiUrl = z.infer<typeof CloudflareApiUrl>

/** Uploads and removes the versions' Workers in the apps' namespace (decision 0043). */
export type CloudflareAppsToken = Secret<'CloudflareAppsToken'>
export const CloudflareAppsToken = {
  parse(value: string): CloudflareAppsToken {
    return new Secret('CloudflareAppsToken', value)
  },
}

/** The account and the dispatch namespace that hold the apps' Workers. */
export const CloudflareName = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{0,62}$/)
  .brand('CloudflareName')
export type CloudflareName = z.infer<typeof CloudflareName>

type BaseConfig = {
  version: Version
  port: number
  logLevel: LogLevel
  databaseUrl: DatabaseUrl
  mastraDatabaseUrl: DatabaseUrl
}
export type Config = BaseConfig & {
  edgePort: number
  appsDomain: AppsDomain
  publicOrigin: PublicOrigin
  sessionSecret: SessionSecret
  mailApiUrl: MailApiUrl
  mailFrom: Email
  mailToken: MailToken
  neonApiUrl: NeonApiUrl
  neonOrgId: NeonOrgId
  neonApiKey: NeonApiKey
  appLoginKey: AppLoginKey
  cloudflareApiUrl: CloudflareApiUrl
  cloudflareAccountId: CloudflareName
  appsNamespace: CloudflareName
  cloudflareAppsToken: CloudflareAppsToken
  sealKeys: SealKeys
  cliProxy: CliProxy
  gitRoot: string
  gitCopyBucket: GitCopyBucket
  gitCopyKey: GitCopyKey
}
/**
 * CLIProxyAPI's program for Google's sign-in, the sha256 it must have to run, and how long it keeps
 * a login open (decision 0049).
 */
export type CliProxy = Readonly<{ binary: string; sha256: string; loginSeconds: number }>

// v8.0.33 (2422c6b0), as hub.Dockerfile installs it and the step's live proof ran it.
const CLIPROXY: CliProxy = {
  binary: '/opt/cliproxy/cli-proxy-api',
  sha256: 'e78e2ea753a1f6f020b3f9558081a0f433968b86e500fcb8c556365ee13c90dc',
  // An Antigravity login fails after five minutes
  // (internal/api/handlers/management/auth_files_provider_oauth.go:402).
  loginSeconds: 300,
}

type MigrateConfig = BaseConfig & { migrationDatabaseUrl: DatabaseUrl }

const Port = z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(65535))
const Environment = z.object({
  CONEXUS_VERSION: Version,
  HUB_PORT: Port,
  LOG_LEVEL: z.enum(LOG_LEVELS),
  HUB_DATABASE_URL_FILE: z.string().min(1),
  HUB_MASTRA_DATABASE_URL_FILE: z.string().min(1),
})
const MigrationKey = z.object({ HUB_MIGRATION_DATABASE_URL_FILE: z.string().min(1) })
const ServeEnvironment = z.object({
  HUB_EDGE_PORT: Port,
  HUB_APPS_DOMAIN: AppsDomain,
  HUB_PUBLIC_ORIGIN: PublicOrigin,
  HUB_SESSION_SECRET_FILE: z.string().min(1),
  HUB_MAIL_API_URL: MailApiUrl,
  HUB_MAIL_FROM: Email,
  HUB_MAIL_TOKEN_FILE: z.string().min(1),
  HUB_NEON_API_URL: NeonApiUrl,
  HUB_NEON_ORG_ID: NeonOrgId,
  HUB_NEON_API_KEY_FILE: z.string().min(1),
  HUB_APP_LOGIN_KEY_FILE: z.string().min(1),
  HUB_CLOUDFLARE_API_URL: CloudflareApiUrl,
  HUB_CLOUDFLARE_ACCOUNT_ID: CloudflareName,
  HUB_APPS_NAMESPACE: CloudflareName,
  HUB_CLOUDFLARE_APPS_TOKEN_FILE: z.string().min(1),
  HUB_SEAL_KEYS_FILE: z.string().min(1),
  ...GitEnvironment.shape,
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
    mastraDatabaseUrl: readUrl('HUB_MASTRA_DATABASE_URL_FILE', data.HUB_MASTRA_DATABASE_URL_FILE),
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
  if (serve.HUB_EDGE_PORT === data.HUB_PORT) throw invalid('HUB_EDGE_PORT', 'equals HUB_PORT')
  return {
    ...baseConfig(data),
    edgePort: serve.HUB_EDGE_PORT,
    appsDomain: serve.HUB_APPS_DOMAIN,
    publicOrigin: serve.HUB_PUBLIC_ORIGIN,
    sessionSecret: readSecret(
      'HUB_SESSION_SECRET_FILE',
      serve.HUB_SESSION_SECRET_FILE,
      SessionSecret.parse,
    ),
    mailApiUrl: serve.HUB_MAIL_API_URL,
    mailFrom: serve.HUB_MAIL_FROM,
    mailToken: readSecret('HUB_MAIL_TOKEN_FILE', serve.HUB_MAIL_TOKEN_FILE, MailToken.parse),
    neonApiUrl: serve.HUB_NEON_API_URL,
    neonOrgId: serve.HUB_NEON_ORG_ID,
    neonApiKey: readSecret('HUB_NEON_API_KEY_FILE', serve.HUB_NEON_API_KEY_FILE, NeonApiKey.parse),
    appLoginKey: readSecret(
      'HUB_APP_LOGIN_KEY_FILE',
      serve.HUB_APP_LOGIN_KEY_FILE,
      AppLoginKey.parse,
    ),
    cloudflareApiUrl: serve.HUB_CLOUDFLARE_API_URL,
    cloudflareAccountId: serve.HUB_CLOUDFLARE_ACCOUNT_ID,
    appsNamespace: serve.HUB_APPS_NAMESPACE,
    cloudflareAppsToken: readSecret(
      'HUB_CLOUDFLARE_APPS_TOKEN_FILE',
      serve.HUB_CLOUDFLARE_APPS_TOKEN_FILE,
      CloudflareAppsToken.parse,
    ),
    sealKeys: readSecret('HUB_SEAL_KEYS_FILE', serve.HUB_SEAL_KEYS_FILE, parseSealKeys),
    cliProxy: CLIPROXY,
    gitRoot: serve.HUB_GIT_ROOT,
    gitCopyBucket: serve.HUB_GIT_COPY_BUCKET,
    gitCopyKey: readSecret('HUB_GIT_COPY_KEY_FILE', serve.HUB_GIT_COPY_KEY_FILE, GitCopyKey.parse),
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
