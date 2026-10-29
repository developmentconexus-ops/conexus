import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { fetchText } from './spec-source.ts'

async function serving(
  handle: Parameters<typeof createServer>[1],
  use: (origin: string) => Promise<void>,
) {
  const server = createServer(handle)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  try {
    await use(`http://127.0.0.1:${address.port}`)
  } finally {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
}

test('uma página que o site não termina de mandar acaba no prazo, e uma grande demais no teto', async () => {
  const limits = { seconds: 0.2, bytes: 1000 }
  await serving(
    (_request, response) => {
      response.write('start')
    },
    async (origin) => {
      await assert.rejects(fetchText(`${origin}/hang`, limits), { name: 'TimeoutError' })
    },
  )
  await serving(
    (_request, response) => {
      response.end('x'.repeat(5000))
    },
    async (origin) => {
      await assert.rejects(fetchText(`${origin}/big`, limits), /more than 1000 bytes/)
    },
  )
  await serving(
    (_request, response) => {
      response.end('página')
    },
    async (origin) => {
      assert.equal(await fetchText(`${origin}/ok`, limits), 'página')
    },
  )
})

test('uma resposta que não é 200 não é uma página', async () => {
  await serving(
    (_request, response) => {
      response.statusCode = 503
      response.end()
    },
    async (origin) => {
      await assert.rejects(fetchText(`${origin}/down`), /503/)
    },
  )
})
