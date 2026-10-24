import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { openRepository, repositoriesIn, Sha } from './public.ts'

const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const PROJECT = ProjectId.parse('projectAAAAAAAAAAAAAAAAAAAAAAAAA')

test('git: a marca da cópia fica no repositório, e uma versão que a cópia perdeu sai com a próxima', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'conexus-copied-test-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const repository = openRepository({
    root,
    companyId: COMPANY,
    projectId: PROJECT,
    log: { info: () => undefined, error: () => undefined },
  })
  const starter = await repository.ensure()
  assert.equal(await repository.uncopied(), null, 'the starter is no version')
  const dir = join(root, COMPANY, `${PROJECT}.git`)
  function next(parent: Sha): Sha {
    const tree = execFileSync('git', ['--git-dir', dir, 'write-tree'], { encoding: 'utf8' }).trim()
    const author = ['-c', 'user.name=Teste', '-c', 'user.email=teste@example.test']
    const args = [...author, '--git-dir', dir, 'commit-tree', tree, '-p', parent, '-m', 'versão']
    const commit = Sha.parse(execFileSync('git', args, { encoding: 'utf8' }).trim())
    execFileSync('git', ['--git-dir', dir, 'update-ref', 'refs/heads/main', commit])
    return commit
  }
  const first = next(starter)
  assert.equal(await repository.uncopied(), first)
  const second = next(first)
  assert.equal(
    await repository.uncopied(),
    second,
    'the first was never copied: one copy covers both',
  )
  await repository.markCopied(second)
  assert.equal(await repository.uncopied(), null)
  assert.deepEqual(await repositoriesIn(root), [{ companyId: COMPANY, projectId: PROJECT }])
  assert.deepEqual(await repositoriesIn(join(root, 'nothing')), [])
})
