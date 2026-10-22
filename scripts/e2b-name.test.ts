import assert from 'node:assert/strict'
import { test } from 'node:test'
import { templateName } from '../infra/e2b/name.ts'

test('each build is named by its commit, so no build replaces the one before it', () => {
  assert.equal(templateName('9fd478b'), 'conexus-builder:9fd478b')
  assert.notEqual(templateName('9fd478b'), templateName('979dba7'))
})

test('a name without a commit is refused, never the bare production name', () => {
  assert.throws(() => templateName(''), /not a commit/)
  assert.throws(() => templateName('main'), /not a commit/)
})
