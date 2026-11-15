import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { assertPersonal } from './conformance.ts'
import { defineOperation, get } from './operation.ts'
import type { PersonalField } from './personal.ts'
import { documentColumns, findUndeclared } from './personal.ts'

function readWith(personal: readonly PersonalField[]) {
  return defineOperation({
    id: 'clientes',
    class: 'read',
    subject: 'cadastros',
    idempotent: true,
    summary: 'Clientes.',
    label: 'Clientes',
    input: z.object({}),
    output: z.unknown(),
    personal,
    probe: () => ({}),
    request: () => get('/clientes'),
    answer: (answer) => ({ kind: 'OK', value: answer.body }),
  })
}

const CPF = '52998224725'
const ROWS = {
  linhas: [
    {
      id: 2000000000001,
      envio: 40000000001,
      cliente: { nome: 'Maria Fictícia', documento: CPF, contato: 'maria@exemplo.test' },
      itens: [{ sku: 'PAO-001', fone: '11988776655', cpfNumero: 2345670070 }],
    },
  ],
  temMais: false,
}

test('caminho declarado que não existe', () => {
  const declared = [
    { path: 'cliente', kind: 'contato' },
    { path: 'itens', kind: 'contato' },
  ] as const
  assertPersonal(readWith(declared), ROWS)
  assert.throws(
    () => assertPersonal(readWith([...declared, { path: 'comprador', kind: 'contato' }]), ROWS),
    /clientes declares comprador, which no row of the double carries/,
  )
})

test('forma conhecida não declarada', () => {
  assert.deepEqual(findUndeclared(ROWS, []), [
    { path: 'cliente.documento', kind: 'documento' },
    { path: 'cliente.contato', kind: 'contato' },
    { path: 'itens.fone', kind: 'contato' },
    { path: 'itens.cpfNumero', kind: 'documento' },
  ])
  assert.deepEqual(findUndeclared(ROWS.linhas[0], [{ path: 'cliente', kind: 'contato' }]), [
    { path: 'itens.fone', kind: 'contato' },
    { path: 'itens.cpfNumero', kind: 'documento' },
  ])
  assert.throws(
    () => assertPersonal(readWith([{ path: 'cliente.nome', kind: 'contato' }]), ROWS),
    (error: unknown) => {
      const text = String(error instanceof Error ? error.message : error)
      assert.match(text, /clientes carries what it does not declare/)
      assert.match(text, /documento at cliente\.documento/)
      assert.match(text, /contato at itens\.fone/)
      for (const value of [CPF, 'maria@exemplo.test', '11988776655', '2345670070'])
        assert.ok(!text.includes(value), `the refusal shows ${value}`)
      return true
    },
  )
})

const [CPF_A, CPF_B, CPF_C] = ['529.982.247-25', '11144477735', '390.533.447-05'] as const
const [CNPJ_A, CNPJ_B, CNPJ_C] = [
  '11.222.333/0001-81',
  '11222333000181',
  '45.723.174/0001-10',
] as const

test('documentColumns acha a coluna de CPF e de CNPJ, com e sem máscara', () => {
  const rows = [
    ['a', CPF_A, CNPJ_A],
    ['b', CPF_B, CNPJ_B],
    ['c', CPF_C, CNPJ_C],
  ]
  assert.deepEqual(documentColumns(['nome', 'cpf', 'cnpj'], rows), ['cpf', 'cnpj'])
})

test('menos de três células não acusam', () => {
  assert.deepEqual(documentColumns(['doc'], [[CPF_A], [CPF_B], [null], ['']]), [])
  assert.deepEqual(documentColumns(['doc'], [[CPF_A], [CPF_B], [CPF_C]]), ['doc'])
})

test('metade exata não acusa e mais da metade acusa', () => {
  const half = [[CPF_A], [CPF_B], ['abc'], ['def']]
  assert.deepEqual(documentColumns(['doc'], half), [])
  assert.deepEqual(documentColumns(['doc'], [...half, [CPF_C]]), ['doc'])
})

test('um CNPJ alfanumérico conta', () => {
  const rows = [['Q0SLFMBD7VX439'], ['q0.slf.mbd/7vx4-39'], ['Q0SLFMBD7VX439']]
  assert.deepEqual(documentColumns(['doc'], rows), ['doc'])
})
