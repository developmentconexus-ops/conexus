import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createAnthropic } from '@ai-sdk/anthropic'
import { Effort, ModelId } from '@conexus/hub-api'
import { getModelReasoningOptions, PROVIDER_REGISTRY } from '@mastra/core/llm'
import { effortsOf, providerOptionsOf } from './public.ts'

function asked(model: string, effort: Effort) {
  return providerOptionsOf(ModelId.parse(model), effort)
}

function levels(model: string) {
  return effortsOf(ModelId.parse(model))
}

test('o nível pedido chega a cada fornecedor na forma que o dado de raciocínio do Mastra lista para o modelo', () => {
  const cases: [string, Effort, unknown][] = [
    [
      'anthropic/claude-sonnet-4-5',
      'high',
      { anthropic: { thinking: { type: 'enabled', budgetTokens: 16384 } } },
    ],
    [
      'anthropic/claude-sonnet-4-5',
      'max',
      { anthropic: { thinking: { type: 'enabled', budgetTokens: 24576 } } },
    ],
    [
      'anthropic/claude-opus-4-5',
      'medium',
      { anthropic: { thinking: { type: 'enabled', budgetTokens: 8192 }, effort: 'medium' } },
    ],
    [
      'anthropic/claude-opus-4-5',
      'max',
      { anthropic: { thinking: { type: 'enabled', budgetTokens: 16384 }, effort: 'high' } },
    ],
    [
      'anthropic/claude-opus-4-7',
      'xhigh',
      { anthropic: { thinking: { type: 'adaptive', display: 'summarized' }, effort: 'xhigh' } },
    ],
    ['google/gemini-2.5-pro', 'medium', { google: { thinkingConfig: { thinkingBudget: 8192 } } }],
    ['google/gemini-2.5-flash', 'max', { google: { thinkingConfig: { thinkingBudget: 24576 } } }],
    [
      'google/gemini-3.1-pro-preview',
      'medium',
      { google: { thinkingConfig: { thinkingLevel: 'medium' } } },
    ],
    [
      'google/gemini-3-pro-image',
      'medium',
      { google: { thinkingConfig: { thinkingLevel: 'low' } } },
    ],
    ['openai/gpt-5', 'high', { openai: { reasoningEffort: 'high' } }],
    ['openai/gpt-5', 'max', { openai: { reasoningEffort: 'high' } }],
    ['openai/gpt-5-pro', 'low', { openai: { reasoningEffort: 'high' } }],
    ['anthropic/claude-opus-4-7', 'off', { anthropic: { thinking: { type: 'disabled' } } }],
    ['openai/gpt-4o', 'high', undefined],
    ['google/gemma-4-31b-it', 'high', undefined],
    ['openrouter/anthropic/claude-sonnet-4-5', 'high', undefined],
  ]
  for (const [model, effort, wire] of cases)
    assert.deepEqual(asked(model, effort), wire, `${model} at ${effort}`)
})

test('"Desligado" chega ao fornecedor como o dado do Mastra diz que o modelo para de raciocinar, e quem sempre raciocina vai no nível mais baixo', () => {
  const cases: [string, unknown][] = [
    ['anthropic/claude-opus-4-7', { anthropic: { thinking: { type: 'disabled' } } }],
    ['anthropic/claude-haiku-5-5', { anthropic: { thinking: { type: 'disabled' } } }],
    [
      'anthropic/claude-sonnet-5-5',
      { anthropic: { thinking: { type: 'adaptive', display: 'summarized' }, effort: 'low' } },
    ],
    ['openai/gpt-5.1', { openai: { reasoningEffort: 'none' } }],
    ['google/gemini-2.5-flash', { google: { thinkingConfig: { thinkingBudget: 0 } } }],
    ['openai/gpt-5', { openai: { reasoningEffort: 'low' } }],
    ['openai/gpt-5-pro', { openai: { reasoningEffort: 'high' } }],
    ['google/gemini-2.5-pro', { google: { thinkingConfig: { thinkingBudget: 1024 } } }],
    ['google/gemini-3.1-pro-preview', { google: { thinkingConfig: { thinkingLevel: 'low' } } }],
    ['openai/gpt-4o', undefined],
  ]
  for (const [model, wire] of cases) assert.deepEqual(asked(model, 'off'), wire, model)
})

// Each provider's models take three, four or five levels, as Mastra lists them per model; "Desligado"
// leads only where the model can stop reasoning.
test('Anthropic: os níveis de cada modelo são os que o Mastra lista para ele', () => {
  assert.deepEqual(levels('anthropic/claude-opus-4-5'), ['off', 'low', 'medium', 'high'])
  assert.deepEqual(levels('anthropic/claude-sonnet-4-6'), ['off', 'low', 'medium', 'high', 'max'])
  assert.deepEqual(levels('anthropic/claude-opus-4-7'), [
    'off',
    'low',
    'medium',
    'high',
    'xhigh',
    'max',
  ])
  assert.deepEqual(
    levels('anthropic/claude-sonnet-4-5'),
    ['off', 'low', 'medium', 'high', 'xhigh'],
    'a budget only: one level per budget of Mastra Code',
  )
})

