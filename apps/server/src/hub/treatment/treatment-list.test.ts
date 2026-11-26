import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import type { Connector } from '../connectors/public.ts'
import { CONNECTORS } from '../connectors/public.ts'
import type { Hub } from '../identity/test-hub.ts'
import { ANA_OWNER, call } from '../identity/test-hub.ts'
import { lakeWorld } from '../lake/test-lake.ts'
import { treatModelsOf } from './public.ts'
import type { TreatmentOn } from './test-treatment.ts'
import { OF_NOTAS, tableOf, treatmentOn } from './test-treatment.ts'

function renamedPartners(): readonly Connector[] {
  return CONNECTORS.map((connector) => {
    const { tables } = connector
    if (connector.id !== 'sankhya' || tables === undefined) return connector
    const declared = tables.declared.map((table) =>
      table.name !== 'parceiros'
        ? table
        : {
            ...table,
            treated: {
              description: 'Parceiros, com o nome renomeado.',
              columns: [{ column: 'nomeparc', as: 'nome_do_parceiro', cast: 'KEEP' as const }],
            },
          },
    )
    return { ...connector, tables: { ...tables, declared } }
  })
}

async function plantHubSpot(on: TreatmentOn) {
  const connection = randomUUID()
  await on.rows(
    `insert into connectors.connection (id, company_id, connector_id, name, connector_version, state, sealed, key_id, linked_by, linked_at, attempt_key)
     values ($1, $2, 'hubspot', 'HubSpot', '1.0.0', 'ACTIVE', '\\x00', 'chave', $3, now(), $4)`,
    [connection, on.companyId, on.ana.id, randomUUID()],
  )
  await on.rows(
    `insert into copies.lake_copy (company_id, connector_id, connection_id, interval, created_at)
     values ($1, 'hubspot', $2, 'MANUAL', now())`,
    [on.companyId, connection],
  )
  await on.rows(
    `insert into copies.lake_table (id, company_id, connection_id, source_table, name, label, columns)
     values ($1, $2, $3, 'negocios', 'hubspot_negocios', 'Negócios', '[]')`,
    [randomUUID(), on.companyId, connection],
  )
}

test('os modelos da rodada: um por molde, com o SELECT do conector, e cada tratamento ligado, depois do que ele lê', async (t) => {
  const on = await treatmentOn(t)
  const venda = await on.proposed(OF_NOTAS)
  await on.proposed(OF_NOTAS, 'so_proposta')
  await on.approved(venda.id, venda.version)
  const reads = {
    source: on.hub.connectors.copies,
    treatable: on.config.aws.treatable,
  }
  const models = await on.hub.test.database.read(on.at, (tx) =>
    treatModelsOf(reads, tx, on.companyId),
  )
  assert.deepEqual(
    models.map(({ name, layer, table, after }) => [name, layer, table, after]),
    [
      ['tratado__sankhya_notas', 'tratado', 'sankhya_notas', []],
      ['tratado__sankhya_parceiros', 'tratado', 'sankhya_parceiros', []],
      ['negocio__venda', 'negocio', 'venda', ['tratado__sankhya_notas']],
    ],
  )
  assert.match(
    models[0]?.sql ?? '',
    /CAST\("dtneg" AS DATE\) AS "dtneg"[\s\S]*FROM "current"\."sankhya_notas"$/,
  )
  assert.equal(models[2]?.sql, OF_NOTAS)
})

async function partnerDescription(on: TreatmentOn, name: string) {
  const [copied] = await on.rows(
    `select columns from copies.lake_table where name = 'sankhya_parceiros'`,
  )
  const column = Object(copied).columns.find(
    (each: { name: string }) => each.name.toLowerCase() === name,
  )
  assert.equal(typeof column?.description, 'string')
  return String(column.description)
}

test('lista: uma tabela por cópia com molde, com a descrição da coluna copiada, e quem a lê', async (t) => {
  const on = await treatmentOn(t)
  await plantHubSpot(on)
  const description = await partnerDescription(on, 'nomeparc')
  const view = await on.listed()
  assert.deepEqual(
    [view.lake, view.lastRun, view.tables.map((table) => `${table.layer}.${table.name}`)],
    ['CURRENT', null, ['tratado.sankhya_notas', 'tratado.sankhya_parceiros']],
  )
  const partners = tableOf(view, 'tratado', 'sankhya_parceiros')
  assert.ok(partners.layer === 'tratado')
  assert.deepEqual(
    partners.columns.find((column) => column.name === 'nomeparc'),
    { name: 'nomeparc', description },
  )
  const { id, version } = await on.proposed(OF_NOTAS)
  assert.deepEqual(tableOf(await on.listed(), 'tratado', 'sankhya_notas').readBy, [])
  await on.approved(id, version)
  const read = await on.listed()
  assert.deepEqual(tableOf(read, 'tratado', 'sankhya_notas').readBy, [
    { layer: 'negocio', table: 'venda' },
  ])
  assert.deepEqual(tableOf(read, 'tratado', 'sankhya_parceiros').readBy, [])
})

