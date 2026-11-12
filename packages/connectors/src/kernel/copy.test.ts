import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { sankhya } from '../sankhya/definition.ts'
import type { ConnectorCopy, CopyModel } from './copy.ts'
import {
  CANONICAL_CELL,
  CopyDefinition,
  CopyDefinitionV1,
  CopyDefinitionV2,
  CopyName,
  CopyPosition,
  Instant,
  PageInput,
} from './copy.ts'
import { defineConnector } from './definition.ts'
import { defineOperation } from './operation.ts'

const DEFINITION = {
  version: 1,
  source: { kind: 'QUERY', sql: 'SELECT ID, NOME, ALTERADO, DIA FROM T' },
  columns: [
    { name: 'ID', type: 'bigint' },
    { name: 'NOME', type: 'text' },
    { name: 'ALTERADO', type: 'timestamp' },
    { name: 'DIA', type: 'date' },
  ],
  key: ['ID'],
  changedSince: { column: 'ALTERADO' },
  window: { column: 'DIA', days: 30 },
} as const

function refuses(change: (definition: typeof DEFINITION) => unknown, why: string) {
  assert.equal(CopyDefinition.safeParse(change(DEFINITION)).success, false, why)
}

/** At most 100 columns. */
function columnCounts() {
  refuses(
    (d) => ({
      ...d,
      columns: [
        ...d.columns,
        ...Array.from({ length: 97 }, (_, at) => ({ name: `C${at}`, type: 'text' })),
      ],
    }),
    'mais de 100 colunas',
  )
  refuses((d) => ({ ...d, source: { kind: 'QUERY', sql: '' } }), 'consulta vazia')
  assert.equal(
    CopyDefinition.safeParse({
      ...DEFINITION,
      columns: [
        ...DEFINITION.columns,
        ...Array.from({ length: 96 }, (_, at) => ({ name: `C${at}`, type: 'text' })),
      ],
    }).success,
    true,
    '100 colunas cabem',
  )
}

/** Names in lower case, as a MySQL or PostgreSQL source gives them. */
function acceptsLowerCase() {
  const lower = {
    version: 1,
    source: { kind: 'QUERY', sql: 'select id, updated_at, _flag from orders' },
    columns: [
      { name: 'id', type: 'bigint' },
      { name: 'updated_at', type: 'timestamp' },
      { name: '_flag', type: 'boolean' },
    ],
    key: ['id'],
    changedSince: { column: 'updated_at' },
  }
  assert.equal(CopyDefinition.safeParse(lower).success, true, 'nomes de MySQL ou PostgreSQL')
  assert.equal(
    CopyDefinition.safeParse({ ...lower, changedSince: null }).success,
    true,
    'sem alteração: relida inteira',
  )
}

test('a definição', () => {
  assert.equal(CopyDefinition.safeParse(DEFINITION).success, true)
  refuses((d) => ({ ...d, key: ['OUTRA'] }), 'chave fora das colunas')
  refuses((d) => ({ ...d, key: ['NOME'] }), 'chave que não é bigint')
  refuses((d) => ({ ...d, key: ['ID', 'ID'] }), 'chave repetida')
  refuses((d) => ({ ...d, changedSince: { column: 'OUTRA' } }), 'alteração fora das colunas')
  refuses((d) => ({ ...d, changedSince: { column: 'NOME' } }), 'alteração que não é data')
  refuses((d) => ({ ...d, window: { column: 'OUTRA', days: 30 } }), 'janela fora das colunas')
  refuses((d) => ({ ...d, window: { column: 'ID', days: 30 } }), 'janela que não é data')
  refuses((d) => ({ ...d, window: { column: 'DIA', days: 91 } }), 'janela de mais de 90 dias')
  for (const name of ['1ID', 'NO-ME', 'NO ME', '"ID"', 'a'.repeat(61), ''])
    refuses(
      (d) => ({ ...d, columns: [...d.columns, { name, type: 'text' }] }),
      `nome de coluna ${name}`,
    )
  refuses(
    (d) => ({ ...d, columns: [...d.columns, { name: 'NOME', type: 'text' }] }),
    'coluna repetida',
  )
  columnCounts()
  acceptsLowerCase()
  assert.equal(
    PageInput.safeParse({
      definition: DEFINITION,
      after: [1, 2],
      since: '1900-01-01',
      windowFrom: null,
      limit: 500,
    }).success,
    false,
    'um valor de after por coluna da chave',
  )
})

