import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, ProposedItem } from '@conexus/hub-api'
import type { ActiveSet } from './public.ts'
import { applied, hashOf, incomplete, versionsOf } from './public.ts'

const EMPTY: ActiveSet = { concepts: [], fields: [], codes: [], relations: [], sources: [] }
const concept = {
  ...{ key: 'pedido', name: 'Pedido', plural: 'Pedidos', description: '', synonyms: [] },
  ...{ titleField: 'numero', keyFields: ['numero'], state: 'ACTIVE' },
}
const field = {
  key: 'numero',
  name: 'Número',
  description: '',
  type: 'ID',
  column: 'NUNOTA',
}

function at(companyId: string, revision: number) {
  return { companyId: CompanyId.parse(companyId), revision }
}

test('o conjunto ativo: applied troca cada chave, incomplete diz o que falta, hashOf não depende da empresa, da revisão nem da ordem', () => {
  const items = [
    { n: 1, item: ProposedItem.parse({ kind: 'ADD_CONCEPT', concept }), proof: null },
    {
      n: 2,
      item: ProposedItem.parse({ kind: 'ADD_FIELD', concept: 'pedido', field }),
      proof: null,
    },
  ]
  const one = applied(EMPTY, versionsOf(EMPTY, items, at('a'.repeat(32), 1)))
  assert.deepEqual(incomplete(one), [{ target: 'pedido', needs: 'SOURCE', address: 'pedido' }])
  const other = applied(EMPTY, versionsOf(EMPTY, [...items].reverse(), at('b'.repeat(32), 7)))
  assert.equal(hashOf(one), hashOf(other))
  const renamed = versionsOf(
    one,
    [
      {
        n: 3,
        item: ProposedItem.parse({ kind: 'RENAME_LABEL', target: 'pedido', name: 'Ordem' }),
        proof: null,
      },
    ],
    at('a'.repeat(32), 2),
  )
  assert.deepEqual(
    renamed.concepts.map((row) => [row.name, row.revision]),
    [['Ordem', 2]],
  )
  assert.deepEqual(renamed.fields, [])
  assert.notEqual(hashOf(applied(one, renamed)), hashOf(one))
  assert.throws(
    () =>
      versionsOf(
        one,
        [
          {
            n: 4,
            item: ProposedItem.parse({ kind: 'DEPRECATE', target: 'cliente', reason: 'x' }),
            proof: null,
          },
        ],
        at('a'.repeat(32), 2),
      ),
    /TARGET_UNKNOWN/,
  )
})
