import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { commit, git, scope } from './ci-scope-lab.ts'

test('o scope lê o intervalo do push e só chama de documento o que a lista nomeia', () => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-scope-'))
  try {
    git(dir, 'init', '-q')
    const base = commit(dir, { 'docs/a.md': 'a', 'scripts/s.ts': 's' })
    const documents = commit(dir, { 'docs/b.md': 'b', 'AGENTS.md': 'x' })
    assert.equal(scope(dir, 'push', base, documents), 'code=false')
    const mixed = commit(dir, { 'docs/c.md': 'c', 'scripts/s.ts': 'changed' })
    assert.equal(scope(dir, 'push', documents, mixed), 'code=true')
    assert.equal(scope(dir, 'push', '0'.repeat(40), mixed), 'code=true')
    git(dir, 'mv', 'scripts/s.ts', 'docs/s.md')
    const renamed = commit(dir, {})
    assert.equal(scope(dir, 'push', mixed, renamed), 'code=true')
    assert.equal(scope(dir, 'schedule', base, documents), 'code=true')
  } finally {
    rmSync(dir, { recursive: true, force: true })
    rmSync(`${dir}.output`, { force: true })
  }
})
