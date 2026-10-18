import assert from 'node:assert/strict'
import { join } from 'node:path'
import { test } from 'node:test'
import { experimental_readRawConfig } from 'wrangler'
import wall from './outbound.ts'

const ROOT = join(import.meta.dirname, '..')

// The wall itself is proved on Cloudflare (decision 0041); here, that the configuration that
// publishes the dispatcher still sends the apps' outbound calls to it.
test('o muro: o namespace dos apps manda toda saída ao conexus-outbound, que recusa', async () => {
  const dispatcher = experimental_readRawConfig({ config: join(ROOT, 'wrangler.jsonc') }).rawConfig
  const outbound = experimental_readRawConfig({ config: join(ROOT, 'wrangler.outbound.jsonc') })
  assert.deepEqual(dispatcher.dispatch_namespaces, [
    { binding: 'DISPATCHER', namespace: 'conexus-apps', outbound: { service: 'conexus-outbound' } },
  ])
  assert.equal(outbound.rawConfig.name, 'conexus-outbound')
  assert.equal(outbound.rawConfig.main, 'src/outbound.ts')
  const refused = await wall.fetch()
  assert.equal(refused.status, 403)
})
