import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join, normalize, resolve } from 'node:path'
import { test } from 'node:test'
import { z } from 'zod'
import { runCommand } from './command.ts'
import { NEVER_RERUN, neverRerun } from './rerun-exempt.ts'

const ROOT = resolve(import.meta.dirname, '..')
const Rows = z.array(
  z.object({ test: z.object({ cwd: z.string(), file: z.string(), name: z.string() }) }),
)

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

test('todo teste que uma linha de remoção prova está na lista, pelo arquivo e pelo nome', () => {
  const rows = Rows.parse(JSON.parse(readFileSync(join(ROOT, 'scripts/removals.json'), 'utf8')))
  const missing = rows
    .map(({ test: row }) => ({ file: normalize(join(row.cwd, row.file)), name: row.name }))
    .filter(
      (row) =>
        !NEVER_RERUN.files.includes(row.file) &&
        !NEVER_RERUN.tests.some((entry) => entry.file === row.file && entry.name === row.name),
    )
  assert.deepEqual(missing, [])
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

test('a lista não guarda arquivo que sumiu; o nome que sumiu, a própria linha de remoção acusa', () => {
  const files = [...NEVER_RERUN.files, ...NEVER_RERUN.tests.map((entry) => entry.file)]
  assert.deepEqual(
    files.filter((file) => !existsSync(join(ROOT, file))),
    [],
  )
})
