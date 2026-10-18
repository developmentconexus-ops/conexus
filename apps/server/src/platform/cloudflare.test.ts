import assert from 'node:assert/strict'
import type { ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { WorkerUpload } from './cloudflare.ts'
import { createCloudflareApps } from './cloudflare.ts'
import { testAppsConfig } from './test-cloudflare.ts'
import { testConfig, unreachableDatabaseUrl } from './test-database.ts'

// Cloudflare's API at its HTTP door (T14): each test names the answer, and every request is kept.
type Answer = (response: ServerResponse, path: string) => void

async function cloudflareAt(t: TestContext, answer: Answer) {
  const paths: string[] = []
  const server = createServer((request, response) => {
    request.resume()
    request.on('end', () => {
      paths.push(`${request.method} ${request.url}`)
      answer(response, request.url ?? '')
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  const config = {
    ...testConfig(await unreachableDatabaseUrl()),
    ...testAppsConfig(`http://127.0.0.1:${address.port}/client/v4`),
  }
  const logged: unknown[] = []
  const log = { info: () => undefined, error: (fields: unknown) => logged.push(fields) }
  return { cloudflare: createCloudflareApps({ config, log }), paths, logged }
}

function json(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}

const UPLOAD: WorkerUpload = {
  worker: 'v-1',
  mainModule: 'worker.js',
  compatibilityDate: '2026-10-18',
  files: [
    {
      path: 'worker.js',
      bytes: new TextEncoder().encode('export default {}'),
      mediaType: 'text/javascript',
    },
  ],
  tags: ['company-c', 'project-p'],
  cpuMs: 50,
}

test('cloudflare: uma resposta sem tamanho declarado que passa de 1 MiB é silêncio, lida só até o teto', async (t) => {
  const { cloudflare } = await cloudflareAt(t, (response) => {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.write('{"success":true,"result":"')
    response.end(`${'x'.repeat(2 * 1024 * 1024)}"}`)
  })
  assert.deepEqual(await cloudflare.exists('v-1'), { kind: 'NO_ANSWER' })
})

test('cloudflare: o código que não inicia (10021) é NOT_STARTING; outra recusa é REFUSED, registrada só pelos códigos', async (t) => {
  const errors = [[{ code: 10_021, message: 'Uncaught Error: segredo' }], [{ code: 10_000 }]]
  const { cloudflare, logged } = await cloudflareAt(t, (response) =>
    json(response, 400, { success: false, errors: errors.shift(), result: null }),
  )
  assert.deepEqual(await cloudflare.upload(UPLOAD), { kind: 'DONE', value: 'NOT_STARTING' })
  assert.deepEqual(await cloudflare.upload(UPLOAD), { kind: 'REFUSED' })
  assert.doesNotMatch(JSON.stringify(logged), /segredo/)
})

test('cloudflare: o script removido lê como ausente, e remover o que já saiu é removido', async (t) => {
  const { cloudflare, paths } = await cloudflareAt(t, (response) =>
    json(response, 404, { success: false, errors: [{ code: 10_007 }], result: null }),
  )
  assert.deepEqual(await cloudflare.exists('v-1'), { kind: 'DONE', value: false })
  assert.deepEqual(await cloudflare.remove('v-1'), { kind: 'DONE', value: 'REMOVED' })
  assert.match(
    paths[0] ?? '',
    /^GET \/client\/v4\/accounts\/a{32}\/workers\/dispatch\/namespaces\/conexus-apps-test\/scripts\/v-1$/,
  )
})
