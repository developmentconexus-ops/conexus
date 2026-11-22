import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Hub, Person } from '../identity/test-hub.ts'
import { call, codeOf } from '../identity/test-hub.ts'
import type { LakeHub } from '../lake/test-lake.ts'
import {
  createLake,
  lakeIn,
  lakeWorld,
  readLake,
  readyLake,
  rowOf,
  stackOf,
} from '../lake/test-lake.ts'

type Client = Awaited<ReturnType<typeof lakeWorld>>['a']

function deleteClient(hub: Hub, ana: Person, client: Client) {
  return call(hub, ana, 'DELETE', `/api/clients/${client.companyId}`, {
    name: client.name,
    revision: 0,
  })
}

async function clientsLeft(hub: Hub, client: Client) {
  const [row] = await hub.test.asOwner(
    `select (select count(*)::int from operations.client where company_id = $1) as clients,
            (select count(*)::int from lake.company_lake where company_id = $1) as lakes`,
    [client.companyId],
  )
  return row
}

function removes(hub: LakeHub) {
  return hub.aws.calls.filter(({ call: made }) => made === 'remove').length
}

test('cliente: o cliente leva o lago; sem banco e sem lago, sai na hora', async (t) => {
  const { hub, ana, a, b } = await lakeWorld(t)
  await readyLake(hub, ana, a)
  const pending = await deleteClient(hub, ana, a)
  assert.deepEqual([pending.statusCode, codeOf(pending)], [503, 'CLIENT_DELETION_PENDING'])
  assert.equal(removes(hub), 1)
  assert.deepEqual(await clientsLeft(hub, a), { clients: 1, lakes: 1 })
  hub.aws.finish(stackOf(hub, a), 'DELETE_COMPLETE')
  assert.equal((await deleteClient(hub, ana, a)).statusCode, 204)
  assert.deepEqual(await clientsLeft(hub, a), { clients: 0, lakes: 0 })
  assert.equal((await deleteClient(hub, ana, b)).statusCode, 204)
  assert.deepEqual(await clientsLeft(hub, b), { clients: 0, lakes: 0 })
})

test('cliente: o cliente espera o lago nascer; o falho sai na hora, o que não se apagou se apaga de novo', async (t) => {
  const { hub, ana, a, b } = await lakeWorld(t)
  await createLake(hub, ana, a)
  for (let attempt = 0; attempt < 2; attempt += 1) {
    assert.equal(codeOf(await deleteClient(hub, ana, a)), 'CLIENT_DELETION_PENDING')
  }
  assert.equal(removes(hub), 0)
  assert.equal(hub.aws.calls.filter(({ call: made }) => made === 'status').length, 2)
  hub.aws.finish(stackOf(hub, a), 'CREATE_COMPLETE')
  assert.equal(codeOf(await deleteClient(hub, ana, a)), 'CLIENT_DELETION_PENDING')
  assert.equal(removes(hub), 1)
  assert.equal((await rowOf(hub, a))?.state, 'deleting')
  // The try that reads DELETE_FAILED sends a new DeleteStack at once.
  hub.aws.finish(stackOf(hub, a), 'DELETE_FAILED')
  assert.equal(codeOf(await deleteClient(hub, ana, a)), 'CLIENT_DELETION_PENDING')
  assert.equal(removes(hub), 2)
  assert.equal((await rowOf(hub, a))?.state, 'deleting')
  hub.aws.finish(stackOf(hub, a), 'DELETE_COMPLETE')
  assert.equal((await deleteClient(hub, ana, a)).statusCode, 204)
  await createLake(hub, ana, b)
  hub.aws.finish(stackOf(hub, b), 'DELETE_COMPLETE')
  assert.equal(lakeIn(await readLake(hub, ana, b)).state, 'FAILED')
  assert.equal((await deleteClient(hub, ana, b)).statusCode, 204)
  assert.deepEqual(await clientsLeft(hub, b), { clients: 0, lakes: 0 })
})
