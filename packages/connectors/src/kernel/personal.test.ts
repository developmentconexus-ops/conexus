import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { assertPersonal } from './conformance.ts'
import { defineOperation, get } from './operation.ts'
import type { PersonalField } from './personal.ts'
import { findUndeclared } from './personal.ts'

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
