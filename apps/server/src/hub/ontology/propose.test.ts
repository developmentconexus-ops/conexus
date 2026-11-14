import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { PADARIA_SOL_MATRIZ, salesDatabase } from '@conexus/connectors'
import { connecting } from '../../builder/conversation/test-connecting.ts'
import { endOf, messagesOf } from '../../builder/conversation/test-conversation.ts'
import { tool } from '../../builder/conversation/test-questions.ts'

const PROPOSE = 'concept_propose'

type Field = Readonly<{ key: string; column: string; type: string }>

/** A concept's items: the concept, its fields and its source, as the Builder would send them. */
function concept(
  key: string,
  sql: string,
  fields: readonly Field[],
  shape: { keyFields: string[]; titleField: string; base?: string },
) {
  return [
    {
      kind: 'ADD_CONCEPT',
      concept: {
        ...{ key, name: key, plural: `${key}s`, description: '', synonyms: [] },
        ...{ ...shape, state: 'EXPERIMENTAL' },
      },
    },
    ...fields.map((field) => ({
      kind: 'ADD_FIELD',
      concept: key,
      field: {
        key: field.key,
        name: field.key,
        description: '',
        type: field.type,
        column: field.column,
      },
    })),
    { kind: 'SET_SOURCE', concept: key, sql },
  ]
}

const SELLERS = 'SELECT CODVEND, APELIDO FROM TGFVEN'

/** What the double holds, counted on it directly: the number a proof must report. */
function countOn(sql: string): number {
  return Number(salesDatabase(PADARIA_SOL_MATRIZ)(`SELECT COUNT(*) FROM (${sql}) Q`)?.rows[0]?.[0])
}
const VENDEDOR = concept(
  'vendedor',
  SELLERS,
  [
    { key: 'codigo', column: 'CODVEND', type: 'ID' },
    { key: 'nome', column: 'APELIDO', type: 'TEXT' },
  ],
  { keyFields: ['codigo'], titleField: 'nome' },
)

/**
 * The Builder of the test calling `concept_propose` once per batch, in one turn, on the Projeto's
 * Sankhya double run on its invented sales; the answers in order, and the conversation.
 */
async function proposed(t: TestContext, ...batches: readonly unknown[][]) {
  const steps = batches.map((items) => [
    tool(PROPOSE, { connection: 'Matriz', demand: 'os vendedores e as notas', items }),
  ])
  const on = await connecting(t, steps, null)
  await on.release(await on.link())
  assert.equal(endOf(await on.say()), 'complete')
  const answers = (await messagesOf(on.hub, on.ana, on.url))
    .flatMap((message) => message.parts)
    .flatMap((part) =>
      part.type === 'tool-invocation' && part.toolInvocation.toolName === PROPOSE
        ? [Object(part.toolInvocation.result)]
        : [],
    )
  assert.equal(answers.length, batches.length)
  return { on, answers }
}

function reasons(answer: { refused: { target: string; reason: string }[] }) {
  return Object.fromEntries(answer.refused.map((each) => [each.target, each.reason]))
}

test('a prova sem linha: a fonte grava a contagem e a forma, nome e tipo de cada coluna, e nenhuma linha do dublê', async (t) => {
  const { on, answers } = await proposed(t, VENDEDOR)
  const [answer] = answers
  assert.equal(answer.kind, 'PROPOSED', JSON.stringify(answer).slice(0, 2000))
  assert.deepEqual(answer.refused, [])
  const sellers = countOn(SELLERS)
  assert.ok(sellers > 0)
  assert.deepEqual(
    answer.items.find((each: { target: string }) => each.target === 'vendedor' && 'proof' in each)
      ?.proof,
    { rows: sellers, columns: ['CODVEND', 'APELIDO'] },
  )
  const runs = await on.hub.test.asOwner(
    'select outcome, rows::int, shape, query, outside_base from ontology.proof_run',
  )
  assert.deepEqual(runs, [
    {
      outcome: 'OK',
      rows: sellers,
      shape: [
        { column: 'CODVEND', type: 'I' },
        { column: 'APELIDO', type: 'S' },
      ],
      query: SELLERS,
      outside_base: null,
    },
  ])
  const kept = JSON.stringify(
    await on.hub.test.asOwner('select * from ontology.proof_run, ontology.proposal_item'),
  )
  for (const seller of PADARIA_SOL_MATRIZ.vendedores)
    assert.ok(!kept.includes(seller.apelido), 'no value of a row is kept')
  const items = await on.hub.test.asOwner(
    'select kind, target, decision from ontology.proposal_item order by n',
  )
  assert.deepEqual(
    items.map((row) => Object.values(row).join(' ')),
    [
      'ADD_CONCEPT vendedor PENDING',
      'ADD_FIELD vendedor.codigo PENDING',
      'ADD_FIELD vendedor.nome PENDING',
      'SET_SOURCE vendedor PENDING',
    ],
  )
})

