import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from '../../platform/test-database.ts'

const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const ANA = PersonId.parse('person-a')
const HASH = 'a'.repeat(64)
const PROPOSAL = '3aaaaaaa-0000-4000-8000-000000000000'
const PROOF = '2aaaaaaa-0000-4000-8000-000000000000'
const RUN = '1aaaaaaa-0000-4000-8000-000000000000'
const CONNECTION = '4aaaaaaa-0000-4000-8000-000000000000'

// Company A with its first revision, so a version has a revision to name; company B with none.
const SEED = `
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${A}', 'Empresa A', 'key-a', now(), 'key-a'), ('${B}', 'Empresa B', 'key-b', now(), 'key-b');
  insert into ontology.proposal(id, company_id, demand, proposed_by, base_revision, created_at, state)
    values ('${PROPOSAL}', '${A}', 'Pedido', 'person-a', 0, now(), 'CLOSED');
  insert into ontology.revision(company_id, number, proposal_id, proposed_by, approved_by, approved_at,
    hash) values ('${A}', 1, '${PROPOSAL}', 'person-a', 'person-a', now(), '${HASH}');
  insert into ontology.inventory_run(id, company_id, connection_id, started_at)
    values ('${RUN}', '${A}', '${CONNECTION}', now());
  insert into ontology.proof_run(id, company_id, connection_id, query, query_hash, ran_at, outcome,
    reason, rows, shape) values ('${PROOF}', '${A}', '${CONNECTION}', 'SELECT 1', '${HASH}', now(),
    'OK', null, 0, '[]');`

const CONCEPT = `insert into ontology.concept_version(company_id, key, revision, name, plural, description,
  synonyms, title_field, key_fields, base, state) values ('${A}', %KEY%, %REVISION%, 'Pedido', 'Pedidos', '', '{}',
  'numero', %FIELDS%, %BASE%, 'ACTIVE')`
const FIELD = `insert into ontology.field_version(company_id, concept, key, revision, name, description,
  type, currency, column_name, state) values ('${A}', 'pedido', 'valor', 1, 'Valor', '', %TYPE%,
  %CURRENCY%, 'VLR', 'ACTIVE')`
const RELATION = `insert into ontology.relation_version(company_id, key, revision, from_concept,
  to_concept, cardinality, pairs, from_name, to_name, through, through_pairs, state)
  values ('${A}', 'origem', 1, 'documento', 'documento', %CARDINALITY%, '[["a","b"]]', 'veio de',
  'deu origem a', %THROUGH%, %THROUGH_PAIRS%, 'ACTIVE')`

function fill(template: string, values: Record<string, string>) {
  const first: Record<string, string> = { REVISION: '1' }
  return sql.raw(
    template.replace(/%(\w+)%/g, (_, name: string) => values[name] ?? first[name] ?? 'null'),
  )
}

function violating(constraint: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'constraint' in error.cause)
    assert.equal(error.cause.constraint, constraint)
    return true
  }
}

async function seeded(t: Parameters<typeof createTestDatabase>[0]) {
  const test = await createTestDatabase(t)
  await test.asOwner(SEED)
  function inA(statement: ReturnType<typeof sql>) {
    return test.database.command({ kind: 'COMPANY', companyId: A, personId: ANA }, (tx) =>
      tx.execute(statement),
    )
  }
  return { inA }
}

test('ontologia: uma chave tem a forma de uma chave, e um conceito tem de 1 a 4 campos de chave', async (t) => {
  const { inA } = await seeded(t)
  for (const key of ["'Pedido'", "'1pedido'", "'pedido-venda'", `'${'a'.repeat(41)}'`]) {
    await assert.rejects(
      inA(fill(CONCEPT, { KEY: key, FIELDS: "'{numero}'" })),
      violating('concept_version_key'),
      key,
    )
  }
  await assert.rejects(
    inA(fill(CONCEPT, { KEY: "'pedido'", FIELDS: "'{}'" })),
    violating('concept_version_key_fields'),
  )
  await assert.rejects(
    inA(fill(CONCEPT, { KEY: "'pedido'", FIELDS: "'{a,b,c,d,e}'" })),
    violating('concept_version_key_fields'),
  )
  await inA(fill(CONCEPT, { KEY: `'${'a'.repeat(40)}'`, FIELDS: "'{a,b,c,d}'" }))
})

