import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import type { ConnectionId, LakeRunMachine } from '@conexus/hub-api'
import {
  CompanyId as CompanyIdSchema,
  ConnectionId as ConnectionIdSchema,
  LakeRunId,
  LakeTableName,
  LakeTablesOfConnection,
} from '@conexus/hub-api'
import type { CopyTasks, LakeStacks, LakeTables, Where } from '../../platform/aws.ts'
import { createAws, LakeId } from '../../platform/aws.ts'
import { testAws } from '../../platform/test-aws.ts'
import { awsServer } from '../../platform/test-aws-server.ts'
import { silent } from '../../platform/test-database.ts'
import { linkSankhya } from '../connectors/test-connections.ts'
import { sankhyaFake } from '../connectors/test-copy-source.ts'
import type { Person } from '../identity/test-hub.ts'
import {
  ANA_OWNER,
  call,
  hubWithLog,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../identity/test-hub.ts'
import { companyScope } from './lake-close.ts'
import type { StartClock } from './public.ts'
import { CopyTaskSpec } from './public.ts'
import { TEST_LAKE } from './test-lake-run.ts'

type Options = {
  /** The Hub's clock, for "today" in the date's check. */
  now?: Date
  /** The stack port the Hub reads the lake with, given the real one on the double. */
  stacks?: (real: LakeStacks) => LakeStacks
  /** The tables port the Hub drops with, given the real one on the double. */
  tables?: (real: LakeTables) => LakeTables
  /** The tasks port the Hub stops with, given the real one on the double. */
  tasks?: (real: CopyTasks) => CopyTasks
  /** A company with no lake row. */
  noLake?: boolean
  /** The clock a disconnection waits for its task's stop on. */
  stopWait?: StartClock
}

type Double = Awaited<ReturnType<typeof awsServer>>

function hubOf(t: TestContext, doubles: { aws: Double; origin: string }, options: Options) {
  const { now } = options
  return hubWithLog(
    t,
    (config) => ({
      ...config,
      connectorOrigins: new Map([['sankhya', doubles.origin]]),
      aws: testAws(doubles.aws.endpoint.href, doubles.aws.credentialsFile),
    }),
    {
      ...(now === undefined ? {} : { now: () => now }),
      outside: (config, log) => {
        const real = createAws({ config, log })
        return {
          lakeStacks: options.stacks?.(real.stacks) ?? real.stacks,
          copyTasks: options.tasks?.(real.tasks) ?? real.tasks,
          copyQueue: real.queue,
          lakeTables: options.tables?.(real.tables) ?? real.tables,
          ...(options.stopWait === undefined ? {} : { copyStopWait: options.stopWait }),
        }
      },
    },
  )
}

type Hub = Awaited<ReturnType<typeof hubOf>>

async function plantLake(hub: Hub, where: Where) {
  const real = createAws({ config: hub.config, log: silent })
  const created = await real.stacks.create(where, {
    id: LakeId.parse(TEST_LAKE),
    template: hub.config.aws.templateVersion,
  })
  assert.equal(created.kind, 'DONE')
  if (created.kind !== 'DONE') return undefined
  for (let read = 0; read < 2; read += 1) await real.stacks.status(where, created.value)
  const { account, region, templateVersion } = hub.config.aws
  await hub.test.asOwner(
    `insert into lake.company_lake (company_id, lake_id, state, account, region, template, stack_id, since)
     values ($1, $2, 'ready', $3, $4, $5, $6, now())`,
    [where.company, TEST_LAKE, account, region, templateVersion, created.value],
  )
  return { stack: created.value, stacks: real.stacks }
}

function urlsOf(base: string, connection: string) {
  return {
    list: `${base}/${connection}/lake-tables`,
    copy: `${base}/${connection}/lake-copy`,
    run: `${base}/${connection}/lake-copy/run`,
  }
}

/**
 * Empresa Teste on a Hub whose Sankhya is the kit's double and whose AWS is the double of recorded
 * answers (T29), its lake ready with a stack the double holds; the copy's routes of a connection
 * called as a person does.
 */
export async function lakeCopyOn(t: TestContext, options: Options = {}) {
  const aws = await awsServer(t)
  const fake = sankhyaFake()
  const served = await fake.serve()
  t.after(() => served.close())
  const hub = await hubOf(t, { aws, origin: served.origin }, options)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = CompanyIdSchema.parse(await plantCompany(hub.test, ana.id))
  const { config } = hub
  const where = { company: companyId, account: config.aws.account, region: config.aws.region }
  const lake = options.noLake === true ? undefined : await plantLake(hub, where)
  const base = `/api/companies/${companyId}/connections`

  /** A Sankhya connection, named, with no copy. */
  async function linked(name = 'Matriz'): Promise<ConnectionId> {
    const made = await linkSankhya(hub, ana, base, fake.credential, undefined, name)
    assert.equal(made.statusCode, 201, made.body)
    return ConnectionIdSchema.parse(Object(made.json()).connection.id)
  }
  return {
    ...{ hub, aws, ana, companyId, config, linked, base, where },
    ...{ stack: lake?.stack, stacks: lake?.stacks },
    fake,
    served,
    at: companyScope(companyId),
    /** Another member of the company, at a role. */
    member: (name: string, role: string) =>
      memberOn(hub, companyId, { name, email: `${name.toLowerCase()}@example.test` }, role),
    get: (connection: string, who: Person = ana) =>
      call(hub, who, 'GET', urlsOf(base, connection).list),
    put: (connection: string, body: object, who: Person = ana) =>
      call(hub, who, 'PUT', urlsOf(base, connection).copy, body),
    run: (connection: string, body: object = {}, who: Person = ana) =>
      post(hub, who, urlsOf(base, connection).run, body),
    rows: (statement: string, values: unknown[] = []) => hub.test.asOwner(statement, values),
    /** The answer, parsed as the contract states it. */
    viewOf: (response: { statusCode: number; body: string; json(): unknown }) => {
      assert.equal(response.statusCode, 200, response.body)
      return LakeTablesOfConnection.parse(response.json())
    },
  }
}

export type LakeCopyOn = Awaited<ReturnType<typeof lakeCopyOn>>

export const NOTAS = { source: 'TGFCAB', name: 'sankhya_notas' }
export const PARCEIROS = { source: 'TGFPAR', name: 'sankhya_parceiros' }
export const PRODUTOS = { source: 'TGFPRO', name: 'sankhya_produtos' }
export const DAILY = { interval: '24h', startDate: null }

export function runsOf(on: LakeCopyOn, connection: string) {
  return on.rows(
    `select id, whole, task_arn from copies.lake_run where connection_id = $1 order by started_at`,
    [connection],
  )
}

export function specOf(on: LakeCopyOn, run: unknown) {
  const value = on.aws.parameter(`/conexus/copia/${on.companyId}/${String(run)}`)
  assert.ok(value !== undefined, 'the round has its parameter')
  return CopyTaskSpec.parse(JSON.parse(value))
}

export function wholeOf(on: LakeCopyOn, run: unknown) {
  return Object.fromEntries(specOf(on, run).tables.map((table) => [table.name, table.whole]))
}

export async function counts(on: LakeCopyOn) {
  const [row] = await on.rows(
    `select (select count(*) from copies.lake_copy)::int as copies,
            (select count(*) from copies.lake_table)::int as tables,
            (select count(*) from copies.lake_run)::int as runs`,
  )
  return { ...row, parameters: on.aws.parameters().length }
}

/** The one round of a connection, closed as the task's result would, so its tables are no first load. */
export async function finished(
  on: LakeCopyOn,
  connection: string,
  names: readonly string[],
  machine?: LakeRunMachine,
) {
  await on.hub.lakeRuns.idle()
  const [run] = (await runsOf(on, connection)).slice(-1)
  assert.ok(run !== undefined)
  await on.hub.lakeRuns.closeLakeRun(on.at, {
    run: LakeRunId.parse(run.id),
    end: { kind: 'COMPLETE' },
    tables: names.map((name) => ({
      name: LakeTableName.parse(name),
      read: 3,
      written: 3,
      rows: 3,
      whole: true,
    })),
    cause: 'RESULT',
    machine,
  })
}
