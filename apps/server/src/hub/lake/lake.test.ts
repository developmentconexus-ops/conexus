import assert from 'node:assert/strict'
import { test } from 'node:test'
import { queued, withOwnerLock } from '../../platform/test-database.ts'
import { CARLA, codeOf, personOn } from '../identity/test-hub.ts'
import {
  createLake,
  deleteLake,
  lakeIn,
  lakeLines,
  lakeWorld,
  plantLeftover,
  readLake,
  readyLake,
  rowOf,
  stackOf,
} from './test-lake.ts'

const LAKE_ID = /^[a-z0-9]{12}$/

test('lago: o operador cria; o dono recebe não encontrado', async (t) => {
  const { hub, ana, davi, a } = await lakeWorld(t)
  const created = await createLake(hub, ana, a)
  assert.equal(created.statusCode, 202)
  assert.equal(lakeIn(created).state, 'CREATING')
  const row = await rowOf(hub, a)
  assert.match(String(row?.lake_id), LAKE_ID)
  assert.deepEqual(
    hub.aws.calls.map(({ call, company }) => [call, company]),
    [['create', a.companyId]],
  )
  for (const refused of [
    await createLake(hub, davi, a),
    await readLake(hub, davi, a),
    await deleteLake(hub, davi, a),
  ]) {
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  }
  assert.equal(hub.aws.calls.length, 1)
})

// The company is held, so the two clicks queue on its lock and neither reaches AWS before it is let
// go; then one creates the row and the other finds it (the failure table, criterion 41).
test('lago: dois cliques criam um lago', async (t) => {
  const { hub, ana, a } = await lakeWorld(t)
  const carla = await personOn(hub, { ...CARLA, role: 'admin' })
  const lockCompany = 'select id from auth.company where id = $1 for update'
  const [first, second] = await withOwnerLock(
    hub.test,
    lockCompany,
    [a.companyId],
    async (release) => {
      const one = createLake(hub, ana, a)
      await queued(hub.test, 1, one)
      const two = createLake(hub, carla, a)
      await queued(hub.test, 2, two)
      assert.equal(hub.aws.calls.length, 0)
      await release()
      return Promise.all([one, two])
    },
  )
  assert.deepEqual([first?.statusCode, second?.statusCode], [202, 202])
  assert.deepEqual(lakeIn(first), lakeIn(second))
  assert.equal(hub.aws.calls.filter(({ call }) => call === 'create').length, 1)
  assert.equal(hub.aws.stacks().length, 1)
})

test('lago: a leitura acerta a linha e para de perguntar', async (t) => {
  const { hub, ana, a } = await lakeWorld(t)
  await createLake(hub, ana, a)
  assert.equal(lakeIn(await readLake(hub, ana, a)).state, 'CREATING')
  hub.aws.finish(stackOf(hub, a), 'CREATE_COMPLETE')
  const ready = lakeIn(await readLake(hub, ana, a))
  const row = await rowOf(hub, a)
  assert.deepEqual(
    { ...ready, readyAt: undefined },
    {
      state: 'READY',
      bucket: `conexus-${row?.lake_id}`,
      region: 'us-east-2',
      readyAt: undefined,
      outdated: false,
    },
  )
  assert.ok(!Number.isNaN(Date.parse(ready.readyAt)))
  const asked = hub.aws.calls.length
  assert.deepEqual(lakeIn(await readLake(hub, ana, a)), ready)
  assert.equal(hub.aws.calls.length, asked)
  assert.deepEqual(lakeLines(hub, 'LAKE_READY'), [{ companyId: a.companyId, lakeId: row?.lake_id }])
})

test('lago: o de uma receita anterior à desta imagem diz que está antigo', async (t) => {
  const { hub, ana, a } = await lakeWorld(t)
  await readyLake(hub, ana, a)
  await hub.test.asOwner('update lake.company_lake set template = $1 where company_id = $2', [
    '0'.repeat(64),
    a.companyId,
  ])
  assert.partialDeepStrictEqual(lakeIn(await readLake(hub, ana, a)), {
    state: 'READY',
    outdated: true,
  })
})

