import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Version } from '@conexus/hub-api'
import { createStatus } from './public.ts'

test('lê a versão', () => {
  const status = createStatus({ version: Version.parse('v0.1.0') })
  assert.deepEqual(status.read(), { version: 'v0.1.0' })
})

test('a versão do nome v0.1.1 também é lida', () => {
  assert.deepEqual(createStatus({ version: Version.parse('v0.1.1') }).read(), { version: 'v0.1.1' })
})

test('o objeto é congelado', () => {
  assert.ok(Object.isFrozen(createStatus({ version: Version.parse('v0.1.0') })))
})
