import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Effort } from '@conexus/hub-api'
import { ModelId } from '@conexus/hub-api'
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
    ['anthropic/claude-opus-4-7', 'off', undefined],
    ['openai/gpt-4o', 'high', undefined],
    ['google/gemma-4-31b-it', 'high', undefined],
    ['openrouter/anthropic/claude-sonnet-4-5', 'high', undefined],
  ]
  for (const [model, effort, wire] of cases)
    assert.deepEqual(asked(model, effort), wire, `${model} at ${effort}`)
})

test('os níveis de um modelo são os que o Mastra lista, ou um por orçamento, e "Desligado" sempre', () => {
  assert.deepEqual(levels('anthropic/claude-opus-4-5'), ['off', 'low', 'medium', 'high'])
  assert.deepEqual(levels('anthropic/claude-sonnet-4-5'), ['off', 'low', 'medium', 'high', 'xhigh'])
  assert.deepEqual(levels('google/gemini-3.1-flash-image'), ['off', 'high'])
  assert.deepEqual(levels('openai/gpt-5-pro'), ['off', 'high'])
  assert.deepEqual(levels('google/gemma-4-31b-it'), ['off'], 'a toggle only names no level')
})
