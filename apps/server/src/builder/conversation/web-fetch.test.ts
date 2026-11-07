import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { webFetchTool } from '@mastra/core/tools'
import { z } from 'zod'

const Fetched = z.object({ isError: z.boolean().optional(), content: z.string() })

async function fetched(url: string) {
  const answer: unknown = await webFetchTool.execute?.({ url }, {})
  return Fetched.parse(answer)
}

test('o web_fetch não alcança o Hub: os endereços da máquina, da rede privada e do metadado de nuvem são recusados, e um servidor local que imita o Hub recebe zero pedidos', async (t) => {
  let received = 0
  const imitation = createServer((_, response) => {
    received += 1
    response.end('hub')
  })
  await new Promise<void>((resolve) => imitation.listen(0, '127.0.0.1', resolve))
  t.after(() => imitation.close())
  const address = imitation.address()
  assert.ok(address !== null && typeof address === 'object')
  const { port } = address
  const urls = [
    `http://127.0.0.1:${port}/api/health`,
    `http://localhost:${port}/api/health`,
    `http://[::1]:${port}/api/health`,
    'http://10.0.0.1/',
    'http://169.254.169.254/latest/meta-data/',
  ]
  for (const url of urls) {
    const answer = await fetched(url)
    assert.equal(answer.isError, true, url)
    assert.doesNotMatch(answer.content, /hub/, url)
  }
  assert.equal(received, 0)
})
