import assert from 'node:assert/strict'
import { test } from 'node:test'
import { codeOf } from '../identity/test-hub.ts'
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
