import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import type { CompanyId, ConnectionId, LakeRunId } from '@conexus/hub-api'
import { CompanyId as CompanyIdSchema, ConnectionId as ConnectionIdSchema } from '@conexus/hub-api'
import { z } from 'zod'
import { createAws } from '../../platform/aws.ts'
import type { Config } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import type { Scalar } from '../../platform/failure.ts'
import { testAws } from '../../platform/test-aws.ts'
import { awsServer } from '../../platform/test-aws-server.ts'
import { silent } from '../../platform/test-database.ts'
import { linkSankhya, servedSankhya } from '../connectors/test-connections.ts'
import type { Hub } from '../identity/test-hub.ts'
import { ANA_OWNER, hubWithLog, personOn, plantCompany } from '../identity/test-hub.ts'
import { companyScope } from './lake-close.ts'
import type { StartAnswer, StartClock } from './lake-run.ts'
import { createLakeRuns } from './lake-run.ts'
import { CopyTaskSpec } from './lake-task.ts'

/** The lake's id in the tests, as the row of a ready lake holds it. */
export const TEST_LAKE = 'k3x9a0b1c2d3'
const DEADLINES = { connectionMs: 500, requestMs: 1_000, callMs: 1_500 }

/**
 * A clock that only moves when the start line sleeps: the double reads the same clock, so the
 * second each parameter arrives in is the line's own (T20).
 */
export function testClock(start = Date.parse('2026-11-24T13:07:00Z')) {
  let now = start
  const clock: StartClock = {
    now: () => now,
    async sleep(ms) {
      now += ms
      await new Promise((resolve) => setImmediate(resolve))
    },
  }
  return clock
}

/** The most writes any one-second window holds. */
export function busiestSecond(writes: readonly number[]): number {
  const sorted = [...writes].sort((a, b) => a - b)
  return Math.max(
    0,
    ...sorted.map((from) => sorted.filter((at) => at >= from && at - from < 1_000).length),
  )
}

function capturing() {
  const lines: { fields: Record<string, Scalar>; message: string }[] = []
  const log = {
    info: (fields: Record<string, Scalar>, message: string) => void lines.push({ fields, message }),
    error: (fields: Record<string, Scalar>, message: string) =>
      void lines.push({ fields, message }),
  }
  return { lines, log }
}

async function plantLake(hub: Hub, companyId: CompanyId, aws: Config['aws']) {
  const stack = `arn:aws:cloudformation:${aws.region}:${aws.account}:stack/conexus-lago-${TEST_LAKE}/x`
  await hub.test.asOwner(
    `insert into lake.company_lake (company_id, lake_id, state, account, region, template, stack_id, since)
     values ($1, $2, 'ready', $3, $4, $5, $6, now())`,
    [companyId, TEST_LAKE, aws.account, aws.region, aws.templateVersion, stack],
  )
}

async function finishedOnce(
  hub: Hub,
  a: { companyId: CompanyId; connection: string; name: string },
) {
  const run = crypto.randomUUID()
  await hub.test.asOwner(
    `insert into copies.lake_run (id, company_id, connection_id, started_at, ended_at, outcome, whole, attempt)
     values ($1, $2, $3, now() - interval '1 day', now() - interval '1 day', 'COMPLETE', false, 1)`,
    [run, a.companyId, a.connection],
  )
  await hub.test.asOwner(
    `update copies.lake_table set last_run_id = $1 where connection_id = $2 and name = $3`,
    [run, a.connection, a.name],
  )
}

type CopyOptions = { name?: string; startDate?: string | null; interval?: string }
type Marked = { source: string; name: string; done?: boolean }

/**
 * Empresa Teste on a Hub whose Sankhya is the kit's double and whose AWS is the double of recorded
 * answers (T29), its lake ready; the copy's start over them, with the connectors' own seal and
 * dictionary.
 */
