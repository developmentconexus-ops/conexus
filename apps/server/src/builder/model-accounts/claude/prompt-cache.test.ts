import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MockLanguageModelV3 } from 'ai/test'
import { promptCacheMiddleware } from '../public.ts'

const oneHour = { anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } } }
const fiveMinutes = { anthropic: { cacheControl: { type: 'ephemeral', ttl: '5m' } } }

type Transform = NonNullable<ReturnType<typeof promptCacheMiddleware>['transformParams']>
type Prompt = Parameters<Transform>[0]['params']['prompt']

// Mastra Code's own prompt shape (`prompt-cache.test.ts`, `conversationPrompt`).
function conversationPrompt(): Prompt {
  return [
    { role: 'system', content: 'Instructions' },
    { role: 'system', content: 'Memory' },
    { role: 'user', content: [{ type: 'text', text: 'First question' }] },
    { role: 'assistant', content: [{ type: 'text', text: 'First answer' }] },
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Earlier part' },
        { type: 'text', text: 'Follow-up' },
      ],
    },
  ]
}

async function marked(scope: 'conversation' | 'system', type: 'stream' | 'generate') {
  const transform = promptCacheMiddleware(scope).transformParams
  assert.ok(transform)
  const model = new MockLanguageModelV3()
  const result = await transform({ params: { prompt: conversationPrompt() }, type, model })
  return result.prompt
}

/** The options each part of a message carries, in order. */
function partOptions(message: Prompt[number] | undefined) {
  assert.ok(message && typeof message.content !== 'string')
  return message.content.map((part) => part.providerOptions)
}

test('a conversa marca a última mensagem de sistema e a última mensagem, por 1 h', async () => {
  const out = await marked('conversation', 'stream')
  assert.equal(out[0]?.providerOptions, undefined)
  assert.deepEqual(out[1]?.providerOptions, oneHour)
  assert.deepEqual(partOptions(out[2]), [undefined])
  assert.deepEqual(partOptions(out[3]), [undefined])
  assert.deepEqual(partOptions(out[4]), [undefined, oneHour])
})

test('as chamadas laterais marcam só a última mensagem de sistema, por 5 min', async () => {
  const out = await marked('system', 'generate')
  assert.equal(out[0]?.providerOptions, undefined)
  assert.deepEqual(out[1]?.providerOptions, fiveMinutes)
  assert.deepEqual(partOptions(out[2]), [undefined])
  assert.deepEqual(partOptions(out[3]), [undefined])
  assert.deepEqual(partOptions(out[4]), [undefined, undefined])
})
