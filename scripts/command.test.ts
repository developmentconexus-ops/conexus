import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'
import { after, test } from 'node:test'

const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function hangingGit(): { root: string; path: string } {
  const root = mkdtempSync(join(tmpdir(), 'conexus-hang-'))
  dirs.push(root)
  const bin = join(root, 'bin')
  mkdirSync(bin)
  writeFileSync(join(bin, 'git'), '#!/bin/sh\nexec sleep 60\n')
  chmodSync(join(bin, 'git'), 0o755)
  mkdirSync(join(root, 'docs/steps'), { recursive: true })
  writeFileSync(join(root, 'docs/steps/e01-x.md'), '# x\n')
  writeFileSync(
    join(root, 'docs/approvals.md'),
    'Cartão da etapa 1 aprovado em 2026-01-01 (commit abcdef1): "x"\n',
  )
  return { root, path: `${bin}${delimiter}${process.env.PATH}` }
}

const SCRIPTS: [string, (root: string) => string[]][] = [
  ['list-new-dependencies.ts', (root) => ['--base', 'main', '--root', root]],
  ['check-migrations.ts', (root) => ['--base', 'main', '--root', root]],
  ['check-method-freeze.ts', (root) => ['--base', 'main', '--root', root, '--labels', '']],
  ['check-approval.ts', (root) => [root, '--base', 'main']],
]
for (const [script, args] of SCRIPTS) {
  test(`${script} termina quando o git não responde no prazo`, () => {
    const { root, path } = hangingGit()
    const started = Date.now()
    const run = spawnSync('node', [resolve(import.meta.dirname, script), ...args(root)], {
      encoding: 'utf8',
      env: { ...process.env, PATH: path, CONEXUS_COMMAND_DEADLINE_MS: '500' },
      timeout: 20_000,
    })
    assert.equal(run.status, 1, run.stderr)
    assert.match(run.stderr, /git did not answer within 500 ms/)
    assert.ok(Date.now() - started < 15_000)
  })
}
