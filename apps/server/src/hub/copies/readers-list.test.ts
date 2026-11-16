import assert from 'node:assert/strict'
import { test } from 'node:test'
import { listCopyReaders } from '@conexus/hub-api'
import { call, codeOf, personOn } from '../identity/test-hub.ts'
import { copyOf, idsOf, put, rolesWorld, VENDAS } from './test-readers.ts'

const ZE = { name: 'Zé Fora', email: 'ze@example.test' }

test('listCopyReaders dá Dono, Administrador e cada papel com a contagem de pessoas', async (t) => {
  const w = await rolesWorld(t, 'NONE')
  assert.equal((await put(w, w.on.ana, w.vendas.role, idsOf(w, VENDAS))).statusCode, 200)
  const both = idsOf(w, ['sankhya_clientes', 'sankhya_vendas'])
  assert.equal((await put(w, w.on.ana, w.financeiro.role, both)).statusCode, 200)
  const listed = await call(
    w.on.hub,
    w.on.ana,
    'GET',
    `/api/companies/${w.on.companyId}/copy-readers`,
  )
  assert.equal(listed.statusCode, 200, listed.body)
  const fixed = [
    { role: 'owner', label: 'Dono', members: 1 },
    { role: 'admin', label: 'Administrador', members: 0 },
  ]
  const vendas = { role: w.vendas.role, label: 'Vendas', members: 1 }
  const financeiro = { role: w.financeiro.role, label: 'Financeiro', members: 1 }
  assert.deepEqual(listCopyReaders.success.body.parse(listed.json()), {
    readers: [
      { copyId: copyOf(w.copies, 'sankhya_clientes'), roles: [...fixed, financeiro] },
      { copyId: copyOf(w.copies, 'sankhya_itens_venda'), roles: [...fixed, vendas] },
      { copyId: copyOf(w.copies, 'sankhya_produtos'), roles: [...fixed, vendas] },
      { copyId: copyOf(w.copies, 'sankhya_vendas'), roles: [...fixed, financeiro, vendas] },
      { copyId: copyOf(w.copies, 'sankhya_vendedores'), roles: [...fixed, vendas] },
    ],
  })
})

test('o membro vê quem lê só as cópias do seu papel', async (t) => {
  const w = await rolesWorld(t, 'NONE')
  assert.equal((await put(w, w.on.ana, w.vendas.role, idsOf(w, VENDAS))).statusCode, 200)
  assert.equal(
    (await put(w, w.on.ana, w.financeiro.role, idsOf(w, ['sankhya_clientes']))).statusCode,
    200,
  )
  const url = `/api/companies/${w.on.companyId}/copy-readers`
  const carla = await call(w.on.hub, w.on.carla, 'GET', url)
  assert.equal(carla.statusCode, 200, carla.body)
  assert.deepEqual(carla.json(), {
    readers: [
      {
        copyId: copyOf(w.copies, 'sankhya_clientes'),
        roles: [
          { role: 'owner', label: 'Dono', members: 1 },
          { role: 'admin', label: 'Administrador', members: 0 },
          { role: w.financeiro.role, label: 'Financeiro', members: 1 },
        ],
      },
    ],
  })
  assert.ok(!carla.body.includes('Carla') && !carla.body.includes('Bruno'))
  const ze = await personOn(w.on.hub, ZE)
  const outside = await call(w.on.hub, ze, 'GET', url)
  assert.deepEqual([outside.statusCode, codeOf(outside)], [404, 'NOT_FOUND'])
})
