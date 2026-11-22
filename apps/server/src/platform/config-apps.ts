import { z } from 'zod'
import { Secret } from './secret.ts'

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
