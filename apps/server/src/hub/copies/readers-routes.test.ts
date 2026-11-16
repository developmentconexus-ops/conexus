import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { listCopyReaders } from '@conexus/hub-api'
import pg from 'pg'
import { call, codeOf, memberOn, personOn, plantCompany, post } from '../identity/test-hub.ts'
import { ATENDENTE } from '../identity/test-roles.ts'
import {
  asRole,
  copiesUrl,
  copyOf,
  erred,
  holdNextReconcile,
  hubMarks,
  hubNames,
  idsOf,
  logged,
  put,
  rolesWorld,
  roleTables,
  silentReconcile,
  VENDAS,
} from './test-readers.ts'

const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }
const ZE = { name: 'Zé Fora', email: 'ze@example.test' }

test('o dono marca clientes para o Financeiro e Carla passa a ler', async (t) => {
  const w = await rolesWorld(t, 'NONE')
  const clientes = idsOf(w, ['sankhya_clientes'])
  assert.deepEqual(await asRole(w.on, w.financeiro.id, 'sankhya_clientes'), { refused: '42501' })
  const set = await put(w, w.on.ana, w.financeiro.role, clientes)
  assert.deepEqual([set.statusCode, set.json()], [200, { copies: clientes }])
  assert.deepEqual(await asRole(w.on, w.financeiro.id, 'sankhya_clientes'), { rows: 56 })
  assert.deepEqual(logged(w.on, 'COPY_READERS_SET'), [
    {
      ...{ companyId: w.on.companyId, role: w.financeiro.role, by: w.on.ana.id },
      ...{ added: 1, removed: 0 },
    },
  ])
})

test('tirar uma tabela recusa a leitura seguinte', async (t) => {
  const w = await rolesWorld(t, 'NONE')
  assert.equal(
    (await put(w, w.on.ana, w.financeiro.role, idsOf(w, ['sankhya_clientes']))).statusCode,
    200,
  )
  const taken = await put(w, w.on.ana, w.financeiro.role, [])
  assert.deepEqual([taken.statusCode, taken.json()], [200, { copies: [] }])
  assert.deepEqual(await asRole(w.on, w.financeiro.id, 'sankhya_clientes'), { refused: '42501' })
})

test('o banco calado ao tirar responde 503 e nada muda', async (t) => {
  const w = await rolesWorld(t, 'NONE')
  assert.equal(
    (await put(w, w.on.ana, w.financeiro.role, idsOf(w, ['sankhya_clientes']))).statusCode,
    200,
  )
  const before = await hubMarks(w, w.financeiro.id)
  silentReconcile(t, w)
  const taken = await put(w, w.on.ana, w.financeiro.role, [])
  assert.deepEqual([taken.statusCode, codeOf(taken)], [503, 'COPY_DATABASE_UNAVAILABLE'])
  assert.deepEqual(await hubMarks(w, w.financeiro.id), before)
  assert.deepEqual(await asRole(w.on, w.financeiro.id, 'sankhya_clientes'), { rows: 56 })
  assert.ok(erred(w, 'COPY_READERS_FAILED').length > 0)
})

test('a reposição que falha diz COPY_READERS_PENDING como erro e a rodada seguinte conserta', async (t) => {
  const w = await rolesWorld(t, 'NONE')
  assert.equal(
    (await put(w, w.on.ana, w.financeiro.role, idsOf(w, ['sankhya_clientes']))).statusCode,
    200,
  )
  const asOwner = w.on.hub.test.asOwner.bind(w.on.hub.test)
  const silent = t.mock.method(w.on.hub.postgres.companyPostgres, 'reconcileReaders', async () => {
    await asOwner('revoke insert on copies.copy_reader from hub_company')
    return { kind: 'NO_ANSWER' as const }
  })
  const taken = await put(w, w.on.ana, w.financeiro.role, [])
  assert.deepEqual([taken.statusCode, codeOf(taken)], [503, 'COPY_DATABASE_UNAVAILABLE'])
  assert.deepEqual(erred(w, 'COPY_READERS_PENDING'), [
    { companyId: w.on.companyId, role: w.financeiro.role },
  ])
  assert.deepEqual(await hubNames(w, w.financeiro.id), [])
  silent.mock.restore()
  await asOwner('grant insert on copies.copy_reader to hub_company')
  assert.deepEqual(await asRole(w.on, w.financeiro.id, 'sankhya_clientes'), { rows: 56 })
  assert.equal((await w.on.run(copyOf(w.copies, 'sankhya_clientes'))).kind, 'ENDED')
  assert.deepEqual(await asRole(w.on, w.financeiro.id, 'sankhya_clientes'), { refused: '42501' })
})

