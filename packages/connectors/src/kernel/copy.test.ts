import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { sankhya } from '../sankhya/definition.ts'
import type { ConnectorCopy, CopyModel } from './copy.ts'
import { CopyDefinition, CopyName, PageInput } from './copy.ts'
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
  definition: CopyDefinition.parse(DEFINITION),
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
