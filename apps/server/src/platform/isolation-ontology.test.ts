import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from './test-database.ts'

// Two companies, each with one row of every table of the Ontology, written as the owner; each check
// enters as the company's login with the company of the transaction and no filter of ours (decision
// 0039, B3 and B4), as the other isolation tests do.
const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const ANA = PersonId.parse('person-a')
const HASH = 'a'.repeat(64)

const TABLES = [
  'inventory_run',
  'inventory_end',
  'inventory_entry',
  'proof_run',
  'proposal',
  'proposal_item',
  'revision',
  'concept_version',
  'field_version',
  'code_version',
  'relation_version',
  'source_version',
] as const
const VIEWS = ['concept', 'field', 'code', 'relation', 'source'] as const
const INVENTORY = ['inventory_run', 'inventory_end', 'inventory_entry'] as const

// One uuid per row kind and company: the kind's digit, then the company's letter.
function idOf(kind: string, letter: string) {
  return `${kind}${letter.repeat(7)}-0000-4000-8000-000000000000`
}

function seedCompany(company: CompanyId, letter: string) {
  const run = idOf('1', letter)
  const proof = idOf('2', letter)
  const proposal = idOf('3', letter)
  const connection = idOf('4', letter)
  return `
  insert into ontology.inventory_run(id, company_id, connection_id, started_at)
    values ('${run}', '${company}', '${connection}', now());
  insert into ontology.inventory_end(run_id, company_id, ended_at, outcome, reason, pages)
    values ('${run}', '${company}', now(), 'COMPLETE', null, 1);
  insert into ontology.inventory_entry(run_id, company_id, kind, name, type, label, custom)
    values ('${run}', '${company}', 'TABLE', 'TGFCAB', null, 'Cabeçalho', false);
  insert into ontology.proof_run(id, company_id, connection_id, query, query_hash, ran_at, outcome,
    reason, rows, shape) values ('${proof}', '${company}', '${connection}', 'SELECT 1', '${HASH}',
    now(), 'OK', null, 1, '[{"column":"NUNOTA","type":"I"}]');
  insert into ontology.proposal(id, company_id, demand, proposed_by, agent, base_revision, created_at,
    state) values ('${proposal}', '${company}', 'Pedido', 'person-a', null, 0, now(), 'OPEN');
  insert into ontology.proposal_item(proposal_id, company_id, n, kind, target, content, proof_run_id,
    decision) values ('${proposal}', '${company}', 1, 'SET_SOURCE', 'pedido',
    '{"concept":"pedido","sql":"SELECT 1"}', '${proof}', 'PENDING');
  insert into ontology.revision(company_id, number, proposal_id, proposed_by, approved_by, approved_at,
    hash) values ('${company}', 1, '${proposal}', 'person-a', 'person-a', now(), '${HASH}');
  insert into ontology.concept_version(company_id, key, revision, name, plural, description, synonyms,
    title_field, key_fields, base, state) values ('${company}', 'pedido', 1, 'Pedido', 'Pedidos', '',
    '{}', 'numero', '{nunota}', null, 'ACTIVE');
  insert into ontology.field_version(company_id, concept, key, revision, name, description, type,
    column_name, state) values ('${company}', 'pedido', 'nunota', 1, 'Número', '', 'ID', 'NUNOTA',
    'ACTIVE');
  insert into ontology.code_version(company_id, concept, field, value, revision, label, origin, state)
    values ('${company}', 'pedido', 'tipo', '101', 1, 'Venda', 'DICTIONARY', 'ACTIVE');
  insert into ontology.relation_version(company_id, key, revision, from_concept, to_concept,
    cardinality, pairs, from_name, to_name, state) values ('${company}', 'pedido_cliente', 1, 'pedido',
    'parceiro', 'MANY_TO_ONE', '[["codparc","codparc"]]', 'feito por', 'fez', 'ACTIVE');
  insert into ontology.source_version(company_id, concept, revision, connection_id, read, proof_run_id)
    values ('${company}', 'pedido', 1, '${connection}', '{"kind":"DOOR","sql":"SELECT 1"}',
    '${proof}');`
}

const SEED = `
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${A}', 'Empresa A', 'key-a', now(), 'key-a'), ('${B}', 'Empresa B', 'key-b', now(), 'key-b');
  ${seedCompany(A, 'a')}
  ${seedCompany(B, 'b')}`

function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