const copyRead = defineOperation({
  id: 'lerPaginaTeste',
  class: 'read' as const,
  subject: 'porta',
  idempotent: true,
  summary: 'Página.',
  label: 'Página',
  input: PageInput,
  output: z.object({ rows: z.array(z.array(z.string().nullable())), more: z.boolean() }),
  probe: () => null,
  request: () => ({ method: 'POST', path: '/p', query: {}, body: {} }),
  answer: () => ({ kind: 'OK', value: { rows: [], more: false } }),
})

const MODEL: CopyModel = {
  id: CopyName.parse('modelo'),
  label: 'Modelo',
  definition: CopyDefinitionV1.parse(DEFINITION),
}

/** A copy the types would refuse, to meet the run-time checks of `defineConnector`. */
const Unchecked = z.custom<ConnectorCopy>()

function withCopy(copy: unknown) {
  const { id: _id, ...rest } = sankhya
  return () => defineConnector({ ...rest, id: 'sankhya', copy: Unchecked.parse(copy) })
}

test('o kit recusa uma cópia mal declarada', () => {
  assert.equal(sankhya.copy?.models.length, 5)
  assert.deepEqual(
    sankhya.copy?.models.map((model) => model.id),
    ['clientes', 'vendedores', 'produtos', 'vendas', 'itens_venda'],
  )
  assert.doesNotThrow(withCopy({ read: copyRead, models: [MODEL] }))
  assert.throws(
    withCopy({ read: { ...copyRead, class: 'write' }, models: [MODEL] }),
    /Copy read not read/,
  )
  const door = sankhya.readDoor?.consultar
  assert.ok(door)
  assert.throws(
    withCopy({ read: { ...copyRead, id: door.id }, models: [MODEL] }),
    /repeats operation id/,
  )
  assert.throws(
    withCopy({ read: copyRead, models: [MODEL, { ...MODEL, label: 'Outro' }] }),
    /Repeated copy template id/,
  )
  assert.throws(
    withCopy({
      read: copyRead,
      models: [{ ...MODEL, definition: { ...MODEL.definition, key: ['NOME'] } }],
    }),
    z.ZodError,
  )
})

const V2 = {
  version: 2,
  source: { kind: 'OPERATION', operation: 'pedidos', input: { status: 'paid' } },
  description: 'Pedidos do mês.',
  columns: [
    { name: 'id', type: 'bigint', path: 'id', description: 'O número do pedido.' },
    { name: 'codigo', type: 'text', path: 'code' },
    { name: 'alterado', type: 'timestamp', path: 'date_last_updated' },
    { name: 'itens', type: 'json', path: 'order_items' },
    { name: 'total', type: 'numeric', path: 'total_amount' },
  ],
  key: ['id'],
  changedSince: { column: 'alterado' },
} as const

function refusesV2(change: (definition: typeof V2) => unknown, path: string, why: string) {
  const parsed = CopyDefinitionV2.safeParse(change(V2))
  assert.equal(parsed.success, false, why)
  if (!parsed.success)
    assert.ok(
      parsed.error.issues.some((issue) => issue.path.join('.').startsWith(path)),
      `${why}: ${JSON.stringify(parsed.error.issues.map((issue) => issue.path))}`,
    )
}

