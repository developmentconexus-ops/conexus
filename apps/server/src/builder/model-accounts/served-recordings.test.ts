import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { ModelId } from '@conexus/hub-api'
import { z } from 'zod'
import { LEAK, RECORDINGS, Recording, replayed } from '../../platform/test-recordings.ts'
import { AnthropicPage, callModel, GooglePage, OpenAiList, providerOptionsOf } from './public.ts'

const LISTS = new Map<string, z.ZodType>([
  ['anthropic', AnthropicPage],
  ['openai', OpenAiList],
  ['google', GooglePage],
])

test('cada lista de modelos gravada é lida pelo esquema que o Hub usa, e não guarda e-mail nem credencial (T24, S40)', () => {
  const lists = readdirSync(RECORDINGS).filter((file) => file.endsWith('.list.json'))
  for (const file of lists) {
    const name = file.slice(0, -'.list.json'.length)
    const text = readFileSync(join(RECORDINGS, file), 'utf8')
    assert.equal(LEAK.test(text), false, `${file} carries an address or a credential`)
    const schema = LISTS.get(
      name.startsWith('google-cliproxy') ? 'openai' : (name.split('-')[0] ?? ''),
    )
    assert.ok(schema, `${file} names a provider with no reader`)
    schema.parse(JSON.parse(text))
    Recording.parse(JSON.parse(readFileSync(join(RECORDINGS, `${name}.json`), 'utf8')))
  }
})

test('o pedido de raciocínio do Gemini leva reasoning_effort ao CLIProxy e a resposta gravada devolve reasoning_content (T24, 14.2 critério 19)', async (t) => {
  const real = globalThis.fetch
  let sent: string | undefined
  globalThis.fetch = async (_input, init) => {
    sent = typeof init?.body === 'string' ? init.body : undefined
    return replayed('google-thinking', init?.signal)
  }
  t.after(() => {
    globalThis.fetch = real
  })
  const name = 'gemini-3.8-flash-high'
  const model = await callModel({
    providerId: 'google',
    modelId: name,
    url: 'http://127.0.0.1:1/v1',
    apiKey: 'k',
  })
  const { stream } = await model.doStream({
    prompt: [{ role: 'user', content: [{ type: 'text', text: 'oi' }] }],
    providerOptions: { google: { reasoningEffort: 'low' } },
  })
  assert.deepEqual(providerOptionsOf(ModelId.parse(`google/${name}`), 'low'), {
    google: { reasoningEffort: 'low' },
  })
  const kinds = new Set<string>()
  for await (const part of stream) kinds.add(part.type)
  const request = z
    .object({ model: z.string(), reasoning_effort: z.string() })
    .parse(JSON.parse(sent ?? 'null'))
  assert.deepEqual(request, { model: name, reasoning_effort: 'low' })
  assert.ok(kinds.has('reasoning-delta') && kinds.has('text-delta'), [...kinds].join())
})
