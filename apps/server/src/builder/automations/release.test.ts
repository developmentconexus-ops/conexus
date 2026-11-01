import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import {
  CARLA,
  call,
  codeOf,
  memberOn,
  personOn,
  plantCompany,
} from '../../hub/identity/test-hub.ts'
import { holding } from '../conversation/test-conversation.ts'
import { AUTOMATION_WORKFLOW } from './public.ts'
import {
  answering,
  automating,
  conversing,
  created,
  ended,
  ranNow,
  salesSummary,
} from './test-automations.ts'

/** Whether the automation still has its schedule row, and how many runs of it are kept. */
async function keptOf(hub: Hub, automationId: string) {
  const rows = await hub.test.mastraPool.query(
    'select count(*)::int as n from mastra.mastra_schedules where id = $1',
    [automationId],
  )
  const runs = await hub.test.mastraPool.query(
    `select count(*)::int as n from mastra.mastra_workflow_snapshot
      where workflow_name = $1 and snapshot::text like $2`,
    [AUTOMATION_WORKFLOW, `%${automationId}%`],
  )
  return { row: rows.rows[0]?.n === 1, runs: Number(runs.rows[0]?.n) }
}

/** Ana's and Carla's automations, on the Início and in the Projeto, each run once, and one of Carla in another company. */
async function spread(t: TestContext) {
  const on = await automating(t)
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const inProject = salesSummary([], { projectId: on.projectId })
  async function ranOnce(person: Person, url: string, body: object) {
    const automation = await created(on.hub, person, url, body)
    const at = `${url}/${automation.id}`
    await ended(on.hub, person, at, await ranNow(on.hub, person, at))
    return automation.id
  }
  const elsewhere = await plantCompany(on.hub.test, carla.id, 'Outra Empresa')
  const ids = {
    anaHome: await ranOnce(on.ana, on.automations, salesSummary([])),
    anaProject: await ranOnce(on.ana, on.automations, inProject),
    carlaHome: await ranOnce(carla, on.automations, salesSummary([])),
    carlaProject: await ranOnce(carla, on.automations, inProject),
    elsewhere: (
      await created(on.hub, carla, `/api/companies/${elsewhere}/automations`, salesSummary([]))
    ).id,
  }
  async function left() {
    const entries = await Promise.all(
      Object.entries(ids).map(async ([name, id]) => [name, (await keptOf(on.hub, id)).row]),
    )
    return Object.fromEntries(entries)
  }
  async function noRunsOfGone() {
    for (const [name, id] of Object.entries(ids)) {
      const kept = await keptOf(on.hub, id)
      if (!kept.row) assert.equal(kept.runs, 0, `the runs of ${name} left with it`)
    }
  }
  function automationsFirst() {
    function at(message: string) {
      return on.lines.findIndex((line) => line.message === message)
    }
    assert.ok(at('AUTOMATIONS_RELEASED') >= 0, 'the automations were released')
    assert.ok(at('AUTOMATIONS_RELEASED') < at('ASSISTANT_CONVERSATIONS_RELEASED'))
  }
  return { ...on, carla, ids, left, noRunsOfGone, automationsFirst }
}

test('tirar uma pessoa apaga as automações dela e os runs delas, antes das conversas, e nenhuma outra', async (t) => {
  const on = await spread(t)
  assert.equal((await keptOf(on.hub, on.ids.carlaHome)).runs, 1)
  const removed = await call(on.hub, on.ana, 'DELETE', `${on.company}/members/${on.carla.id}`)
  assert.equal(removed.statusCode, 204, removed.body)
  assert.deepEqual(await on.left(), {
    anaHome: true,
    anaProject: true,
    carlaHome: false,
    carlaProject: false,
    elsewhere: true,
  })
  await on.noRunsOfGone()
  on.automationsFirst()
})

test('remover a empresa apaga as automações de todas as pessoas dela, e nenhuma de outra empresa', async (t) => {
  const on = await spread(t)
  const operator = await personOn(on.hub, {
    name: 'Olga Souza',
    email: 'olga@example.test',
    role: 'admin',
  })
  await on.hub.test.asOwner(
    `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
     values ($1, '00000000000001', 'Empresa Teste Ltda', $1, now())`,
    [on.companyId],
  )
  const body = { name: 'Empresa Teste', revision: 0 }
  const deleted = await call(on.hub, operator, 'DELETE', `/api/clients/${on.companyId}`, body)
  assert.equal(deleted.statusCode, 204, deleted.body)
  assert.deepEqual(await on.left(), {
    anaHome: false,
    anaProject: false,
    carlaHome: false,
    carlaProject: false,
    elsewhere: true,
  })
  await on.noRunsOfGone()
  on.automationsFirst()
})

