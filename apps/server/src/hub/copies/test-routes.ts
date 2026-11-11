import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { setTimeout as sleep } from 'node:timers/promises'
import type { CopyRun, CopySummary } from '@conexus/hub-api'
import { CopySummary as CopySummarySchema, listCopyRuns } from '@conexus/hub-api'
import type { Person } from '../identity/test-hub.ts'
import { call, post } from '../identity/test-hub.ts'
import type { CopiesOn } from './test-copies.ts'

/** How long a test waits for a run to end: the publish, the pages and the close, with a margin. */
const RUN_DEADLINE_MS = 60_000

export function copiesUrl(on: CopiesOn) {
  return `/api/companies/${on.companyId}/copies`
}

/** A copy turned on by Ana through the route, its summary. */
export async function enabled(on: CopiesOn, model: string): Promise<CopySummary> {
  const body = { from: 'MODEL', connectionId: on.connectionId, model, interval: '30m' }
  const made = await post(on.hub, on.ana, copiesUrl(on), body, randomUUID())
  assert.equal(made.statusCode, 201, made.body)
  return CopySummarySchema.parse(Object(made.json()).copy)
}

/** The copy's runs, one page. */
export async function runsPage(on: CopiesOn, person: Person, copyId: string, page?: string) {
  const read = await call(
    on.hub,
    person,
    'GET',
    `${copiesUrl(on)}/${copyId}/runs${page === undefined ? '' : `?page=${page}`}`,
  )
  assert.equal(read.statusCode, 200, read.body)
  return listCopyRuns.success.body.parse(read.json())
}

/** The first run of the copy to end, once the workflow has run it. */
export async function firstEnded(on: CopiesOn, copyId: string): Promise<CopyRun> {
  const deadline = Date.now() + RUN_DEADLINE_MS
  while (Date.now() < deadline) {
    const { runs } = await runsPage(on, on.ana, copyId)
    const found = runs.find((run) => run.outcome.kind !== 'RUNNING')
    if (found !== undefined) return found
    await sleep(100)
  }
  throw new Error(`no run of ${copyId} ended within ${RUN_DEADLINE_MS} ms`)
}

/** The copy as the list shows it. */
export async function listed(on: CopiesOn, person: Person, copyId: string) {
  const read = await call(on.hub, person, 'GET', copiesUrl(on))
  assert.equal(read.statusCode, 200, read.body)
  const copies: CopySummary[] = Object(read.json()).copies.map((each: unknown) =>
    CopySummarySchema.parse(each),
  )
  const found = copies.find((each) => each.id === copyId)
  assert.ok(found, 'the copy is listed')
  return found
}