function acceptsAndRefusesV2() {
  assert.equal(CopyDefinitionV2.safeParse(V2).success, true)
  assert.equal(
    CopyDefinitionV2.safeParse({ ...V2, key: ['codigo'] }).success,
    true,
    'chave de texto',
  )
  assert.equal(CopyDefinitionV2.safeParse({ ...V2, changedSince: null }).success, true)
  assert.equal(
    CopyDefinitionV2.safeParse({ ...V2, key: ['id', 'codigo'] }).success,
    true,
    'chave de duas colunas',
  )
  refusesV2((d) => ({ ...d, key: ['itens'] }), 'key.0', 'chave json')
  refusesV2((d) => ({ ...d, key: ['total'] }), 'key.0', 'chave numeric')
  refusesV2((d) => ({ ...d, key: ['alterado'] }), 'key.0', 'chave timestamp')
  refusesV2((d) => ({ ...d, key: ['OUTRA'] }), 'key.0', 'chave fora das colunas')
  refusesV2((d) => ({ ...d, key: ['id', 'id'] }), 'key', 'chave repetida')
  refusesV2(
    (d) => ({ ...d, columns: [...d.columns, { name: '_conta', type: 'text', path: 'x' }] }),
    'columns.5.name',
    'nome que começa por _',
  )
  refusesV2(
    (d) => ({ ...d, columns: [...d.columns, { name: 'id', type: 'text', path: 'x' }] }),
    'columns',
    'coluna repetida',
  )
  refusesV2(
    (d) => ({ ...d, changedSince: { column: 'codigo' } }),
    'changedSince.column',
    'alteração que não é data',
  )
  refusesV2((d) => ({ ...d, window: { column: 'alterado', days: 30 } }), '', 'janela')
  refusesV2((d) => ({ ...d, description: '  ' }), 'description', 'descrição vazia')
  refusesV2(
    (d) => ({ ...d, columns: d.columns.map((c) => ({ ...c, path: 'a..b' })) }),
    'columns.0.path',
    'caminho mal formado',
  )
}

function versionsAndPositions() {
  assert.equal(
    CopyDefinition.safeParse({
      version: 1,
      source: { kind: 'QUERY', sql: 'SELECT 1' },
      columns: [{ name: 'ID', type: 'json' }],
      key: ['ID'],
      changedSince: null,
    }).success,
    false,
    'json não é da versão 1',
  )
  assert.equal(CopyDefinitionV1.safeParse(V2).success, false, 'a versão 2 não passa pela 1')

  for (const [kind, cell] of [
    ['timestamp', '2026-11-10T12:30:45.000-03:00'],
    ['timestamp', '2026-11-10T12:30:45'],
    ['json', '{"a":1}'],
  ] as const)
    assert.match(cell, CANONICAL_CELL[kind], kind)
  assert.doesNotMatch('2026-11-10', CANONICAL_CELL.timestamp)
  // an instant is the timestamp cell with its offset required: one definition
  for (const cell of ['2026-11-10T12:30:45.000-03:00', '2026-11-10T12:30:45Z'])
    assert.ok(Instant.safeParse(cell).success && CANONICAL_CELL.timestamp.test(cell), cell)
  for (const cell of ['2026-11-10T12:30:45', '2026-11-10'])
    assert.equal(Instant.safeParse(cell).success, false, cell)

  for (const position of [
    { kind: 'KEY', after: [1] },
    { kind: 'OFFSET', offset: 0 },
    { kind: 'CURSOR', cursor: 'abc', at: '2026-11-10T12:00:00.000Z' },
  ])
    assert.equal(CopyPosition.safeParse(position).success, true, position.kind)
  for (const position of [
    { kind: 'OFFSET', offset: -1 },
    { kind: 'CURSOR', cursor: '', at: '2026-11-10T12:00:00.000Z' },
    { kind: 'CURSOR', cursor: 'abc', at: 'ontem' },
  ])
    assert.equal(CopyPosition.safeParse(position).success, false, JSON.stringify(position))
}

test('a versão 2', () => {
  acceptsAndRefusesV2()
  versionsAndPositions()
})

test('as duas versões', () => {
  const v1 = CopyDefinition.parse(DEFINITION)
  assert.equal(v1.version, 1)
  assert.deepEqual(v1, CopyDefinitionV1.parse(DEFINITION), 'a versão 1 de hoje lida igual')
  const v2 = CopyDefinition.parse(V2)
  assert.equal(v2.version, 2)
  assert.deepEqual(v2, CopyDefinitionV2.parse(V2))
  assert.equal(CopyDefinition.safeParse({ ...V2, version: 3 }).success, false, 'versão 3')
  assert.equal(
    CopyDefinition.safeParse({ ...V2, window: { column: 'x', days: 1 } }).success,
    false,
    'a janela não é da versão 2',
  )
  assert.equal(
    CopyDefinition.safeParse({ ...DEFINITION, key: ['NOME'] }).success,
    false,
    'as regras da versão 1 valem na união',
  )
})
