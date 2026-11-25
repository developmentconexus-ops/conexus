import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DAILY, finished, lakeCopyOn, NOTAS, PARCEIROS } from '../copies/test-lake-copy.ts'
import { call, codeOf, personOn } from '../identity/test-hub.ts'
import {
  createLake,
  deleteLake,
  lakeIn,
  lakeWorld,
  readLake,
  readyLake,
  rowOf,
  stackOf,
} from './test-lake.ts'

function removes(hub: Awaited<ReturnType<typeof lakeWorld>>['hub']) {
  return hub.aws.calls.filter(({ call }) => call === 'remove').length
}

test('lago: apagar pede o nome e leva a linha; criando ou apagando, o lago está ocupado', async (t) => {
  const { hub, ana, a, b } = await lakeWorld(t)
  await readyLake(hub, ana, a)
  const wrong = await deleteLake(hub, ana, a, 'Empresa Teste')
  assert.deepEqual([wrong.statusCode, codeOf(wrong)], [422, 'CLIENT_NAME_MISMATCH'])
  assert.equal(removes(hub), 0)
  const deleting = await deleteLake(hub, ana, a)
  assert.deepEqual([deleting.statusCode, lakeIn(deleting).state], [202, 'DELETING'])
  assert.equal(removes(hub), 1)
  const busy = await deleteLake(hub, ana, a)
  assert.deepEqual([busy.statusCode, codeOf(busy)], [409, 'LAKE_BUSY'])
  hub.aws.finish(stackOf(hub, a), 'DELETE_COMPLETE')
  assert.deepEqual(lakeIn(await readLake(hub, ana, a)), { state: 'NONE' })
  assert.equal(await rowOf(hub, a), undefined)
  await createLake(hub, ana, b)
  const creating = await deleteLake(hub, ana, b)
  assert.deepEqual([creating.statusCode, codeOf(creating)], [409, 'LAKE_BUSY'])
  const none = await deleteLake(hub, ana, a)
  assert.deepEqual([none.statusCode, lakeIn(none)], [202, { state: 'NONE' }])
})

test('lago: o apagar cortado é retomado pela leitura', async (t) => {
  const { hub, ana, a } = await lakeWorld(t)
  await readyLake(hub, ana, a)
  hub.aws.script('remove', 'NO_ANSWER')
  assert.equal(lakeIn(await deleteLake(hub, ana, a)).state, 'DELETING')
  assert.equal(hub.aws.stacks()[0]?.status, 'CREATE_COMPLETE')
  assert.equal(lakeIn(await readLake(hub, ana, a)).state, 'DELETING')
  assert.equal(removes(hub), 2)
  assert.equal(hub.aws.stacks()[0]?.status, 'DELETE_IN_PROGRESS')
})

test('lago: o apagar que falhou se tenta de novo', async (t) => {
  const { hub, ana, a } = await lakeWorld(t)
  await readyLake(hub, ana, a)
  await deleteLake(hub, ana, a)
  hub.aws.finish(stackOf(hub, a), 'DELETE_FAILED')
  assert.equal(lakeIn(await readLake(hub, ana, a)).state, 'DELETE_FAILED')
  assert.equal(lakeIn(await deleteLake(hub, ana, a)).state, 'DELETING')
  assert.equal(removes(hub), 2)
  assert.equal(hub.aws.stacks()[0]?.status, 'DELETE_IN_PROGRESS')
})

test('lago: a pilha apagada por fora sai pelo apagar, qualquer que seja a resposta da AWS', async (t) => {
  const { hub, ana, a, b } = await lakeWorld(t)
  for (const [client, answer] of [
    [a, 'REFUSED'],
    [b, 'NO_ANSWER'],
  ] as const) {
    await readyLake(hub, ana, client)
    hub.aws.finish(stackOf(hub, client), 'DELETE_COMPLETE')
    hub.aws.script('remove', answer)
    const deleting = await deleteLake(hub, ana, client)
    assert.deepEqual([deleting.statusCode, lakeIn(deleting).state], [202, 'DELETING'])
    assert.deepEqual(lakeIn(await readLake(hub, ana, client)), { state: 'NONE' })
  }
})

