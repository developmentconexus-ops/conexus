import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TableRef } from '@conexus/hub-api'
import type { LastStatus, ModelGraph } from './public.ts'
import { ModelName, selection } from './public.ts'

function ref(layer: string, table: string) {
  return TableRef.parse({ layer, table })
}

const GRAPH: ModelGraph = [
  { name: ModelName.parse('tratado__sankhya_notas'), inputs: [ref('current', 'sankhya_notas')] },
  {
    name: ModelName.parse('tratado__sankhya_parceiros'),
    inputs: [ref('current', 'sankhya_parceiros')],
  },
  { name: ModelName.parse('negocio__venda'), inputs: [ref('tratado', 'sankhya_notas')] },
  { name: ModelName.parse('negocio__painel'), inputs: [ref('negocio', 'venda')] },
]

function last(entries: Record<string, 'BUILT' | 'FAILED' | 'SKIPPED'>): LastStatus {
  return new Map(Object.entries(entries).map(([name, status]) => [ModelName.parse(name), status]))
}

const ALL_BUILT = last({
  tratado__sankhya_notas: 'BUILT',
  tratado__sankhya_parceiros: 'BUILT',
  negocio__venda: 'BUILT',
  negocio__painel: 'BUILT',
})

test('a seleção: os modelos abaixo da tabela copiada, até o último que a lê por outro modelo', () => {
  assert.deepEqual(selection(GRAPH, [ref('current', 'sankhya_notas')], ALL_BUILT), [
    'tratado__sankhya_notas',
    'negocio__venda',
    'negocio__painel',
  ])
  assert.deepEqual(selection(GRAPH, [ref('current', 'sankhya_parceiros')], ALL_BUILT), [
    'tratado__sankhya_parceiros',
  ])
})

test('a seleção: nada a tratar quando a tabela copiada não tem modelo e tudo foi gravado', () => {
  assert.deepEqual(selection(GRAPH, [ref('current', 'sankhya_vendedores')], ALL_BUILT), [])
  assert.deepEqual(selection([], [ref('current', 'sankhya_notas')], new Map()), [])
})

test('a seleção: o nunca gravado e o que falhou ou pulou por último entram, com o que está abaixo deles', () => {
  assert.deepEqual(
    selection(GRAPH, [], last({ ...Object.fromEntries(ALL_BUILT), negocio__venda: 'FAILED' })),
    ['negocio__venda', 'negocio__painel'],
  )
  assert.deepEqual(
    selection(GRAPH, [], last({ ...Object.fromEntries(ALL_BUILT), negocio__painel: 'SKIPPED' })),
    ['negocio__painel'],
  )
  const firstLake = selection(GRAPH, [ref('current', 'sankhya_parceiros')], new Map())
  assert.deepEqual(
    firstLake,
    GRAPH.map(({ name }) => name),
  )
})
