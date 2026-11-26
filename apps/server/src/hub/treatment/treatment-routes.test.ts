import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { ProposedTreatment, TreatedTables, TreatmentModel, VersionView } from '@conexus/hub-api'
import {
  queued,
  serveEnvironment,
  TEST_ORIGIN,
  withOwnerLock,
} from '../../platform/test-database.ts'
import { spawnHub } from '../../platform/test-hub-process.ts'
import type { Connector } from '../connectors/public.ts'
import { CONNECTORS } from '../connectors/public.ts'
import { DAILY, lakeCopyOn, NOTAS, PARCEIROS } from '../copies/test-lake-copy.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  call,
  codeOf,
  memberOn,
  PASSWORD,
  plantCompany,
  post,
} from '../identity/test-hub.ts'
import { ATENDENTE } from '../identity/test-roles.ts'
import { lakeWorld } from '../lake/test-lake.ts'
import { treatModelsOf } from './public.ts'

const VENDEDORES = { source: 'TGFVEN', name: 'sankhya_vendedores' }
const OF_NOTAS = 'select nunota, codparc from tratado.sankhya_notas'

type Options = Parameters<typeof lakeCopyOn>[1]

/** Empresa Teste with a lake and a Sankhya connection whose notes, partners and sellers are copied. */
async function treatmentOn(t: TestContext, options: Options = {}) {
  const on = await lakeCopyOn(t, options)
  const connection = await on.linked()
  const marked = await on.put(connection, { tables: [NOTAS, PARCEIROS, VENDEDORES], ...DAILY })
  assert.equal(marked.statusCode, 200, marked.body)
  await on.hub.lakeRuns.idle()
  const base = `/api/companies/${on.companyId}/data/treated`
  const models = `${base}/models`
  function propose(sql: string, name = 'venda', who: Person = on.ana, description = 'Vendas') {
    return post(on.hub, who, models, { name, description, sql })
  }
  async function proposed(sql: string, name = 'venda') {
    const response = await propose(sql, name)
    assert.equal(response.statusCode, 201, response.body)
    return ProposedTreatment.parse(response.json())
  }
  function change(id: string, sql: string, who: Person = on.ana, description = 'Vendas') {
    return post(on.hub, who, `${models}/${id}/versions`, { sql, description })
  }
  async function changed(id: string, sql: string, description?: string) {
    const response = await change(id, sql, on.ana, description)
    assert.equal(response.statusCode, 201, response.body)
    return VersionView.parse(response.json())
  }
  function approve(id: string, number: number, hash: string, who: Person = on.ana) {
    return post(on.hub, who, `${models}/${id}/versions/${number}/approve`, { hash })
  }
  async function approved(id: string, version: { number: number; hash: string }, who?: Person) {
    const response = await approve(id, version.number, version.hash, who)
    assert.equal(response.statusCode, 200, response.body)
    return VersionView.parse(response.json())
  }
  async function listed(who: Person = on.ana) {
    const response = await call(on.hub, who, 'GET', base)
    assert.equal(response.statusCode, 200, response.body)
    return TreatedTables.parse(response.json())
  }
  async function read(id: string) {
    const response = await call(on.hub, on.ana, 'GET', `${models}/${id}`)
    assert.equal(response.statusCode, 200, response.body)
    return TreatmentModel.parse(response.json())
  }
  function saved() {
    return on.rows(
      `select (select count(*)::int from treatment.model) as models,
              (select count(*)::int from treatment.version) as versions,
              (select count(*)::int from treatment.run) as runs`,
    )
  }
  return {
    ...on,
    ...{ base, models, propose, proposed, change, changed, approve, approved, listed, read, saved },
  }
}

type TreatmentOn = Awaited<ReturnType<typeof treatmentOn>>

function tableOf(view: TreatedTables, layer: 'tratado' | 'negocio', name: string) {
  const table = view.tables.find((each) => each.layer === layer && each.name === name)
  assert.ok(table !== undefined, `${layer}.${name}`)
  return table
}

function refusalOf(response: { statusCode: number; json(): unknown }) {
  const { code, table, position } = Object(response.json())
  return { status: response.statusCode, code, table, position }
}