test('o Projeto: apagá-lo apaga as automações presas a ele; a agenda fora deixa o Projeto marcado, e a repetição acha as que sobraram', async (t) => {
  const on = await spread(t)
  const project = `${on.company}/projects/${on.projectId}`
  await on.hub.test.mastraPool.query(
    'alter table mastra.mastra_schedules rename to mastra_schedules_out',
  )
  const pending = await call(on.hub, on.ana, 'DELETE', project, { name: 'Encomendas' })
  assert.deepEqual([pending.statusCode, codeOf(pending)], [503, 'PROJECT_DELETION_PENDING'])
  await on.hub.test.mastraPool.query(
    'alter table mastra.mastra_schedules_out rename to mastra_schedules',
  )
  assert.ok((await keptOf(on.hub, on.ids.anaProject)).row)

  const resumed = await call(on.hub, on.ana, 'DELETE', project, { name: 'Encomendas' })
  assert.equal(resumed.statusCode, 204, resumed.body)
  assert.deepEqual(await on.left(), {
    anaHome: true,
    anaProject: false,
    carlaHome: true,
    carlaProject: false,
    elsewhere: true,
  })
  await on.noRunsOfGone()
  on.automationsFirst()
})

/** Mastra's schedule delete, made to fail as a database that went away would. */
function refusingDelete(t: TestContext, hub: Hub) {
  const refused = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' })
  return t.mock.method(hub.mastra.schedules, 'delete', () => Promise.reject(refused))
}

test('apagar: o banco que falha entre os runs e a linha deixa a linha, a repetição a acha, e os runs de outra automação ficam', async (t) => {
  const on = await spread(t)
  const url = `${on.automations}/${on.ids.anaHome}`
  const refusing = refusingDelete(t, on.hub)
  const failed = await call(on.hub, on.ana, 'DELETE', url)
  assert.deepEqual([failed.statusCode, codeOf(failed)], [503, 'DATABASE_UNAVAILABLE'])
  assert.deepEqual(await keptOf(on.hub, on.ids.anaHome), { row: true, runs: 0 })
  refusing.mock.restore()
  const repeated = await call(on.hub, on.ana, 'DELETE', url)
  assert.equal(repeated.statusCode, 204, repeated.body)
  assert.deepEqual(await keptOf(on.hub, on.ids.anaHome), { row: false, runs: 0 })
  const sibling = await keptOf(on.hub, on.ids.anaProject)
  assert.ok(sibling.row && sibling.runs > 0, 'the other automation of the person kept its runs')
})

test('o Projeto: o banco que falha entre os runs e a linha deixa a automação, e a repetição a acha', async (t) => {
  const on = await spread(t)
  const project = `${on.company}/projects/${on.projectId}`
  const refusing = refusingDelete(t, on.hub)
  const pending = await call(on.hub, on.ana, 'DELETE', project, { name: 'Encomendas' })
  assert.deepEqual([pending.statusCode, codeOf(pending)], [503, 'PROJECT_DELETION_PENDING'])
  const stopped = await Promise.all(
    [on.ids.anaProject, on.ids.carlaProject].map((id) => keptOf(on.hub, id)),
  )
  assert.ok(
    stopped.every((each) => each.row),
    'the rows stay',
  )
  assert.ok(
    stopped.some((each) => each.runs === 0),
    'the runs went first',
  )
  refusing.mock.restore()
  const resumed = await call(on.hub, on.ana, 'DELETE', project, { name: 'Encomendas' })
  assert.equal(resumed.statusCode, 204, resumed.body)
  await on.noRunsOfGone()
  assert.deepEqual((await on.left()).anaProject, false)
})

test('tirar a pessoa no meio do turno da execução: a conversa apagada termina o turno INTERRUPTED, sem esperar o orçamento', {
  timeout: 150_000,
}, async (t) => {
  const held = holding(t)
  const on = await automating(t, answering([held.reply]))
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const automation = await created(on.hub, carla, on.automations, salesSummary([]))
  const url = `${on.automations}/${automation.id}`
  const runId = await ranNow(on.hub, carla, url)
  await conversing(on.hub, carla, url, runId)
  while (on.calls.length < 1) await sleep(50)
  const removed = await call(on.hub, on.ana, 'DELETE', `${on.company}/members/${carla.id}`)
  assert.equal(removed.statusCode, 204, removed.body)
  // The turn's budget is a minute; the deleted conversation must end it long before.
  const deadline = Date.now() + 15_000
  function failed() {
    return on.lines.find((line) => line.message === 'AUTOMATION_RUN_FAILED')
  }
  while (failed() === undefined && Date.now() < deadline) await sleep(100)
  assert.equal(failed()?.fields.code, 'INTERRUPTED')
})
