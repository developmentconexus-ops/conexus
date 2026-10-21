import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { testConfig, unreachableDatabaseUrl } from '../../../platform/test-database.ts'
import { copyKey, createGitCopy, Sha } from '../public.ts'

const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const OTHER = ProjectId.parse('projectBBBBBBBBBBBBBBBBBBBBBBBBB')
const PROJECT = ProjectId.parse('projectAAAAAAAAAAAAAAAAAAAAAAAAA')
function SHA(digit: string): Sha {
  return Sha.parse(digit.repeat(40))
}
const PAGE = 2

/** An R2 bucket in memory: put, get, list by pages of two and delete, as S3's wire speaks them. */
async function bucket(t: TestContext) {
  const objects = new Map<string, Buffer>()
  const deletes: number[] = []
  const refused = new Set<string>()
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://x')
    const chunks: Buffer[] = []
    for await (const chunk of request) chunks.push(chunk)
    const body = Buffer.concat(chunks)
    const key = decodeURIComponent(url.pathname.split('/').slice(2).join('/'))
    if (request.method === 'PUT') {
      objects.set(key, body)
      response.writeHead(200, { etag: '"x"' }).end()
    } else if (request.method === 'GET' && key !== '') {
      const found = objects.get(key)
      response.writeHead(found ? 200 : 404, { 'content-length': found?.length ?? 0 }).end(found)
    } else if (request.method === 'GET') {
      const prefix = url.searchParams.get('prefix') ?? ''
      const after = url.searchParams.get('continuation-token') ?? ''
      const keys = [...objects.keys()].filter((k) => k.startsWith(prefix) && k > after).sort()
      const page = keys.slice(0, PAGE)
      const more = keys.length > PAGE
      response
        .writeHead(200, { 'content-type': 'application/xml' })
        .end(
          `<ListBucketResult><IsTruncated>${more}</IsTruncated>${more ? `<NextContinuationToken>${page.at(-1)}</NextContinuationToken>` : ''}${page.map((k) => `<Contents><Key>${k}</Key></Contents>`).join('')}</ListBucketResult>`,
        )
    } else {
      const doomed = [...body.toString().matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) => m[1] ?? '')
      deletes.push(doomed.length)
      for (const k of doomed.filter((k) => !refused.has(k))) objects.delete(k)
      const errors = doomed
        .filter((k) => refused.has(k))
        .map((k) => `<Error><Key>${k}</Key><Code>InternalError</Code><Message>no</Message></Error>`)
      response
        .writeHead(200, { 'content-type': 'application/xml' })
        .end(`<DeleteResult>${errors.join('')}</DeleteResult>`)
    }
  })
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  t.after(() => server.close())
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  const endpoint = `http://127.0.0.1:${address.port}`
  const copy = createGitCopy(testConfig(await unreachableDatabaseUrl()), endpoint)
  return { copy, objects, deletes, refused }
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
