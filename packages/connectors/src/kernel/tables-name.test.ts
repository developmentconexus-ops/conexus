import assert from 'node:assert/strict'
import { test } from 'node:test'
import { lakeNameOf, suggestedLakeName, TableName } from '../index.ts'
import { ConnectorId } from './definition.ts'

test('o nome no lago é o prefixo mais o nome, e o da tabela só minúsculo', () => {
  assert.equal(lakeNameOf('sankhya_', 'notas'), 'sankhya_notas')
  assert.throws(() => lakeNameOf('sankhya_', 'x'.repeat(53)), 'até 60')
  assert.throws(() => lakeNameOf('sankhya_', 'Notas'), 'um nome com maiúscula não vira nome')
  assert.throws(() => TableName.parse('Notas'), 'só minúsculas')
  assert.throws(() => TableName.parse('x'.repeat(41)), 'até 40')
})

test('o nome sugerido: o prefixo do conector, o da ligação quando o nome já existe, e nunca acima de 60', () => {
  const sankhyaId = ConnectorId.parse('sankhya')
  const notas = TableName.parse('notas')
  function free() {
    return false
  }
  assert.equal(
    suggestedLakeName({
      connector: sankhyaId,
      table: notas,
      connectionName: 'Matriz',
      taken: free,
    }),
    'sankhya_notas',
  )
  function taken(name: string) {
    return name === 'sankhya_notas'
  }
  assert.equal(
    suggestedLakeName({
      connector: sankhyaId,
      table: notas,
      connectionName: 'Filial São João',
      taken,
    }),
    'sankhya_filial_sao_joao_notas',
  )
  const long = suggestedLakeName({
    connector: ConnectorId.parse('mercado-livre'),
    table: TableName.parse('periodos_de_faturamento'),
    connectionName: 'Loja oficial da empresa no marketplace',
    taken: (name) => name === 'mercado_livre_periodos_de_faturamento',
  })
  assert.equal(long, 'mercado_livre_loja_oficial_da_empres_periodos_de_faturamento')
  assert.equal(long.length, 60)
  assert.equal(
    suggestedLakeName({
      connector: ConnectorId.parse('mercado-livre'),
      table: TableName.parse('periodos_de_faturamento'),
      connectionName: 'Loja oficial da empre sa',
      taken: (name) => name === 'mercado_livre_periodos_de_faturamento',
    }),
    'mercado_livre_loja_oficial_da_empre_periodos_de_faturamento',
    'o corte que cai num _ não deixa dois',
  )
  const names = new Set(['sankhya_notas', 'sankhya_matriz_notas', 'sankhya_matriz_notas_2'])
  function held(name: string) {
    return names.has(name)
  }
  assert.equal(
    suggestedLakeName({
      connector: sankhyaId,
      table: notas,
      connectionName: 'Matriz',
      taken: held,
    }),
    'sankhya_matriz_notas_3',
    'o nome com a ligação também tomado ganha um número',
  )
  assert.equal(
    suggestedLakeName({ connector: sankhyaId, table: notas, connectionName: '東京', taken: held }),
    'sankhya_notas_2',
    'uma ligação sem letra latina não devolve o nome tomado',
  )
  const numbered = suggestedLakeName({
    connector: ConnectorId.parse('mercado-livre'),
    table: TableName.parse('periodos_de_faturamento'),
    connectionName: 'Loja oficial da empresa no marketplace',
    taken: (name) => !name.endsWith('_2'),
  })
  assert.equal(numbered, 'mercado_livre_loja_oficial_da_empres_periodos_de_faturamen_2')
  assert.equal(numbered.length, 60, 'o número cabe nos 60')
})
