import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { queued, whenIdle, withOwnerLock } from '../../platform/test-database.ts'
import { ANA_OWNER, hubWithLog, personOn, plantCompany } from '../identity/test-hub.ts'

/**
 * A company whose ready database the Hub recorded as a Neon project of the old name, as every
 * company created before decision 0048 has it.
 */
async function companyOfOldName(hub: Awaited<ReturnType<typeof hubWithLog>>, name: string) {
  const ana = await personOn(hub, { ...ANA_OWNER, email: `${name}@example.test` })
  const companyId = await plantCompany(hub.test, ana.id, name, name)
  const neonProjectId = hub.neon.plant(`cx-${companyId}`)
  await hub.test.asOwner(
    `insert into projects.company_database (company_id, state, neon_project_id)
      values ($1, 'ready', $2)`,
    [companyId, neonProjectId],
  )
  return { companyId, neonProjectId }
}

async function world(t: TestContext) {
  const hub = await hubWithLog(t)
  const a = await companyOfOldName(hub, 'empresa-a')
  const b = await companyOfOldName(hub, 'empresa-b')
  return { hub, a, b }
}

function logged(hub: Awaited<ReturnType<typeof hubWithLog>>, message: string) {
  return hub.lines.filter((line) => line.message === message).map((line) => line.fields)
}

test('nomes: ao subir, o projeto que o Hub registrou com nome velho sai <apelido>-<id>; a segunda partida não renomeia', async (t) => {
  const { hub, a, b } = await world(t)
  await hub.projects.nameDatabases()
  // The pass runs alone at start; after it no connection stays, so the database can sleep (D27).
  await whenIdle(hub.test.database)
  assert.deepEqual(
    hub.neon
      .projects()
      .map((found) => found.name)
      .sort(),
    [`empresa-a-${a.companyId}`, `empresa-b-${b.companyId}`],
  )
  assert.deepEqual(
    logged(hub, 'COMPANY_DATABASE_RENAMED').sort((x, y) =>
      String(x.companyId).localeCompare(String(y.companyId)),
    ),
    [a, b]
      .map(({ companyId, neonProjectId }) => ({ companyId, neonProjectId }))
      .sort((x, y) => x.companyId.localeCompare(y.companyId)),
  )
  hub.neon.calls.length = 0
  await hub.projects.nameDatabases()
  assert.deepEqual(hub.neon.calls, ['list'])
})

test('nomes: projeto sem empresa, ou da empresa e não registrado pelo Hub, fica como está', async (t) => {
  const { hub, a } = await world(t)
  const strangers = [`cx-${'z'.repeat(32)}`, `cx-${a.companyId}`, 'sem-final', `${a.companyId}-x`]
  for (const name of strangers) hub.neon.plant(name)
  await hub.projects.nameDatabases()
  const names = hub.neon.projects().map((found) => found.name)
  for (const name of strangers) assert.ok(names.includes(name), name)
  assert.ok(names.includes(`empresa-a-${a.companyId}`))
  assert.equal(hub.neon.calls.filter((call) => call === 'rename').length, 2)
})

test('nomes: Neon fora ao listar, a passada termina e registra; uma empresa recusada não para a outra', async (t) => {
  const { hub, a, b } = await world(t)
  hub.neon.script('list', 'NO_ANSWER')
  await hub.projects.nameDatabases()
  assert.deepEqual(logged(hub, 'COMPANY_DATABASE_RENAME_FAILED'), [{ reason: 'NO_ANSWER' }])
  assert.equal(hub.neon.calls.includes('rename'), false)
  hub.lines.length = 0
  hub.neon.script('rename', 'REFUSED')
  await hub.projects.nameDatabases()
  const [failed] = logged(hub, 'COMPANY_DATABASE_RENAME_FAILED')
  assert.equal(failed?.reason, 'REFUSED')
  const renamed = logged(hub, 'COMPANY_DATABASE_RENAMED').map((fields) => fields.companyId)
  assert.deepEqual([failed?.companyId, ...renamed].sort(), [a.companyId, b.companyId].sort())
  await hub.projects.nameDatabases()
  assert.deepEqual(
    hub.neon
      .projects()
      .map((found) => found.name)
      .sort(),
    [`empresa-a-${a.companyId}`, `empresa-b-${b.companyId}`],
  )
})

// The company's database is held, so the pass waits after Neon listed the project and before it
// renames it, and the company's deletion takes the project in between.
test('nomes: o projeto que sai do Neon no meio da passada não é renomeado nem registrado', async (t) => {
  const hub = await hubWithLog(t)
  const a = await companyOfOldName(hub, 'empresa-a')
  const hold = 'lock table projects.company_database in access exclusive mode'
  await withOwnerLock(hub.test, hold, [], async (release) => {
    const pass = hub.projects.nameDatabases()
    await queued(hub.test, 1, pass)
    assert.equal((await hub.neon.neon.delete(a.neonProjectId)).kind, 'DONE')
    await release()
    await pass
  })
  assert.deepEqual(hub.neon.projects(), [])
  assert.deepEqual(logged(hub, 'COMPANY_DATABASE_RENAMED'), [])
  assert.deepEqual(logged(hub, 'COMPANY_DATABASE_RENAME_FAILED'), [])
})
