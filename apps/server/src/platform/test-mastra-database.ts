import pg from 'pg'
import type { Config } from './config.ts'
import type { MastraPool } from './database.ts'
import { DatabaseUrl, MASTRA_LOGIN, openMastraPool } from './database.ts'

/** Mastra's database beside a test one, `<name>_mastra`, its login with the Hub login's password. */
export function mastraUrlOf(hubUrl: DatabaseUrl): DatabaseUrl {
  const url = new URL(hubUrl.reveal())
  url.pathname = `${url.pathname}_mastra`
  url.username = MASTRA_LOGIN
  return DatabaseUrl.parse(url.toString())
}

/** `url`'s login aimed at `of`'s database: Mastra's at the Hub's, or the Hub's at Mastra's. */
export function inDatabase(url: DatabaseUrl, of: DatabaseUrl): DatabaseUrl {
  const next = new URL(url.reveal())
  next.pathname = new URL(of.reveal()).pathname
  return DatabaseUrl.parse(next.toString())
}

/** What the server answers a login to `url`: `ok` once a statement ran, or the refusal's SQLSTATE. */
export async function loginAnswer(url: DatabaseUrl, statement = 'select 1'): Promise<string> {
  const client = new pg.Client({ connectionString: url.reveal() })
  try {
    await client.connect()
    await client.query(statement)
    return 'ok'
  } catch (error) {
    return error instanceof pg.DatabaseError ? (error.code ?? 'unknown') : 'unknown'
  } finally {
    await client.end().catch(() => undefined)
  }
}

const QUIET = { info: () => undefined, error: () => undefined }

/** The pool of Mastra's login a test Hub converses through, ended with the test. */
export function testMastraPool(
  t: { after: (cleanup: () => Promise<void>) => void },
  config: Config,
): MastraPool {
  const pool = openMastraPool({ url: config.mastraDatabaseUrl, log: QUIET })
  t.after(() => pool.end())
  return pool
}

/** A pool of Mastra's own login at `address`, the database behind a test's door (`database-down.test.ts`). */
export function mastraPoolAt(address: string): MastraPool {
  return openMastraPool({
    url: DatabaseUrl.parse(address),
    log: { info: () => undefined, error: () => undefined },
  })
}
