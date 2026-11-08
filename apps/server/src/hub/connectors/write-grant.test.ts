import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ConnectionId, ProjectId } from '@conexus/hub-api'
import { call, plantCompany, post } from '../identity/test-hub.ts'
import { linkSankhya } from './test-connections.ts'
import { writing } from './test-write.ts'

test('as permissões do papel também se leem na hora: tirar a escrita do papel pela rota faz a próxima recusar, sem pedido ao dublê', async (t) => {
  const on = await writing(t)
  const route = `/api/companies/${on.companyId}/roles`
  const made = await post(on.hub, on.ana, route, {
    label: 'Escritor',
    connectors: { sankhya: ['pedidos', 'lancarPedido'] },
  })
  assert.equal(made.statusCode, 201)
  await on.hub.test.asOwner(
    "update auth.member set role = 'escritor' where company_id = $1 and user_id = $2",
    [on.companyId, on.carla.id],
  )
  assert.equal((await on.ask(on.byCarla())).kind, 'OK')
  const changed = await call(on.hub, on.ana, 'PUT', `${route}/escritor`, {
    connectors: { sankhya: ['pedidos'] },
    unattended: false,
  })
  assert.equal(changed.statusCode, 200)
  assert.deepEqual(await on.ask(on.byCarla()), { kind: 'NOT_IN_ROLE' })
  assert.equal(on.mode.posts, 1)
})

test('uma ligação de outro Projeto ou de outra empresa dá NOT_GRANTED, sem pedido ao dublê (T10)', async (t) => {
  const on = await writing(t)
  const made = await post(on.hub, on.ana, `/api/companies/${on.companyId}/projects`, {
    name: 'Outro',
  })
  const elsewhere = ProjectId.parse(Object(made.json()).project.id)
  const inOther = on.byAna({
    scope: { ...on.scopeOf(on.ana.id), place: { kind: 'PROJECT', projectId: elsewhere } },
  })
  assert.deepEqual(await on.ask(inOther), { kind: 'NOT_GRANTED' })
  const company = await plantCompany(on.hub.test, on.ana.id, 'Empresa B', 'empresa-b')
  const linked = await linkSankhya(
    on.hub,
    on.ana,
    `/api/companies/${company}/connections`,
    on.fake.credential,
    undefined,
    'Outra',
  )
  const foreign = ConnectionId.parse(Object(linked.json()).connection.id)
  const request = on.byAna({ connectionId: foreign, scope: on.scopeOf(on.ana.id, [foreign]) })
  assert.deepEqual(await on.ask(request), { kind: 'NOT_GRANTED' })
  assert.equal(on.mode.posts, 0)
  assert.equal((await on.ledger()).length, 0)
})
