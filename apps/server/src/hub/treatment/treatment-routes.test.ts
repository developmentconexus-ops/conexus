import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { queued, withOwnerLock } from '../../platform/test-database.ts'
import { ANA_OWNER, BRUNO, codeOf, memberOn } from '../identity/test-hub.ts'
import { OF_NOTAS, refusalOf, tableOf, treatmentOn } from './test-treatment.ts'

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
  assert.deepEqual([view.active?.number, view.proposal?.number], [1, 2])
  await on.approved(id, second)
  const after = tableOf(await on.listed(), 'negocio', 'venda')
  assert.ok(after.layer === 'negocio')
  assert.deepEqual([after.active?.number, after.proposal], [2, null])
  const bothBound = await on.read(id)
  assert.deepEqual(
    bothBound.versions.map((v) => v.approvedAt !== null),
    [true, true],
  )
  assert.deepEqual([bothBound.active?.number, bothBound.proposal], [2, null])
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

test('Tratar agora: abre uma rodada com todos os modelos da empresa e responde 202 sem esperar; com uma aberta, ALREADY_RUNNING', async (t) => {
  const on = await treatmentOn(t)
  const venda = await on.proposed(OF_NOTAS)
  await on.approved(venda.id, venda.version)

  const opened = await on.treatNow()
  assert.equal(opened.statusCode, 202, opened.body)
  await on.hub.treatment.idle()
  const [run, ...more] = await on.treatRuns()
  assert.deepEqual(more, [])
  assert.deepEqual(opened.json(), { run: run?.id })
  assert.deepEqual(
    [run?.cause, run?.state, run?.select],
    ['NOW', 'RUNNING', ['tratado__sankhya_notas', 'tratado__sankhya_parceiros', 'negocio__venda']],
  )

  const again = await on.treatNow()
  assert.deepEqual([again.statusCode, codeOf(again)], [409, 'ALREADY_RUNNING'])
  assert.equal((await on.treatRuns()).length, 1)
})

test('Tratar agora: o lago sem a receita nova recusa com LAKE_NOT_READY, e sem modelo com NOTHING_TO_TREAT; nada abre', async (t) => {
  const on = await treatmentOn(t)
  await on.rows(`update lake.company_lake set template = repeat('0', 64)`)
  const outdated = await on.treatNow()
  assert.deepEqual([outdated.statusCode, codeOf(outdated)], [409, 'LAKE_NOT_READY'])
  await on.rows(`update lake.company_lake set template = $1`, [on.config.aws.templateVersion])
  await on.rows(`delete from copies.lake_table`)
  const empty = await on.treatNow()
  assert.deepEqual([empty.statusCode, codeOf(empty)], [409, 'NOTHING_TO_TREAT'])
  assert.deepEqual(await on.treatRuns(), [])
})