const NOTA = concept(
  'nota',
  'SELECT NUNOTA, TIPMOV FROM TGFCAB',
  [
    { key: 'numero', column: 'NUNOTA', type: 'ID' },
    { key: 'tipo', column: 'TIPMOV', type: 'CODE' },
  ],
  { keyFields: ['numero'], titleField: 'numero' },
)

test('as recusas por item: o campo fora da prova, o código que a contagem não acha, a prova que a porta recusa e o mesmo alvo pendente duas vezes', async (t) => {
  function field(key: string, column: string) {
    return {
      kind: 'ADD_FIELD',
      concept: 'vendedor',
      field: { key, name: key, description: '', type: 'TEXT', column },
    }
  }
  function code(value: string) {
    return {
      ...{ kind: 'SET_CODE', concept: 'nota', field: 'tipo', value, label: value },
    }
  }
  const { on, answers } = await proposed(
    t,
    [
      ...VENDEDOR,
      field('comissao', 'COMISSAO'),
      ...NOTA,
      code('V'),
      code('Z'),
      { kind: 'SET_SOURCE', concept: 'falho', sql: 'SELECT NADA FROM TABELA_QUE_NAO_EXISTE' },
    ],
    [field('nome', 'APELIDO'), code('V')],
  )
  const [first, second] = answers
  assert.deepEqual(reasons(first), {
    'vendedor.comissao': 'FIELD_NOT_IN_PROOF',
    'nota.tipo=Z': 'CODE_UNSEEN',
    falho: 'PROOF_FAILED',
  })
  const failed = first.refused.find((each: { target: string }) => each.target === 'falho')
  assert.equal(typeof failed.detail, 'string', 'the type of the answer the door gave')
  assert.ok(first.items.some((each: { target: string }) => each.target === 'nota.tipo=V'))
  assert.equal(second.proposalId, first.proposalId, 'the conversation keeps one open proposal')
  assert.deepEqual(reasons(second), {
    'vendedor.nome': 'ITEM_REPEATED',
    'nota.tipo=V': 'ITEM_REPEATED',
  })
  const outcomes = await on.hub.test.asOwner(
    'select outcome, count(*)::int as n from ontology.proof_run group by outcome order by outcome',
  )
  assert.deepEqual(outcomes, [
    { outcome: 'FAILED', n: 1 },
    { outcome: 'OK', n: 2 },
  ])
  const [items] = await on.hub.test.asOwner('select count(*)::int as n from ontology.proposal_item')
  assert.equal(Object(items).n, first.items.length)
})

const PARCEIRO = concept(
  'parceiro',
  'SELECT CODPARC, NOMEPARC FROM TGFPAR',
  [
    { key: 'codigo', column: 'CODPARC', type: 'ID' },
    { key: 'nome', column: 'NOMEPARC', type: 'TEXT' },
  ],
  { keyFields: ['codigo'], titleField: 'nome' },
)

/** A role of the partner: its own read of the sellers, keyed by the partner's code. */
function role(key: string, sql: string, keyFields = ['parceiro'], base = 'parceiro') {
  return concept(
    key,
    sql,
    [
      { key: 'parceiro', column: 'CODPARC', type: 'ID' },
      { key: 'apelido', column: 'APELIDO', type: 'TEXT' },
    ],
    { keyFields, titleField: 'apelido', base },
  )
}

