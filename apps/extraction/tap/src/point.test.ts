import assert from 'node:assert/strict'
import { test } from 'node:test'
import { behind, latest } from './point.ts'

test('o número passa de 15 dígitos sem arredondar', () => {
  assert.equal(latest(['9007199254740993', '9007199254740992'], 'bigint'), '9007199254740993')
  assert.equal(behind('9007199254740993', 1), '9007199254740992')
})

test('o decimal compara pela escala, e o atraso mantém as casas', () => {
  assert.equal(latest(['10.5', '9.75', '10.45'], 'numeric'), '10.5')
  assert.equal(latest(['2', '1.999'], 'numeric'), '2')
  assert.equal(behind('105.25', 100), '5.25')
  assert.equal(behind('5.25', 100), '-94.75')
  assert.equal(behind('100.05', 100), '0.05')
})

test('o que não é número é recusado', () => {
  assert.throws(() => behind('2026-11-27', 1), /Not a number/)
})