export async function lakeRunOn(t: TestContext, clock = testClock()) {
  const aws = await awsServer(t)
  aws.start.now = clock.now
  const sankhya = await servedSankhya(t)
  const hub = await hubWithLog(t, (config) => ({
    ...config,
    connectorOrigins: new Map([['sankhya', sankhya.origin]]),
    aws: testAws(aws.endpoint.href, aws.credentialsFile),
  }))
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = CompanyIdSchema.parse(await plantCompany(hub.test, ana.id))
  const { config } = hub
  const { lines, log } = capturing()
  const ports = createAws({ config, log, deadlines: DEADLINES })
  async function companies() {
    return [companyId]
  }
  const runs = createLakeRuns({
    ...{ database: hub.test.database, source: hub.connectors.copies, copy: config.aws.copy },
    ...{ tasks: ports.tasks, queue: ports.queue, log, clock, companies },
  })
  t.after(() => runs.queue.stop())
  await plantLake(hub, companyId, config.aws)
  const base = `/api/companies/${companyId}/connections`

  /** A Sankhya connection with a copy of these tables. */
  async function copied(tables: readonly Marked[], a: CopyOptions = {}): Promise<ConnectionId> {
    const name = a.name ?? 'Matriz'
    const linked = await linkSankhya(hub, ana, base, sankhya.credential, undefined, name)
    assert.equal(linked.statusCode, 201, linked.body)
    const connection = ConnectionIdSchema.parse(Object(linked.json()).connection.id)
    await hub.test.asOwner(
      `insert into copies.lake_copy (company_id, connector_id, connection_id, interval, start_date, created_at)
       values ($1, 'sankhya', $2, $3, $4, now())`,
      [companyId, connection, a.interval ?? '24h', a.startDate ?? null],
    )
    for (const table of tables) {
      await hub.test.asOwner(
        `insert into copies.lake_table (id, company_id, connection_id, source_table, name, label, columns)
         values (gen_random_uuid(), $1, $2, $3, $4, 'Rótulo', '[]'::jsonb)`,
        [companyId, connection, table.source, table.name],
      )
      if (table.done === true) await finishedOnce(hub, { companyId, connection, name: table.name })
    }
    return connection
  }

  return {
    ...{ hub, aws, runs, queue: runs.queue, ports, companies, companyId, lines, copied, config },
    at: companyScope(companyId),
    fake: { credential: sankhya.credential },
    served: { origin: sankhya.origin },
    /** Rows of the Hub's database, read by its owner. */
    rows: (statement: string, values: unknown[] = []) => hub.test.asOwner(statement, values),
  }
}

export type LakeRunOn = Awaited<ReturnType<typeof lakeRunOn>>

const Sent = z.object({
  clientToken: z.string(),
  startedBy: z.string(),
  overrides: z.object({ cpu: z.string(), memory: z.string(), taskRoleArn: z.string() }),
})

export function queued(answer: StartAnswer): LakeRunId {
  assert.equal(answer.kind, 'QUEUED')
  return answer.run
}

/** The spec the round's parameter holds, as the task reads it. */
export function specOf(on: LakeRunOn, run: string) {
  const value = on.aws.parameter(`/conexus/copia/${on.companyId}/${run}`)
  assert.ok(value !== undefined, 'the round has its parameter')
  return CopyTaskSpec.parse(JSON.parse(value))
}

/** The `RunTask` requests a round sent. */
export function sentOf(on: LakeRunOn, run: string) {
  const found = on.aws.requests().map((text) => Sent.parse(JSON.parse(text)))
  return found.filter((sent) => sent.startedBy === run)
}

export function roundsOf(on: LakeRunOn, connection: string) {
  return on.rows(
    `select id, task_arn, outcome, code from copies.lake_run where connection_id = $1 order by started_at`,
    [connection],
  )
}

/** Closes a round as its task's result would. */
export function completed(on: LakeRunOn, run: LakeRunId) {
  return on.runs.closeLakeRun(on.at, {
    run,
    end: { kind: 'COMPLETE' },
    tables: [],
    cause: 'RESULT',
  })
}

/**
 * The Hub's database whose first command after `arm` resolves only when `release` is called: a
 * start that committed its round and has not yet entered the line.
 */
function heldDatabase(on: LakeRunOn) {
  const database = on.hub.test.database
  let armed = false
  const released = Promise.withResolvers<void>()
  const reaching = Promise.withResolvers<void>()
  const held: Database = {
    ...database,
    async command(scope, work) {
      const done = await database.command(scope, work)
      if (armed) {
        armed = false
        reaching.resolve()
        await released.promise
      }
      return done
    },
  }
  return {
    database: held,
    arm: () => {
      armed = true
    },
    reaching: reaching.promise,
    release: () => released.resolve(),
  }
}

/**
 * A start line of its own over that database, whose `ListTasks` lets the held command go: a second
 * start's sweep reads the round the first committed and asks AWS while the first enters the line.
 */
export function heldStart(t: TestContext, on: LakeRunOn) {
  const held = heldDatabase(on)
  const runs = createLakeRuns({
    ...{ database: held.database, source: on.hub.connectors.copies, copy: on.config.aws.copy },
    ...{ queue: on.ports.queue, log: silent, clock: testClock(), companies: on.companies },
    tasks: {
      ...on.ports.tasks,
      find: (...asked) => {
        held.release()
        return on.ports.tasks.find(...asked)
      },
    },
  })
  t.after(() => runs.queue.stop())
  return { runs, arm: held.arm, reaching: held.reaching }
}
