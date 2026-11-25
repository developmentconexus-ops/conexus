import pg from 'pg'
import type { DatabaseUrl } from './database.ts'

type Lifetime = { after(cleanup: () => Promise<void> | void): void }

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
 * A test's hooks run in the order they were registered, and the first to throw ends the rest. A
 * database dropped in its own place ran before the hooks of the Hub, its pools and a spawned Hub
 * registered after it, so a connection of theirs still held the database, the drop threw, and none
 * of them closed: the process stayed alive to the job's timeout. Called where the database is
 * made, this runs `cleanup` behind every hook the test registers afterwards.
 */
export function afterTheRest(t: Lifetime, cleanup: () => Promise<void> | void): void {
  t.after(() => t.after(cleanup))
}
