import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { promisify } from 'node:util'

const SERVER = join(import.meta.dirname, '..', '..')
const ROOT = join(SERVER, '..', '..')
const TSC = join(ROOT, 'node_modules', '.bin', 'tsc')

test('o tipo: abrir transação sem escopo, ou com um id que nenhum parse fez, não compila', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-check-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const config = join(dir, 'tsconfig.json')
  writeFileSync(
    config,
    JSON.stringify({
      extends: join(SERVER, 'tsconfig.json'),
      // A configuration outside the tree finds the tree's type packages only by this path.
      compilerOptions: { typeRoots: [join(ROOT, 'node_modules', '@types')] },
      include: [],
      files: [join(SERVER, 'src', 'platform', 'database.check.ts')],
    }),
  )
  const compiled = await promisify(execFile)(TSC, ['--noEmit', '-p', config], {
    timeout: 90_000,
    killSignal: 'SIGKILL',
  }).then(
    () => 'compiled',
    (error: unknown) => String(Object(error).stdout),
  )
  assert.equal(compiled, 'compiled')
})