test('propor: o modelo e a versão 1, com as tabelas que o SQL lê, sem rodar nada', async (t) => {
  const on = await treatmentOn(t)
  const sql = `${OF_NOTAS} n join current.sankhya_parceiros p on p.codparc = n.codparc`
  const { id, version, ...model } = await on.proposed(sql)
  assert.deepEqual(model, { name: 'venda', description: 'Vendas' })
  assert.deepEqual(
    { ...version, hash: version.hash.length, proposedAt: typeof version.proposedAt },
    {
      number: 1,
      sql,
      inputs: [
        { layer: 'current', table: 'sankhya_parceiros' },
        { layer: 'tratado', table: 'sankhya_notas' },
      ],
      hash: 64,
      proposedBy: 'Ana Lima',
      proposedAt: 'string',
      approvedBy: null,
      approvedAt: null,
    },
  )
  assert.deepEqual(await on.saved(), [{ models: 1, versions: 1, runs: 0 }])
  assert.deepEqual((await on.read(id)).versions, [version])
})

test('propor: cada recusa com o seu código e o que ela nomeia, sem gravar nada', async (t) => {
  const on = await treatmentOn(t)
  const venda = await on.proposed(OF_NOTAS)
  const outra = await on.proposed('select * from negocio.venda', 'outra')
  const before = await on.saved()
  for (const [code, sql, named] of [
    ['TREATMENT_SQL_INVALID', 'select *\nfrom (', { position: { line: 2, column: 7 } }],
    ['TREATMENT_SQL_NOT_A_QUERY', 'delete from current.sankhya_notas', {}],
    ['TREATMENT_SQL_TEMPLATE', "select * from {{ ref('notas') }}", {}],
    ['TREATMENT_INPUT_UNQUALIFIED', 'select * from sankhya_notas', { table: 'sankhya_notas' }],
    [
      'TREATMENT_INPUT_UNKNOWN',
      'select * from current.sankhya_estoque',
      { table: 'current.sankhya_estoque' },
    ],
    [
      'TREATMENT_INPUT_UNKNOWN',
      'select * from tratado.sankhya_vendedores',
      { table: 'tratado.sankhya_vendedores' },
    ],
    ['TREATMENT_INPUT_UNKNOWN', 'select * from negocio.nada', { table: 'negocio.nada' }],
    ['TREATMENT_INPUT_CYCLE', 'select * from negocio.nova', { table: 'negocio.nova' }],
  ] as const) {
    const refused = refusalOf(await on.propose(sql, 'nova'))
    const expected = { status: 422, code, table: undefined, position: undefined, ...named }
    assert.deepEqual(refused, expected, sql)
  }
  const taken = refusalOf(await on.propose(OF_NOTAS))
  assert.deepEqual([taken.status, taken.code], [409, 'TREATMENT_NAME_TAKEN'])
  const circle = refusalOf(await on.change(venda.id, 'select * from negocio.outra'))
  assert.deepEqual(
    [circle.status, circle.code, circle.table],
    [422, 'TREATMENT_INPUT_CYCLE', 'negocio.venda'],
  )
  assert.deepEqual(await on.saved(), before)
  assert.equal((await on.read(outra.id)).versions.length, 1)
})

test('ciclo: a versão ligada conta mesmo depois de uma proposta que não lê mais o outro', async (t) => {
  const on = await treatmentOn(t)
  const a = await on.proposed(OF_NOTAS, 'a')
  const b = await on.proposed('select * from negocio.a', 'b')
  await on.approved(b.id, b.version)
  await on.changed(b.id, OF_NOTAS)
  const refused = refusalOf(await on.change(a.id, 'select * from negocio.b'))
  assert.deepEqual([refused.status, refused.code], [422, 'TREATMENT_INPUT_CYCLE'])
})

for (const [lake, statement] of [
  ['de receita anterior', `update lake.company_lake set template = repeat('0', 64)`],
  ['que não está pronto', `update lake.company_lake set state = 'creating'`],
  ['ausente', 'delete from lake.company_lake'],
] as const) {
  test(`propor: o lago ${lake} recusa com LAKE_NOT_READY, no modelo novo e na versão`, async (t) => {
    const on = await treatmentOn(t)
    const venda = await on.proposed(OF_NOTAS)
    await on.rows(statement)
    for (const response of [
      await on.propose(OF_NOTAS, 'nova'),
      await on.change(venda.id, OF_NOTAS),
    ]) {
      assert.deepEqual([response.statusCode, codeOf(response)], [409, 'LAKE_NOT_READY'])
    }
    assert.deepEqual(await on.saved(), [{ models: 1, versions: 1, runs: 0 }])
  })
}