test('o banco calado ao dar responde 200, diz COPY_READERS_PENDING e o conserto libera', async (t) => {
  const w = await rolesWorld(t, 'NONE')
  const silent = silentReconcile(t, w)
  const clientes = idsOf(w, ['sankhya_clientes'])
  const set = await put(w, w.on.ana, w.financeiro.role, clientes)
  assert.deepEqual([set.statusCode, set.json()], [200, { copies: clientes }])
  assert.deepEqual(logged(w.on, 'COPY_READERS_PENDING'), [
    { companyId: w.on.companyId, role: w.financeiro.role },
  ])
  assert.deepEqual(erred(w, 'COPY_READERS_PENDING'), [], 'dar com o banco calado é info')
  assert.deepEqual(await asRole(w.on, w.financeiro.id, 'sankhya_clientes'), { refused: '42501' })
  silent.mock.restore()
  const carla = w.on.hub.data({
    ...{ companyId: w.on.companyId, personId: w.carlaId },
    ...{ place: { kind: 'COMPANY' }, chosen: [] },
  })
  const read = await carla.read({
    kind: 'QUERY',
    sql: 'select count(*) from sync.sankhya_clientes',
  })
  assert.equal(read.kind, 'QUERY', JSON.stringify(read))
  assert.equal(logged(w.on, 'COPY_READERS_REPAIRED').length, 1)
})

test('com o banco falhando, a resposta nunca deixa o login lendo mais do que o Hub diz', async (t) => {
  const w = await rolesWorld(t, 'NONE')
  const steps = [
    ['sankhya_clientes'],
    ['sankhya_clientes', 'sankhya_vendas'],
    ['sankhya_vendas'],
    [],
    ['sankhya_produtos', 'sankhya_vendedores'],
  ]
  for (const names of steps) {
    for (const silenced of [true, false]) {
      const silent = silenced ? silentReconcile(t, w) : undefined
      const answer = await put(w, w.on.ana, w.financeiro.role, idsOf(w, names))
      silent?.mock.restore()
      assert.ok([200, 503].includes(answer.statusCode), answer.body)
      const hub = await hubNames(w, w.financeiro.id)
      const read = await roleTables(w.on, w.financeiro.id)
      assert.ok(
        read.every((table) => hub.includes(table)),
        `o login lê ${read} e o Hub diz ${hub}`,
      )
      if (!silenced) assert.deepEqual(read, hub)
    }
  }
})

test('a ordem da rodada 3, item 1(c): uma reconciliação que leu o Hub antes de tirar e aplicou depois não devolve o GRANT', async (t) => {
  const w = await rolesWorld(t, 'NONE')
  assert.equal(
    (await put(w, w.on.ana, w.financeiro.role, idsOf(w, ['sankhya_clientes']))).statusCode,
    200,
  )
  const held = holdNextReconcile(t, w)
  const running = w.on.run(copyOf(w.copies, 'sankhya_vendas'))
  await held.arrived
  const taken = await put(w, w.on.ana, w.financeiro.role, [])
  assert.equal(taken.statusCode, 200, taken.body)
  held.release()
  assert.equal((await running).kind, 'ENDED')
  assert.deepEqual(held.answers, ['SUPERSEDED'])
  assert.deepEqual(await asRole(w.on, w.financeiro.id, 'sankhya_clientes'), { refused: '42501' })
})

test('Dono e Administrador respondem ROLE_FIXED, e o papel que não existe ROLE_NOT_FOUND', async (t) => {
  const w = await rolesWorld(t, 'NONE')
  const clientes = idsOf(w, ['sankhya_clientes'])
  for (const role of ['owner', 'admin']) {
    const fixed = await put(w, w.on.ana, role, clientes)
    assert.deepEqual([fixed.statusCode, codeOf(fixed)], [409, 'ROLE_FIXED'])
  }
  const missing = await put(w, w.on.ana, 'nao-existe', clientes)
  assert.deepEqual([missing.statusCode, codeOf(missing)], [404, 'ROLE_NOT_FOUND'])
  assert.deepEqual(await w.on.hub.test.asOwner('select * from copies.copy_reader'), [])
})

