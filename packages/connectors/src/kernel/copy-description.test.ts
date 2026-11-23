import assert from 'node:assert/strict'
import { test } from 'node:test'
import { copyPrefixOf } from './copy.ts'

test('o prefixo troca o hífen', () => {
  assert.equal(copyPrefixOf('mercado-livre'), 'mercado_livre_')
})