// The sellers of the double linked to a partner all have a registered one; a seller with no
// partner, or a key moved off the partners, is outside the base.
const REGISTERED = 'SELECT CODPARC, APELIDO FROM TGFVEN WHERE CODPARC IS NOT NULL'
const MOVED = 'SELECT CODPARC + 100000 AS CODPARC, APELIDO FROM TGFVEN'
const UNREGISTERED = countOn(MOVED)

test('o papel: fora da base é ROLE_NOT_SUBSET com a contagem, a chave de outro tamanho ROLE_KEY_MISMATCH, a base que não existe CONCEPT_INCOMPLETE, e o subconjunto aceito com a prova', async (t) => {
  const { on, answers } = await proposed(
    t,
    [...PARCEIRO, ...role('vendedor_parceiro', REGISTERED)],
    [
      ...role('fora', MOVED),
      ...role('dupla', 'SELECT CODPARC, APELIDO FROM TGFVEN', ['parceiro', 'apelido']),
      ...role('orfao', 'SELECT CODPARC, APELIDO FROM TGFVEN', ['parceiro'], 'inexistente'),
    ],
  )
  assert.ok(UNREGISTERED > 0)
  const [accepted, refused] = answers
  assert.deepEqual(accepted.refused, [])
  assert.ok(accepted.items.some((each: { target: string }) => each.target === 'vendedor_parceiro'))
  // The source is refused with the count; the concept, left without a source, is incomplete.
  const outside = refused.refused.find(
    (each: { reason: string }) => each.reason === 'ROLE_NOT_SUBSET',
  )
  assert.deepEqual(outside, {
    target: 'fora',
    reason: 'ROLE_NOT_SUBSET',
    detail: UNREGISTERED,
  })
  assert.equal(reasons(refused).dupla, 'ROLE_KEY_MISMATCH')
  assert.equal(reasons(refused).orfao, 'CONCEPT_INCOMPLETE')
  const proofs = await on.hub.test.asOwner(
    'select outside_base::int from ontology.proof_run where outside_base is not null order by outside_base',
  )
  assert.deepEqual(
    proofs.map((row) => Object(row).outside_base),
    [0, UNREGISTERED],
    'the accepted role and the refused one, each proof kept',
  )
})

const DOCUMENTO = concept(
  'documento',
  'SELECT NUNOTA FROM TGFCAB',
  [{ key: 'numero', column: 'NUNOTA', type: 'ID' }],
  { keyFields: ['numero'], titleField: 'numero' },
)
const ORIGEM_ITEM = concept(
  'origem_item',
  'SELECT NUNOTA, SEQUENCIA, NUNOTAORIG, SEQUENCIAORIG FROM TGFVAR',
  [
    { key: 'nota', column: 'NUNOTA', type: 'ID' },
    { key: 'sequencia', column: 'SEQUENCIA', type: 'INTEGER' },
    { key: 'nota_origem', column: 'NUNOTAORIG', type: 'ID' },
    { key: 'sequencia_origem', column: 'SEQUENCIAORIG', type: 'INTEGER' },
  ],
  { keyFields: ['nota', 'sequencia'], titleField: 'nota' },
)

function origem(key: string, relation: object) {
  return {
    kind: 'ADD_RELATION',
    relation: {
      ...{ key, from: 'documento', to: 'documento', cardinality: 'MANY_TO_MANY' },
      ...{ fromName: 'Documento', toName: 'Documento de origem', through: 'origem_item' },
      ...{ pairs: [['numero', 'nota']], throughPairs: [['nota_origem', 'numero']] },
      ...relation,
    },
  }
}

test('a junção: Documento com Documento pela Origem do item é aceita com os dois pares; sem throughPairs, ou com um campo de par fora da junção, RELATION_INVALID', async (t) => {
  const { answers } = await proposed(t, [
    ...DOCUMENTO,
    ...ORIGEM_ITEM,
    origem('origem', {}),
    origem('sem_volta', { throughPairs: undefined }),
    origem('fora_da_juncao', { pairs: [['numero', 'inexistente']] }),
  ])
  const [answer] = answers
  assert.ok(answer.items.some((each: { target: string }) => each.target === '@origem'))
  assert.deepEqual(reasons(answer), {
    '@sem_volta': 'RELATION_INVALID',
    '@fora_da_juncao': 'RELATION_INVALID',
  })
})