async function seeded(t: Parameters<typeof createTestDatabase>[0]) {
  const test = await createTestDatabase(t)
  await test.asOwner(SEED)
  function in_(company: CompanyId, statement: ReturnType<typeof sql>) {
    return test.database.command({ kind: 'COMPANY', companyId: company, personId: ANA }, (tx) =>
      tx.execute(statement),
    )
  }
  return {
    ...test,
    inA: (statement: ReturnType<typeof sql>) => in_(A, statement),
    inB: (statement: ReturnType<typeof sql>) => in_(B, statement),
  }
}

// What the login may change: the proposal's state and the four columns of an item's decision.
const REFUSED_UPDATES: [string, string][] = [
  ['revision', `update ontology.revision set approved_by = 'person-b'`],
  ['proof_run', `update ontology.proof_run set rows = 2`],
  ['concept_version', `update ontology.concept_version set name = 'Outro'`],
  ['field_version', `update ontology.field_version set name = 'Outro'`],
  ['code_version', `update ontology.code_version set label = 'Outro'`],
  ['relation_version', `update ontology.relation_version set from_name = 'outro'`],
  [
    'source_version',
    `update ontology.source_version set read = '{"kind":"DOOR","sql":"SELECT 2"}'`,
  ],
  [
    'o conteúdo de um item',
    `update ontology.proposal_item set content = '{"concept":"x","sql":"y"}'`,
  ],
  ['o alvo de um item', `update ontology.proposal_item set target = 'outro'`],
  ['a prova de um item', `update ontology.proposal_item set proof_run_id = null`],
  ['a demanda de uma proposta', `update ontology.proposal set demand = 'Outra'`],
  ['a base de uma proposta', `update ontology.proposal set base_revision = 9`],
  ['inventory_run', `update ontology.inventory_run set started_at = now()`],
  ['inventory_end', `update ontology.inventory_end set outcome = 'FAILED', reason = 'REFUSED'`],
  ['inventory_entry', `update ontology.inventory_entry set label = 'Outro'`],
  ['o dono de uma linha', `update ontology.proposal set company_id = '${B}'`],
]
const REFUSED_DELETES = [
  'revision',
  'proof_run',
  'proposal',
  'proposal_item',
  'concept_version',
  'field_version',
  'code_version',
  'relation_version',
  'source_version',
]

test('ontologia: a P1 no banco — só o estado e a decisão mudam, e só o inventário apaga', async (t) => {
  const { inA, asOwner } = await seeded(t)
  for (const [what, statement] of REFUSED_UPDATES) {
    await assert.rejects(inA(sql.raw(statement)), refusedWith('42501'), `UPDATE de ${what}`)
  }
  for (const table of REFUSED_DELETES) {
    await assert.rejects(
      inA(sql.raw(`delete from ontology.${table}`)),
      refusedWith('42501'),
      `DELETE de ${table}`,
    )
  }
  // A view of DISTINCT ON is no updatable view (55000), and it has no grant but SELECT besides.
  for (const view of VIEWS) {
    await assert.rejects(
      inA(sql.raw(`delete from ontology.${view}`)),
      refusedWith('55000'),
      `DELETE de ${view}`,
    )
    await assert.rejects(
      inA(sql.raw(`update ontology.${view} set company_id = company_id`)),
      refusedWith('55000'),
      `UPDATE de ${view}`,
    )
  }
  assert.deepEqual(await asOwner(`select count(*)::int as n from ontology.revision`), [{ n: 2 }])

  await inA(sql`update ontology.proposal set state = 'CLOSED'`)
  await inA(sql`update ontology.proposal_item set decision = 'REFUSED', reason = 'não',
    decided_by = 'person-a', decided_at = now()`)
  assert.deepEqual(
    await asOwner(`select p.state, i.decision, i.reason, i.decided_by is not null as by
      from ontology.proposal p join ontology.proposal_item i on i.proposal_id = p.id
      where p.company_id = '${A}'`),
    [{ state: 'CLOSED', decision: 'REFUSED', reason: 'não', by: true }],
  )
  // The same two changes in the other company's rows touch nothing: its rows are not visible.
  assert.deepEqual(await asOwner(`select state from ontology.proposal where company_id = '${B}'`), [
    { state: 'OPEN' },
  ])

  // The inventory is replaced by run: the three tables delete, in the company's own rows only.
  for (const table of ['inventory_entry', 'inventory_end', 'inventory_run']) {
    await inA(sql.raw(`delete from ontology.${table}`))
  }
  for (const table of INVENTORY) {
    assert.deepEqual(
      await asOwner(`select company_id from ontology.${table}`),
      [{ company_id: B }],
      table,
    )
  }
})

