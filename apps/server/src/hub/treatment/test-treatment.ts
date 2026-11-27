import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import {
  ProposedTreatment,
  TreatedTables,
  TreatmentModel,
  TreatmentRunId,
  VersionView,
} from '@conexus/hub-api'
import { z } from 'zod'
import { treatSpecKey } from '../../platform/aws.ts'
import { stateBucketName } from '../../platform/aws-names.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import type { LakeCopyOn } from '../copies/test-lake-copy.ts'
import { DAILY, finished, lakeCopyOn, NOTAS, PARCEIROS } from '../copies/test-lake-copy.ts'
import type { Person } from '../identity/test-hub.ts'
import { call, post } from '../identity/test-hub.ts'
import { TreatTaskResult, TreatTaskSpec } from './treat-task.ts'

/** The inside a close test reaches past the public door (T5): the one close and the task's result. */
export type { TreatmentEnd } from './treatment-rows.ts'
export { closedIn } from './treatment-rows.ts'
export { TreatTaskResult }

const RunRow = z.object({
  id: TreatmentRunId,
  cause: z.string(),
  state: z.string(),
  failure: z.string().nullable(),
  select: z.array(z.string()),
  pending: z.array(z.object({ layer: z.string(), table: z.string() })),
  stopped_by: z.string().nullable(),
  task: z.string().nullable(),
  lake_id: z.string(),
  attempt: z.number(),
})

const VENDEDORES = { source: 'TGFVEN', name: 'sankhya_vendedores' }
export const OF_NOTAS = 'select nunota, codparc from tratado.sankhya_notas'

type Options = Parameters<typeof lakeCopyOn>[1]

/** The treatment runs of a company with one connection: its copies' ends, the runs, their specs and tasks. */
function runsOf(on: LakeCopyOn, connection: string, base: string) {
  /** The connection's copy round ends complete with these tables, and the treatment's start ends. */
  async function copyEnded(names: readonly string[] = ['sankhya_notas', 'sankhya_parceiros']) {
    const [open] = await on.rows(
      `select id from copies.lake_run where connection_id = $1 and ended_at is null`,
      [connection],
    )
    if (open === undefined) assert.equal((await on.run(connection)).statusCode, 202)
    await finished(on, connection, names)
  }
  async function treatRuns() {
    const rows = await on.rows(
      `select id, cause, state, failure, "select", pending, stopped_by, task, lake_id, attempt
       from treatment.run order by started_at, id`,
    )
    return z.array(RunRow).parse(rows)
  }
  /** The run's specification, as the task reads it from the state bucket. */
  function specIn(run: string) {
    const key = `${stateBucketName(on.config.aws.account, on.config.aws.region)}/${treatSpecKey(on.companyId, run, 1)}`
    const text = on.aws.objects().get(key)
    assert.ok(text !== undefined, `the run has its spec at ${key}`)
    return TreatTaskSpec.parse(JSON.parse(text))
  }
  /** A POST with no body, as the screen sends Tratar agora and Parar. */
  function bare(url: string, who: Person = on.ana) {
    return on.hub.app.inject({
      method: 'POST',
      url,
      headers: { origin: TEST_ORIGIN, cookie: who.cookie },
    })
  }
  function treatNow(who?: Person) {
    return bare(`${base}/run`, who)
  }
  function stopRun(who?: Person) {
    return bare(`${base}/run/stop`, who)
  }
  function taskOf(run: string) {
    const task = on.aws.tasks().find(({ startedBy }) => startedBy === run)
    assert.ok(task !== undefined, 'the run has its task')
    return task
  }
  return { copyEnded, treatRuns, specIn, taskOf, bare, treatNow, stopRun }
}

export async function treatmentOn(t: TestContext, options: Options = {}) {
  const on = await lakeCopyOn(t, options)
  const connection = await on.linked()
  const marked = await on.put(connection, { tables: [NOTAS, PARCEIROS, VENDEDORES], ...DAILY })
  assert.equal(marked.statusCode, 200, marked.body)
  await on.hub.lakeRuns.idle()
  const base = `/api/companies/${on.companyId}/data/treated`
  const models = `${base}/models`
  function propose(sql: string, name = 'venda', who: Person = on.ana, description = 'Vendas') {
    return post(on.hub, who, models, { name, description, sql })
  }
  async function proposed(sql: string, name = 'venda') {
    const response = await propose(sql, name)
    assert.equal(response.statusCode, 201, response.body)
    return ProposedTreatment.parse(response.json())
  }
  function change(id: string, sql: string, who: Person = on.ana, description = 'Vendas') {
    return post(on.hub, who, `${models}/${id}/versions`, { sql, description })
  }
  async function changed(id: string, sql: string, description?: string) {
    const response = await change(id, sql, on.ana, description)
    assert.equal(response.statusCode, 201, response.body)
    return VersionView.parse(response.json())
  }
  function approve(id: string, number: number, hash: string, who: Person = on.ana) {
    return post(on.hub, who, `${models}/${id}/versions/${number}/approve`, { hash })
  }
  async function approved(id: string, version: { number: number; hash: string }, who?: Person) {
    const response = await approve(id, version.number, version.hash, who)
    assert.equal(response.statusCode, 200, response.body)
    return VersionView.parse(response.json())
  }
  async function listed(who: Person = on.ana) {
    const response = await call(on.hub, who, 'GET', base)
    assert.equal(response.statusCode, 200, response.body)
    return TreatedTables.parse(response.json())
  }
  async function read(id: string) {
    const response = await call(on.hub, on.ana, 'GET', `${models}/${id}`)
    assert.equal(response.statusCode, 200, response.body)
    return TreatmentModel.parse(response.json())
  }
  function saved() {
    return on.rows(
      `select (select count(*)::int from treatment.model) as models,
              (select count(*)::int from treatment.version) as versions,
              (select count(*)::int from treatment.run) as runs`,
    )
  }
  const runs = runsOf(on, connection, base)
  return {
    ...on,
    ...{ base, models, propose, proposed, change, changed, approve, approved, listed, read, saved },
    ...{ connection, ...runs },
  }
}

export type TreatmentOn = Awaited<ReturnType<typeof treatmentOn>>

/** The message a treatment task sends at its end, read by the contract before it is sent. */
export function treatResult(
  run: string,
  models: object[],
  outcome: object = { kind: 'COMPLETE' },
  attempt = 1,
) {
  const sent = { type: 'TREAT_RESULT', version: 1, runId: run, attempt, outcome, models }
  return JSON.stringify(TreatTaskResult.parse(sent))
}

export function built(name: string, rows = 3) {
  return { name, status: 'BUILT', rows }
}

export function tableOf(view: TreatedTables, layer: 'tratado' | 'negocio', name: string) {
  const table = view.tables.find((each) => each.layer === layer && each.name === name)
  assert.ok(table !== undefined, `${layer}.${name}`)
  return table
}

export function refusalOf(response: { statusCode: number; json(): unknown }) {
  const { code, table, position } = Object(response.json())
  return { status: response.statusCode, code, table, position }
}
