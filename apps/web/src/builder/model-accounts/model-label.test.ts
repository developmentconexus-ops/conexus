import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ModelId } from '@conexus/hub-api'
import { modelLabel } from './model-label.ts'

const CASES: readonly [id: string, label: string][] = [
  ['anthropic/claude-sonnet-4-5', 'Claude Sonnet 4.5'],
  ['anthropic/claude-opus-4-1-20250805', 'Claude Opus 4.1 (2025-08-05)'],
  ['anthropic/claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet (2024-10-22)'],
  ['anthropic/claude-sonnet-4', 'Claude Sonnet 4'],
  ['openai/gpt-5', 'GPT 5'],
  ['openai/gpt-4o-2024-08-06', 'GPT 4o (2024-08-06)'],
  ['openai/gpt-oss-120b', 'GPT OSS 120b'],
  ['google/gemini-2.5-pro', 'Gemini 2.5 Pro'],
  ['mistral/mistral-large', 'Mistral Large'],
  ['openai/o3-mini', 'O3 Mini'],
  ['claude-haiku-4-5', 'Claude Haiku 4.5'],
]

for (const [id, label] of CASES) {
  test(`${id} is read as "${label}"`, () => {
    assert.equal(modelLabel(ModelId.parse(id)), label)
  })
}

for (const id of [
  'openrouter/anthropic/claude-3.5-sonnet:beta',
  'x/Llama_3',
  'anthropic/-20250805',
]) {
  test(`${id} has no name by the rule and stays as it is`, () => {
    assert.equal(modelLabel(ModelId.parse(id)), id)
  })
}

test('a dated copy of a model reads apart from the model it copies', () => {
  assert.notEqual(
    modelLabel(ModelId.parse('anthropic/claude-opus-4-5-20251101')),
    modelLabel(ModelId.parse('anthropic/claude-opus-4-5')),
  )
})
