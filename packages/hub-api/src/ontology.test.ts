import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ItemContent, ProofShape, ProposedItem, RelationPairs, SourceRead } from './ontology.ts'

test('as colunas jsonb: de 1 a 4 pares de campos, e a forma da prova até 200 colunas', () => {
  assert.ok(RelationPairs.safeParse([['codparc', 'codparc']]).success)
  assert.ok(!RelationPairs.safeParse([]).success)
  assert.ok(!RelationPairs.safeParse(Array.from({ length: 5 }, () => ['a', 'b'])).success)
  assert.ok(!RelationPairs.safeParse([['Codparc', 'codparc']]).success)
  assert.ok(ProofShape.safeParse([{ column: 'NUNOTA', type: null }]).success)
  assert.ok(
    !ProofShape.safeParse(Array.from({ length: 201 }, () => ({ column: 'A', type: 'I' }))).success,
  )
  assert.ok(SourceRead.safeParse({ kind: 'DOOR', sql: 'SELECT 1' }).success)
  assert.ok(!SourceRead.safeParse({ kind: 'DOOR', sql: 'x'.repeat(4001) }).success)
  assert.ok(!SourceRead.safeParse({ kind: 'FILE', sql: 'SELECT 1' }).success)
})

test('o conteúdo de um item é o do seu tipo sem o tipo, ou uma nota; uma mistura não passa', () => {
  const source = { concept: 'pedido', sql: 'SELECT 1' }
  assert.ok(ProposedItem.safeParse({ kind: 'SET_SOURCE', ...source }).success)
  assert.ok(ItemContent.safeParse(source).success)
  assert.ok(ItemContent.safeParse({ target: 'pedido.tipo', name: 'Tipo' }).success)
  assert.ok(!ItemContent.safeParse({ ...source, target: 'pedido' }).success)
})

test('a ligação por junção leva os pares até a junção e os da junção até o outro lado', () => {
  const relation = {
    key: 'origem',
    from: 'documento',
    to: 'documento',
    cardinality: 'MANY_TO_MANY',
    pairs: [['nunota', 'nunota']],
    fromName: 'veio de',
    toName: 'deu origem a',
    through: 'origem_item',
    throughPairs: [['nunota_origem', 'nunota']],
  }
  assert.ok(ProposedItem.safeParse({ kind: 'ADD_RELATION', relation }).success)
  assert.ok(
    !ProposedItem.safeParse({ kind: 'ADD_RELATION', relation: { ...relation, throughPairs: [] } })
      .success,
  )
})
