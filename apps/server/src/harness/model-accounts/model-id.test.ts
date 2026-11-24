import assert from 'node:assert/strict'
import { test } from 'node:test'
import { providerOfModel } from '@conexus/hub-api'
import { PROVIDER_REGISTRY, parseModelString } from '@mastra/core/llm'

test('a tela e o servidor leem o fornecedor de um modelo igual, em todo modelo do registro e nas formas sem fornecedor', () => {
  const ids = Object.entries(PROVIDER_REGISTRY).flatMap(([provider, config]) =>
    config.models.map((model) => `${provider}/${model}`),
  )
  assert.ok(ids.length > 1000)
  for (const id of [...ids, 'claude', '/claude', 'anthropic/', '', '/', 'a/b/c'])
    assert.equal(providerOfModel(id), parseModelString(id).provider, id)
  assert.equal(providerOfModel('anthropic/claude-sonnet-4-5'), 'anthropic')
  assert.equal(providerOfModel('openrouter/anthropic/claude-sonnet-4-5'), 'openrouter')
})
