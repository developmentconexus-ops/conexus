import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'
import { templateName } from '../infra/e2b/name.ts'

const RELEASES = resolve(import.meta.dirname, '../infra/releases.sh')
const dir = mkdtempSync(join(tmpdir(), 'conexus-releases-'))
after(() => rmSync(dir, { recursive: true, force: true }))

const IMAGE = 'ghcr.io/developmentconexus-ops/conexus-hub'
const FIRST = `${IMAGE}@sha256:${'a'.repeat(64)}`
const SECOND = `${IMAGE}@sha256:${'b'.repeat(64)}`
// What the build names, so the record keeps exactly the shape infra/e2b/name.ts owns.
const TEMPLATE = templateName('5a2ae2be')

function releases(records: string, ...args: string[]) {
  return spawnSync('/bin/bash', [RELEASES, ...args], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH, RELEASES_DIR: records },
  })
}

function records() {
  return mkdtempSync(join(dir, 'records-'))
}

test('o que o Release registra, a volta encontra', () => {
  const at = records()
  const record = releases(at, 'record', 'v1.2.3', FIRST, TEMPLATE)
  assert.equal(record.status, 0, record.stderr)
  const found = releases(at, 'find', 'v1.2.3')
  assert.equal(found.status, 0, found.stderr)
  assert.equal(found.stdout, `${FIRST} ${TEMPLATE}\n`)
  assert.deepEqual(readdirSync(at), ['v1.2.3'])
})

test('registrar a mesma versão de novo troca o digest', () => {
  const at = records()
  assert.equal(releases(at, 'record', 'v1.2.3', FIRST, TEMPLATE).status, 0)
  assert.equal(releases(at, 'record', 'v1.2.3', SECOND, templateName('1111111')).status, 0)
  assert.equal(releases(at, 'find', 'v1.2.3').stdout, `${SECOND} conexus-builder:1111111\n`)
})

test('uma versão sem registro é recusada', () => {
  const at = records()
  releases(at, 'record', 'v1.2.3', FIRST, TEMPLATE)
  const found = releases(at, 'find', 'v1.2.4')
  assert.equal(found.status, 1)
  assert.equal(found.stdout, '')
  assert.match(found.stderr, /^no record of a Publish of v1\.2\.4 on this server\n$/)
})

test('recusa registrar um nome de versão ou uma referência que não são os esperados', () => {
  const at = records()
  for (const version of ['1.2.3', 'v1.2', 'v1.2.3-rc1', '../v1.2.3', 'v1.2.3\n']) {
    const run = releases(at, 'record', version, FIRST, TEMPLATE)
    assert.equal(run.status, 1, version)
    assert.match(run.stderr, /is not a version name/)
  }
  for (const reference of [
    `${IMAGE}:v1.2.3`,
    `${IMAGE}@sha256:${'a'.repeat(63)}`,
    `${IMAGE}@sha256:${'A'.repeat(64)}`,
    `ghcr.io/other/conexus-hub@sha256:${'a'.repeat(64)}`,
    `${FIRST}\nextra`,
  ]) {
    const run = releases(at, 'record', 'v1.2.3', reference, TEMPLATE)
    assert.equal(run.status, 1, reference)
    assert.match(run.stderr, /is not an image reference by digest/)
  }
  for (const template of [
    'conexus-builder',
    'conexus-builder:main',
    'other:5a2ae2be',
    `${TEMPLATE} x`,
  ]) {
    const run = releases(at, 'record', 'v1.2.3', FIRST, template)
    assert.equal(run.status, 1, template)
    assert.match(run.stderr, /is not a template of a commit/)
  }
  assert.deepEqual(readdirSync(at), [])
  assert.match(releases(at, 'find', 'latest').stderr, /is not a version name/)
})

test('sem a pasta dos registros, registrar é recusado', () => {
  const run = releases(join(dir, 'missing'), 'record', 'v1.2.3', FIRST, TEMPLATE)
  assert.equal(run.status, 1)
  assert.match(run.stderr, /no records directory at .*missing/)
})

test('um registro adulterado que não é um digest é recusado ao procurar', () => {
  const at = records()
  writeFileSync(join(at, 'v1.2.3'), `${IMAGE}:v9.9.9\n`)
  const found = releases(at, 'find', 'v1.2.3')
  assert.equal(found.status, 1)
  assert.equal(found.stdout, '')
  assert.match(found.stderr, /the record of v1\.2\.3 is not an image reference by digest/)
})

test('um registro de antes do template devolve só o digest, e a volta mantém o template no ar', () => {
  const at = records()
  writeFileSync(join(at, 'v0.18.1'), `${FIRST}\n`)
  const found = releases(at, 'find', 'v0.18.1')
  assert.equal(found.status, 0, found.stderr)
  assert.equal(found.stdout, `${FIRST}\n`)
})

test('um registro adulterado no template é recusado ao procurar', () => {
  const at = records()
  writeFileSync(join(at, 'v1.2.3'), `${FIRST} conexus-builder:$(id)\n`)
  const found = releases(at, 'find', 'v1.2.3')
  assert.equal(found.status, 1)
  assert.equal(found.stdout, '')
  assert.match(found.stderr, /the record of v1\.2\.3 is not a template of a commit/)
})
