import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import type { Person } from '../identity/test-hub.ts'
import { codeOf, post } from '../identity/test-hub.ts'
import type { connectionsOn } from './test-connections.ts'

export type On = Awaited<ReturnType<typeof connectionsOn>>

export const ASKED = ['clientSecret', 'xToken']

let next = 0
/** An address of its own for each call, so the limit of attempts is met only where a test goes for it. */
function freshAddress(): string {
  next += 1
  return `203.0.113.${next}`
}

function secretOf(url: string): string {
  return new URL(url).pathname.split('/').pop() ?? ''
}

export function digestOf(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}

export async function made(on: On, who: Person, extra: object = {}) {
  const body = {
    connector: 'sankhya',
    name: 'Filial',
    asked: ASKED,
    filled: filledOf(on),
    ...extra,
  }
  const reply = await post(on.hub, who, `/api/companies/${on.companyId}/connection-links`, body)
  assert.equal(reply.statusCode, 201)
  const { url, expiresAt } = Object(reply.json())
  const secret = secretOf(url)
  const [row] = await on.hub.test.asOwner(
    'select id from connectors.connection_link where secret_hash = $1',
    [digestOf(secret)],
  )
  return { url, expiresAt, secret, id: String(Object(row).id) }
}

function filledOf(on: On) {
  return { clientId: on.fake.credential.clientId }
}

export function open(on: On, secret: string, address = freshAddress()) {
  return on.hub.app.inject({
    method: 'GET',
    url: `/api/connection-links/${secret}`,
    headers: { 'cf-connecting-ip': address },
  })
}

export function send(on: On, secret: string, fields: object, address = freshAddress()) {
  return on.hub.app.inject({
    method: 'POST',
    url: `/api/connection-links/${secret}`,
    headers: {
      origin: TEST_ORIGIN,
      'content-type': 'application/json',
      'cf-connecting-ip': address,
    },
    payload: JSON.stringify({ fields }),
  })
}

export function rightFields(on: On) {
  const { clientSecret, xToken } = on.fake.credential
  return { clientSecret, xToken }
}

export async function count(on: On, table: string): Promise<number> {
  const [row] = await on.hub.test.asOwner(`select count(*)::int as n from connectors.${table}`)
  return Number(Object(row).n)
}

export function logged(on: On, message: string) {
  return on.hub.lines.filter((line) => line.message === message)
}

export function failed(reply: { statusCode: number; json(): unknown }) {
  return [reply.statusCode, codeOf(reply)]
}

export async function allRowsWith(on: On, text: string): Promise<string[]> {
  const tables = await on.hub.test.asOwner(
    `select schemaname, tablename from pg_tables where schemaname not in ('pg_catalog', 'information_schema')`,
  )
  const found: string[] = []
  for (const table of tables) {
    const name = `"${table.schemaname}"."${table.tablename}"`
    const [row] = await on.hub.test.asOwner(
      `select count(*)::int as n from ${name} as row where row::text like $1`,
      [`%${text}%`],
    )
    if (Number(Object(row).n) > 0) found.push(name)
  }
  return found
}
