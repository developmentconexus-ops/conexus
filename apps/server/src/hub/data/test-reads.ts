import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import type { DataReadEntry } from '@conexus/hub-api'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { silent } from '../../platform/test-database.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import {
  BRUNO,
  CARLA,
  call,
  hubOn,
  memberOn,
  personOn,
  plantCompany,
} from '../identity/test-hub.ts'
import { recordRead } from './public.ts'

const ANA = { name: 'Ana Lima', email: 'ana@example.test' }
const DORA = { name: 'Dora Admin', email: 'dora@example.test' }
const EDU = { name: 'Edu Fora', email: 'edu@example.test' }

/** Ana owns Empresa A, Dora administers it, Bruno is a member and Carla a developer; Edu is outside. */
export async function registry(t: TestContext) {
  const hub = await hubOn(t)
  const ana = await personOn(hub, ANA)
  const companyId = CompanyId.parse(await plantCompany(hub.test, ana.id, 'Empresa A'))
  const dora = await memberOn(hub, companyId, DORA, 'admin')
  const bruno = await memberOn(hub, companyId, BRUNO, 'member')
  const carla = await memberOn(hub, companyId, CARLA, 'developer')
  const edu = await personOn(hub, EDU)
  const record = recordRead({ database: hub.test.database, log: silent })
  return { hub, companyId, ana, dora, bruno, carla, edu, record }
}

export type Registry = Awaited<ReturnType<typeof registry>>

export function who(w: Registry, person: Person) {
  return {
    ...{ companyId: w.companyId, personId: PersonId.parse(person.id), by: 'assistant' as const },
    ...{ projectId: null, agentId: null, threadId: null },
  }
}

export const SAMPLE = { verb: 'SAMPLE', query: null, connectionId: null, operation: null } as const

export async function sampled(
  w: Registry,
  person: Person,
  table = 'sankhya_vendas',
  outcome = 'TABLE',
) {
  const rows = outcome === 'TABLE' ? 1 : null
  const done = await w.record({
    ...who(w, person),
    ...SAMPLE,
    tables: [table],
    outcome,
    rows,
    ms: 3,
  })
  assert.equal(done, 'RECORDED')
}

export function url(w: Registry, query = '', companyId: string = w.companyId) {
  return `/api/companies/${companyId}/data-reads${query}`
}

export function exportUrl(w: Registry, from: string, to: string, more = '') {
  const period = new URLSearchParams({ from, to }).toString()
  return `/api/companies/${w.companyId}/data-reads/export?${period}${more}`
}

export type Listed = {
  reads: DataReadEntry[]
  next: { kind: 'END' } | { kind: 'MORE'; page: string }
}

export async function listed(hub: Hub, person: Person, address: string): Promise<Listed> {
  const response = await call(hub, person, 'GET', address)
  assert.equal(response.statusCode, 200, response.body)
  return Object(response.json())
}

export async function idsNewestFirst(w: Registry): Promise<string[]> {
  const rows = await w.hub.test.asOwner(
    'select id from data.data_read where company_id = $1 order by at desc, id desc',
    [w.companyId],
  )
  return rows.map((row) => String(row.id))
}
