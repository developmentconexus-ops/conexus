import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ZodError } from 'zod'
import { CONNECTORS } from '../index.ts'
import { sankhya } from '../sankhya/definition.ts'
import { defineConnector } from './definition.ts'
import { defineTables } from './tables.ts'

type Declared = Parameters<typeof defineTables>[0]['declared'][number]

const BASE: Declared = {
  name: 'teste',
  label: 'Teste',
  description: 'Uma tabela de teste.',
  group: 'vendas',
  source: { kind: 'TABLE', table: 'AD_TESTE' },
  key: ['NUNOTA'],
  mode: { kind: 'CHANGED', column: 'DTALTER', cursor: { kind: 'TIME', registry: false } },
  history: false,
  columns: {
    kind: 'DECLARED',
    columns: [
      { name: 'NUNOTA', type: 'bigint', description: null, path: 'NUNOTA' },
      { name: 'DTALTER', type: 'timestamp', description: null, path: 'DTALTER' },
      { name: 'TIPMOV', type: 'text', description: null, path: 'TIPMOV' },
    ],
  },
}

function withTables(
  declared: readonly Declared[],
  a: { discover?: boolean; ceiling?: boolean; id?: string } = {},
) {
  const { id: _id, tables, ...rest } = sankhya
  const hooks = {
    ...(a.discover === false ? {} : { discover: tables?.discover }),
    ...(a.ceiling === false ? {} : { ceiling: tables?.ceiling }),
    months: tables?.months,
    readTable: tables?.readTable,
  }
  const kept = tables?.declared ?? []
  return defineConnector({
    ...rest,
    id: a.id ?? 'sankhya',
    tables: { ...hooks, declared: [...kept, ...defineTables({ declared }).declared] },
  })
}

/** Each declaration the conformance refuses (criterion 10), with the refusal it gives. */
const REFUSED: [string, () => unknown, RegExp | typeof ZodError][] = [
  [
    'dois nomes sugeridos iguais',
    () => withTables([BASE, { ...BASE, source: { kind: 'TABLE', table: 'AD_OUTRA' } }]),
    /suggests one lake name twice/,
  ],
  ['um nome fora do padrão', () => withTables([{ ...BASE, name: 'Notas' }]), ZodError],
  ['um nome acima de 40', () => withTables([{ ...BASE, name: 'n'.repeat(41) }]), ZodError],
  [
    'a mesma origem duas vezes com uma coluna que não é da chave',
    () => withTables([BASE, { ...BASE, name: 'teste_dois' }]),
    /read twice with DTALTER/,
  ],
  [
    'uma chave fora das colunas',
    () => withTables([{ ...BASE, key: ['CODEMP'] }]),
    /names CODEMP, not one of its columns/,
  ],
  [
    'uma coluna de alteração fora das colunas',
    () =>
      withTables([
        {
          ...BASE,
          mode: { kind: 'CHANGED', column: 'DHALTER', cursor: { kind: 'TIME', registry: true } },
        },
      ]),
    /names DHALTER/,
  ],
  [
    'uma coluna de janela fora das colunas',
    () =>
      withTables([
        { ...BASE, mode: { kind: 'WINDOW', column: 'DTREF', step: 'MONTH', reread: 2 } },
      ]),
    /names DTREF/,
  ],
  [
    'uma janela sem coluna de data',
    () =>
      withTables([
        { ...BASE, mode: { kind: 'WINDOW', column: 'TIPMOV', step: 'MONTH', reread: 2 } },
      ]),
    /windows by TIPMOV, which is no date/,
  ],
  [
    'colunas descobertas sem o gancho',
    () =>
      withTables([{ ...BASE, columns: { kind: 'DISCOVERED', exclude: [] } }], {
        discover: false,
      }),
    /teste discovers its columns, and sankhya has no discovery|notas discovers its columns, and sankhya has no discovery/,
  ],
  [
    'uma tabela só do que mudou de uma fonte sem o teto',
    () => withTables([BASE], { ceiling: false }),
    /follows DTALTER, and sankhya asks no ceiling/,
  ],
  [
    'uma descoberta que não pede tabela',
    () =>
      defineConnector({
        ...sankhya,
        tables: {
          ...(sankhya.tables ?? assert.fail()),
          discover: { ...(sankhya.tables?.discover ?? assert.fail()), tables: 0 },
        },
      }),
    /A discovery asks tables/,
  ],
  [
    'uma tabela de operação sem colunas declaradas',
    () =>
      withTables([
        {
          ...BASE,
          source: { kind: 'OPERATION', operation: 'pedidos', input: {} },
          columns: { kind: 'DISCOVERED', exclude: [] },
        },
      ]),
    /reads an operation, so it declares its columns/,
  ],
  [
    'uma tabela de operação com nenhuma coluna',
    () => withTables([{ ...BASE, columns: { kind: 'DECLARED', columns: [] } }]),
    /declares no column/,
  ],
  [
    'um grupo que não é assunto',
    () => withTables([{ ...BASE, group: 'rh' }]),
    /grouped under rh, no subject/,
  ],
  [
    'uma coluna do motor',
    () =>
      withTables([
        {
          ...BASE,
          columns: {
            kind: 'DECLARED',
            columns: [
              { name: '_sdc_extracted_at', type: 'timestamp', description: null, path: 'x' },
            ],
          },
        },
      ]),
    /starts with "_", which the engine owns/,
  ],
  [
    'um prefixo acima de 20',
    () => withTables([BASE], { id: 'conector-de-nome-comprido' }),
    /prefix of conector-de-nome-comprido passes 20/,
  ],
]

test('a declaração por tabela: a conformidade recusa o que não se lê, e aceita a lista de cada conector', () => {
  for (const connector of CONNECTORS) assert.equal('copy' in connector, false, connector.id)
  assert.doesNotThrow(() => withTables([BASE]))
  for (const [what, define, refusal] of REFUSED) assert.throws(define, refusal, what)
})

test('a classe da credencial: o Sankhya compartilhável, o Mercado Livre e o HubSpot exclusiva; um login sem a classe é recusado', () => {
  const classes = Object.fromEntries(
    CONNECTORS.map((connector) => [connector.id, connector.auth.credentialClass]),
  )
  assert.deepEqual(classes, {
    sankhya: 'SHAREABLE',
    'mercado-livre': 'EXCLUSIVE',
    hubspot: 'EXCLUSIVE',
  })
  const { id: _id, auth, ...rest } = sankhya
  const { credentialClass: _class, ...unclassed } = auth
  const without = { ...rest, id: 'sankhya', auth: { ...unclassed, credentialClass: undefined } }
  assert.throws(() => defineConnector(Object(without)), /credentialClass|Invalid/)
})