test('ligar: o hash lido liga a versão, com quem e quando; outro hash ou outra versão, não', async (t) => {
  const on = await treatmentOn(t)
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'admin')
  const { id, version: first } = await on.proposed(OF_NOTAS)
  const second = await on.changed(id, 'select nunota from tratado.sankhya_notas')
  const refusals = [
    await on.approve(id, 1, first.hash),
    await on.approve(id, 2, first.hash),
    await on.approve(id, 3, second.hash),
  ]
  for (const refused of refusals) {
    assert.deepEqual([refused.statusCode, codeOf(refused)], [409, 'TREATMENT_VERSION_CHANGED'])
  }
  assert.deepEqual(
    (await on.read(id)).versions.map((version) => version.approvedBy),
    [null, null],
  )
  const yes = await on.approved(id, second, bruno)
  assert.deepEqual([yes.number, yes.approvedBy, typeof yes.approvedAt], [2, BRUNO.name, 'string'])
  const again = await on.approve(id, 2, second.hash)
  assert.deepEqual([again.statusCode, codeOf(again)], [409, 'TREATMENT_VERSION_CHANGED'])
  const [kept] = await on.rows(
    `select count(*)::int as approved from treatment.version where approved_at is not null`,
  )
  assert.deepEqual(kept, { approved: 1 })
})

test('versões: a ligada fica até a nova ser ligada, e a lista e o modelo mostram as duas', async (t) => {
  const on = await treatmentOn(t)
  const { id, version: first } = await on.proposed(OF_NOTAS)
  await on.approved(id, first)
  const second = await on.changed(id, 'select nunota from tratado.sankhya_notas', 'Só notas')
  const before = tableOf(await on.listed(), 'negocio', 'venda')
  assert.ok(before.layer === 'negocio')
  assert.deepEqual(
    [before.description, before.active?.number, before.proposal?.number],
    ['Só notas', 1, 2],
  )
  const view = await on.read(id)
  assert.deepEqual(
    view.versions.map((v) => [v.number, v.proposedBy, v.approvedBy]),
    [
      [2, ANA_OWNER.name, null],
      [1, ANA_OWNER.name, ANA_OWNER.name],
    ],
  )
  await on.approved(id, second)
  const after = tableOf(await on.listed(), 'negocio', 'venda')
  assert.ok(after.layer === 'negocio')
  assert.deepEqual([after.active?.number, after.proposal], [2, null])
})

test('versões: duas propostas ao mesmo tempo não dão o mesmo número', async (t) => {
  const on = await treatmentOn(t)
  const { id } = await on.proposed(OF_NOTAS)
  await withOwnerLock(
    on.hub.test,
    `insert into treatment.version (id, model_id, company_id, number, sql, inputs, hash, proposed_by, proposed_at)
     values ($1, $2, $3, 2, 'select 1', '[]', repeat('a', 64), $4, now())`,
    [randomUUID(), id, on.companyId, on.ana.id],
    async (release) => {
      const request = on.change(id, OF_NOTAS, on.ana, 'Outra')
      await queued(on.hub.test, 1, request)
      await release()
      const refused = await request
      assert.deepEqual([refused.statusCode, codeOf(refused)], [409, 'TREATMENT_VERSION_CHANGED'])
    },
  )
  const view = await on.read(id)
  assert.deepEqual(
    [view.description, view.versions.map((version) => version.number)],
    ['Vendas', [2, 1]],
  )
})

test('ciclo: duas propostas ao mesmo tempo não fecham um ciclo entre si', async (t) => {
  const on = await treatmentOn(t)
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'admin')
  const a = await on.proposed(OF_NOTAS, 'a')
  const b = await on.proposed(OF_NOTAS, 'b')
  await withOwnerLock(
    on.hub.test,
    // Holds both before either writes its version, after each could have read the other's model.
    'lock table treatment.version in share mode',
    [],
    async (release) => {
      const requests = Promise.all([
        on.change(a.id, 'select * from negocio.b'),
        on.change(b.id, 'select * from negocio.a', bruno),
      ])
      await queued(on.hub.test, 2, requests)
      await release()
      const answers = (await requests).map((response) => response.statusCode)
      assert.deepEqual(answers.toSorted(), [201, 422])
    },
  )
})

/** The five routes of a treatment, as one person calls them on one model of a company. */
function routesOf(base: string, id: string, version: { number: number; hash: string }) {
  const model = `${base}/models/${id}`
  return [
    ['GET', base, undefined],
    ['GET', model, undefined],
    ['POST', `${base}/models`, { name: 'nova', description: '', sql: OF_NOTAS }],
    ['POST', `${model}/versions`, { description: '', sql: OF_NOTAS }],
    ['POST', `${model}/versions/${version.number}/approve`, { hash: version.hash }],
  ] as const
}