test('lago: a resposta cortada não cria duas pilhas', async (t) => {
  const { hub, ana, a } = await lakeWorld(t)
  hub.aws.script('create', 'NO_ANSWER', true)
  assert.equal(lakeIn(await createLake(hub, ana, a)).state, 'CREATING')
  assert.equal((await rowOf(hub, a))?.stack_id, null)
  await readLake(hub, ana, a)
  const row = await rowOf(hub, a)
  const creates = hub.aws.calls.filter(({ call }) => call === 'create')
  assert.deepEqual(
    creates.map(({ target }) => target),
    [row?.lake_id, row?.lake_id],
  )
  assert.equal(hub.aws.stacks().length, 1)
  assert.equal(row?.stack_id, stackOf(hub, a))
})

test('lago: a falha mostra o código e apaga o que sobrou', async (t) => {
  const { hub, ana, a } = await lakeWorld(t)
  await createLake(hub, ana, a)
  const { lake_id: lakeId } = (await rowOf(hub, a)) ?? {}
  const reader = { resource: 'Reader', type: 'AWS::IAM::Role' }
  hub.aws.finish(stackOf(hub, a), 'DELETE_COMPLETE', reader)
  await plantLeftover(hub, a)
  const failed = lakeIn(await readLake(hub, ana, a))
  assert.deepEqual(
    { ...failed, at: undefined },
    { state: 'FAILED', code: 'LAKE_CREATE_FAILED', at: undefined },
  )
  assert.ok(!hub.aws.buckets().includes(`conexus-${lakeId}`))
  assert.deepEqual(lakeLines(hub, 'LAKE_CREATE_FAILED'), [
    { companyId: a.companyId, lakeId, ...reader },
  ])
  assert.deepEqual(lakeLines(hub, 'LAKE_LEFTOVER_DELETED'), [{ companyId: a.companyId, lakeId }])
  assert.deepEqual(await rowOf(hub, a), {
    lake_id: lakeId,
    state: 'failed',
    stack_id: stackOf(hub, a),
    failure: 'LAKE_CREATE_FAILED',
  })
})

test('lago: tentar de novo troca o id, e criar de novo na mesma hora funciona', async (t) => {
  const { hub, ana, a } = await lakeWorld(t)
  await createLake(hub, ana, a)
  const first = (await rowOf(hub, a))?.lake_id
  hub.aws.finish(stackOf(hub, a), 'DELETE_COMPLETE')
  assert.equal(lakeIn(await readLake(hub, ana, a)).state, 'FAILED')
  assert.equal(lakeIn(await createLake(hub, ana, a)).state, 'CREATING')
  const second = (await rowOf(hub, a))?.lake_id
  assert.notEqual(second, first)
  assert.match(String(second), LAKE_ID)
  hub.aws.finish(stackOf(hub, a), 'CREATE_COMPLETE')
  assert.equal(lakeIn(await readLake(hub, ana, a)).state, 'READY')
  // Deleted and created again at once: a new id, so the taken bucket name is never met.
  assert.equal((await deleteLake(hub, ana, a)).statusCode, 202)
  hub.aws.finish(stackOf(hub, a), 'DELETE_COMPLETE')
  assert.equal(lakeIn(await readLake(hub, ana, a)).state, 'NONE')
  await createLake(hub, ana, a)
  const third = (await rowOf(hub, a))?.lake_id
  assert.ok(third !== first && third !== second)
  hub.aws.finish(stackOf(hub, a), 'CREATE_COMPLETE')
  assert.equal(lakeIn(await readLake(hub, ana, a)).state, 'READY')
  assert.deepEqual(
    hub.aws.stacks().map((stack) => stack.lake),
    [first, second, third],
  )
})

