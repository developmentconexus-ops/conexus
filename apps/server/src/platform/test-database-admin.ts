import pg from 'pg'
import type { DatabaseUrl } from './database.ts'

export type Lifetime = { after(cleanup: () => Promise<void> | void): void }

export async function connected(url: DatabaseUrl): Promise<pg.Client> {
  const client = new pg.Client({ connectionString: url.reveal() })
  await client.connect()
  return client
}

/** One connection for `work`, ended after it, so a hook that throws never leaves one open. */
export async function asAdmin<T>(
  url: DatabaseUrl,
  work: (admin: pg.Client) => Promise<T>,
): Promise<T> {
  const admin = await connected(url)
  try {
    return await work(admin)
  } finally {
    await admin.end()
  }
}

/**
 * Node runs a test's hooks in the order they were registered and skips the rest once one throws.
 * This puts `cleanup` behind every hook registered after the call.
 */
export function afterTheRest(t: Lifetime, cleanup: () => Promise<void> | void): void {
  t.after(() => t.after(cleanup))
}
