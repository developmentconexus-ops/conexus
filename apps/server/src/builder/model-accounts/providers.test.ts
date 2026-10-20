import assert from 'node:assert/strict'
import { test } from 'node:test'

test('os fornecedores por chave são só os do critério 1, por nome, e importar e listar não chamam ninguém', async (t) => {
  const calls: unknown[] = []
  const original = globalThis.fetch
  globalThis.fetch = async (input) => {
    calls.push(input)
    throw new Error('no call leaves the Hub')
  }
  t.after(() => {
    globalThis.fetch = original
  })
  const { ANA_OWNER, call, hubOn, personOn } = await import('../../hub/identity/test-hub.ts')
  const hub = await hubOn(t)
  const ana = await personOn(hub, ANA_OWNER)
  const answer = await call(hub, ana, 'GET', '/api/model-providers')
  assert.equal(answer.statusCode, 200)
  const { providers } = Object(answer.json())
  const ids = providers.map(({ id }: { id: string }) => id)
  assert.equal(ids.length, 210)
  for (const out of [
    'cloudflare-workers-ai',
    'databricks',
    'snowflake-cortex',
    'neon',
    'infomaniak',
    'netlify',
  ])
    assert.equal(ids.includes(out), false, out)
  for (const kept of ['anthropic', 'openai', 'google', 'openrouter'])
    assert.ok(ids.includes(kept), kept)
  const names = providers.map(({ name }: { name: string }) => name)
  assert.deepEqual(
    names,
    [...names].sort((a: string, b: string) => a.localeCompare(b, 'pt-BR')),
  )
  const anthropic = providers.find(({ id }: { id: string }) => id === 'anthropic')
  assert.ok(anthropic.models.length > 0)
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(String(calls.find((url) => !String(url).includes('127.0.0.1')) ?? ''), '')
  assert.equal(
    (await hub.app.inject({ method: 'GET', url: '/api/model-providers' })).statusCode,
    401,
  )
})

type Listed = { id: string; models: { id: string; efforts: string[] }[] }

test('cada modelo com os níveis de raciocínio que aceita; sem dado de raciocínio do Mastra, só "Desligado"', async (t) => {
  const { ANA_OWNER, call, hubOn, personOn } = await import('../../hub/identity/test-hub.ts')
  const hub = await hubOn(t)
  const ana = await personOn(hub, ANA_OWNER)
  const { providers }: { providers: Listed[] } = Object(
    (await call(hub, ana, 'GET', '/api/model-providers')).json(),
  )
  function effortsOf(provider: string, model: string) {
    return providers
      .find(({ id }) => id === provider)
      ?.models.find(({ id }) => id === `${provider}/${model}`)?.efforts
  }
  assert.deepEqual(effortsOf('anthropic', 'claude-sonnet-4-5'), [
    'off',
    'low',
    'medium',
    'high',
    'xhigh',
  ])
  assert.deepEqual(effortsOf('anthropic', 'claude-opus-4-7'), [
    'off',
    'low',
    'medium',
    'high',
    'xhigh',
    'max',
  ])
  assert.deepEqual(effortsOf('openai', 'gpt-5'), ['off', 'low', 'medium', 'high'])
  assert.deepEqual(effortsOf('google', 'gemini-2.5-pro'), ['off', 'low', 'medium', 'high'])
  assert.deepEqual(effortsOf('openai', 'gpt-4o'), ['off'], 'listed without reasoning controls')
  const openrouter = providers.find(({ id }) => id === 'openrouter')
  assert.deepEqual(new Set(openrouter?.models.flatMap(({ efforts }) => efforts)), new Set(['off']))
})