test('ontologia: um papel tem a sua base, que não é ele mesmo', async (t) => {
  const { inA } = await seeded(t)
  await assert.rejects(
    inA(fill(CONCEPT, { KEY: "'cliente'", FIELDS: "'{codparc}'", BASE: "'cliente'" })),
    violating('concept_version_base'),
  )
  await inA(fill(CONCEPT, { KEY: "'cliente'", FIELDS: "'{codparc}'", BASE: "'parceiro'" }))
  const role = await inA(sql`select base from ontology.concept where key = 'cliente'`)
  assert.deepEqual(role.rows, [{ base: 'parceiro' }])
})

test('ontologia: o dinheiro tem moeda, e só ele', async (t) => {
  const { inA } = await seeded(t)
  await assert.rejects(inA(fill(FIELD, { TYPE: "'MONEY'" })), violating('field_version_money'))
  await assert.rejects(
    inA(fill(FIELD, { TYPE: "'DECIMAL'", CURRENCY: "'BRL'" })),
    violating('field_version_money'),
  )
  await assert.rejects(
    inA(fill(FIELD, { TYPE: "'MONEY'", CURRENCY: "'brl'" })),
    violating('field_version_currency'),
  )
  await assert.rejects(inA(fill(FIELD, { TYPE: "'FLOAT'" })), violating('field_version_type'))
  await inA(fill(FIELD, { TYPE: "'MONEY'", CURRENCY: "'BRL'" }))
})

test('ontologia: a ligação por junção leva a junção e os seus pares, e um conceito liga a si mesmo', async (t) => {
  const { inA } = await seeded(t)
  const through = { THROUGH: "'origem_item'", THROUGH_PAIRS: `'[["b","c"]]'` }
  await assert.rejects(
    inA(fill(RELATION, { CARDINALITY: "'MANY_TO_MANY'" })),
    violating('relation_version_through'),
  )
  await assert.rejects(
    inA(fill(RELATION, { CARDINALITY: "'MANY_TO_ONE'", ...through })),
    violating('relation_version_through'),
  )
  await assert.rejects(
    inA(fill(RELATION, { CARDINALITY: "'MANY_TO_MANY'", THROUGH: "'origem_item'" })),
    violating('relation_version_through_both'),
  )
  await inA(fill(RELATION, { CARDINALITY: "'MANY_TO_MANY'", ...through }))
  const joined = await inA(
    sql`select from_concept, to_concept, through, through_pairs from ontology.relation`,
  )
  assert.deepEqual(joined.rows, [
    {
      from_concept: 'documento',
      to_concept: 'documento',
      through: 'origem_item',
      through_pairs: [['b', 'c']],
    },
  ])
})

test('ontologia: a rodada fecha uma vez, com a razão que o fim pede', async (t) => {
  const { inA } = await seeded(t)
  function end(outcome: string, reason: string | null) {
    return sql.raw(`insert into ontology.inventory_end(run_id, company_id, ended_at, outcome, reason, pages)
      values ('${RUN}', '${A}', now(), '${outcome}', ${reason === null ? 'null' : `'${reason}'`}, 1)`)
  }
  await assert.rejects(inA(end('COMPLETE', 'CAP')), violating('inventory_end_reason_outcome'))
  await assert.rejects(inA(end('FAILED', null)), violating('inventory_end_reason_outcome'))
  await assert.rejects(inA(end('FAILED', 'OUTRA')), violating('inventory_end_reason'))
  await inA(end('PARTIAL', 'CAP'))
  await assert.rejects(inA(end('COMPLETE', null)), violating('inventory_end_pkey'))
})