test('quem não muda papéis, outra empresa, a cópia de outra empresa, a sessão vencida e o corpo grande demais são recusados', async (t) => {
  const w = await rolesWorld(t, 'NONE')
  const clientes = idsOf(w, ['sankhya_clientes'])
  const developer = await memberOn(w.on.hub, w.on.companyId, DAVI, 'developer')
  const ze = await personOn(w.on.hub, ZE)
  const other = await plantCompany(w.on.hub.test, ze.id, 'Empresa B', 'empresa-b')
  for (const who of [w.on.carla, developer, ze]) {
    const refused = await put(w, who, w.financeiro.role, clientes)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  }
  const made = await post(w.on.hub, ze, `/api/companies/${other}/roles`, ATENDENTE)
  assert.equal(made.statusCode, 201, made.body)
  const theirs = String(Object(made.json()).role.role)
  const crossed = await call(w.on.hub, ze, 'PUT', copiesUrl(w, theirs, other), { copies: clientes })
  assert.deepEqual([crossed.statusCode, codeOf(crossed)], [404, 'COPY_NOT_FOUND'])
  const ours = await put(w, w.on.ana, w.financeiro.role, [...clientes, randomUUID()])
  assert.deepEqual([ours.statusCode, codeOf(ours)], [404, 'COPY_NOT_FOUND'])
  const tooMany = Array.from({ length: 201 }, () => randomUUID())
  const large = await put(w, w.on.ana, w.financeiro.role, tooMany)
  assert.deepEqual([large.statusCode, codeOf(large)], [400, 'REQUEST_MALFORMED'])
  await w.on.hub.test.asOwner(
    `update auth.session set expires_at = now() - interval '1 second' where user_id = $1`,
    [w.on.ana.id],
  )
  const expired = await put(w, w.on.ana, w.financeiro.role, clientes)
  assert.deepEqual([expired.statusCode, codeOf(expired)], [401, 'SESSION_REQUIRED'])
  assert.deepEqual(await w.on.hub.test.asOwner('select * from copies.copy_reader'), [])
})

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

async function waitingOnLocks(client: pg.Client, count: number) {
  for (;;) {
    const waiting = await client.query(
      `select count(*)::int as n from pg_locks l join pg_stat_activity a on a.pid = l.pid
        where not l.granted and a.datname = current_database()`,
    )
    if (waiting.rows[0]?.n >= count) return
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
}

test('dois PUT ao mesmo tempo terminam com o estado de um deles, e repetir não muda nada', async (t) => {
  const w = await rolesWorld(t, 'NONE')
  const one = ['sankhya_clientes']
  const other = ['sankhya_clientes', 'sankhya_produtos']
  const holder = new pg.Client({ connectionString: w.on.hub.test.ownerUrl.reveal() })
  await holder.connect()
  const both = await (async () => {
    try {
      await holder.query('begin')
      await holder.query('select id from copies.copy where id = $1 for update', idsOf(w, one))
      const asked = Promise.all([
        put(w, w.on.ana, w.financeiro.role, idsOf(w, one)),
        put(w, w.on.ana, w.financeiro.role, idsOf(w, other)),
      ])
      await waitingOnLocks(holder, 2)
      await holder.query('commit')
      return asked
    } finally {
      await holder.end()
    }
  })()
  const [first, second] = both
  assert.deepEqual(
    [first?.statusCode, second?.statusCode],
    [200, 200],
    `${first?.body} ${second?.body}`,
  )
  const after = await hubNames(w, w.financeiro.id)
  assert.ok(
    [JSON.stringify([...one].sort()), JSON.stringify([...other].sort())].includes(
      JSON.stringify(after),
    ),
    JSON.stringify(after),
  )
  const before = await hubMarks(w, w.financeiro.id)
  const again = await put(w, w.on.ana, w.financeiro.role, idsOf(w, after))
  assert.equal(again.statusCode, 200)
  assert.deepEqual(await hubMarks(w, w.financeiro.id), before)
  const [clientes] = idsOf(w, ['sankhya_clientes'])
  assert.ok(clientes)
  const twice = await put(w, w.on.ana, w.financeiro.role, [clientes, clientes])
  assert.deepEqual([twice.statusCode, twice.json()], [200, { copies: [clientes] }])
  assert.deepEqual(await hubNames(w, w.financeiro.id), ['sankhya_clientes'])
})
