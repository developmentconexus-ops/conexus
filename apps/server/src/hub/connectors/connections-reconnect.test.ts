import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, codeOf } from '../identity/test-hub.ts'
import { connectionsOn, linkSankhya, testOf } from './test-connections.ts'

test('conectar de novo no Sankhya: as chaves novas na mesma ligação', async (t) => {
  const { hub, fake, ana, carla, base } = await connectionsOn(t)
  const wrong = { ...fake.credential, clientSecret: 'segredo-errado' }
  const { connection } = Object((await linkSankhya(hub, ana, base, wrong)).json())
  const refused = Object((await testOf(hub, ana, base, connection.id)).json())
  assert.equal(refused.connection.state, 'NEEDS_REAUTH')
  const credential = `${base}/${connection.id}/credential`
  function read() {
    return hub.test.asOwner('select sealed, revision, state, last_test from connectors.connection')
  }
  const before = await read()

  const invalid = await call(hub, ana, 'PUT', credential, {
    credential: { ...fake.credential, extra: 'x' },
  })
  assert.deepEqual([invalid.statusCode, codeOf(invalid)], [422, 'CONNECTION_CREDENTIAL_INVALID'])
  const byMember = await call(hub, carla, 'PUT', credential, { credential: fake.credential })
  assert.deepEqual([byMember.statusCode, codeOf(byMember)], [404, 'NOT_FOUND'])
  assert.deepEqual(await read(), before)

  const again = await call(hub, ana, 'PUT', credential, { credential: fake.credential })
  assert.equal(again.statusCode, 200)
  const changed = Object(again.json()).connection
  assert.deepEqual(
    [changed.id, changed.name, changed.state, changed.testedAt, changed.testedBy],
    [connection.id, 'Matriz', 'NEW', null, null],
  )
  const [after] = await read()
  assert.equal(after?.revision, Number(before[0]?.revision) + 1)
  assert.notDeepEqual(after?.sealed, before[0]?.sealed)
  const working = Object((await testOf(hub, ana, base, connection.id)).json())
  assert.deepEqual([working.result, working.connection.state], ['WORKING', 'ACTIVE'])

  const gone = await call(hub, ana, 'PUT', `${base}/${crypto.randomUUID()}/credential`, {
    credential: fake.credential,
  })
  assert.deepEqual([gone.statusCode, codeOf(gone)], [404, 'CONNECTION_NOT_FOUND'])
})