test('ontologia: uma prova ok não tem razão e uma que falhou tem; o item decidido tem a hora', async (t) => {
  const { inA } = await seeded(t)
  function proof(outcome: string, reason: string | null) {
    return sql.raw(`insert into ontology.proof_run(id, company_id, connection_id, query, query_hash, ran_at,
      outcome, reason, rows, shape) values (gen_random_uuid(), '${A}', '${CONNECTION}', 'SELECT 1',
      '${HASH}', now(), '${outcome}', ${reason === null ? 'null' : `'${reason}'`}, 0, '[]')`)
  }
  await assert.rejects(inA(proof('OK', 'REFUSED')), violating('proof_run_reason'))
  await assert.rejects(inA(proof('FAILED', null)), violating('proof_run_reason'))
  await inA(proof('FAILED', 'REFUSED'))

  function item(decision: string, decidedAt: string) {
    return sql.raw(`insert into ontology.proposal_item(proposal_id, company_id, n, kind, target, content,
      decision, decided_at) values ('${PROPOSAL}', '${A}', ${decision.length}, 'SET_SOURCE', 'pedido', '{}',
      '${decision}', ${decidedAt})`)
  }
  await assert.rejects(inA(item('PENDING', 'now()')), violating('proposal_item_decided'))
  await assert.rejects(inA(item('APPROVED', 'null')), violating('proposal_item_decided'))
  await inA(item('REFUSED', 'now()'))
})

test('ontologia: uma proposta da tela repete a chave de tentativa uma vez, e a conversa tem uma aberta', async (t) => {
  const { inA } = await seeded(t)
  function proposal(attemptKey: string | null, conversation: string | null, state: string) {
    return sql.raw(`insert into ontology.proposal(id, company_id, demand, proposed_by, conversation_id,
      base_revision, created_at, state, attempt_key, body_hash) values (gen_random_uuid(), '${A}', 'Pedido',
      'person-a', ${conversation === null ? 'null' : `'${conversation}'`}, 1, now(), '${state}',
      ${attemptKey === null ? 'null' : `'${attemptKey}'`}, ${attemptKey === null ? 'null' : `'${HASH}'`})`)
  }
  await inA(proposal('key-1', null, 'OPEN'))
  await assert.rejects(
    inA(proposal('key-1', null, 'OPEN')),
    violating('proposal_company_id_attempt_key_key'),
  )
  await inA(proposal(null, null, 'OPEN'))
  await inA(proposal(null, null, 'OPEN'))
  await inA(proposal(null, 'conversa-1', 'OPEN'))
  await assert.rejects(
    inA(proposal(null, 'conversa-1', 'OPEN')),
    violating('proposal_open_conversation_key'),
  )
  await inA(proposal(null, 'conversa-1', 'CLOSED'))
})

test('ontologia: uma versão nomeia uma revisão da própria empresa, e um item uma prova dela', async (t) => {
  const { inA } = await seeded(t)
  await assert.rejects(
    inA(fill(CONCEPT, { KEY: "'pedido'", FIELDS: "'{numero}'", REVISION: '2' })),
    violating('concept_version_revision_fkey'),
  )
  await assert.rejects(
    inA(sql`insert into ontology.proposal_item(proposal_id, company_id, n, kind, target, content,
      proof_run_id, decision) values (${PROPOSAL}, ${A}, 9, 'SET_SOURCE', 'pedido', '{}',
      gen_random_uuid(), 'PENDING')`),
    violating('proposal_item_proof_fkey'),
  )
})

test('ontologia: a saída da empresa apaga o que ela tem, também item e fonte que citam uma prova', async (t) => {
  const test = await createTestDatabase(t)
  await test.asOwner(SEED)
  await test.asOwner(`insert into ontology.proposal_item(proposal_id, company_id, n, kind, target,
    content, proof_run_id, decision) values ('${PROPOSAL}', '${A}', 1, 'SET_SOURCE', 'pedido', '{}',
    '${PROOF}', 'PENDING');
    insert into ontology.source_version(company_id, concept, revision, connection_id, read, proof_run_id)
    values ('${A}', 'pedido', 1, '${CONNECTION}', '{}', '${PROOF}')`)
  async function count(table: string) {
    return (await test.asOwner(`select count(*)::int as n from ontology.${table}`))[0]?.n
  }
  const tables = ['proof_run', 'proposal', 'proposal_item', 'revision', 'source_version']
  for (const table of tables) assert.equal(await count(table), 1, table)
  await test.asOwner(`delete from auth.company where id = '${A}'`)
  for (const table of [...tables, 'inventory_run']) assert.equal(await count(table), 0, table)
})