test('lista: o molde que renomeia mostra a descrição da coluna copiada', async (t) => {
  const on = await treatmentOn(t, { catalog: renamedPartners() })
  const description = await partnerDescription(on, 'nomeparc')
  const partners = tableOf(await on.listed(), 'tratado', 'sankhya_parceiros')
  assert.ok(partners.layer === 'tratado')
  assert.deepEqual(
    [partners.description, partners.columns],
    ['Parceiros, com o nome renomeado.', [{ name: 'nome_do_parceiro', description }]],
  )
})

test('lista: a receita anterior e o lago ausente se dizem', async (t) => {
  const on = await treatmentOn(t)
  await on.rows(`update lake.company_lake set template = repeat('0', 64)`)
  assert.equal((await on.listed()).lake, 'OUTDATED')
  await on.rows('delete from lake.company_lake')
  assert.equal((await on.listed()).lake, 'NONE')
})

async function plantRun(
  on: TreatmentOn,
  run: Readonly<{ lake: string; state: string; hours: number; rows: number }>,
  name: string,
) {
  const id = randomUUID()
  await on.rows(
    `insert into treatment.run (id, company_id, lake_id, cause, state, "select", attempt, started_at, ended_at, stopped_by)
     values ($1, $2, $3, 'NOW', $4, '[]', 1, now() - make_interval(hours => $5), now() - make_interval(hours => $5), $6)`,
    [id, on.companyId, run.lake, run.state, run.hours, run.state === 'STOPPED' ? on.ana.id : null],
  )
  await on.rows(
    `insert into treatment.model_run (run_id, company_id, name, status, rows) values ($1, $2, $3, 'BUILT', $4)`,
    [id, on.companyId, name, run.rows],
  )
}

test('rodadas: a lista e o modelo mostram só as do lago de agora, a mais nova primeiro', async (t) => {
  const on = await treatmentOn(t)
  const { id } = await on.proposed(OF_NOTAS)
  const [lake] = await on.rows('select lake_id from lake.company_lake')
  const now = String(Object(lake).lake_id)
  await plantRun(on, { lake: now, state: 'DONE', hours: 3, rows: 1 }, 'negocio__venda')
  await plantRun(on, { lake: now, state: 'STOPPED', hours: 2, rows: 2 }, 'negocio__venda')
  await plantRun(on, { lake: 'apagado', state: 'DONE', hours: 1, rows: 9 }, 'negocio__venda')
  const view = await on.listed()
  assert.deepEqual(view.lastRun?.state === 'STOPPED' ? view.lastRun.stoppedBy : view.lastRun, {
    name: ANA_OWNER.name,
  })
  const { lastRun } = tableOf(view, 'negocio', 'venda')
  assert.equal(lastRun?.status === 'BUILT' ? lastRun.rows : null, 2)
  const runs = (await on.read(id)).runs
  assert.deepEqual(
    runs.map((run) => (run.status === 'BUILT' ? run.rows : null)),
    [2, 1],
  )
  assert.equal(tableOf(view, 'tratado', 'sankhya_notas').lastRun, null)
})

async function plantTreatment(hub: Hub, company: string, person: string) {
  const [model, version, run] = [randomUUID(), randomUUID(), randomUUID()]
  await hub.test.asOwner(
    `insert into treatment.model (id, company_id, name, description, created_by, created_at)
     values ($1, $2, 'venda', '', $3, now())`,
    [model, company, person],
  )
  await hub.test.asOwner(
    `insert into treatment.version (id, model_id, company_id, number, sql, inputs, hash, proposed_by, proposed_at)
     values ($1, $2, $3, 1, 'select 1', '[]', repeat('c', 64), $4, now())`,
    [version, model, company, person],
  )
  await hub.test.asOwner(
    `insert into treatment.run (id, company_id, lake_id, cause, state, "select", attempt, started_at, ended_at)
     values ($1, $2, 'lago', 'NOW', 'DONE', '[]', 1, now(), now())`,
    [run, company],
  )
  await hub.test.asOwner(
    `insert into treatment.model_run (run_id, company_id, name, version_id, status, rows)
     values ($1, $2, 'negocio__venda', $3, 'BUILT', 1)`,
    [run, company, version],
  )
}

test('apagar o cliente leva os tratamentos da empresa, e só os dela', async (t) => {
  const { hub, ana, a, b } = await lakeWorld(t)
  for (const client of [a, b]) await plantTreatment(hub, client.companyId, ana.id)
  const deleted = await call(hub, ana, 'DELETE', `/api/clients/${b.companyId}`, {
    name: b.name,
    revision: 0,
  })
  assert.equal(deleted.statusCode, 204, deleted.body)
  const left = await hub.test.asOwner(
    `select 'model' as of, company_id from treatment.model
     union all select 'version', company_id from treatment.version
     union all select 'run', company_id from treatment.run
     union all select 'model_run', company_id from treatment.model_run`,
  )
  assert.deepEqual(
    left.map((row) => Object(row).company_id),
    Array(4).fill(a.companyId),
  )
})
