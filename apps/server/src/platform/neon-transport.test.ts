import assert from 'node:assert/strict'
import type { ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { neonConfig } from '@neondatabase/serverless'
import { neonTransport } from './company-postgres.ts'
import { DatabaseUrl } from './database.ts'

// Neon's HTTP proxy at its door (T14): the program's transport reads a reply only up to its cap.

async function proxyAt(t: TestContext, answer: (response: ServerResponse) => void) {
  const server = createServer((request, response) => {
    request.resume()
    request.on('end', () => answer(response))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  neonConfig.fetchEndpoint = `http://127.0.0.1:${address.port}/sql`
}

const OWNER = DatabaseUrl.parse('postgresql://dono:senha@db.example.test/empresa')
const ONE_ROW = {
  results: [
    {
      command: 'SELECT',
      rowCount: 1,
      fields: [{ name: 'n', dataTypeID: 25 }],
      rows: [['um']],
      rowAsArray: true,
    },
  ],
}

test('transporte do Neon: a resposta sem tamanho declarado que passa de 1 MiB é silêncio; a pequena chega', async (t) => {
  let big = false
  await proxyAt(t, (response) => {
    response.writeHead(200, { 'content-type': 'application/json' })
    if (!big) return response.end(JSON.stringify(ONE_ROW))
    const row = JSON.stringify({ ...ONE_ROW.results[0], rows: [['x'.repeat(64 * 1024)]] })
    response.write('{"results":[')
    for (let i = 0; i < 40; i++) response.write(`${i === 0 ? '' : ','}${row}`)
    response.end(']}')
  })
  const statements = [{ text: 'SELECT 1' }]
  const signal = AbortSignal.timeout(10_000)
  assert.deepEqual(await neonTransport(OWNER, statements, signal), {
    kind: 'DONE',
    value: [[{ n: 'um' }]],
  })
  big = true
  assert.deepEqual(await neonTransport(OWNER, statements, signal), { kind: 'NO_ANSWER' })
})
