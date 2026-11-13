import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, ConnectionId } from '@conexus/hub-api'
import { z } from 'zod'
import { linkMercadoLivre, mercadoLivreOn } from '../connectors/test-connections.ts'
import { call, codeOf } from '../identity/test-hub.ts'
import { doorOf, inventoryOn, inventoryPath, linked, rerun, settled } from './test-inventory.ts'

const FIELDS = ['AD_METAS.META', 'TGFCAB.AD_CANAL']

test('ao ligar', async (t) => {
  const on = await inventoryOn(t)
  const id = await linked(on)
  const path = inventoryPath(on, id)
  const view = Object(await settled(on.hub, on.ana.cookie, path))
  assert.deepEqual(view.inventory, {
    readAt: view.inventory.readAt,
    outcome: 'COMPLETE',
    reason: null,
    tables: 6,
    fields: 7,
    codes: 7,
    operations: view.inventory.operations,
  })
  assert.ok(view.inventory.operations > 0, 'o Sankhya mostra também as suas operações')
  assert.deepEqual(view.last, { outcome: 'COMPLETE', reason: null })
  assert.equal(view.mayRun, true)
  const rows = await on.hub.test.asOwner(
    `select kind, name, type, label, custom from ontology.inventory_entry order by kind, name`,
  )
  const own = rows.filter((row) => row.kind === 'FIELD' && row.custom).map((row) => row.name)
  assert.deepEqual(own, FIELDS)
  const code = rows.find((row) => row.name === 'TGFCAB.TIPMOV=V')
  assert.equal(code?.label, 'Venda', 'o rótulo do dicionário')
  const joined = JSON.stringify(rows)
  assert.ok(!joined.includes('Padaria'), 'nenhum valor de linha da empresa')
  const member = await call(on.hub, on.carla, 'GET', path)
  assert.equal(Object(member.json()).mayRun, false, 'todo membro lê, só quem gerencia lê de novo')
})

test('ler de novo', async (t) => {
  const on = await inventoryOn(t)
  const id = await linked(on)
  const path = inventoryPath(on, id)
  await settled(on.hub, on.ana.cookie, path)
  const [before] = await on.hub.test.asOwner('select id from ontology.inventory_run')
  const denied = await rerun(on.hub, on.carla.cookie, path)
  assert.deepEqual([denied.statusCode, codeOf(denied)], [404, 'NOT_FOUND'])
  const again = await rerun(on.hub, on.ana.cookie, path)
  assert.equal(again.statusCode, 202, again.body)
  assert.deepEqual(again.json(), { started: true })
  await settled(on.hub, on.ana.cookie, path)
  const runs = await on.hub.test.asOwner(
    'select id from ontology.inventory_run order by started_at',
  )
  assert.equal(runs.length, 1, 'a rodada nova troca as antigas')
  assert.notEqual(runs[0]?.id, before?.id)

  await on.hub.test.asOwner(
    `insert into ontology.inventory_run (id, company_id, connection_id, started_at)
     select gen_random_uuid(), company_id, connection_id, now() from ontology.inventory_run limit 1`,
  )
  const busy = await rerun(on.hub, on.ana.cookie, path)
  assert.deepEqual([busy.statusCode, codeOf(busy)], [409, 'INVENTORY_RUNNING'])
})

