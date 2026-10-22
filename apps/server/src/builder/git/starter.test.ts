import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { openRepository } from './public.ts'

const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const PROJECT = ProjectId.parse('projectAAAAAAAAAAAAAAAAAAAAAAAAA')

test('git: o primeiro commit guarda o starter, não é versão, e um segundo ensure não o regrava', async (t) => {
  const infos: Record<string, unknown>[] = []
  const root = mkdtempSync(join(tmpdir(), 'conexus-starter-test-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const repository = openRepository({
    root,
    companyId: COMPANY,
    projectId: PROJECT,
    log: { info: (fields) => infos.push(fields), error: () => undefined },
  })
  const first = await repository.ensure()
  assert.equal(await repository.version(), 0)
  const paths = ((await repository.tree(first)) ?? []).map((file) => file.path)
  assert.equal(await repository.contains(first), true)
  assert.ok(
    paths.includes('src/main.tsx') &&
      paths.includes('src/router.tsx') &&
      paths.includes('package.json'),
  )
  assert.equal(
    paths.some((path) => /^(server|shared|node_modules|dist)\//.test(path)),
    false,
  )
  assert.equal(await repository.ensure(), first)
  assert.deepEqual(infos, [{ companyId: COMPANY, projectId: PROJECT }])
})