test('ontologia: a B não vê a A — lê zero e não grava com a empresa da A', async (t) => {
  const { inA, inB, asOwner } = await seeded(t)
  const counts = sql.raw(
    `select ${[...TABLES, ...VIEWS].map((name) => `(select count(*)::int from ontology.${name}) as ${name}`).join(', ')}`,
  )
  const own = Object.fromEntries([...TABLES, ...VIEWS].map((name) => [name, 1]))
  assert.deepEqual((await inA(counts)).rows, [own])
  assert.deepEqual((await inB(counts)).rows, [own])

  // B lists A's rows by naming A's company: the row policy hides them.
  for (const name of [...TABLES, ...VIEWS]) {
    const read = await inB(sql.raw(`select 1 from ontology.${name} where company_id = '${A}'`))
    assert.equal(read.rows.length, 0, name)
  }

  // B writes with A's company_id, in each table that takes an insert: the policy refuses.
  const planted = [
    `insert into ontology.inventory_run(id, company_id, connection_id, started_at)
      values (gen_random_uuid(), '${A}', gen_random_uuid(), now())`,
    `insert into ontology.proof_run(id, company_id, connection_id, query, query_hash, ran_at, outcome,
      reason, rows, shape) values (gen_random_uuid(), '${A}', gen_random_uuid(), 'SELECT 1', '${HASH}',
      now(), 'OK', null, 0, '[]')`,
    `insert into ontology.proposal(id, company_id, demand, proposed_by, base_revision, created_at,
      state) values (gen_random_uuid(), '${A}', 'Pedido', 'person-b', 0, now(), 'OPEN')`,
    `insert into ontology.concept_version(company_id, key, revision, name, plural, description,
      synonyms, title_field, key_fields, state) values ('${A}', 'pedido', 2, 'Pedido', 'Pedidos', '',
      '{}', 'numero', '{nunota}', 'ACTIVE')`,
  ]
  for (const statement of planted) {
    await assert.rejects(inB(sql.raw(statement)), refusedWith('42501'), statement.slice(0, 60))
  }
  // A revision of B that names A's proposal is no way in: the key is the pair (company, proposal).
  await assert.rejects(
    inB(sql`insert into ontology.revision(company_id, number, proposal_id, proposed_by, approved_by,
      approved_at, hash) values (${B}, 2, ${idOf('3', 'a')}, 'x', 'x', now(), ${HASH})`),
    refusedWith('23503'),
  )
  // B's own decision never reaches A's item.
  await inB(sql`update ontology.proposal_item set decision = 'APPROVED', decided_by = 'person-b',
    decided_at = now() where company_id = ${A}`)
  assert.deepEqual(
    await asOwner(`select decision from ontology.proposal_item where company_id = '${A}'`),
    [{ decision: 'PENDING' }],
  )
})

test('ontologia: o atual e o da revisão N — a visão traz a mais nova e as versões trazem a de N', async (t) => {
  const { inA, inB } = await seeded(t)
  // The proposals the revisions 2 and 3 come from: written as the company's own routes would.
  for (const number of [2, 3]) {
    await inA(sql`insert into ontology.proposal(id, company_id, demand, proposed_by, base_revision,
      created_at, state) values (gen_random_uuid(), ${A}, ${`Revisão ${number}`}, 'person-a', ${number - 1}, now(), 'CLOSED')`)
    await inA(sql`insert into ontology.revision(company_id, number, proposal_id, proposed_by,
      approved_by, approved_at, hash) select ${A}, ${number}, id, 'person-a', 'person-a', now(), ${HASH}
      from ontology.proposal where demand = ${`Revisão ${number}`}`)
    await inA(sql`insert into ontology.concept_version(company_id, key, revision, name, plural,
      description, synonyms, title_field, key_fields, state) values (${A}, 'pedido', ${number},
      ${`Pedido v${number}`}, 'Pedidos', '', '{}', 'numero', '{nunota}', 'ACTIVE')`)
  }
  const current = await inA(sql`select key, revision, name from ontology.concept order by key`)
  assert.deepEqual(current.rows, [{ key: 'pedido', revision: 3, name: 'Pedido v3' }])

  const asOf2 =
    await inA(sql`select distinct on (key) key, revision, name from ontology.concept_version
    where revision <= 2 order by key, revision desc`)
  assert.deepEqual(asOf2.rows, [{ key: 'pedido', revision: 2, name: 'Pedido v2' }])

  // The view reads with the caller's policy (security_invoker): B's current is its own, of revision 1.
  const ofB = await inB(sql`select revision from ontology.concept`)
  assert.deepEqual(ofB.rows, [{ revision: 1 }])
})