test('recusa, teto e prazo', async (t) => {
  const on = await inventoryOn(t, { pageRows: 2, runPages: 2 })
  const id = await linked(on)
  const path = inventoryPath(on, id)
  const capped = Object(await settled(on.hub, on.ana.cookie, path))
  assert.deepEqual(capped.last, { outcome: 'PARTIAL', reason: 'CAP' })
  assert.equal(capped.inventory.outcome, 'PARTIAL')
  assert.equal(capped.inventory.tables + capped.inventory.fields + capped.inventory.codes, 4)

  on.fake.switches.refuse.add('consultar')
  await rerun(on.hub, on.ana.cookie, path)
  const refused = Object(await settled(on.hub, on.ana.cookie, path))
  assert.deepEqual(refused.last, { outcome: 'FAILED', reason: 'REFUSED' })
  assert.equal(refused.inventory.readAt, capped.inventory.readAt, 'o anterior continua')
  on.fake.switches.refuse.clear()

  on.door.spoilAfter = on.door.asked + 1
  await rerun(on.hub, on.ana.cookie, path)
  const fell = Object(await settled(on.hub, on.ana.cookie, path))
  assert.deepEqual(fell.last, { outcome: 'FAILED', reason: 'UNREADABLE' })
  assert.equal(fell.inventory.readAt, capped.inventory.readAt)

  on.door.spoilAfter = Number.POSITIVE_INFINITY
  await on.hub.test.asOwner(
    `insert into ontology.inventory_run (id, company_id, connection_id, started_at)
     select gen_random_uuid(), company_id, connection_id, now() - interval '16 minutes'
     from ontology.inventory_run limit 1`,
  )
  on.fake.switches.refuse.add('consultar')
  const unlocked = await rerun(on.hub, on.ana.cookie, path)
  assert.equal(unlocked.statusCode, 202, 'uma rodada aberta há mais de 15 minutos não impede')
  await settled(on.hub, on.ana.cookie, path)
  const ends = await on.hub.test.asOwner(
    `select outcome from ontology.inventory_end where outcome = 'INTERRUPTED'`,
  )
  assert.equal(ends.length, 1, 'a rodada que o processo deixou aberta termina INTERRUPTED')
})

test('das declarações', async (t) => {
  const { door, through } = doorOf(t)
  const on = await mercadoLivreOn(t, { through, tuning: { inventory: {} } })
  const linkedOn = await linkMercadoLivre(on.hub, on.ana, on.companyId)
  assert.equal(linkedOn.statusCode, 200, linkedOn.body)
  const id = z.object({ connection: z.object({ id: z.string() }) }).parse(linkedOn.json())
  const path = `/api/companies/${on.companyId}/ontology/inventories/${id.connection.id}`
  const before = door.calls
  const started = await rerun(on.hub, on.ana.cookie, path)
  assert.equal(started.statusCode, 202, started.body)
  const view = Object(await settled(on.hub, on.ana.cookie, path))
  assert.equal(door.calls, before, 'nenhuma chamada ao fornecedor')
  assert.equal(view.inventory.outcome, 'COMPLETE')
  assert.equal(view.inventory.tables + view.inventory.fields + view.inventory.codes, 0)
  assert.ok(view.inventory.operations > 0)
})

test('a busca no inventário, como as ferramentas a leem', async (t) => {
  const on = await inventoryOn(t)
  const id = ConnectionId.parse(await linked(on))
  await settled(on.hub, on.ana.cookie, inventoryPath(on, id))
  function ask(text: string, kind?: 'TABLE' | 'FIELD' | 'CODE' | 'OPERATION') {
    return on.hub.ontology.inventory.search({
      companyId: CompanyId.parse(on.companyId),
      connectionId: id,
      text,
      kind,
      limit: 2,
    })
  }
  const found = await ask('canal')
  assert.equal(found.kind, 'OK')
  if (found.kind !== 'OK') return
  assert.deepEqual(
    found.entries.map((entry) => [entry.kind, entry.name, entry.label, entry.custom]),
    [
      ['CODE', 'TGFCAB.AD_CANAL=1', 'Loja', false],
      ['CODE', 'TGFCAB.AD_CANAL=2', 'Site', false],
    ],
  )
  assert.equal(found.more, true, 'o campo vem depois, e o limite era 2')
  const own = await ask('canal', 'FIELD')
  assert.deepEqual(Object(own).entries, [
    { kind: 'FIELD', name: 'TGFCAB.AD_CANAL', type: 'I', label: 'Canal de venda', custom: true },
  ])
  const none = await on.hub.ontology.inventory.search({
    companyId: CompanyId.parse(on.companyId),
    connectionId: ConnectionId.parse('4aaaaaaa-0000-4000-8000-000000000000'),
    text: 'x',
    limit: 5,
  })
  assert.deepEqual(none, { kind: 'EMPTY' })
})
