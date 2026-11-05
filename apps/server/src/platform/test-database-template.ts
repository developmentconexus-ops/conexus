import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type pg from 'pg'
import { DatabaseUrl, MASTRA_LOGIN, MIGRATIONS_FOLDER, RUNTIME_LOGIN } from './database.ts'
import { migrate } from './migrate.ts'
import { mastraUrlOf } from './test-mastra-database.ts'

/** `url` on another database of the same server, as another login when `login` is given. */
export function withDatabase(
  url: DatabaseUrl,
  name: string,
  login?: { user: string; password: string },
) {
  const next = new URL(url.reveal())
  next.pathname = `/${name}`
  if (login !== undefined) {
    next.username = login.user
    next.password = login.password
  }
  return DatabaseUrl.parse(next.toString())
}

/** The Hub's template for a migrations folder: another name once a file's name or content changes. */
export function templateNameOf(folder = MIGRATIONS_FOLDER): string {
  const hash = createHash('sha256')
  for (const file of readdirSync(folder, { recursive: true, encoding: 'utf8' }).sort()) {
    const path = join(folder, file)
    if (statSync(path).isFile()) hash.update(`${file}\0`).update(readFileSync(path)).update('\0')
  }
  return `conexus_template_${hash.digest('hex').slice(0, 12)}`
}

/**
 * The Hub's database migrated once per migrations folder, for every test to clone; the caller
 * holds the role lock. It is migrated under a provisional name and takes its own only when whole,
 * so a migration that dies halfway leaves nothing to clone; the next process drops what was left
 * and starts again.
 */
export async function hubTemplate(
  admin: pg.Client,
  serverUrl: DatabaseUrl,
  runtimePassword: string,
): Promise<string> {
  const name = templateNameOf()
  const found = await admin.query('select 1 from pg_database where datname = $1', [name])
  if (found.rowCount !== 0) return name
  const building = `${name}_building`
  await admin.query(`drop database if exists ${building}_mastra`)
  await admin.query(`drop database if exists ${building}`)
  await admin.query(`create database ${building}`)
  const login = { user: RUNTIME_LOGIN, password: runtimePassword }
  const runtimeUrl = withDatabase(serverUrl, building, login)
  const ownerUrl = withDatabase(serverUrl, building)
  await migrate({ ownerUrl, runtimeUrl, mastraUrl: mastraUrlOf(runtimeUrl) })
  await admin.query(`drop database ${building}_mastra`)
  await admin.query(`alter database ${building} rename to ${name}`)
  await admin.query(`alter database ${name} is_template true`)
  return name
}

/**
 * Mastra's empty database beside a clone, and the database grants a clone does not copy, as the
 * migration `mastra_login` and `prepareMastraDatabase` give them.
 */
export async function grantCloned(admin: pg.Client, name: string): Promise<void> {
  await admin.query(`create database ${name}_mastra`)
  await admin.query(`revoke connect on database ${name} from public`)
  await admin.query(`grant connect on database ${name} to ${RUNTIME_LOGIN}`)
  await admin.query(`revoke connect on database ${name}_mastra from public`)
  await admin.query(`grant connect, create on database ${name}_mastra to ${MASTRA_LOGIN}`)
}
