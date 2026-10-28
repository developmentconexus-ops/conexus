import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { MigrationCause } from '@conexus/hub-api'
import { askOf, reasonOf } from './migration-cause.ts'

function database(sqlstate: string, names: object = {}): MigrationCause {
  return { kind: 'database', sqlstate, ...names }
}

test('cada código do banco diz o motivo em palavras, com os nomes que trouxe', () => {
  const words = [
    ['23505', 'valor repetido'],
    ['23502', 'campo vazio'],
    ['23514', 'valor fora da regra'],
    ['22P02', 'valor que não converte'],
    ['22008', 'valor que não converte'],
    ['2BP01', 'outra tabela depende desta'],
    ['CX001', 'a versão anterior deixaria de abrir'],
    ['CX002', 'um valor salvo mudaria ou sumiria'],
  ]
  assert.deepEqual(
    words.map(([sqlstate]) => reasonOf(database(sqlstate ?? ''))),
    words.map(([, said]) => said),
  )
  assert.equal(
    reasonOf(database('CX002', { table: 'encomenda', column: 'whatsapp' })),
    'um valor salvo mudaria ou sumiria, tabela encomenda, coluna whatsapp',
  )
  assert.equal(reasonOf(database('42P01')), 'código 42P01')
})

test('a lista fixa diz a migração, o comando e o nó, e o pedido ao Builder a frase inteira', () => {
  const rule: MigrationCause = {
    kind: 'rule',
    migration: '003_publico',
    statement: 2,
    subject: 'GrantStmt',
  }
  assert.equal(
    reasonOf(rule),
    'a migração 003_publico, comando 2, faz o que o Conexus não confere (GrantStmt)',
  )
  assert.equal(
    askOf(4, rule),
    'A versão 4 não entrou: a migração 003_publico, comando 2, faz o que o Conexus não confere (GrantStmt).',
  )
  const duplicate = database('23505', { table: 'encomenda', constraint: 'encomenda_whatsapp_key' })
  assert.equal(
    askOf(7, duplicate),
    'A versão 7 não entrou: o banco recusou a migração (valor repetido, tabela encomenda, regra encomenda_whatsapp_key).',
  )
})