test('OpenAI: os níveis de cada modelo são os que o Mastra lista para ele', () => {
  assert.deepEqual(levels('openai/gpt-5'), ['low', 'medium', 'high'], 'no `none`: always reasons')
  assert.deepEqual(levels('openai/gpt-5.1'), ['off', 'low', 'medium', 'high'])
  assert.deepEqual(levels('openai/gpt-5.2-pro'), ['medium', 'high', 'xhigh'])
  assert.deepEqual(levels('openai/gpt-5.6'), ['off', 'low', 'medium', 'high', 'xhigh', 'max'])
  assert.deepEqual(levels('openai/o3'), ['low', 'medium', 'high'])
  assert.deepEqual(levels('openai/gpt-5-pro'), ['high'])
  assert.deepEqual(levels('openai/gpt-4o'), ['off'], 'no reasoning control')
})

test('Google: os níveis de cada modelo são os que o Mastra lista para ele', () => {
  assert.deepEqual(levels('google/gemini-2.5-flash'), ['off', 'low', 'medium', 'high'])
  assert.deepEqual(levels('google/gemini-2.5-pro'), ['low', 'medium', 'high'], 'budget from 128')
  assert.deepEqual(levels('google/gemini-3.1-pro-preview'), ['low', 'medium', 'high'])
  assert.deepEqual(levels('google/gemini-3.1-flash-image'), ['high'])
  assert.deepEqual(levels('google/gemma-4-31b-it'), ['off'], 'a toggle only names no level')
})

test('em todo modelo da Anthropic, OpenAI e Google que lista níveis, os níveis oferecidos são exatamente os listados na escala da conversa', () => {
  const scale: readonly string[] = Effort.options
  for (const provider of ['anthropic', 'openai', 'google'] as const) {
    for (const name of PROVIDER_REGISTRY[provider].models) {
      const model = `${provider}/${name}`
      const listed = (getModelReasoningOptions(model) ?? []).flatMap((option) =>
        option.type === 'effort' ? option.values : [],
      )
      if (!listed.some((value) => scale.includes(value) && value !== 'off')) continue
      const offered = levels(model).filter((level) => level !== 'off')
      assert.deepEqual(
        offered,
        scale.filter((level) => level !== 'off' && listed.includes(level)),
        model,
      )
    }
  }
})

/** The `thinking` and `output_config` the Anthropic provider puts on the request for one step. */
async function sentToAnthropic(model: string, effort: Effort) {
  let body: { thinking?: { type: string }; output_config?: { effort?: string } } = {}
  const provider = createAnthropic({
    apiKey: 'test',
    fetch: async (_url, init) => {
      body = JSON.parse(String(init?.body))
      return Response.json({
        id: 'msg',
        type: 'message',
        role: 'assistant',
        model,
        content: [{ type: 'text', text: 'ok' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 1, output_tokens: 1 },
      })
    },
  })
  const parsed = ModelId.parse(`anthropic/${model}`)
  await provider.languageModel(model).doGenerate({
    prompt: [{ role: 'user', content: [{ type: 'text', text: 'oi' }] }],
    providerOptions: JSON.parse(JSON.stringify(providerOptionsOf(parsed, effort) ?? {})),
  })
  return body
}

// Absent `thinking` is the API's default, not "off": Claude Haiku 5.5 thinks adaptively unless it is
// told `disabled` (AI SDK docs, 05-anthropic.mdx "Effort"), which streamed "Pensando…" at Desligado.
test('"Desligado" na Anthropic manda `thinking: disabled` ao modelo que aceita, e os que sempre raciocinam não oferecem "Desligado"', async () => {
  for (const name of PROVIDER_REGISTRY.anthropic.models) {
    const model = `anthropic/${name}`
    const offered = levels(model).includes('off')
    const sent = await sentToAnthropic(name, 'off')
    if (offered) assert.equal(sent.thinking?.type, 'disabled', `${model} offers Desligado`)
    else assert.notEqual(sent.thinking?.type, 'disabled', model)
    assert.notEqual(sent.thinking, undefined, `${model} at Desligado must say what it does`)
  }
  for (const name of ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-fable-5', 'claude-fable-5-1'])
    assert.equal(levels(`anthropic/${name}`).includes('off'), false, `${name} always reasons`)
  for (const name of ['claude-haiku-5-5', 'claude-opus-5', 'claude-opus-4-7', 'claude-sonnet-4-5'])
    assert.equal(levels(`anthropic/${name}`)[0], 'off', `${name} can stop`)
})
