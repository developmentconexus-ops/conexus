import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MachineTemplate } from '../apps/server/src/platform/config-machine.ts'
import { TEMPLATE, templateName } from '../infra/e2b/name.ts'

test('each build is named by its commit, so no build replaces the one before it', () => {
  assert.equal(templateName('9fd478b'), 'conexus-builder:9fd478b')
  assert.notEqual(templateName('9fd478b'), templateName('979dba7'))
})

test('a name without a commit is refused, never the bare production name', () => {
  assert.throws(() => templateName(''), /not a commit/)
  assert.throws(() => templateName('main'), /not a commit/)
})

test('the line the build prints is a value the Hub accepts, and a bare name is not', () => {
  assert.ok(MachineTemplate.safeParse(templateName('0b2d667')).success)
  assert.equal(MachineTemplate.safeParse(TEMPLATE).success, false)
})