test('lago: o apagar recusado numa pilha viva vai a não deu para apagar, que se tenta de novo', async (t) => {
  const { hub, ana, a } = await lakeWorld(t)
  await readyLake(hub, ana, a)
  hub.aws.script('remove', 'REFUSED')
  assert.equal(lakeIn(await deleteLake(hub, ana, a)).state, 'DELETING')
  assert.equal((await rowOf(hub, a))?.state, 'delete_failed')
  assert.equal(lakeIn(await readLake(hub, ana, a)).state, 'DELETE_FAILED')
  assert.equal(lakeIn(await deleteLake(hub, ana, a)).state, 'DELETING')
  assert.equal(hub.aws.stacks()[0]?.status, 'DELETE_IN_PROGRESS')
})

const OPERATOR = { name: 'Operadora Teste', email: 'operadora@example.test', role: 'admin' }
const SILENT = { kind: 'NO_ANSWER' } as const

test('o lago com tabela: apaga as tabelas, depois a pilha, e na mesma passada as cópias do lago e os relógios; com a AWS fora, nada sai e repetir termina', async (t) => {
  let down = true
  const on = await lakeCopyOn(t, {
    tables: (real) => ({
      ...real,
      drop: async (...asked) => (down ? SILENT : real.drop(...asked)),
    }),
  })
  const operator = await personOn(on.hub, OPERATOR)
  const [company] = await on.rows('select name from auth.company where id = $1', [on.companyId])
  await on.rows(
    `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
     values ($1, '00000000000001', 'Empresa Teste Ltda', $1, now())`,
    [on.companyId],
  )
  const connection = await on.linked()
  assert.equal((await on.put(connection, { tables: [NOTAS, PARCEIROS], ...DAILY })).statusCode, 200)
  await finished(on, connection, ['sankhya_notas', 'sankhya_parceiros'])
  on.aws.seedTables(
    'raw/sankhya_notas',
    'current/sankhya_notas',
    'raw/sankhya_parceiros',
    'current/sankhya_parceiros',
  )
  const clockId = `schedule_${connection}`
  assert.notEqual(await on.hub.mastra.schedules.get(clockId), null)
  const url = `/api/clients/${on.companyId}/lake`
  const asked = { name: String(company?.name) }

  const refused = await call(on.hub, operator, 'DELETE', url, asked)
  assert.equal(refused.statusCode, 202, refused.body)
  assert.equal(Object(refused.json()).lake.state, 'DELETING')
  assert.equal(on.aws.tables().length, 4, 'AWS out: no table dropped')
  assert.deepEqual(await copiesLeft(on), { copies: 1, tables: 2 }, 'AWS out: the copies stay')
  assert.notEqual(await on.hub.mastra.schedules.get(clockId), null, 'AWS out: the clock stays')
  assert.equal(on.aws.stacks()[0]?.status, 'CREATE_COMPLETE', 'AWS out: the stack is not deleted')

  down = false
  const read = await call(on.hub, operator, 'GET', url)
  assert.equal(read.statusCode, 200)
  assert.deepEqual(on.aws.tables(), [])
  assert.deepEqual(await copiesLeft(on), { copies: 0, tables: 0 })
  assert.equal(await on.hub.mastra.schedules.get(clockId), null, 'the clock left with the lake')
  assert.equal(on.aws.stacks()[0]?.status, 'DELETE_IN_PROGRESS')
  await call(on.hub, operator, 'GET', url)
  const settled = await call(on.hub, operator, 'GET', url)
  assert.deepEqual(Object(settled.json()).lake, { state: 'NONE' })
})

async function copiesLeft(on: Awaited<ReturnType<typeof lakeCopyOn>>) {
  const [row] = await on.rows(
    `select (select count(*) from copies.lake_copy)::int as copies,
            (select count(*) from copies.lake_table)::int as tables`,
  )
  return row
}
