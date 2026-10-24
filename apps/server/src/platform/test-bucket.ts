import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'

const PAGE = 2

/** An R2 bucket in memory: put, get, list by pages of two and delete, as S3's wire speaks them. */
export async function bucketServer(t: TestContext) {
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
  return { url: `http://127.0.0.1:${address.port}`, objects, deletes, refused }
}
