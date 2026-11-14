import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { runCommand } from './command.ts'
import { NEVER_RERUN, neverRerun } from './rerun-exempt.ts'

const ROOT = resolve(import.meta.dirname, '..')

test('um arquivo da lista inteiro, e um teste da lista pelo seu nome ou pelo de uma suíte em volta', () => {
  assert.equal(
    neverRerun({ file: 'apps/server/src/platform/isolation.test.ts', names: ['x'] }),
    true,
  )
  const [entry] = NEVER_RERUN.tests
  assert.ok(entry)
  const name = entry.name.replace(/\\(.)/g, '$1')
  assert.equal(neverRerun({ file: entry.file, names: [name] }), true)
  assert.equal(
    neverRerun({ file: entry.file, names: ['grupo de fora', 'um teste qualquer'] }),
    false,
  )
  assert.equal(neverRerun({ file: entry.file, names: [name, 'um teste qualquer'] }), true)
})

test('um teste fora da lista ganha a segunda rodada', () => {
  assert.equal(
    neverRerun({ file: 'apps/server/src/a.test.ts', names: ['lista as conversas'] }),
    false,
  )
})

test('todo arquivo de isolamento, recusa, segredo ou acesso do repositório está na lista inteiro', () => {
  const tracked = runCommand('git', ['ls-files', '*.test.ts', '*.test.tsx'], { cwd: ROOT })
    .split('\n')
    .filter((file) =>
      /isolation|refus|recus|leak|vaz|secret|access|permission|oauth-logs|connector-tools-scope/i.test(
        file,
      ),
    )
  assert.ok(tracked.length >= 10, `${tracked.length} files`)
  assert.deepEqual(
    tracked.filter((file) => !NEVER_RERUN.files.includes(file)),
    [],
  )
})

test('a lista não guarda arquivo que sumiu', () => {
  const files = [...NEVER_RERUN.files, ...NEVER_RERUN.tests.map((entry) => entry.file)]
  assert.deepEqual(
    files.filter((file) => !existsSync(join(ROOT, file))),
    [],
  )
})

const NAMED = /\b(?:test|it|describe)(?:\.\w+)?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
const ISOLATION =
  /outra empresa|outras empresas|outro projeto|outra pessoa|de outr[ao]\b|estranh|forast|isolament|isolation|vaz(?:a|am|amento)\b|leak|alheio/i

test('todo teste ou suíte que diz outra empresa, outro Projeto, outra pessoa, isolamento ou vazamento está na lista', () => {
  const tracked = runCommand('git', ['ls-files', '*.test.ts', '*.test.tsx'], { cwd: ROOT })
    .split('\n')
    .filter((file) => /^(apps|packages|tests)\//.test(file))
  const missing = tracked.flatMap((file) =>
    [...readFileSync(join(ROOT, file), 'utf8').matchAll(NAMED)]
      .map((match) => match[2] ?? '')
      .filter((name) => ISOLATION.test(name) && !neverRerun({ file, names: [name] }))
      .map((name) => `${file}: ${name}`),
  )
  assert.deepEqual(missing, [])
})

test('todo nome da lista é uma expressão válida', () => {
  for (const entry of NEVER_RERUN.tests)
    assert.doesNotThrow(() => new RegExp(entry.name), entry.name)
})
