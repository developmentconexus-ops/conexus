import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { bucketServer } from '../../../platform/test-bucket.ts'
import { testConfig, unreachableDatabaseUrl } from '../../../platform/test-database.ts'
import { copyKey, createGitCopy, Sha } from '../public.ts'

const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const OTHER = ProjectId.parse('projectBBBBBBBBBBBBBBBBBBBBBBBBB')
const PROJECT = ProjectId.parse('projectAAAAAAAAAAAAAAAAAAAAAAAAA')
function SHA(digit: string): Sha {
  return Sha.parse(digit.repeat(40))
}

async function bucket(t: TestContext) {
  const { url, ...state } = await bucketServer(t)
  return { copy: createGitCopy(testConfig(await unreachableDatabaseUrl()), url), ...state }
}

test('cópia: cada versão é um objeto, repetir a mesma é o mesmo objeto, e a última volta inteira', async (t) => {
  const { copy, objects } = await bucket(t)
  const base = { companyId: COMPANY, projectId: PROJECT }
  await copy.put({ ...base, version: 1, sha: SHA('a'), bundle: Buffer.from('um') })
  await copy.put({ ...base, version: 2, sha: SHA('b'), bundle: Buffer.from('dois') })
  await copy.put({ ...base, version: 2, sha: SHA('b'), bundle: Buffer.from('dois') })
  await copy.put({ ...base, version: 10, sha: SHA('c'), bundle: Buffer.from('dez') })
  assert.deepEqual([...objects.keys()].sort(), [
    `git/${COMPANY}/${PROJECT}/00000001-${SHA('a')}.bundle`,
    `git/${COMPANY}/${PROJECT}/00000002-${SHA('b')}.bundle`,
    `git/${COMPANY}/${PROJECT}/00000010-${SHA('c')}.bundle`,
  ])
  const latest = await copy.latest({ ...base, maxBytes: 1_000 })
  assert.deepEqual(latest, { version: 10, sha: SHA('c'), bundle: Buffer.from('dez') })
  assert.equal(await copy.latest({ ...base, maxBytes: 2 }), null)
  assert.equal(await copy.latest({ companyId: COMPANY, projectId: OTHER, maxBytes: 1_000 }), null)
  assert.equal(
    copyKey({ ...base, version: 3, sha: SHA('d') }).endsWith(`00000003-${SHA('d')}.bundle`),
    true,
  )
})

test('cópia: remover o Projeto apaga de mil em mil e deixa os outros Projetos', async (t) => {
  const { copy, objects, deletes } = await bucket(t)
  for (let n = 1; n <= 1_001; n++) {
    objects.set(
      `git/${COMPANY}/${PROJECT}/${String(n).padStart(8, '0')}-${SHA('a')}.bundle`,
      Buffer.alloc(0),
    )
  }
  objects.set(`git/${COMPANY}/${OTHER}/00000001-${SHA('b')}.bundle`, Buffer.alloc(0))
  await copy.removeProject({ companyId: COMPANY, projectId: PROJECT })
  assert.deepEqual(deletes, [1_000, 1])
  assert.deepEqual([...objects.keys()], [`git/${COMPANY}/${OTHER}/00000001-${SHA('b')}.bundle`])
})

test('cópia: o R2 recusa uma chave com 200 e a remoção falha, para tentar de novo', async (t) => {
  const { copy, objects, refused } = await bucket(t)
  const kept = `git/${COMPANY}/${PROJECT}/00000001-${SHA('a')}.bundle`
  objects.set(kept, Buffer.alloc(0))
  objects.set(`git/${COMPANY}/${PROJECT}/00000002-${SHA('b')}.bundle`, Buffer.alloc(0))
  refused.add(kept)
  await assert.rejects(copy.removeProject({ companyId: COMPANY, projectId: PROJECT }))
  assert.deepEqual([...objects.keys()], [kept])
  refused.clear()
  await copy.removeProject({ companyId: COMPANY, projectId: PROJECT })
  assert.equal(objects.size, 0)
})

test('cópia: um id hostil não chega à chave nem à remoção, e nada sai para o R2', async (t) => {
  const { copy, objects, deletes } = await bucket(t)
  const kept = `git/${COMPANY}/${PROJECT}/00000001-${SHA('a')}.bundle`
  objects.set(kept, Buffer.alloc(0))
  const hostile: ProjectId[] = JSON.parse(
    '["../projectAAAAAAAAAAAAAAAAAAAAAAAAA", "", "a/b", "a\\u0000b"]',
  )
  for (const projectId of hostile) {
    const ids = { companyId: COMPANY, projectId }
    assert.throws(() => copyKey({ ...ids, version: 1, sha: SHA('a') }))
    await assert.rejects(copy.put({ ...ids, version: 1, sha: SHA('a'), bundle: Buffer.alloc(0) }))
    await assert.rejects(copy.latest({ ...ids, maxBytes: 1_000 }))
    await assert.rejects(copy.removeProject(ids))
  }
  const company: CompanyId = JSON.parse('".."')
  await assert.rejects(copy.removeProject({ companyId: company, projectId: PROJECT }))
  assert.deepEqual([...objects.keys()], [kept])
  assert.deepEqual(deletes, [])
})
