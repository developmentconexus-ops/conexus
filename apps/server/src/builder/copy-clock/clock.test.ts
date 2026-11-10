import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { CopyRun } from '@conexus/hub-api'
import type { CopiesOn } from '../../hub/copies/test-copies.ts'
import { copiesOn, holdPage, plantCopy } from '../../hub/copies/test-copies.ts'
import { copiesUrl, enabled, runsPage } from '../../hub/copies/test-routes.ts'
import { call, codeOf, personOn, post } from '../../hub/identity/test-hub.ts'
import { COPY_WORKFLOW } from './public.ts'

/** A scheduler that ticks fast enough for a test to wait for a fire it made due (T20). */
const TICK_MS = 200
const DEADLINE_MS = 60_000

/** The copy's runs, once `done` holds of them: polled, never a fixed wait. */
async function runsWhen(on: CopiesOn, copyId: string, done: (runs: CopyRun[]) => boolean) {
  const deadline = Date.now() + DEADLINE_MS
  for (;;) {
    const { runs } = await runsPage(on, on.ana, copyId)
    if (done(runs)) return runs
    if (Date.now() > deadline) throw new Error(`the runs of ${copyId} never reached the state`)
    await sleep(50)
  }
}

function ended(runs: CopyRun[]) {
  return runs.filter((run) => run.outcome.kind !== 'RUNNING')
}

/** A copy turned on, and its first run, which `enable` asked for, ended. */
async function started(on: CopiesOn, model: string) {
  const copy = await enabled(on, model)
  await runsWhen(on, copy.id, (runs) => ended(runs).length === 1)
  return copy
}

test('rodar agora e o disparo', { timeout: 120_000 }, async (t) => {
  const on = await copiesOn(t, undefined, TICK_MS)
  const { hub } = on
  const copy = await started(on, 'clientes')
  const url = `${copiesUrl(on)}/${copy.id}`

  // Rodar agora: 202 now, the run is the workflow's; a run holding the lease refuses the next.
  const held = holdPage(on)
  const asked = await post(hub, on.ana, `${url}/run`, {})
  assert.deepEqual([asked.statusCode, asked.json()], [202, {}])
  await held.arrived
  const running = await runsWhen(on, copy.id, (runs) =>
    runs.some((run) => run.outcome.kind === 'RUNNING'),
  )
  assert.equal(running.filter((run) => run.outcome.kind === 'RUNNING').length, 1)
  const refused = await post(hub, on.ana, `${url}/run`, {})
  assert.deepEqual([refused.statusCode, codeOf(refused)], [409, 'COPY_RUNNING'])
  held.release()
  await runsWhen(on, copy.id, (runs) => ended(runs).length === 2)

  // A schedule whose next time passed: the scheduler's next tick fires it, with no wait for the clock.
  const store = await hub.mastra.getStorage()?.getStore('schedules')
  assert.ok(store)
  await store.updateSchedule(`schedule_${copy.id}`, { nextFireAt: Date.now() - 3 * 86_400_000 })
  hub.mastra.scheduler?.wake()
  await runsWhen(on, copy.id, (runs) => ended(runs).length === 3)

  // The Hub stopping: the scheduler stops, and a run is refused.
  await hub.settle(AbortSignal.timeout(10_000))
  const updating = await post(hub, on.ana, `${url}/run`, {})
  assert.deepEqual([updating.statusCode, codeOf(updating)], [503, 'HUB_UPDATING'])
})

test('a órfã não recomeça sozinha', { timeout: 120_000 }, async (t) => {
  const on = await copiesOn(t, undefined, TICK_MS)
  const { hub, gate } = on
  const copy = await started(on, 'clientes')
  const url = `${copiesUrl(on)}/${copy.id}`

  const held = holdPage(on)
  assert.equal((await post(hub, on.ana, `${url}/run`, {})).statusCode, 202)
  await held.arrived
  const workflow = hub.mastra.getWorkflow(COPY_WORKFLOW)
  assert.equal((await workflow.listActiveWorkflowRuns()).total, 1, 'the run is open')
  const swept = await hub.mastra.listActiveWorkflowRuns()
  assert.equal(
    swept.runs.filter((run) => run.workflowName === COPY_WORKFLOW).length,
    0,
    'the start-up sweep does not take it',
  )

  // The Hub died with the run open: its lease ran out, and the sweep of the next start finds nothing to restart.
  await plantCopy(on, copy.id, "claimed_until = now() - interval '1 minute'")
  const pages = gate.pages
  await hub.mastra.restartAllActiveWorkflowRuns()
  await sleep(500)
  assert.equal(gate.pages, pages, 'nothing read again')

  // The next run closes the orphan INTERRUPTED and finishes the pass.
  assert.equal((await post(hub, on.ana, `${url}/run`, {})).statusCode, 202)
  const runs = await runsWhen(
    on,
    copy.id,
    (all) =>
      all.some((run) => run.outcome.kind === 'INTERRUPTED') &&
      ended(all).filter((run) => run.outcome.kind === 'COMPLETE').length === 2,
  )
  assert.equal(runs.filter((run) => run.outcome.kind === 'INTERRUPTED').length, 1)
  held.release()
})

/** The Central's operator and the company's client row, which its deletion asks for. */
async function operatorOf(on: CopiesOn) {
  await on.hub.test.asOwner(
    `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
     values ($1, '00000000000001', 'Empresa A Ltda', $1, now())`,
    [on.companyId],
  )
  return personOn(on.hub, { name: 'Olga Souza', email: 'olga@example.test', role: 'admin' })
}

async function copyRows(on: CopiesOn) {
  const [row] = await on.hub.test.asOwner(
    'select count(*)::int as n from copies.copy where company_id = $1',
    [on.companyId],
  )
  return Number(Object(row).n)
}

test('a empresa apagada leva as agendas', { timeout: 120_000 }, async (t) => {
  const on = await copiesOn(t, undefined, TICK_MS)
  const { hub, companyId } = on
  await started(on, 'clientes')
  await started(on, 'produtos')
  function schedules() {
    return hub.mastra.schedules.list({ workflowId: COPY_WORKFLOW })
  }
  assert.equal((await schedules()).length, 2)

  // A Projeto removed leaves the company's copies, and their schedules, alone.
  const project = `/api/companies/${companyId}/projects/${on.projectId}`
  assert.equal((await call(hub, on.ana, 'DELETE', project, { name: 'Pedidos' })).statusCode, 204)
  assert.equal((await schedules()).length, 2)

  // The schedules go before the rows: one that cannot be deleted keeps the company and its copies.
  const operator = await operatorOf(on)
  const url = `/api/clients/${companyId}`
  const body = { name: 'Empresa A', revision: 0 }
  const refused = Object.assign(new Error('DELETE SCHEDULE FAILED'), {
    ...{ domain: 'STORAGE', category: 'THIRD_PARTY' },
  })
  const failing = t.mock.method(hub.mastra.schedules, 'delete', () => Promise.reject(refused))
  const pending = await call(hub, operator, 'DELETE', url, body)
  assert.deepEqual([pending.statusCode, codeOf(pending)], [503, 'CLIENT_DELETION_PENDING'])
  assert.equal(await copyRows(on), 2, 'the rows wait for the schedules')
  failing.mock.restore()

  const deleted = await call(hub, operator, 'DELETE', url, body)
  assert.equal(deleted.statusCode, 204, deleted.body)
  assert.deepEqual(await schedules(), [])
  assert.equal(await copyRows(on), 0)
})
