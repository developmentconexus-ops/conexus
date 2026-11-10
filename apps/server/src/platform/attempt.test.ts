import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bodyHashOf } from './attempt.ts'

test('o hash de um corpo é o que já está gravado: sha256 do JSON em base64url', () => {
  assert.equal(bodyHashOf({ name: 'Pedidos' }), 'sfYsi3uZ5lQuK8TVdVKI7BugSeRQ3vE0q2GNat0pqSk')
})

test('outro corpo, outro hash', () => {
  assert.notEqual(bodyHashOf({ name: 'Pedidos' }), bodyHashOf({ name: 'Vendas' }))
})
