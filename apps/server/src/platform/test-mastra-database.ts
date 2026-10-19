import pg from 'pg'
import { DatabaseUrl, MASTRA_LOGIN } from './database.ts'

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
