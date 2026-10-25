import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runningEffort } from './conversations.ts'

test('o nível em que o modelo roda: o mesmo, o mais perto abaixo, ou o mais baixo dele; Desligado só onde ele aceita', () => {
  assert.equal(runningEffort(['off', 'low', 'high'], 'high'), 'high')
  assert.equal(runningEffort(['off', 'low', 'high'], 'medium'), 'low')
  assert.equal(runningEffort(['low', 'medium', 'high'], 'off'), 'low')
  assert.equal(runningEffort(['low', 'medium', 'high'], 'max'), 'high')
  // A model whose lowest level is above the one kept from before runs at its lowest, never off.
  assert.equal(runningEffort(['off', 'medium', 'high'], 'low'), 'medium')
  assert.equal(runningEffort(['off'], 'high'), 'off')
})
