import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createAnthropic } from '@ai-sdk/anthropic'
import { MockLanguageModelV3 } from 'ai/test'
import { plantAnthropic } from '../../../platform/test-anthropic.ts'
import { promptCacheMiddleware, subscriptionModel } from '../public.ts'

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

test('cada passo do modelo da conta volta sem o corpo do pedido, que o Mastra guardaria até a próxima volta', async (t) => {
  plantAnthropic(t, () => ({ kind: 'text', text: 'ok' }))
  const prompt: Prompt = [{ role: 'user', content: [{ type: 'text', text: 'Oi' }] }]
  const bare = await createAnthropic({ apiKey: 'sk-ant-planted' })('claude-sonnet-4-6').doStream({
    prompt,
  })
  assert.equal(typeof bare.request?.body, 'object', 'the provider gives the body back')
  await bare.stream.pipeTo(new WritableStream())
  const model = subscriptionModel('claude-sonnet-4-6', 'sk-ant-oat01-planted', 'conversation')
  const answered = await model.doStream({ prompt })
  assert.equal(answered.request, undefined)
  await answered.stream.pipeTo(new WritableStream())
})