test('lago: a AWS calada não derruba a leitura', async (t) => {
  const { hub, ana, a } = await lakeWorld(t)
  await createLake(hub, ana, a)
  hub.aws.script('status', 'NO_ANSWER')
  const read = await readLake(hub, ana, a)
  assert.deepEqual([read.statusCode, lakeIn(read).state], [200, 'CREATING'])
  const lakeId = (await rowOf(hub, a))?.lake_id
  assert.deepEqual(lakeLines(hub, 'LAKE_AWS_SILENT'), [
    { companyId: a.companyId, lakeId, call: 'DescribeStacks' },
  ])
})

test('lago: o Hub só chama a pilha da empresa do pedido', async (t) => {
  const { hub, ana, a, b } = await lakeWorld(t)
  await readyLake(hub, ana, a)
  await createLake(hub, ana, b)
  await readLake(hub, ana, b)
  for (const { company, target } of hub.aws.calls) {
    const owner = hub.aws.stacks().find((stack) => stack.id === target || stack.lake === target)
    assert.equal(owner?.company, company)
  }
  // B's row pointed at A's stack, as only a tampered database would: B's session is refused.
  await hub.test.asOwner('delete from lake.company_lake where company_id = $1', [a.companyId])
  await hub.test.asOwner('update lake.company_lake set stack_id = $1 where company_id = $2', [
    stackOf(hub, a),
    b.companyId,
  ])
  assert.equal(lakeIn(await readLake(hub, ana, b)).state, 'CREATING')
  assert.deepEqual(lakeLines(hub, 'LAKE_AWS_REFUSED').at(-1), {
    companyId: b.companyId,
    lakeId: (await rowOf(hub, b))?.lake_id,
    call: 'DescribeStacks',
    code: 'AccessDenied',
  })
})

test('lago: cada recusa termina num estado que a tela mostra', async (t) => {
  const { hub, ana, a, b } = await lakeWorld(t)
  hub.aws.script('create', 'REFUSED')
  const refused = await createLake(hub, ana, a)
  assert.deepEqual([refused.statusCode, lakeIn(refused).state], [202, 'FAILED'])
  await createLake(hub, ana, b)
  hub.aws.finish(stackOf(hub, b), 'DELETE_FAILED')
  assert.equal(lakeIn(await readLake(hub, ana, b)).state, 'DELETE_FAILED')
  assert.equal(lakeIn(await deleteLake(hub, ana, b)).state, 'DELETING')
  hub.aws.finish(stackOf(hub, b), 'DELETE_COMPLETE')
  assert.equal(lakeIn(await readLake(hub, ana, b)).state, 'NONE')
  assert.equal(lakeIn(await createLake(hub, ana, a)).state, 'CREATING')
  hub.aws.finish(stackOf(hub, a), 'DELETE_COMPLETE')
  hub.aws.script('leftover', 'REFUSED')
  assert.equal(lakeIn(await readLake(hub, ana, a)).state, 'FAILED')
  assert.equal(lakeLines(hub, 'LAKE_LEFTOVER_REFUSED').length, 1)
})

test('lago: o registro só tem campos escolhidos, sem frase da AWS nem conta', async (t) => {
  const { hub, ana, a } = await lakeWorld(t)
  hub.aws.script('create', 'NO_ANSWER')
  await createLake(hub, ana, a)
  hub.aws.script('create', 'REFUSED')
  await readLake(hub, ana, a)
  const allowed = new Set(['companyId', 'lakeId', 'call', 'code', 'resource', 'type'])
  const lake = hub.lines.filter((line) => line.message.startsWith('LAKE_'))
  assert.ok(lake.length >= 3)
  for (const line of lake) {
    for (const key of Object.keys(line.fields))
      assert.ok(allowed.has(key), `${line.message}.${key}`)
    assert.ok(!JSON.stringify(line.fields).includes('111122223333'), line.message)
  }
})
