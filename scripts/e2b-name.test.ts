import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { MachineTemplate } from '../apps/server/src/platform/config-machine.ts'
import { TEMPLATE, templateLine, templateName } from '../infra/e2b/name.ts'
import { digests, sdkFiles } from '../infra/e2b/sdk.ts'

const ROOT = resolve(import.meta.dirname, '..')

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

test('a linha que o build imprime é o nome pedido, uma vez só o commit, e o Hub a aceita', () => {
  const line = templateLine(templateName('5a2ae2be'))
  assert.equal(line, 'HUB_E2B_TEMPLATE=conexus-builder:5a2ae2be')
  assert.ok(MachineTemplate.safeParse(line.slice('HUB_E2B_TEMPLATE='.length)).success)
})

test('a prova do SDK confere o programa da conferência, o contrato e o kit dos tipos, sem os testes que o build deixa fora', () => {
  const files = sdkFiles(ROOT)
  assert.ok(files.includes('packages/app/src/check/main.ts'))
  assert.ok(files.includes('packages/app-contract/package.json'))
  assert.ok(files.includes('packages/connectors/src/calls.ts'))
  assert.ok(
    files.every((file) => /^packages\/(app|app-contract|connectors)\//.test(file)),
    files.join('\n'),
  )
  assert.equal(
    files.filter((file) => /\.test\.tsx?$|\/node_modules\/|\/dist\//.test(file)).length,
    0,
  )
})

test('a prova escreve as linhas que o sha256sum da máquina imprime para os mesmos arquivos', () => {
  const files = ['packages/app/package.json', 'packages/app/src/check/main.ts']
  const machine = execFileSync('sha256sum', files, { cwd: ROOT, encoding: 'utf8' })
  assert.equal(digests(ROOT, files), machine)
})