async function without(on: TreatmentOn) {
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'developer')
  const davi = await memberOn(
    on.hub,
    on.companyId,
    { name: 'Davi Costa', email: 'davi@example.test' },
    'member',
  )
  await post(on.hub, on.ana, `/api/companies/${on.companyId}/roles`, ATENDENTE)
  const edu = await memberOn(
    on.hub,
    on.companyId,
    { name: 'Edu Lima', email: 'edu@example.test' },
    'atendente',
  )
  return [carla, davi, edu]
}

test('permissão: o desenvolvedor, o membro e o papel próprio recebem 404 em cada rota', async (t) => {
  const on = await treatmentOn(t)
  const { id, version } = await on.proposed(OF_NOTAS)
  for (const who of await without(on)) {
    for (const [method, url, body] of routesOf(on.base, id, version)) {
      const refused = await call(on.hub, who, method, url, body)
      assert.deepEqual(
        [refused.statusCode, codeOf(refused)],
        [404, 'NOT_FOUND'],
        `${method} ${url}`,
      )
    }
  }
  assert.deepEqual(await on.saved(), [{ models: 1, versions: 1, runs: 0 }])
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'admin')
  assert.equal((await on.listed(bruno)).tables.length, 3)
  assert.equal((await on.propose(OF_NOTAS, 'do_admin', bruno)).statusCode, 201)
  await on.approved(id, version, bruno)
})

test('permissão: o registro do 404 diz FORBIDDEN em cada rota', async (t) => {
  const on = await treatmentOn(t)
  const { id, version } = await on.proposed(OF_NOTAS)
  await memberOn(on.hub, on.companyId, CARLA, 'developer')
  const environment = serveEnvironment(t, on.hub.test.runtimeUrl)
  const { port, lines, stop } = await spawnHub(t, environment)
  try {
    async function send(method: string, path: string, cookie: string, body?: unknown) {
      return fetch(`http://127.0.0.1:${port}${path}`, {
        method,
        headers: {
          origin: TEST_ORIGIN,
          cookie,
          'cf-connecting-ip': '198.51.100.20',
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(10_000),
      })
    }
    const signedIn = await send('PUT', '/api/sessions/current', '', {
      email: CARLA.email,
      password: PASSWORD,
    })
    const cookie = String(signedIn.headers.get('set-cookie')).split(';')[0] ?? ''
    for (const [method, url, body] of routesOf(on.base, id, version)) {
      assert.equal((await send(method, url, cookie, body)).status, 404, `${method} ${url}`)
    }
  } finally {
    await stop()
  }
  const reasons = lines.filter((line) => line.msg === 'NOT_FOUND').map((line) => line.reason)
  assert.deepEqual(reasons, Array(5).fill('FORBIDDEN'))
})

test('outra empresa: o modelo dela não se lê, não muda e não se liga', async (t) => {
  const on = await treatmentOn(t)
  const other = await plantCompany(on.hub.test, on.ana.id, 'Outra Empresa', 'outra-empresa')
  const id = randomUUID()
  const hash = 'b'.repeat(64)
  await on.rows(
    `insert into treatment.model (id, company_id, name, description, created_by, created_at)
     values ($1, $2, 'venda', '', $3, now())`,
    [id, other, on.ana.id],
  )
  await on.rows(
    `insert into treatment.version (id, model_id, company_id, number, sql, inputs, hash, proposed_by, proposed_at)
     values ($1, $2, $3, 1, 'select 1', '[]', $4, $5, now())`,
    [randomUUID(), id, other, hash, on.ana.id],
  )
  for (const [method, url, body] of routesOf(on.base, id, { number: 1, hash }).filter(([, url]) =>
    url.includes(id),
  )) {
    const refused = await call(on.hub, on.ana, method, url, body)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'], `${method} ${url}`)
  }
  assert.equal((await on.listed()).tables.filter((table) => table.layer === 'negocio').length, 0)
  const [version] = await on.rows(`select approved_at from treatment.version`)
  assert.deepEqual(version, { approved_at: null })
})

/** The kit's Sankhya with a template over the partners that renames a column. */
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

/** A HubSpot table marked for the copy, whose connector declares no template. */
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
    templateVersion: on.config.aws.templateVersion,
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
    /CAST\("dtneg" AS DATE\) AS "dtneg"[^]*FROM "current"\."sankhya_notas"$/,
  )
  assert.equal(models[2]?.sql, OF_NOTAS)
})

/** The description the copy kept of a partners' column, by the column's name in the lake. */
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

/** One treatment run of a lake that ended, with how one model ended in it. */
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

/** A treatment with its version and a run that built it, as the company's rows. */
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
